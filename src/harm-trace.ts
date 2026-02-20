/**
 * Harm Trace Protocol (HTP-1.0) — main HarmTrace class
 */

import type {
  ConsequenceNode,
  CausalChain,
  ImpactSummary,
  PropagationPattern,
  TraceSnapshot,
  VerifyResult,
  ConsequenceFilters,
  AffectedParty,
} from './types';
import { schema } from './types';
import { generateId, chainHash, consequencePayload } from './hash';
import {
  buildChainFromRoot,
  getAllChains,
  getChainsFromDecision,
  getOrphanNodes,
} from './causation-chain';
import { getImpactSummary, getSeverityScore } from './impact-assessor';
import { detectPropagation } from './propagation';

const GENESIS = '0';

type RecordInput = Omit<
  ConsequenceNode,
  'id' | 'timestamp' | 'hash' | 'previous_hash'
>;

export class HarmTrace {
  readonly incident_id: string;
  private nodes: ConsequenceNode[] = [];
  private byId: Map<string, ConsequenceNode> = new Map();

  constructor(incident_id: string) {
    this.incident_id = incident_id;
  }

  recordConsequence(node: RecordInput): ConsequenceNode {
    const id = generateId();
    const timestamp = new Date().toISOString();
    const previous_hash =
      this.nodes.length === 0 ? GENESIS : this.nodes[this.nodes.length - 1].hash;
    const full: ConsequenceNode = {
      ...node,
      id,
      timestamp,
      previous_hash,
      hash: '',
    };
    full.hash = chainHash(previous_hash, consequencePayload(full));
    this.nodes.push(full);
    this.byId.set(id, full);
    return full;
  }

  addRemediation(node_id: string, remediation: string): ConsequenceNode {
    const node = this.byId.get(node_id);
    if (!node) throw new Error(`Consequence not found: ${node_id}`);
    node.remediation_taken = remediation;
    const idx = this.nodes.findIndex((n) => n.id === node_id);
    this.recomputeChainFrom(idx);
    return node;
  }

  private recomputeChainFrom(index: number): void {
    const prev = index === 0 ? GENESIS : this.nodes[index - 1].hash;
    for (let i = index; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      n.previous_hash = i === 0 ? GENESIS : this.nodes[i - 1].hash;
      n.hash = chainHash(n.previous_hash, consequencePayload(n));
    }
  }

  buildChain(root_id: string): CausalChain | null {
    return buildChainFromRoot(root_id, this.nodes, this.byId);
  }

  getAllChains(): CausalChain[] {
    return getAllChains(this.nodes);
  }

  getChainFromDecision(clearpath_trace_id: string): CausalChain[] {
    return getChainsFromDecision(clearpath_trace_id, this.nodes);
  }

  getImpactSummary(): ImpactSummary {
    const chains = this.getAllChains();
    const longest = chains.length === 0 ? 0 : Math.max(...chains.map((c) => c.chain_length));
    const patterns = this.detectPropagation();
    return getImpactSummary(this.nodes, longest, patterns);
  }

  getSeverityScore(): number {
    return getSeverityScore(this.nodes);
  }

  detectPropagation(): PropagationPattern[] {
    const chains = this.getAllChains();
    return detectPropagation(this.nodes, chains, this.byId);
  }

  getConsequences(filters?: ConsequenceFilters): ConsequenceNode[] {
    let list = this.nodes.slice();
    if (filters?.category) list = list.filter((n) => n.category === filters.category);
    if (filters?.severity) list = list.filter((n) => n.severity === filters.severity);
    if (filters?.affected_party_type)
      list = list.filter((n) =>
        n.affected_parties.some((p) => p.type === filters.affected_party_type)
      );
    return list;
  }

  getAffectedParties(): AffectedParty[] {
    const seen = new Map<string, AffectedParty>();
    for (const n of this.nodes) {
      for (const p of n.affected_parties) {
        if (!seen.has(p.id)) seen.set(p.id, p);
      }
    }
    return [...seen.values()];
  }

  getIrreversible(): ConsequenceNode[] {
    return this.nodes.filter((n) => !n.reversible);
  }

  verify(): VerifyResult {
    let valid = true;
    let prev = GENESIS;
    for (const n of this.nodes) {
      if (n.previous_hash !== prev) valid = false;
      const expected = chainHash(n.previous_hash, consequencePayload(n));
      if (n.hash !== expected) valid = false;
      prev = n.hash;
    }
    return { valid, nodes_checked: this.nodes.length };
  }

  toJSON(): string {
    const snapshot: TraceSnapshot = {
      schema,
      incident_id: this.incident_id,
      nodes: this.nodes,
    };
    return JSON.stringify(snapshot, null, 2);
  }

  toMarkdown(): string {
    const chains = this.getAllChains();
    const summary = this.getImpactSummary();
    const lines: string[] = [
      '# Harm Trace',
      '',
      `**Schema:** ${schema}  `,
      `**Incident:** ${this.incident_id}  `,
      `**Generated:** ${summary.generated_at}`,
      '',
      '## Impact summary',
      '',
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Total consequences | ${summary.total_consequences} |`,
      `| Total affected parties | ${summary.total_affected_parties} |`,
      `| Reversible | ${summary.reversible_count} |`,
      `| Irreversible | ${summary.irreversible_count} |`,
      `| Longest chain | ${summary.longest_chain} |`,
      '',
      '## Causal chains',
      '',
    ];
    for (const c of chains.slice(0, 10)) {
      lines.push(`### Chain ${c.id.slice(0, 8)}... (root: ${c.root_node_id.slice(0, 8)}...)`);
      lines.push(`- Length: ${c.chain_length}, Max severity: ${c.max_severity}, Affected: ${c.total_affected}`);
      lines.push(`- Nodes: ${c.nodes.join(' → ')}`);
      lines.push('');
    }
    if (summary.propagation_patterns.length > 0) {
      lines.push('## Propagation patterns', '');
      for (const p of summary.propagation_patterns) {
        lines.push(`- **${p.pattern_type}**: ${p.description}`);
      }
    }
    return lines.join('\n');
  }

  static fromJSON(json: string): HarmTrace {
    const snapshot: TraceSnapshot = JSON.parse(json);
    if (snapshot.schema !== schema) throw new Error(`Invalid schema: expected ${schema}`);
    const trace = new HarmTrace(snapshot.incident_id);
    const T = trace as unknown as { nodes: ConsequenceNode[]; byId: Map<string, ConsequenceNode> };
    T.nodes = snapshot.nodes;
    T.byId = new Map(snapshot.nodes.map((n) => [n.id, n]));
    return trace;
  }

  getOrphanNodes(): ConsequenceNode[] {
    return getOrphanNodes(this.nodes);
  }
}
