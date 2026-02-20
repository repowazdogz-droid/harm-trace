/**
 * Harm Trace Protocol (HTP-1.0) — hashing and ID generation
 * Uses Node.js crypto only (zero external dependencies).
 */

import { createHash, randomBytes } from 'crypto';
import type { ConsequenceNode, AffectedParty, DecisionOrigin } from './types';

const HASH_ALGORITHM = 'sha256';
const ID_BYTES = 16;

export function sha256(data: string): string {
  return createHash(HASH_ALGORITHM).update(data, 'utf8').digest('hex');
}

export function chainHash(previousHash: string, payload: string): string {
  return sha256(previousHash + payload);
}

export function generateId(): string {
  return randomBytes(ID_BYTES).toString('hex');
}

function affectedPartyPayload(p: AffectedParty): string {
  return `${p.id}:${p.type}:${p.description}:${p.count ?? ''}`;
}

function originPayload(o: DecisionOrigin | null): string {
  if (!o) return '';
  return [
    o.clearpath_trace_id ?? '',
    o.consent_ledger_id ?? '',
    o.agent_id,
    o.decision_timestamp,
    o.decision_summary,
  ].join('|');
}

export function consequencePayload(node: ConsequenceNode): string {
  const parties = node.affected_parties.map(affectedPartyPayload).sort().join(';');
  const evidence = [...node.evidence].sort().join('|');
  return [
    node.id,
    node.timestamp,
    node.description,
    node.category,
    node.severity,
    node.causation_type,
    node.parent_id ?? '',
    originPayload(node.origin),
    parties,
    evidence,
    String(node.reversible),
    node.remediation_taken ?? '',
  ].join('\n');
}
