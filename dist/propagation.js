"use strict";
/**
 * Harm Trace Protocol (HTP-1.0) — propagation pattern detection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectPropagation = detectPropagation;
const impact_assessor_1 = require("./impact-assessor");
const hash_1 = require("./hash");
function detectPropagation(nodes, chains, byId) {
    const patterns = [];
    for (const chain of chains) {
        const chainNodes = chain.nodes.map((id) => byId.get(id)).filter((n) => n !== undefined);
        if (chainNodes.length >= 3) {
            const cascade = detectCascade(chain, chainNodes);
            if (cascade)
                patterns.push(cascade);
            const amplification = detectAmplification(chain, chainNodes);
            if (amplification)
                patterns.push(amplification);
        }
        if (chainNodes.length >= 2) {
            const crossDomain = detectCrossDomain(chain, chainNodes);
            if (crossDomain)
                patterns.push(crossDomain);
        }
        const delayed = detectDelayed(chain, chainNodes);
        if (delayed)
            patterns.push(delayed);
    }
    const feedback = detectFeedbackLoop(nodes, chains, byId);
    patterns.push(...feedback);
    return patterns;
}
function detectCascade(chain, chainNodes) {
    if (chainNodes.length < 3)
        return null;
    return {
        id: (0, hash_1.generateId)(),
        pattern_type: 'cascade',
        description: `Single decision led to ${chainNodes.length} consequences in sequence`,
        chain_ids: [chain.id],
        severity_trajectory: trajectory(chainNodes),
    };
}
function trajectory(nodes) {
    const scores = nodes.map((n) => (0, impact_assessor_1.severityNumeric)(n.severity));
    let up = 0;
    let down = 0;
    for (let i = 1; i < scores.length; i++) {
        if (scores[i] > scores[i - 1])
            up++;
        else if (scores[i] < scores[i - 1])
            down++;
    }
    if (up > down)
        return 'escalating';
    if (down > up)
        return 'diminishing';
    return 'stable';
}
function detectAmplification(chain, chainNodes) {
    const scores = chainNodes.map((n) => (0, impact_assessor_1.severityNumeric)(n.severity));
    let increasing = true;
    for (let i = 1; i < scores.length; i++) {
        if (scores[i] <= scores[i - 1]) {
            increasing = false;
            break;
        }
    }
    if (!increasing || chainNodes.length < 2)
        return null;
    return {
        id: (0, hash_1.generateId)(),
        pattern_type: 'amplification',
        description: 'Severity increases along the chain',
        chain_ids: [chain.id],
        severity_trajectory: 'escalating',
    };
}
function detectDelayed(chain, chainNodes) {
    if (chainNodes.length < 2)
        return null;
    const root = chainNodes[0];
    const leaf = chainNodes[chainNodes.length - 1];
    const decisionTime = root.origin?.decision_timestamp
        ? new Date(root.origin.decision_timestamp).getTime()
        : new Date(root.timestamp).getTime();
    const leafTime = new Date(leaf.timestamp).getTime();
    const delayHours = (leafTime - decisionTime) / (1000 * 60 * 60);
    if (delayHours < 24)
        return null;
    return {
        id: (0, hash_1.generateId)(),
        pattern_type: 'delayed',
        description: `Significant delay (${Math.round(delayHours)}h) between decision and consequence`,
        chain_ids: [chain.id],
        severity_trajectory: trajectory(chainNodes),
    };
}
function detectCrossDomain(chain, chainNodes) {
    const categories = new Set(chainNodes.map((n) => n.category));
    if (categories.size < 2)
        return null;
    return {
        id: (0, hash_1.generateId)(),
        pattern_type: 'cross_domain',
        description: `Harm crosses ${categories.size} categories: ${[...categories].join(', ')}`,
        chain_ids: [chain.id],
        severity_trajectory: trajectory(chainNodes),
    };
}
function detectFeedbackLoop(nodes, chains, byId) {
    const patterns = [];
    for (const chain of chains) {
        const chainNodeIds = new Set(chain.nodes);
        const hasBackRef = nodes.some((n) => n.parent_id !== null && chainNodeIds.has(n.parent_id) && chain.nodes.includes(n.id));
        const descendantPointsToRoot = chain.nodes.some((id, i) => {
            const node = byId.get(id);
            return node && i > 0 && chain.nodes.indexOf(node.parent_id ?? '') > i;
        });
        if (descendantPointsToRoot) {
            patterns.push({
                id: (0, hash_1.generateId)(),
                pattern_type: 'feedback_loop',
                description: 'Consequence feeds back to create new causes in chain',
                chain_ids: [chain.id],
                severity_trajectory: 'stable',
            });
        }
    }
    return patterns;
}
