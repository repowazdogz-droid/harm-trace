/**
 * Harm Trace Protocol (HTP-1.0) — causal chain building and validation
 */
import type { ConsequenceNode, CausalChain } from './types';
export declare function buildChainFromRoot(root_id: string, nodes: ConsequenceNode[], byId: Map<string, ConsequenceNode>): CausalChain | null;
export declare function buildChainFromLeaf(leaf_id: string, nodes: ConsequenceNode[], byId: Map<string, ConsequenceNode>): CausalChain | null;
export declare function getAllChains(nodes: ConsequenceNode[]): CausalChain[];
export declare function getChainsFromDecision(clearpath_trace_id: string, nodes: ConsequenceNode[]): CausalChain[];
export declare function getOrphanNodes(nodes: ConsequenceNode[]): ConsequenceNode[];
//# sourceMappingURL=causation-chain.d.ts.map