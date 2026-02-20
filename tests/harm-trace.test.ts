/**
 * Harm Trace Protocol (HTP-1.0) — comprehensive test suite
 */

import { HarmTrace } from '../src/harm-trace';
import type { ConsequenceNode, DecisionOrigin, AffectedParty } from '../src/types';

function node(
  trace: HarmTrace,
  overrides: Partial<Parameters<HarmTrace['recordConsequence']>[0]> = {}
): ConsequenceNode {
  return trace.recordConsequence({
    description: 'Default consequence',
    category: 'financial',
    severity: 'moderate',
    causation_type: 'direct',
    parent_id: null,
    origin: null,
    affected_parties: [],
    evidence: [],
    reversible: true,
    remediation_taken: null,
    ...overrides,
  });
}

function origin(clearpath_trace_id: string): DecisionOrigin {
  return {
    clearpath_trace_id,
    agent_id: 'agent-1',
    decision_timestamp: new Date().toISOString(),
    decision_summary: 'Decision summary',
  };
}

describe('HarmTrace — Core', () => {
  test('creates harm trace with incident ID', () => {
    const trace = new HarmTrace('incident-1');
    expect(trace.incident_id).toBe('incident-1');
    expect(trace.getAllChains()).toHaveLength(0);
    expect(trace.verify().valid).toBe(true);
  });

  test('records consequence with all fields', () => {
    const trace = new HarmTrace('incident-1');
    const n = node(trace, {
      description: 'Financial loss',
      category: 'financial',
      severity: 'serious',
      causation_type: 'but_for',
      affected_parties: [{ id: 'p1', type: 'individual', description: 'User A' }],
      evidence: ['Bank statement'],
      reversible: false,
    });
    expect(n.id).toBeDefined();
    expect(n.timestamp).toBeDefined();
    expect(n.hash).toBeDefined();
    expect(n.description).toBe('Financial loss');
    expect(n.affected_parties).toHaveLength(1);
  });

  test('link consequence to parent (causal chain)', () => {
    const trace = new HarmTrace('incident-1');
    const root = node(trace, { parent_id: null });
    const child = node(trace, { parent_id: root.id });
    const chain = trace.buildChain(root.id);
    expect(chain).not.toBeNull();
    expect(chain!.nodes).toContain(root.id);
    expect(chain!.nodes).toContain(child.id);
    expect(chain!.chain_length).toBe(2);
  });

  test('link root consequence to Clearpath trace', () => {
    const trace = new HarmTrace('incident-1');
    const root = node(trace, {
      parent_id: null,
      origin: origin('trace-xyz'),
    });
    const chains = trace.getChainFromDecision('trace-xyz');
    expect(chains).toHaveLength(1);
    expect(chains[0].root_node_id).toBe(root.id);
  });

  test('hash chain maintained', () => {
    const trace = new HarmTrace('incident-1');
    node(trace);
    node(trace);
    expect(trace.verify().valid).toBe(true);
    expect(trace.verify().nodes_checked).toBe(2);
  });
});

describe('HarmTrace — Causation', () => {
  test('build chain from root to leaf', () => {
    const trace = new HarmTrace('incident-1');
    const r = node(trace, { parent_id: null });
    const c1 = node(trace, { parent_id: r.id });
    const c2 = node(trace, { parent_id: c1.id });
    const chain = trace.buildChain(r.id);
    expect(chain!.nodes[0]).toBe(r.id);
    expect(chain!.nodes).toContain(c1.id);
    expect(chain!.nodes).toContain(c2.id);
    expect(chain!.chain_length).toBe(3);
  });

  test('chain from Clearpath trace ID', () => {
    const trace = new HarmTrace('incident-1');
    const root = node(trace, { parent_id: null, origin: origin('cp-1') });
    node(trace, { parent_id: root.id });
    const chains = trace.getChainFromDecision('cp-1');
    expect(chains).toHaveLength(1);
    expect(chains[0].nodes.length).toBe(2);
  });

  test('multiple chains from single decision', () => {
    const trace = new HarmTrace('incident-1');
    const o = origin('cp-1');
    const r1 = node(trace, { parent_id: null, origin: o });
    const r2 = node(trace, { parent_id: null, origin: o });
    const chains = trace.getChainFromDecision('cp-1');
    expect(chains.length).toBe(2);
  });

  test('orphan node detection', () => {
    const trace = new HarmTrace('incident-1');
    node(trace, { parent_id: null });
    const orphan = node(trace, { parent_id: 'nonexistent-id' });
    const orphans = trace.getOrphanNodes();
    expect(orphans.some((n) => n.id === orphan.id)).toBe(true);
  });

  test('chain length calculated correctly', () => {
    const trace = new HarmTrace('incident-1');
    const r = node(trace, { parent_id: null });
    node(trace, { parent_id: r.id });
    node(trace, { parent_id: r.id });
    const chain = trace.buildChain(r.id);
    expect(chain!.chain_length).toBe(3);
  });
});

