"use strict";
/**
 * Harm Trace Protocol (HTP-1.0) — main HarmTrace class
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HarmTrace = void 0;
const types_1 = require("./types");
const hash_1 = require("./hash");
const causation_chain_1 = require("./causation-chain");
const impact_assessor_1 = require("./impact-assessor");
const propagation_1 = require("./propagation");
const GENESIS = '0';
class HarmTrace {
    constructor(incident_id) {
        this.nodes = [];
        this.byId = new Map();
        this.incident_id = incident_id;
    }
    recordConsequence(node) {
        const id = (0, hash_1.generateId)();
        const timestamp = new Date().toISOString();
        const previous_hash = this.nodes.length === 0 ? GENESIS : this.nodes[this.nodes.length - 1].hash;
        const full = {
            ...node,
            id,
            timestamp,
            previous_hash,
            hash: '',
        };
        full.hash = (0, hash_1.chainHash)(previous_hash, (0, hash_1.consequencePayload)(full));
        this.nodes.push(full);
        this.byId.set(id, full);
        return full;
    }
    addRemediation(node_id, remediation) {
        const node = this.byId.get(node_id);
        if (!node)
            throw new Error(`Consequence not found: ${node_id}`);
        node.remediation_taken = remediation;
        const idx = this.nodes.findIndex((n) => n.id === node_id);
        this.recomputeChainFrom(idx);
        return node;
    }
    recomputeChainFrom(index) {
        const prev = index === 0 ? GENESIS : this.nodes[index - 1].hash;
        for (let i = index; i < this.nodes.length; i++) {
            const n = this.nodes[i];
            n.previous_hash = i === 0 ? GENESIS : this.nodes[i - 1].hash;
            n.hash = (0, hash_1.chainHash)(n.previous_hash, (0, hash_1.consequencePayload)(n));
        }
    }
    buildChain(root_id) {
        return (0, causation_chain_1.buildChainFromRoot)(root_id, this.nodes, this.byId);
    }
    getAllChains() {
        return (0, causation_chain_1.getAllChains)(this.nodes);
    }
    getChainFromDecision(clearpath_trace_id) {
        return (0, causation_chain_1.getChainsFromDecision)(clearpath_trace_id, this.nodes);
    }
    getImpactSummary() {
        const chains = this.getAllChains();
        const longest = chains.length === 0 ? 0 : Math.max(...chains.map((c) => c.chain_length));
        const patterns = this.detectPropagation();
        return (0, impact_assessor_1.getImpactSummary)(this.nodes, longest, patterns);
    }
    getSeverityScore() {
        return (0, impact_assessor_1.getSeverityScore)(this.nodes);
    }
    detectPropagation() {
        const chains = this.getAllChains();
        return (0, propagation_1.detectPropagation)(this.nodes, chains, this.byId);
    }
    getConsequences(filters) {
        let list = this.nodes.slice();
        if (filters?.category)
            list = list.filter((n) => n.category === filters.category);
        if (filters?.severity)
            list = list.filter((n) => n.severity === filters.severity);
        if (filters?.affected_party_type)
            list = list.filter((n) => n.affected_parties.some((p) => p.type === filters.affected_party_type));
        return list;
    }
    getAffectedParties() {
        const seen = new Map();
        for (const n of this.nodes) {
            for (const p of n.affected_parties) {
                if (!seen.has(p.id))
                    seen.set(p.id, p);
            }
        }
        return [...seen.values()];
    }
    getIrreversible() {
        return this.nodes.filter((n) => !n.reversible);
    }
    verify() {
        let valid = true;
        let prev = GENESIS;
        for (const n of this.nodes) {
            if (n.previous_hash !== prev)
                valid = false;
            const expected = (0, hash_1.chainHash)(n.previous_hash, (0, hash_1.consequencePayload)(n));
            if (n.hash !== expected)
                valid = false;
            prev = n.hash;
        }
        return { valid, nodes_checked: this.nodes.length };
    }
    toJSON() {
        const snapshot = {
            schema: types_1.schema,
            incident_id: this.incident_id,
            nodes: this.nodes,
        };
        return JSON.stringify(snapshot, null, 2);
    }
    toMarkdown() {
        const chains = this.getAllChains();
        const summary = this.getImpactSummary();
        const lines = [
            '# Harm Trace',
            '',
            `**Schema:** ${types_1.schema}  `,
            `**Incident:** ${this.incident_id}  `,
            `**Generated:** ${summary.generated_at}`,
            '',
            '## Impact summary',
            '',
            `| Metric | Value |`,
            `|--------|-------|`,
            `| Total consequences | ${summary.total_consequences} |`,
            `| Total affected parties | ${summary.total_affected_parties} |`,
            `| Reversible | ${summary.reversible_count} |`,
            `| Irreversible | ${summary.irreversible_count} |`,
            `| Longest chain | ${summary.longest_chain} |`,
            '',
            '## Causal chains',
            '',
        ];
        for (const c of chains.slice(0, 10)) {
            lines.push(`### Chain ${c.id.slice(0, 8)}... (root: ${c.root_node_id.slice(0, 8)}...)`);
            lines.push(`- Length: ${c.chain_length}, Max severity: ${c.max_severity}, Affected: ${c.total_affected}`);
            lines.push(`- Nodes: ${c.nodes.join(' → ')}`);
            lines.push('');
        }
        if (summary.propagation_patterns.length > 0) {
            lines.push('## Propagation patterns', '');
            for (const p of summary.propagation_patterns) {
                lines.push(`- **${p.pattern_type}**: ${p.description}`);
            }
        }
        return lines.join('\n');
    }
    static fromJSON(json) {
        const snapshot = JSON.parse(json);
        if (snapshot.schema !== types_1.schema)
            throw new Error(`Invalid schema: expected ${types_1.schema}`);
        const trace = new HarmTrace(snapshot.incident_id);
        const T = trace;
        T.nodes = snapshot.nodes;
        T.byId = new Map(snapshot.nodes.map((n) => [n.id, n]));
        return trace;
    }
    getOrphanNodes() {
        return (0, causation_chain_1.getOrphanNodes)(this.nodes);
    }
}
exports.HarmTrace = HarmTrace;
