/**
 * Harm Trace Protocol (HTP-1.0) — causal chain building and validation
 */

import type { ConsequenceNode, CausalChain, HarmCategory, Severity } from './types';
import { generateId } from './hash';

export function buildChainFromRoot(
  root_id: string,
  nodes: ConsequenceNode[],
  byId: Map<string, ConsequenceNode>
): CausalChain | null {
  const root = byId.get(root_id);
  if (!root) return null;
  const ordered: string[] = [root_id];
  const childrenByParent = new Map<string, string[]>();
  for (const n of nodes) {
    if (n.parent_id !== null) {
      const list = childrenByParent.get(n.parent_id) ?? [];
      list.push(n.id);
      childrenByParent.set(n.parent_id, list);
    }
  }
  const queue = [root_id];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const children = (childrenByParent.get(id) ?? []).slice().sort();
    for (const cid of children) {
      ordered.push(cid);
      queue.push(cid);
    }
  }
  const chainNodes = ordered;
  if (chainNodes.length === 0) return null;
  const total_affected = chainNodes.reduce(
    (sum, id) => {
      const n = byId.get(id);
      return sum + (n?.affected_parties.reduce((s, p) => s + (p.count ?? 1), 0) ?? 0);
    },
    0
  );
  const severities: Severity[] = chainNodes
    .map((id) => byId.get(id)?.severity)
    .filter((s): s is Severity => s !== undefined);
  const max_severity = maxSeverity(severities);
  const categories = [...new Set(chainNodes.map((id) => byId.get(id)?.category).filter((c): c is HarmCategory => c !== undefined))];
  return {
    id: generateId(),
    root_node_id: root_id,
    nodes: chainNodes,
    total_affected,
    max_severity,
    categories,
    chain_length: chainNodes.length,
    verified: true,
  };
}

export function buildChainFromLeaf(
  leaf_id: string,
  nodes: ConsequenceNode[],
  byId: Map<string, ConsequenceNode>
): CausalChain | null {
  const chain: string[] = [];
  let current: ConsequenceNode | undefined = byId.get(leaf_id);
  while (current) {
    chain.unshift(current.id);
    if (current.parent_id === null) break;
    current = byId.get(current.parent_id);
  }
  if (chain.length === 0) return null;
  const root_id = chain[0];
  return buildChainFromRoot(root_id, nodes, byId);
}

export function getAllChains(nodes: ConsequenceNode[]): CausalChain[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const roots = nodes.filter((n) => n.parent_id === null);
  const seen = new Set<string>();
  const chains: CausalChain[] = [];
  for (const r of roots) {
    const c = buildChainFromRoot(r.id, nodes, byId);
    if (c && !seen.has(c.root_node_id)) {
      seen.add(c.root_node_id);
      chains.push(c);
    }
  }
  return chains;
}

export function getChainsFromDecision(
  clearpath_trace_id: string,
  nodes: ConsequenceNode[]
): CausalChain[] {
  const roots = nodes.filter(
    (n) => n.origin?.clearpath_trace_id === clearpath_trace_id
  );
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return roots
    .map((r) => buildChainFromRoot(r.id, nodes, byId))
    .filter((c): c is CausalChain => c !== null);
}

export function getOrphanNodes(nodes: ConsequenceNode[]): ConsequenceNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return nodes.filter((n) => {
    if (n.parent_id === null) return false;
    return !byId.has(n.parent_id);
  });
}

function maxSeverity(severities: Severity[]): Severity {
  const order: Severity[] = [
    'negligible',
    'minor',
    'moderate',
    'serious',
    'critical',
    'catastrophic',
  ];
  let max = 'negligible' as Severity;
  let maxIdx = 0;
  for (const s of severities) {
    const idx = order.indexOf(s);
    if (idx > maxIdx) {
      maxIdx = idx;
      max = s;
    }
  }
  return max;
}
