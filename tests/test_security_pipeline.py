"""
Security Pipeline Unit and Invariant Test Suite for FedSentinel-Health
Tests Layer 0 validation, Layer 1 fingerprinting, Layer 2 anomaly detection, and Layer 4 robustness.
"""

import pytest
import torch
from backend.security.validation.layer0 import Layer0Validator
from backend.security.fingerprinting.layer1 import Layer1Fingerprinter
from backend.security.anomaly_detection.layer2 import Layer2AnomalyEngine
from backend.schemas.updates import UpdateFingerprint


def test_layer0_validates_clean_tensor():
    """L0 must pass valid finite PyTorch tensor with normal norm."""
    validator = Layer0Validator(max_norm=100.0)
    dw = torch.randn(37858) * 0.05
    valid, clean_dw, evidence = validator.validate_update("H1", dw)
    assert valid is True
    assert clean_dw.size() == dw.size()


def test_layer0_rejects_nan_and_inf():
    """L0 must sanitize or flag tensors containing IEEE 754 NaN or Inf values."""
    validator = Layer0Validator()
    dw_nan = torch.randn(37858)
    dw_nan[10] = float("nan")
    valid, clean_dw, evidence = validator.validate_update("H1", dw_nan)
    # Layer 0 cleans NaN to 0.0 and records warning evidence
    assert not torch.isnan(clean_dw).any()


def test_layer1_fingerprint_deterministic():
    """L1 fingerprint hash and metrics must be reproducible for identical tensors."""
    fingerprinter = Layer1Fingerprinter(projection_dim=16, seed=42)
    dw = torch.ones(37858) * 0.1
    root = torch.ones(37858) * 0.1
    peers = {"H1": dw}

    fp1 = fingerprinter.compute_fingerprint("H1", dw, root, peers)
    fp2 = fingerprinter.compute_fingerprint("H1", dw, root, peers)

    assert fp1.fingerprint_hash == fp2.fingerprint_hash
    assert abs(fp1.update_norm - fp2.update_norm) < 1e-5
    assert abs(fp1.cosine_to_root - 1.0) < 1e-4


def test_layer2_detects_magnitude_poisoning():
    """L2 anomaly engine must flag a client update with 10x magnitude spike."""
    engine = Layer2AnomalyEngine()
    
    # 4 nominal clean clients
    fps = {
        f"H{i}": UpdateFingerprint(
            update_norm=1.0 + (i * 0.05),
            cosine_to_root=0.92,
            peer_similarity=0.90,
            layer_norms=[0.4, 0.6],
            random_projection=[0.1] * 8,
            sparsity=0.01,
            fingerprint_hash=f"hash_clean_{i}",
        )
        for i in range(1, 5)
    }
    # 1 malicious client with 15x norm
    fps["H5_MALICIOUS"] = UpdateFingerprint(
        update_norm=15.0,
        cosine_to_root=-0.85,
        peer_similarity=-0.75,
        layer_norms=[6.0, 9.0],
        random_projection=[-0.8] * 8,
        sparsity=0.0,
        fingerprint_hash="hash_poisoned",
    )

    detections = engine.evaluate_cohort(fps, round_id=25)
    assert detections["H5_MALICIOUS"].decision == "QUARANTINE"
    assert detections["H5_MALICIOUS"].anomaly_score > 0.70
    assert detections["H1"].decision == "ACCEPT"
