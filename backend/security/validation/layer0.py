"""
Layer 0 — Local Update Validation for FedSentinel-Health
Structural integrity checks, NaN/Inf detection, gradient norm limits, and dynamic clipping.
"""

import torch
from typing import Dict, Any, Tuple, List
from backend.core.config import settings
from backend.schemas.detections import EvidenceItem


class Layer0Validator:
    """Zero-Trust input validation gate for raw incoming tensor payloads."""

    def __init__(self, max_norm: float = settings.MAX_UPDATE_NORM, clip_threshold: float = settings.GRADIENT_CLIP_NORM):
        self.max_norm = max_norm
        self.clip_threshold = clip_threshold

    def validate_update(self, client_id: str, delta_w: torch.Tensor) -> Tuple[bool, torch.Tensor, List[EvidenceItem]]:
        """
        Validates raw update vector Δw_i.
        Returns:
            - is_valid: bool
            - sanitized_delta_w: clipped tensor
            - evidence_items: list of Layer 0 forensic checks
        """
        evidence: List[EvidenceItem] = []
        is_valid = True

        # Check 1: NaN or Inf check
        has_nan = torch.isnan(delta_w).any().item()
        has_inf = torch.isinf(delta_w).any().item()

        if has_nan or has_inf:
            is_valid = False
            evidence.append(EvidenceItem(
                layer="L0",
                signal="nan_inf_check",
                value=1.0 if has_nan else 2.0,
                threshold=0.0,
                status="FAIL",
                description=f"Update from {client_id} contains corrupt NaN/Inf tensor values. Immediate rejection."
            ))
            # Return zero tensor to prevent crash
            return False, torch.zeros_like(delta_w), evidence
        else:
            evidence.append(EvidenceItem(
                layer="L0",
                signal="nan_inf_check",
                value=0.0,
                threshold=0.0,
                status="PASS",
                description="Numerical sanity verified: zero NaN or Inf values detected."
            ))

        # Check 2: L2 Update Norm and Clipping
        norm_val = float(torch.norm(delta_w, p=2).item())
        sanitized_delta = delta_w.clone()

        if norm_val > self.clip_threshold:
            # Apply gradient clipping formula: Δw_i' = Δw_i * (C / ||Δw_i||_2)
            clip_factor = self.clip_threshold / max(norm_val, 1e-8)
            sanitized_delta = sanitized_delta * clip_factor
            
            status = "WARN" if norm_val < self.max_norm else "FAIL"
            if norm_val >= self.max_norm:
                is_valid = False

            evidence.append(EvidenceItem(
                layer="L0",
                signal="update_norm_clipping",
                value=norm_val,
                threshold=self.clip_threshold,
                status=status,
                description=f"Gradient norm ({norm_val:.2f}) exceeded threshold ({self.clip_threshold:.2f}). Clipped to safe envelope."
            ))
        else:
            evidence.append(EvidenceItem(
                layer="L0",
                signal="update_norm_clipping",
                value=norm_val,
                threshold=self.clip_threshold,
                status="PASS",
                description=f"Update norm ({norm_val:.2f}) within permissible operational bound."
            ))

        return is_valid, sanitized_delta, evidence
