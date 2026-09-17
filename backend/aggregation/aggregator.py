"""
Robust Model Aggregation Layer for FedSentinel-Health
Implements FedAvg, Trust-Weighted Aggregation, Trimmed Mean, and Strict Quarantine Isolation.
"""

import torch
from typing import Dict, List, Any
from backend.core.constants import AggregationStrategy
from backend.core.config import settings


class ModelAggregator:
    """Consolidates verified hospital updates into an updated global model w_(t+1)."""

    @staticmethod
    def aggregate(
        base_weights: torch.Tensor,
        client_updates: Dict[str, torch.Tensor],
        aggregation_weights: Dict[str, float],
        strategy: AggregationStrategy = AggregationStrategy.TRUST_WEIGHTED,
        trimmed_ratio: float = 0.1,
    ) -> torch.Tensor:
        """
        Merges client updates into new global model weights.
        """
        if not client_updates:
            return base_weights.clone()

        if strategy == AggregationStrategy.MULTI_KRUM:
            # Multi-Krum (Blanchard et al. 2017): Pairwise Euclidean distances, select m most consistent updates
            updates_list = list(client_updates.values())
            n_clients = len(updates_list)
            if n_clients <= 2:
                avg_dw = torch.stack(updates_list).mean(dim=0)
                return base_weights + avg_dw

            f_byzantine = max(1, n_clients // 5)  # Assume up to 20% Byzantine
            k_neighbors = max(1, n_clients - f_byzantine - 2)

            stacked = torch.stack(updates_list, dim=0)  # [N, D]
            # Compute pairwise L2 distance matrix [N, N]
            dist_matrix = torch.cdist(stacked, stacked, p=2.0) ** 2

            scores = []
            for i in range(n_clients):
                dists, _ = torch.sort(dist_matrix[i])
                # Sum the k nearest neighbors (excluding self at index 0)
                score = dists[1 : k_neighbors + 1].sum().item()
                scores.append((score, i))

            scores.sort(key=lambda x: x[0])
            m_selected = max(1, n_clients - f_byzantine)
            selected_indices = [idx for _, idx in scores[:m_selected]]

            selected_dw = stacked[selected_indices]
            aggregate_dw = selected_dw.mean(dim=0)
            return base_weights + aggregate_dw

        elif strategy == AggregationStrategy.TRIMMED_MEAN:
            # Coordinate-wise trimmed mean: trims top and bottom alpha fraction per parameter coordinate
            stacked = torch.stack(list(client_updates.values()), dim=0)  # [N, D]
            n_clients = stacked.size(0)
            k = int(n_clients * trimmed_ratio)
            
            if k > 0 and n_clients > 2 * k:
                sorted_vals, _ = torch.sort(stacked, dim=0)
                trimmed = sorted_vals[k : n_clients - k]
                aggregate_dw = trimmed.mean(dim=0)
            else:
                aggregate_dw = stacked.mean(dim=0)
            return base_weights + aggregate_dw

        elif strategy == AggregationStrategy.FEDAVG:
            # Standard uniform FedAvg
            total_samples = len(client_updates)
            avg_dw = torch.stack(list(client_updates.values())).mean(dim=0)
            return base_weights + avg_dw

        else:
            # Primary Defense: Trust-Weighted Aggregation
            # w_(t+1) = w_t + sum_i (q_hat_i * Delta w_i)
            # Quarantined nodes have q_hat_i == 0.0
            aggregate_dw = torch.zeros_like(base_weights)
            for cid, dw in client_updates.items():
                w = aggregation_weights.get(cid, 0.0)
                if w > 0.0:
                    aggregate_dw += w * dw

        # Apply Differential Privacy Gaussian Noise if enabled
        dp_enabled = getattr(settings, "DP_ENABLED", False)
        if dp_enabled:
            noise_std = getattr(settings, "DP_NOISE_MULTIPLIER", 0.5) * getattr(settings, "DP_CLIP_NORM", 10.0) / max(len(client_updates), 1)
            dp_noise = torch.randn_like(aggregate_dw) * noise_std
            aggregate_dw = aggregate_dw + dp_noise

        return base_weights + aggregate_dw
