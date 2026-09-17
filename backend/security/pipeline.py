"""
Unified Zero-Trust Security Pipeline for FedSentinel-Health
Orchestrates Layer 0 Validation, Layer 1 Fingerprinting, Layer 2 Anomaly Detection,
Influence Testing, and Attribution Analysis.
"""

import torch
from typing import Dict, List, Any, Tuple
from backend.security.validation.layer0 import Layer0Validator
from backend.security.fingerprinting.layer1 import Layer1Fingerprinter
from backend.security.anomaly_detection.layer2 import Layer2AnomalyEngine
from backend.security.influence.influence_tester import InfluenceTester
from backend.security.attribution.group_attribution import GroupAttributionEngine
from backend.ml.training.evaluator import RootTrustEvaluator
from backend.schemas.detections import DetectionResult
from backend.schemas.updates import UpdateFingerprint


from backend.security.robustness.robustness_tester import RobustnessTester

class SecurityPipeline:
    """End-to-end multi-layer Zero-Trust security gateway."""

    def __init__(self, evaluator: RootTrustEvaluator):
        self.evaluator = evaluator
        self.l0_validator = Layer0Validator()
        self.l1_fingerprinter = Layer1Fingerprinter()
        self.l2_anomaly_engine = Layer2AnomalyEngine()
        self.influence_tester = InfluenceTester(evaluator)
        self.robustness_tester = RobustnessTester(evaluator)
        self.attribution_engine = GroupAttributionEngine()

    def process_round_updates(
        self,
        round_id: int,
        base_weights: torch.Tensor,
        raw_updates: Dict[str, torch.Tensor],
    ) -> Tuple[Dict[str, torch.Tensor], Dict[str, UpdateFingerprint], Dict[str, DetectionResult], Dict[str, float], Dict[str, float], Dict[str, float]]:
        """
        Processes all incoming hospital updates through the full security pipeline.
        Returns:
            - sanitized_updates: Dict[client_id, tensor]
            - fingerprints: Dict[client_id, UpdateFingerprint]
            - detections: Dict[client_id, DetectionResult]
            - influence_scores: Dict[client_id, float]
            - robustness_scores: Dict[client_id, float]
            - attribution_scores: Dict[client_id, float]
        """
        # --- Layer 0: Input Validation & Sanitization ---
        sanitized_updates: Dict[str, torch.Tensor] = {}
        l0_evidence: Dict[str, list] = {}

        for cid, dw in raw_updates.items():
            valid, clean_dw, ev = self.l0_validator.validate_update(cid, dw)
            sanitized_updates[cid] = clean_dw
            l0_evidence[cid] = ev

        # --- Calculate Ground Truth Reference: Root Gradient r_t ---
        root_grad = self.evaluator.compute_root_gradient(base_weights)

        # --- Layer 1: Privacy-Safe Fingerprinting ---
        fingerprints: Dict[str, UpdateFingerprint] = {}
        for cid, dw in sanitized_updates.items():
            fp = self.l1_fingerprinter.compute_fingerprint(cid, dw, root_grad, sanitized_updates)
            fingerprints[cid] = fp

        # --- Layer 2: Multi-Signal Anomaly Detection ---
        detections = self.l2_anomaly_engine.evaluate_cohort(fingerprints, round_id)

        # Append Layer 0 evidence items to detection results
        for cid, det in detections.items():
            if cid in l0_evidence:
                det.signals = l0_evidence[cid] + det.signals

        # --- Counterfactual Influence Testing ---
        influence_scores = self.influence_tester.compute_influence(base_weights, sanitized_updates)

        # --- Layer 5: Robustness Testing ---
        robustness_scores = self.robustness_tester.evaluate_robustness(base_weights, sanitized_updates)

        # --- Group Attribution ---
        attribution_scores = self.attribution_engine.compute_attribution(sanitized_updates, root_grad)

        return sanitized_updates, fingerprints, detections, influence_scores, robustness_scores, attribution_scores
