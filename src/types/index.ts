// Core FedSentinel Type Definitions Matching Backend Response Models

export type ClientStatus = 'TRUSTED' | 'REVIEW' | 'QUARANTINED' | 'BLOCKED' | string;

export interface HospitalClient {
  client_id: string; // e.g. "H3"
  name: string; // e.g. "Hospital 3 - St. Jude Regional"
  status: ClientStatus;
  trust_score: number; // 0 - 100
  samples_count: number;
  historical_anomalies: number;
  last_active_round: number;
}

export type RoundStatus = 'COMPLETED' | 'IN_PROGRESS' | 'FAILED' | 'PENDING' | string;

export interface FederationRound {
  round_id: number;
  status: RoundStatus;
  participating_clients: string[];
  quarantined_clients: string[];
  accepted_clients: string[];
  global_accuracy: number;
  timestamp: string; // ISO timestamp
}

export interface StartRoundRequest {
  round_id?: number;
  target_clients?: string[];
}

export interface BlastRadius {
  baseline_asr?: number;
  post_update_asr?: number;
  baseline_accuracy?: number;
  post_update_accuracy?: number;
  impacted_target_class?: string;
  target_class_accuracy_drop?: number;
}

export interface Layer0LocalValidation {
  status?: string;
  checks_passed?: number;
  total_checks?: number;
  details?: string;
  format_valid?: boolean;
  nan_inf_check?: string;
}

export interface Layer1UpdateFingerprint {
  hash?: string;
  dimensions?: number;
  norm?: number;
  cosine_distance_to_median?: number;
  fingerprint_sample?: number[];
}

export interface Layer2AnomalyDetection {
  anomaly_score?: number;
  threshold?: number;
  flagged_dimensions?: string[];
  method?: string;
  spatial_divergence?: number;
}

export interface Layer3InfluenceTesting {
  influence_score?: number;
  counterfactual_risk?: number;
  test_loss_delta?: number;
  gradient_projection?: number;
}

export interface Layer4CounterfactualRobustness {
  robustness_score?: number;
  targeted_class_shift?: string;
  poison_probability?: number;
  leave_one_out_impact?: number;
}

export interface Layer5ClientAttribution {
  attributed_client_id?: string;
  signature_match?: boolean;
  historical_pattern_similarity?: number;
  device_pcr_match?: boolean;
}

export interface TrustEngineResult {
  trust_before?: number;
  trust_after?: number;
  penalty_breakdown?: Record<string, number>;
  recommended_action?: string;
  decay_rate?: number;
}

export interface IncidentEvidenceSummary {
  layer0_local_validation?: Layer0LocalValidation;
  layer1_fingerprint?: Layer1UpdateFingerprint;
  layer2_anomaly?: Layer2AnomalyDetection;
  layer3_influence?: Layer3InfluenceTesting;
  layer4_counterfactual?: Layer4CounterfactualRobustness;
  layer5_attribution?: Layer5ClientAttribution;
  trust_engine?: TrustEngineResult;
  [key: string]: any;
}

export interface Incident {
  incident_id: string; // e.g. "FS-034"
  client_id: string; // e.g. "H3"
  round_id: number;
  update_hash: string;
  integrity_status: 'PASS' | 'FAIL' | string;
  threat_hypothesis: 'BACKDOOR' | 'MODEL_POISONING' | 'SIGN_FLIP' | 'FREE_RIDER' | 'OOD_COHORT' | string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  action_taken: 'QUARANTINED' | 'BLOCKED' | 'FLAGGED_REVIEW' | 'ACCEPTED' | string;
  trust_before: number;
  trust_after: number;
  blast_radius?: BlastRadius;
  evidence_summary?: IncidentEvidenceSummary;
  timestamp: string; // ISO timestamp
}

export interface ClientTrustInfo {
  client_id: string;
  current_trust_score: number;
  status: ClientStatus;
  trust_history?: Array<{
    round_id: number;
    score: number;
    delta: number;
    reason: string;
    timestamp: string;
  }>;
  incident_count?: number;
  penalties?: Array<{
    type: string;
    points: number;
    date: string;
  }>;
  factors?: {
    anomaly_resistance?: number;
    influence_safety?: number;
    counterfactual_stability?: number;
    consistency?: number;
  };
}

export interface SimulationResponse {
  status: string; // e.g. "SIMULATION_COMPLETE"
  incident: Incident;
}

export interface FedSentinelEvent {
  event_type: string;
  round_id: number;
  client_id: string;
  payload: Record<string, any>;
  timestamp: string;
}

export type NavigationPage = 
  | 'overview'
  | 'clients'
  | 'rounds'
  | 'incidents'
  | 'investigation';

export type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'error';
