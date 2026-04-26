"use strict";
/**
 * Harm Trace Protocol (HTP-1.0) — causal chain building and validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildChainFromRoot = buildChainFromRoot;
exports.buildChainFromLeaf = buildChainFromLeaf;
exports.getAllChains = getAllChains;
exports.getChainsFromDecision = getChainsFromDecision;
exports.getOrphanNodes = getOrphanNodes;
const hash_1 = require("./hash");
function buildChainFromRoot(root_id, nodes, byId) {
    const root = byId.get(root_id);
    if (!root)
        return null;
    const ordered = [root_id];
    const childrenByParent = new Map();
    for (const n of nodes) {
        if (n.parent_id !== null) {
            const list = childrenByParent.get(n.parent_id) ?? [];
            list.push(n.id);
            childrenByParent.set(n.parent_id, list);
        }
    }
    const queue = [root_id];
    while (queue.length > 0) {
        const id = queue.shift();
        const children = (childrenByParent.get(id) ?? []).slice().sort();
        for (const cid of children) {
            ordered.push(cid);
            queue.push(cid);
        }
    }
    const chainNodes = ordered;
    if (chainNodes.length === 0)
        return null;
    const total_affected = chainNodes.reduce((sum, id) => {
        const n = byId.get(id);
        return sum + (n?.affected_parties.reduce((s, p) => s + (p.count ?? 1), 0) ?? 0);
    }, 0);
    const severities = chainNodes
        .map((id) => byId.get(id)?.severity)
        .filter((s) => s !== undefined);
    const max_severity = maxSeverity(severities);
    const categories = [...new Set(chainNodes.map((id) => byId.get(id)?.category).filter((c) => c !== undefined))];
    return {
        id: (0, hash_1.generateId)(),
        root_node_id: root_id,
        nodes: chainNodes,
        total_affected,
        max_severity,
        categories,
        chain_length: chainNodes.length,
        verified: true,
    };
}
function buildChainFromLeaf(leaf_id, nodes, byId) {
    const chain = [];
    let current = byId.get(leaf_id);
    while (current) {
        chain.unshift(current.id);
        if (current.parent_id === null)
            break;
        current = byId.get(current.parent_id);
    }
    if (chain.length === 0)
        return null;
    const root_id = chain[0];
    return buildChainFromRoot(root_id, nodes, byId);
}
function getAllChains(nodes) {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const roots = nodes.filter((n) => n.parent_id === null);
    const seen = new Set();
    const chains = [];
    for (const r of roots) {
        const c = buildChainFromRoot(r.id, nodes, byId);
        if (c && !seen.has(c.root_node_id)) {
            seen.add(c.root_node_id);
            chains.push(c);
        }
    }
    return chains;
}
function getChainsFromDecision(clearpath_trace_id, nodes) {
    const roots = nodes.filter((n) => n.origin?.clearpath_trace_id === clearpath_trace_id);
    const byId = new Map(nodes.map((n) => [n.id, n]));
    return roots
        .map((r) => buildChainFromRoot(r.id, nodes, byId))
        .filter((c) => c !== null);
}
function getOrphanNodes(nodes) {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    return nodes.filter((n) => {
        if (n.parent_id === null)
            return false;
        return !byId.has(n.parent_id);
    });
}
function maxSeverity(severities) {
    const order = [
        'negligible',
        'minor',
        'moderate',
        'serious',
        'critical',
        'catastrophic',
    ];
    let max = 'negligible';
    let maxIdx = 0;
    for (const s of severities) {
        const idx = order.indexOf(s);
        if (idx > maxIdx) {
            maxIdx = idx;
            max = s;
        }
    }
    return max;
}
