/**
 * Harm Trace Protocol (HTP-1.0) — impact categorisation and severity scoring
 */
import type { ConsequenceNode, ImpactSummary, Severity, PropagationPattern } from './types';
export declare function getImpactSummary(nodes: ConsequenceNode[], longest_chain: number, propagation_patterns: PropagationPattern[]): ImpactSummary;
export declare function getSeverityScore(nodes: ConsequenceNode[]): number;
export declare function severityNumeric(s: Severity): number;
//# sourceMappingURL=impact-assessor.d.ts.map