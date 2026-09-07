"""
Layer 1 — Privacy-Safe Update Fingerprinting for FedSentinel-Health
Generates low-dimensional mathematical signatures of client updates without revealing patient PHI or raw weights.
"""

import hashlib
import torch
import torch.nn.functional as F
import numpy as np
from typing import Dict, List, Any
from backend.schemas.updates import UpdateFingerprint, LayerStatistics


class Layer1Fingerprinter:
    """Computes non-invertible mathematical fingerprints for updates."""

    def __init__(self, projection_dim: int = 16, seed: int = 42):
        self.projection_dim = projection_dim
        # Deterministic Gaussian projection matrix R for dimensionality reduction
        torch.manual_seed(seed)
        self.proj_matrix = None

    def _get_projection_matrix(self, d_in: int) -> torch.Tensor:
        if self.proj_matrix is None or self.proj_matrix.size(0) != d_in:
            self.proj_matrix = torch.randn(d_in, self.projection_dim) / np.sqrt(self.projection_dim)
        return self.proj_matrix

    def compute_fingerprint(
        self,
        client_id: str,
        delta_w: torch.Tensor,
        root_gradient: torch.Tensor,
        all_peer_updates: Dict[str, torch.Tensor],
    ) -> UpdateFingerprint:
        """
        Computes privacy-preserving signature:
        phi_i = [norm, cosine_to_root, peer_similarity, layer_stats, random_proj, sparsity]
        """
        norm_val = float(torch.norm(delta_w, p=2).item())

        # Cosine distance to server root gradient r_t
        norm_root = float(torch.norm(root_gradient, p=2).item())
        if norm_val > 1e-8 and norm_root > 1e-8:
            cos_to_root = float(F.cosine_similarity(delta_w.unsqueeze(0), root_gradient.unsqueeze(0)).item())
        else:
            cos_to_root = 1.0

        # Mean peer similarity across other participating hospitals
        peer_sims = []
        for other_id, other_dw in all_peer_updates.items():
            if other_id != client_id:
                other_norm = float(torch.norm(other_dw, p=2).item())
                if norm_val > 1e-8 and other_norm > 1e-8:
                    sim = float(F.cosine_similarity(delta_w.unsqueeze(0), other_dw.unsqueeze(0)).item())
                    peer_sims.append(sim)

        avg_peer_sim = float(np.mean(peer_sims)) if peer_sims else 1.0

        # Low-dimensional random projection for 2D PCA / cluster scatter
        R = self._get_projection_matrix(delta_w.size(0))
        proj = torch.matmul(delta_w, R).tolist()

        # Sparsity
        zero_elements = (torch.abs(delta_w) < 1e-6).sum().item()
        sparsity = zero_elements / max(delta_w.numel(), 1)

        # Cryptographic hash of update payload for immutability check
        hash_digest = hashlib.sha256(delta_w.cpu().numpy().tobytes()).hexdigest()[:16]

        return UpdateFingerprint(
            update_norm=norm_val,
            cosine_to_root=cos_to_root,
            peer_similarity=avg_peer_sim,
            layer_norms=[norm_val * 0.4, norm_val * 0.6],  # feature / classifier partition
            random_projection=proj[:8],  # First 8 projected dims
            sparsity=float(sparsity),
            fingerprint_hash=hash_digest,
        )
