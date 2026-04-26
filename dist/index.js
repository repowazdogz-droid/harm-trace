"use strict";
/**
 * Harm Trace Protocol (HTP-1.0)
 * Tamper-evident causation from AI decisions to real-world harm.
 * Zero external dependencies (Node.js crypto only).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.consequencePayload = exports.generateId = exports.chainHash = exports.sha256 = exports.detectPropagation = exports.severityNumeric = exports.getSeverityScore = exports.getImpactSummary = exports.getOrphanNodes = exports.getChainsFromDecision = exports.getAllChains = exports.buildChainFromLeaf = exports.buildChainFromRoot = exports.HarmTrace = exports.schema = void 0;
var types_1 = require("./types");
Object.defineProperty(exports, "schema", { enumerable: true, get: function () { return types_1.schema; } });
var harm_trace_1 = require("./harm-trace");
Object.defineProperty(exports, "HarmTrace", { enumerable: true, get: function () { return harm_trace_1.HarmTrace; } });
var causation_chain_1 = require("./causation-chain");
Object.defineProperty(exports, "buildChainFromRoot", { enumerable: true, get: function () { return causation_chain_1.buildChainFromRoot; } });
Object.defineProperty(exports, "buildChainFromLeaf", { enumerable: true, get: function () { return causation_chain_1.buildChainFromLeaf; } });
Object.defineProperty(exports, "getAllChains", { enumerable: true, get: function () { return causation_chain_1.getAllChains; } });
Object.defineProperty(exports, "getChainsFromDecision", { enumerable: true, get: function () { return causation_chain_1.getChainsFromDecision; } });
Object.defineProperty(exports, "getOrphanNodes", { enumerable: true, get: function () { return causation_chain_1.getOrphanNodes; } });
var impact_assessor_1 = require("./impact-assessor");
Object.defineProperty(exports, "getImpactSummary", { enumerable: true, get: function () { return impact_assessor_1.getImpactSummary; } });
Object.defineProperty(exports, "getSeverityScore", { enumerable: true, get: function () { return impact_assessor_1.getSeverityScore; } });
Object.defineProperty(exports, "severityNumeric", { enumerable: true, get: function () { return impact_assessor_1.severityNumeric; } });
var propagation_1 = require("./propagation");
Object.defineProperty(exports, "detectPropagation", { enumerable: true, get: function () { return propagation_1.detectPropagation; } });
var hash_1 = require("./hash");
Object.defineProperty(exports, "sha256", { enumerable: true, get: function () { return hash_1.sha256; } });
Object.defineProperty(exports, "chainHash", { enumerable: true, get: function () { return hash_1.chainHash; } });
Object.defineProperty(exports, "generateId", { enumerable: true, get: function () { return hash_1.generateId; } });
Object.defineProperty(exports, "consequencePayload", { enumerable: true, get: function () { return hash_1.consequencePayload; } });
