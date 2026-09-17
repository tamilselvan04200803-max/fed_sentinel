import { HospitalClient, Incident, FederationRound } from '../types';

export const INITIAL_HOSPITALS: HospitalClient[] = [
  { client_id: 'H1', name: 'Mount Sinai', status: 'TRUSTED', trust_score: 98, samples_count: 14200, historical_anomalies: 0, last_active_round: 24 },
  { client_id: 'H2', name: 'Mayo Clinic', status: 'TRUSTED', trust_score: 95, samples_count: 11000, historical_anomalies: 0, last_active_round: 24 },
  { client_id: 'H3', name: 'St. Jude Regional', status: 'TRUSTED', trust_score: 82, samples_count: 8500, historical_anomalies: 0, last_active_round: 24 },
  { client_id: 'H4', name: 'Cleveland Clinic', status: 'TRUSTED', trust_score: 96, samples_count: 12100, historical_anomalies: 0, last_active_round: 24 },
  { client_id: 'H5', name: 'Johns Hopkins', status: 'TRUSTED', trust_score: 99, samples_count: 16500, historical_anomalies: 0, last_active_round: 24 },
];

export const PHASE_2_ATTACK_INCIDENT: Incident = {
  incident_id: 'FS-034',
  client_id: 'H3',
  round_id: 25,
  update_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  integrity_status: 'PASS',
  threat_hypothesis: 'BACKDOOR',
  confidence: 'HIGH',
  action_taken: 'QUARANTINED',
  trust_before: 82,
  trust_after: 45,
  blast_radius: {
    baseline_asr: 0.0,
    post_update_asr: 89.4,
    baseline_accuracy: 94.5,
    post_update_accuracy: 91.2,
    impacted_target_class: 'Class 7 (Malignant Glioblastoma)',
    target_class_accuracy_drop: 44.1
  },
  evidence_summary: {
    layer0_local_validation: { status: 'PASS', checks_passed: 12, total_checks: 12, format_valid: true, nan_inf_check: 'CLEAN' },
    layer1_fingerprint: { hash: 'e3b0...', norm: 4.8, cosine_distance_to_median: 0.86, dimensions: 24576 },
    layer2_anomaly: { anomaly_score: 0.88, threshold: 0.45, flagged_dimensions: ['conv5_3.weight'], spatial_divergence: 3.6 },
    layer3_influence: { influence_score: 0.94, counterfactual_risk: 0.91, test_loss_delta: 0.035 },
    layer4_counterfactual: { robustness_score: 0.12, poison_probability: 0.96, targeted_class_shift: 'Class 7' },
    layer5_attribution: { attributed_client_id: 'H3', signature_match: true, historical_pattern_similarity: 0.96 },
    trust_engine: {
      trust_before: 82,
      trust_after: 45,
      penalty_breakdown: { 'ANOMALY_DIVERGENCE': -25, 'HIGH_INFLUENCE_RISK': -12 },
      recommended_action: 'QUARANTINE_CLIENT'
    }
  },
  timestamp: new Date().toISOString()
};

export const INITIAL_ROUNDS: FederationRound[] = [
  { round_id: 24, status: 'COMPLETED', participating_clients: ['H1','H2','H3','H4','H5'], quarantined_clients: [], accepted_clients: ['H1','H2','H3','H4','H5'], global_accuracy: 94.5, timestamp: new Date().toISOString() }
];
