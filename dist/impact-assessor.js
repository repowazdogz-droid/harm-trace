"use strict";
/**
 * Harm Trace Protocol (HTP-1.0) — impact categorisation and severity scoring
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImpactSummary = getImpactSummary;
exports.getSeverityScore = getSeverityScore;
exports.severityNumeric = severityNumeric;
const SEVERITY_SCORE = {
    negligible: 0.05,
    minor: 0.15,
    moderate: 0.35,
    serious: 0.6,
    critical: 0.8,
    catastrophic: 1.0,
};
const ALL_CATEGORIES = [
    'physical',
    'financial',
    'reputational',
    'psychological',
    'operational',
    'legal',
    'environmental',
    'informational',
    'discriminatory',
];
const ALL_SEVERITIES = [
    'negligible',
    'minor',
    'moderate',
    'serious',
    'critical',
    'catastrophic',
];
function byCategory(nodes) {
    const out = Object.fromEntries(ALL_CATEGORIES.map((c) => [c, 0]));
    for (const n of nodes) {
        out[n.category] = (out[n.category] ?? 0) + 1;
    }
    return out;
}
function bySeverity(nodes) {
    const out = Object.fromEntries(ALL_SEVERITIES.map((s) => [s, 0]));
    for (const n of nodes) {
        out[n.severity] = (out[n.severity] ?? 0) + 1;
    }
    return out;
}
function getImpactSummary(nodes, longest_chain, propagation_patterns) {
    const total_affected_parties = nodes.reduce((sum, n) => sum + n.affected_parties.reduce((s, p) => s + (p.count ?? 1), 0), 0);
    const reversible_count = nodes.filter((n) => n.reversible).length;
    const irreversible_count = nodes.length - reversible_count;
    return {
        total_consequences: nodes.length,
        by_category: byCategory(nodes),
        by_severity: bySeverity(nodes),
        total_affected_parties,
        reversible_count,
        irreversible_count,
        longest_chain,
        propagation_patterns,
        generated_at: new Date().toISOString(),
    };
}
function getSeverityScore(nodes) {
    if (nodes.length === 0)
        return 0;
    const maxScore = Math.max(...nodes.map((n) => SEVERITY_SCORE[n.severity]));
    const irreversibleWeight = nodes.filter((n) => !n.reversible).length / nodes.length;
    const affectedWeight = Math.min(1, nodes.reduce((s, n) => s + n.affected_parties.reduce((a, p) => a + (p.count ?? 1), 0), 0) / 100);
    return Math.min(1, maxScore * 0.7 + irreversibleWeight * 0.2 + affectedWeight * 0.1);
}
function severityNumeric(s) {
    return SEVERITY_SCORE[s];
}
