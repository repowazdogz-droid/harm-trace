# Contributing to Harm Trace Protocol (HTP)

Thank you for your interest in contributing to the Harm Trace Protocol (HTP-1.0). This document provides technical guidance on how the protocol works and how to contribute to its development.

## The Accountability Chain

HTP is part of a broader ecosystem of protocols designed to provide full accountability for AI systems. It works in conjunction with:

1.  **Consent Ledger (CNL-1.0)**: Traces whether a decision was authorised.
2.  **Clearpath (CAP-1.0)**: Traces what was decided.
3.  **Harm Trace (HTP-1.0)**: Traces what happened as a result of that decision.

Together, these form the **Accountability Chain**, enabling investigators to follow a path from authorisation to decision to consequence.

## Recording Consequences

To record a consequence, use the `HarmTrace` class. Each consequence is added to a tamper-evident hash chain.

```typescript
import { HarmTrace } from './src/harm-trace';

const trace = new HarmTrace('incident-uuid');

const node = trace.recordConsequence({
  description: 'AI recommendation led to incorrect medication dosage',
  category: 'physical',
  severity: 'serious',
  causation_type: 'direct',
  parent_id: null, // Root consequences have null parent_id
  origin: {
    clearpath_trace_id: 'cp-001',
    agent_id: 'med-assistant-v1',
    decision_timestamp: new Date().toISOString(),
    decision_summary: 'Recommended 50mg dose'
  },
  affected_parties: [
    { id: 'patient-42', type: 'individual', description: 'Jane Doe' }
  ],
  evidence: ['clinical-audit-log-ref'],
  reversible: false,
  remediation_taken: null
});
```

## ConsequenceNode Schema

A `ConsequenceNode` requires the following fields:

- `description`: Textual description of the harm.
- `category`: `HarmCategory` (see below).
- `severity`: `Severity` (negligible, minor, moderate, serious, critical, catastrophic).
- `causation_type`: `CausationType` (see below).
- `parent_id`: ID of the preceding consequence, or `null` for root nodes.
- `origin`: Link to the AI decision (optional for non-root nodes).
- `affected_parties`: List of individuals or entities impacted.
- `evidence`: Array of strings referencing evidence.
- `reversible`: Boolean indicating if the harm can be undone.
- `remediation_taken`: Description of steps taken to address the harm.

### Harm Categories
`physical`, `financial`, `reputational`, `psychological`, `operational`, `legal`, `environmental`, `informational`, `discriminatory`.

### Causation Types
- `direct`: The decision directly caused the outcome.
- `contributing`: The decision was one of several causes.
- `enabling`: The decision created conditions for harm.
- `proximate`: The decision was the nearest cause in the chain.
- `but_for`: Harm would not have occurred but for this decision.

## Chain Building & Impact Summary

### `buildChain(root_id)`
The `buildChain` method constructs a `CausalChain` by performing a Breadth-First Search (BFS) starting from the specified root node. It collects all descendant consequences to represent the full scope of a single root cause.

### `ImpactSummary`
The `getImpactSummary()` method provides an aggregate view of all recorded consequences:
- `total_consequences`: Count of all nodes.
- `by_category`: Distribution of harm across categories.
- `by_severity`: Distribution of severity levels.
- `total_affected_parties`: Sum of all impacted entities.
- `reversible_count` / `irreversible_count`: Breakdown by reversibility.
- `longest_chain`: The length of the deepest causal path.
- `propagation_patterns`: Identified dangerous patterns in how harm spreads.

## Propagation Detection

Propagation detection analyzes causal chains to identify dangerous trends. It is triggered via `detectPropagation()`.

### Identified Patterns
- **Cascade**: A single decision triggers 3 or more consequences in sequence.
- **Amplification**: Severity escalates as the harm moves along the chain.
- **Delayed**: Significant time gap (24h+) between decision and consequence.
- **Cross-Domain**: Harm jumps between categories (e.g., financial to psychological).
- **Feedback Loop**: A consequence feeds back to create new causes within the chain.
