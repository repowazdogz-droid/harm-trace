/**
 * Harm Trace Protocol (HTP-1.0) — propagation pattern detection
 */
import type { ConsequenceNode, CausalChain, PropagationPattern } from './types';
export declare function detectPropagation(nodes: ConsequenceNode[], chains: CausalChain[], byId: Map<string, ConsequenceNode>): PropagationPattern[];
//# sourceMappingURL=propagation.d.ts.map