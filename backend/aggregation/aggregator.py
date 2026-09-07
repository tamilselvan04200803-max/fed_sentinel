"""
Robust Model Aggregation Layer for FedSentinel-Health
Implements FedAvg, Trust-Weighted Aggregation, Trimmed Mean, and Strict Quarantine Isolation.
"""

import torch
from typing import Dict, List, Any
from backend.core.constants import AggregationStrategy


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

        if strategy == AggregationStrategy.TRIMMED_MEAN:
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
            return base_weights + aggregate_dw
