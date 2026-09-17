"""
Mathematical and Operational Invariants Test Suite for FedSentinel-Health
Verifies core architectural, mathematical, and security invariants.
"""

import pytest
import torch
from backend.ml.models.simple_cnn import MedicalImageCNN
from backend.trust.policy import TrustPolicy, DEFAULT_TRUST_POLICY
from backend.trust.trust_engine import TrustEngine
from backend.schemas.trust import TrustScore
from backend.core.constants import TrustState


def test_model_parameter_count_invariant():
    """Invariant: MedicalImageCNN must have exactly 37,858 trainable parameters."""
    model = MedicalImageCNN(in_channels=1, num_classes=2)
    params = model.get_flattened_parameters()
    assert params.numel() == 37858, f"Expected 37,858 parameters, found {params.numel()}"


def test_trust_policy_weights_sum_to_one():
    """Invariant: Policy weights (w_A + w_I + w_H + w_R + w_C) must sum to 1.0."""
    policy = TrustPolicy(
        w_anomaly=0.35,
        w_influence=0.25,
        w_history=0.20,
        w_robustness=0.10,
        w_contribution=0.10,
    )
    total = policy.w_anomaly + policy.w_influence + policy.w_history + policy.w_robustness + policy.w_contribution
    assert abs(total - 1.0) < 1e-4

    # Negative test: invalid sum must raise ValueError
    with pytest.raises(ValueError):
        TrustPolicy(
            w_anomaly=0.50,
            w_influence=0.50,
            w_history=0.20,
            w_robustness=0.10,
            w_contribution=0.10,
        )


def test_trust_score_bounded_zero_to_hundred():
    """Invariant: For any anomaly, influence, robustness, or attribution, T_i in [0, 100]."""
    engine = TrustEngine()

    # Extreme worst-case: maximum anomalies
    worst_score = engine.compute_trust(
        client_id="TEST_WORST",
        anomaly_score=1.0,
        influence_score=1.0,
        attribution_score=1.0,
        robustness_score=0.0,
    )
    assert 0.0 <= worst_score.score <= 100.0
    assert worst_score.state == TrustState.QUARANTINED.value

    # Ideal best-case: clean nominal update
    best_score = engine.compute_trust(
        client_id="TEST_BEST",
        anomaly_score=0.0,
        influence_score=0.0,
        attribution_score=0.0,
        robustness_score=1.0,
    )
    assert 0.0 <= best_score.score <= 100.0
    assert best_score.score >= 85.0
    assert best_score.state == TrustState.TRUSTED.value


def test_quarantined_client_receives_zero_weight():
    """Invariant: Quarantined nodes receive strictly 0.0 aggregation weight under defense."""
    engine = TrustEngine()
    scores = {
        "H1": TrustScore(client_id="H1", score=95.0, state=TrustState.TRUSTED.value),
        "H2": TrustScore(client_id="H2", score=90.0, state=TrustState.TRUSTED.value),
        "H3": TrustScore(client_id="H3", score=25.0, state=TrustState.QUARANTINED.value),
    }
    weights = engine.calculate_aggregation_weights(scores, defense_enabled=True)
    assert weights["H3"] == 0.0, "Quarantined node must receive 0.0 weight!"
    assert abs(sum(weights.values()) - 1.0) < 1e-3, "Aggregation weights must sum to 1.0!"


def test_defense_bypass_equal_weighting():
    """Invariant: Under defense bypass, all nodes receive uniform FedAvg weights."""
    engine = TrustEngine()
    scores = {
        "H1": TrustScore(client_id="H1", score=95.0, state=TrustState.TRUSTED.value),
        "H2": TrustScore(client_id="H2", score=90.0, state=TrustState.TRUSTED.value),
        "H3": TrustScore(client_id="H3", score=25.0, state=TrustState.QUARANTINED.value),
    }
    weights = engine.calculate_aggregation_weights(scores, defense_enabled=False)
    assert abs(weights["H1"] - 1.0 / 3.0) < 1e-3
    assert abs(weights["H3"] - 1.0 / 3.0) < 1e-3


def test_free_rider_penalty_and_weight_zero():
    """Invariant: Free-riders (norm_ratio < 0.05) must receive low trust and 0.0 aggregation weight."""
    engine = TrustEngine()

    # Free rider with minimal norm ratio (e.g. delta_w * 0.001)
    fr_score = engine.compute_trust(
        client_id="TEST_FREE_RIDER",
        anomaly_score=0.02,     # Appears spatially non-anomalous!
        influence_score=0.01,
        attribution_score=0.0,
        robustness_score=0.98,
        norm_ratio=0.001,       # Less than 0.05 threshold
        is_free_rider=True,
    )

    # Invariants:
    assert fr_score.is_free_rider is True
    assert fr_score.score <= 50.0, f"Free-rider trust must not inflate! Got {fr_score.score}"
    assert fr_score.contribution_integrity <= 15.0, "Contribution integrity must be penalized"
    assert fr_score.security_cleanliness >= 85.0, "Security cleanliness is high because node didn't poison weights"
    assert fr_score.state in ("SUSPICIOUS", "QUARANTINED")

    # Invariant: Aggregation weight must be strictly 0.0
    scores = {
        "H1": TrustScore(client_id="H1", score=95.0, state=TrustState.TRUSTED.value),
        "H2": TrustScore(client_id="H2", score=92.0, state=TrustState.TRUSTED.value),
        "FR": fr_score,
    }
    weights = engine.calculate_aggregation_weights(scores, defense_enabled=True)
    assert weights["FR"] == 0.0, "Free-rider must receive strictly 0.0 aggregation weight!"
    assert weights["H1"] > 0.0
    assert weights["H2"] > 0.0

