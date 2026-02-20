/**
 * Harm Trace Protocol (HTP-1.0) — type definitions
 */

export const schema = 'HTP-1.0' as const;

export type HarmCategory =
  | 'physical'
  | 'financial'
  | 'reputational'
  | 'psychological'
  | 'operational'
  | 'legal'
  | 'environmental'
  | 'informational'
  | 'discriminatory';

export type Severity =
  | 'negligible'
  | 'minor'
  | 'moderate'
  | 'serious'
  | 'critical'
  | 'catastrophic';

export type CausationType =
  | 'direct'
  | 'contributing'
  | 'enabling'
  | 'proximate'
  | 'but_for';

export interface AffectedParty {
  id: string;
  type: 'individual' | 'group' | 'organisation' | 'system' | 'environment';
  description: string;
  count?: number;
}

export interface DecisionOrigin {
  clearpath_trace_id?: string;
  consent_ledger_id?: string;
  agent_id: string;
  decision_timestamp: string;
  decision_summary: string;
}

export interface ConsequenceNode {
  id: string;
  timestamp: string;
  description: string;
  category: HarmCategory;
  severity: Severity;
  causation_type: CausationType;
  parent_id: string | null;
  origin: DecisionOrigin | null;
  affected_parties: AffectedParty[];
  evidence: string[];
  reversible: boolean;
  remediation_taken: string | null;
  hash: string;
  previous_hash: string;
}

export interface CausalChain {
  id: string;
  root_node_id: string;
  nodes: string[];
  total_affected: number;
  max_severity: Severity;
  categories: HarmCategory[];
  chain_length: number;
  verified: boolean;
}

export type PropagationPatternType =
  | 'cascade'
  | 'amplification'
  | 'delayed'
  | 'cross_domain'
  | 'feedback_loop';

export type SeverityTrajectory = 'escalating' | 'stable' | 'diminishing';

export interface PropagationPattern {
  id: string;
  pattern_type: PropagationPatternType;
  description: string;
  chain_ids: string[];
  severity_trajectory: SeverityTrajectory;
}

export interface ImpactSummary {
  total_consequences: number;
  by_category: Record<HarmCategory, number>;
  by_severity: Record<Severity, number>;
  total_affected_parties: number;
  reversible_count: number;
  irreversible_count: number;
  longest_chain: number;
  propagation_patterns: PropagationPattern[];
  generated_at: string;
}

export interface TraceSnapshot {
  schema: typeof schema;
  incident_id: string;
  nodes: ConsequenceNode[];
}

export interface VerifyResult {
  valid: boolean;
  nodes_checked: number;
}

export interface ConsequenceFilters {
  category?: HarmCategory;
  severity?: Severity;
  affected_party_type?: string;
}
