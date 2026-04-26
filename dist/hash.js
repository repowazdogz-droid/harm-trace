"use strict";
/**
 * Harm Trace Protocol (HTP-1.0) — hashing and ID generation
 * Uses Node.js crypto only (zero external dependencies).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256 = sha256;
exports.chainHash = chainHash;
exports.generateId = generateId;
exports.consequencePayload = consequencePayload;
const crypto_1 = require("crypto");
const HASH_ALGORITHM = 'sha256';
const ID_BYTES = 16;
function sha256(data) {
    return (0, crypto_1.createHash)(HASH_ALGORITHM).update(data, 'utf8').digest('hex');
}
function chainHash(previousHash, payload) {
    return sha256(previousHash + payload);
}
function generateId() {
    return (0, crypto_1.randomBytes)(ID_BYTES).toString('hex');
}
function affectedPartyPayload(p) {
    return `${p.id}:${p.type}:${p.description}:${p.count ?? ''}`;
}
function originPayload(o) {
    if (!o)
        return '';
    return [
        o.clearpath_trace_id ?? '',
        o.consent_ledger_id ?? '',
        o.agent_id,
        o.decision_timestamp,
        o.decision_summary,
    ].join('|');
}
function consequencePayload(node) {
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
