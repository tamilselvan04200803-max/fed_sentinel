"""
Group Attribution Engine for FedSentinel-Health
Evaluates repeated random sub-cohort groupings to isolate and attribute anomalous contributions:
Accumulates contribution C_i without making absolute causal claims.
"""

import itertools
import random
import torch
from typing import Dict, List, Any


class GroupAttributionEngine:
    """Attributes anomalous behavior across combinatorial sub-cohorts."""

    def compute_attribution(
        self,
        client_updates: Dict[str, torch.Tensor],
        root_gradient: torch.Tensor,
        num_samples: int = 10,
    ) -> Dict[str, float]:
        """
        Samples random sub-groups of 3 clients and measures group divergence.
        Accumulates marginal penalty to clients consistently present in aberrant groups.
        """
        client_ids = list(client_updates.keys())
        if len(client_ids) < 3:
            return {cid: 0.1 for cid in client_ids}

        contribution_counts: Dict[str, float] = {cid: 0.0 for cid in client_ids}
        group_size = min(3, len(client_ids))

        # Generate combinatorial groups
        all_combinations = list(itertools.combinations(client_ids, group_size))
        sampled_groups = random.sample(all_combinations, min(num_samples, len(all_combinations)))

        for group in sampled_groups:
            # Average gradient of group
            group_dw = torch.stack([client_updates[cid] for cid in group]).mean(dim=0)
            norm_g = float(torch.norm(group_dw, p=2).item())
            norm_r = float(torch.norm(root_gradient, p=2).item())

            if norm_g > 1e-6 and norm_r > 1e-6:
                cos_sim = float(torch.nn.functional.cosine_similarity(group_dw.unsqueeze(0), root_gradient.unsqueeze(0)).item())
                divergence = max(0.0, 1.0 - cos_sim)
            else:
                divergence = 0.0

            # If group is anomalous, add contribution to its members
            for cid in group:
                contribution_counts[cid] += divergence

        # Normalize to [0, 1]
        max_contrib = max(contribution_counts.values()) if contribution_counts.values() else 1.0
        max_contrib = max(max_contrib, 1e-4)

        return {
            cid: float(round(val / max_contrib, 4))
            for cid, val in contribution_counts.items()
        }
