/**
 * Harm Trace Protocol (HTP-1.0) — hashing and ID generation
 * Uses Node.js crypto only (zero external dependencies).
 */
import type { ConsequenceNode } from './types';
export declare function sha256(data: string): string;
export declare function chainHash(previousHash: string, payload: string): string;
export declare function generateId(): string;
export declare function consequencePayload(node: ConsequenceNode): string;
//# sourceMappingURL=hash.d.ts.map