# Harm Trace Protocol (HTP-1.0)

Tamper-evident consequence chains for AI decisions.

The Harm Trace traces the chain of consequences from an AI decision to real-world outcomes. Every consequence is recorded as a hash-chained node in a causal tree, linking back to the Clearpath trace that produced the decision and the Consent Ledger authorisation that permitted it.

Clearpath traces what was decided. The Consent Ledger traces whether it was authorised. The Harm Trace traces what happened because of it.

## Why this exists

When an AI system causes harm, the question is not just what it decided but what happened as a result. A wrong recommendation leads to a bad outcome, which leads to further consequences, which affect real people. Today there is no protocol for tracing the chain of causation from decision to impact. Investigators reconstruct it manually, after the fact, often incompletely.

The Harm Trace builds the consequence chain in real time. When something goes wrong, you can see exactly what happened, why, who was affected, and whether the harm was reversible.

## What it does

Every consequence node records what happened, what category of harm it represents, how severe it is, what type of causation links it to the previous event, who was affected, and whether the harm is reversible. Nodes form causal trees — a single decision can branch into multiple consequence chains.

Four capabilities:

**Causal chain building** traces consequences from root cause to final impact. Follow any consequence node back through its parents to the original decision. Chains can branch when a single decision causes multiple independent consequences.

**Impact assessment** aggregates harm across all chains. Total consequences by category and severity. Total affected parties. Reversible versus irreversible count. Longest chain length. A severity score that accounts for the worst outcome, total affected, and irreversibility.

**Propagation detection** identifies dangerous patterns in how harm spreads. Cascades where one decision triggers three or more consequences in sequence. Amplification where severity escalates along the chain. Delayed harm where significant time passes between decision and impact. Cross-domain propagation where financial harm causes psychological harm. Feedback loops where consequences create new causes.

**Remediation tracking** records what was done to address each consequence. When harm is identified, remediation actions are appended to the relevant node. The record shows both the harm and the response.

## Harm categories

- **physical** — bodily injury or death
- **psychological** — mental distress, manipulation, addiction
- **financial** — monetary loss, exploitation, discriminatory pricing
- **reputational** — damage to standing or credibility
- **operational** — disruption to systems or processes
- **legal** — liability, regulatory violation
- **environmental** — ecological damage
- **informational** — data breach, misinformation
- **discriminatory** — bias, inequality, exclusion

## Causation types

- **direct** — the decision directly caused the outcome
- **contributing** — the decision was one of several causes
- **enabling** — the decision created conditions for harm but didn't cause it directly
- **proximate** — the decision was the nearest cause in the chain
- **but_for** — the harm would not have occurred but for this decision

Repository: https://github.com/repowazdogz-droid/harm-trace

## Install

```bash
npm install
npm run build
```

## Quick start

```javascript
const { HarmTrace } = require('./dist/index');

const trace = new HarmTrace('incident-001');

// Root consequence linked to a Clearpath trace
const root = trace.recordConsequence({
  description: 'AI recommended aggressive treatment that was contraindicated',
  category: 'physical',
  severity: 'serious',
  causation_type: 'direct',
  parent_id: null,
  origin: {
    clearpath_trace_id: 'clearpath-trace-001',
    agent_id: 'clinical-ai',
    decision_timestamp: '2026-02-20T09:00:00Z',
    decision_summary: 'Recommended aggressive surgical intervention'
  },
  affected_parties: [
    { id: 'patient-1', type: 'individual', description: 'Patient aged 62' }
  ],
  evidence: ['Post-operative complication report', 'Clinical review notes'],
  reversible: false,
  remediation_taken: null
});

// Second-order consequence
const c2 = trace.recordConsequence({
  description: 'Extended hospital stay required due to complication',
  category: 'financial',
  severity: 'moderate',
  causation_type: 'direct',
  parent_id: root.id,
  origin: null,
  affected_parties: [
    { id: 'patient-1', type: 'individual', description: 'Patient aged 62' },
    { id: 'nhs-trust', type: 'organisation', description: 'Hospital trust' }
  ],
  evidence: ['Hospital billing records'],
  reversible: true,
  remediation_taken: null
});

// Record remediation
trace.addRemediation(root.id, 'Corrective surgery performed. Patient stable.');

// Build causal chain
const chain = trace.buildChain(root.id);
console.log(chain.max_severity); // 'serious'
console.log(chain.total_affected); // 2

// Impact summary
const impact = trace.getImpactSummary();
console.log(impact.by_category); // { physical: 1, financial: 1 }
console.log(impact.irreversible_count); // 1

// Detect propagation patterns
const patterns = trace.detectPropagation();

// Verify integrity
console.log(trace.verify());
```

## Test

```bash
npm test
```

26 tests covering: core operations, consequence recording, causal chain linking, Clearpath trace linking, hash chain integrity, chain building (root to leaf, from Clearpath ID, multiple chains, orphan detection, length calculation), impact assessment (category counts, severity counts, severity score, irreversible identification, affected party aggregation), propagation detection (cascade, amplification, cross-domain, false positive avoidance), remediation recording, tamper detection, and JSON export/import roundtrip.

## Propagation patterns

| Pattern | Detection | Meaning |
|---------|-----------|---------|
| cascade | 3+ consequences in sequence | Harm spreading through system |
| amplification | Severity increasing along chain | Harm getting worse as it propagates |
| delayed | Significant time gap between decision and consequence | Hidden or slow-moving harm |
| cross_domain | Category changes in chain (e.g., financial → psychological) | Harm jumping between domains |
| feedback_loop | Consequence feeds back to create new causes | Self-reinforcing harm cycle |

## How it works

The Harm Trace is a library, not a service. No server. No database. No UI. It is the protocol layer that other applications build on.

A clinical governance system imports the Harm Trace → every adverse outcome is traced back to the AI recommendation that contributed. A financial regulator imports the Harm Trace → market disruptions are traced to the automated decisions that triggered them. An AI safety team imports the Harm Trace → failure modes are mapped with full causal chains.

The protocol is domain-agnostic. The consequence mechanism is identical. The stakes change.

## Relationship to other protocols

Clearpath (CAP-1.0) traces what was decided. The Consent Ledger (CNL-1.0) traces whether it was authorised. The Harm Trace (HTP-1.0) traces what happened as a result. Together they form the complete accountability chain: from authorisation to decision to consequence.

## Status

- 26 tests passing
- TypeScript, zero external dependencies
- Open-source (MIT)
- Part of the Omega reasoning infrastructure

## License

MIT
