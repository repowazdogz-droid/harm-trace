/**
 * Harm Trace Protocol (HTP-1.0) — main HarmTrace class
 */
import type { ConsequenceNode, CausalChain, ImpactSummary, PropagationPattern, VerifyResult, ConsequenceFilters, AffectedParty } from './types';
type RecordInput = Omit<ConsequenceNode, 'id' | 'timestamp' | 'hash' | 'previous_hash'>;
export declare class HarmTrace {
    readonly incident_id: string;
    private nodes;
    private byId;
    constructor(incident_id: string);
    recordConsequence(node: RecordInput): ConsequenceNode;
    addRemediation(node_id: string, remediation: string): ConsequenceNode;
    private recomputeChainFrom;
    buildChain(root_id: string): CausalChain | null;
    getAllChains(): CausalChain[];
    getChainFromDecision(clearpath_trace_id: string): CausalChain[];
    getImpactSummary(): ImpactSummary;
    getSeverityScore(): number;
    detectPropagation(): PropagationPattern[];
    getConsequences(filters?: ConsequenceFilters): ConsequenceNode[];
    getAffectedParties(): AffectedParty[];
    getIrreversible(): ConsequenceNode[];
    verify(): VerifyResult;
    toJSON(): string;
    toMarkdown(): string;
    static fromJSON(json: string): HarmTrace;
    getOrphanNodes(): ConsequenceNode[];
}
export {};
//# sourceMappingURL=harm-trace.d.ts.map