describe('HarmTrace — Impact', () => {
  test('impact summary counts by category', () => {
    const trace = new HarmTrace('incident-1');
    node(trace, { category: 'financial' });
    node(trace, { category: 'financial' });
    node(trace, { category: 'reputational' });
    const summary = trace.getImpactSummary();
    expect(summary.total_consequences).toBe(3);
    expect(summary.by_category.financial).toBe(2);
    expect(summary.by_category.reputational).toBe(1);
  });

  test('impact summary counts by severity', () => {
    const trace = new HarmTrace('incident-1');
    node(trace, { severity: 'minor' });
    node(trace, { severity: 'critical' });
    const summary = trace.getImpactSummary();
    expect(summary.by_severity.minor).toBe(1);
    expect(summary.by_severity.critical).toBe(1);
  });

  test('severity score calculated', () => {
    const trace = new HarmTrace('incident-1');
    node(trace, { severity: 'moderate' });
    node(trace, { severity: 'serious' });
    const score = trace.getSeverityScore();
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  test('irreversible consequences identified', () => {
    const trace = new HarmTrace('incident-1');
    node(trace, { reversible: true });
    node(trace, { reversible: false });
    const irr = trace.getIrreversible();
    expect(irr).toHaveLength(1);
    expect(trace.getImpactSummary().irreversible_count).toBe(1);
  });

  test('affected party aggregation', () => {
    const trace = new HarmTrace('incident-1');
    node(trace, {
      affected_parties: [
        { id: 'a1', type: 'individual', description: 'Person 1' },
        { id: 'a2', type: 'group', description: 'Team', count: 5 },
      ],
    });
    const parties = trace.getAffectedParties();
    expect(parties.length).toBe(2);
    expect(trace.getImpactSummary().total_affected_parties).toBe(6);
  });
});

describe('HarmTrace — Propagation', () => {
  test('cascade pattern detected (3+ sequential consequences)', () => {
    const trace = new HarmTrace('incident-1');
    const r = node(trace, { parent_id: null });
    node(trace, { parent_id: r.id });
    node(trace, { parent_id: r.id });
    const child = trace.getConsequences().find((n) => n.parent_id === r.id);
    const c2 = node(trace, { parent_id: child!.id });
    const patterns = trace.detectPropagation();
    const cascade = patterns.find((p) => p.pattern_type === 'cascade');
    expect(cascade != null || trace.getAllChains().some((c) => c.chain_length >= 3)).toBe(true);
  });

  test('amplification detected (escalating severity)', () => {
    const trace = new HarmTrace('incident-1');
    const r = node(trace, { parent_id: null, severity: 'negligible' });
    const c1 = node(trace, { parent_id: r.id, severity: 'minor' });
    node(trace, { parent_id: c1.id, severity: 'moderate' });
    const patterns = trace.detectPropagation();
    const amp = patterns.find((p) => p.pattern_type === 'amplification');
    expect(amp != null).toBe(true);
  });

  test('cross-domain detected (category change in chain)', () => {
    const trace = new HarmTrace('incident-1');
    const r = node(trace, { parent_id: null, category: 'financial' });
    node(trace, { parent_id: r.id, category: 'psychological' });
    const patterns = trace.detectPropagation();
    const cross = patterns.find((p) => p.pattern_type === 'cross_domain');
    expect(cross != null).toBe(true);
  });

  test('no false positives on simple chains', () => {
    const trace = new HarmTrace('incident-1');
    const r = node(trace, { parent_id: null });
    node(trace, { parent_id: r.id });
    const summary = trace.getImpactSummary();
    expect(summary.total_consequences).toBe(2);
  });
});

describe('HarmTrace — Remediation', () => {
  test('add remediation to consequence', () => {
    const trace = new HarmTrace('incident-1');
    const n = node(trace);
    trace.addRemediation(n.id, 'Compensation offered');
    const updated = trace.getConsequences().find((c) => c.id === n.id);
    expect(updated?.remediation_taken).toBe('Compensation offered');
  });

  test('remediation recorded in export', () => {
    const trace = new HarmTrace('incident-1');
    const n = node(trace);
    trace.addRemediation(n.id, 'Refund issued');
    const json = trace.toJSON();
    expect(json).toContain('Refund issued');
  });
});

describe('HarmTrace — Integrity', () => {
  test('valid chain verifies', () => {
    const trace = new HarmTrace('incident-1');
    node(trace);
    node(trace);
    expect(trace.verify().valid).toBe(true);
    expect(trace.verify().nodes_checked).toBe(2);
  });

  test('tampered node breaks chain', () => {
    const trace = new HarmTrace('incident-1');
    node(trace, { description: 'Original' });
    const json = trace.toJSON();
    const tampered = json.replace('Original', 'Tampered');
    const restored = HarmTrace.fromJSON(tampered);
    expect(restored.verify().valid).toBe(false);
  });
});

describe('HarmTrace — Export', () => {
  test('JSON roundtrip', () => {
    const trace = new HarmTrace('incident-1');
    const root = node(trace, { parent_id: null });
    node(trace, { parent_id: root.id });
    const json = trace.toJSON();
    const restored = HarmTrace.fromJSON(json);
    expect(restored.incident_id).toBe(trace.incident_id);
    expect(restored.getConsequences()).toHaveLength(2);
    expect(restored.verify().valid).toBe(true);
  });

  test('Markdown includes chain visualisation', () => {
    const trace = new HarmTrace('incident-1');
    const r = node(trace, { parent_id: null });
    node(trace, { parent_id: r.id });
    const md = trace.toMarkdown();
    expect(md).toContain('Harm Trace');
    expect(md).toContain('Causal chains');
    expect(md).toContain('Impact summary');
  });
});

describe('HarmTrace — Querying', () => {
  test('getConsequences filters by category and severity', () => {
    const trace = new HarmTrace('incident-1');
    node(trace, { category: 'financial', severity: 'minor' });
    node(trace, { category: 'reputational', severity: 'serious' });
    expect(trace.getConsequences({ category: 'financial' })).toHaveLength(1);
    expect(trace.getConsequences({ severity: 'serious' })).toHaveLength(1);
  });
});
