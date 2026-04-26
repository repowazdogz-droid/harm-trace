/**
 * Harm Trace Protocol (HTP-1.0)
 * Tamper-evident causation from AI decisions to real-world harm.
 * Zero external dependencies (Node.js crypto only).
 */
export { schema } from './types';
export type { HarmCategory, Severity, CausationType, AffectedParty, DecisionOrigin, ConsequenceNode, CausalChain, PropagationPatternType, SeverityTrajectory, PropagationPattern, ImpactSummary, TraceSnapshot, VerifyResult, ConsequenceFilters, } from './types';
export { HarmTrace } from './harm-trace';
export { buildChainFromRoot, buildChainFromLeaf, getAllChains, getChainsFromDecision, getOrphanNodes, } from './causation-chain';
export { getImpactSummary, getSeverityScore, severityNumeric, } from './impact-assessor';
export { detectPropagation } from './propagation';
export { sha256, chainHash, generateId, consequencePayload } from './hash';
//# sourceMappingURL=index.d.ts.map