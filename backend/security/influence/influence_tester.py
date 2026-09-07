"""
Influence Testing Module for FedSentinel-Health
Evaluates leave-one-out counterfactual model candidate performance:
I_i = Acc(G_-i) - Acc(G_all)
Positive delta indicates the candidate's update actively damaged model performance.
"""

import torch
from typing import Dict, List, Any
from backend.ml.training.evaluator import RootTrustEvaluator


class InfluenceTester:
    """Performs non-destructive leave-one-out counterfactual testing."""

    def __init__(self, evaluator: RootTrustEvaluator):
        self.evaluator = evaluator

    def compute_influence(
        self,
        base_weights: torch.Tensor,
        client_updates: Dict[str, torch.Tensor],
    ) -> Dict[str, float]:
        """
        Computes influence delta I_i for each participating client.
        """
        if len(client_updates) <= 1:
            return {cid: 0.0 for cid in client_updates}

        # 1. Evaluate full candidate aggregate G_all
        all_dw = torch.stack(list(client_updates.values())).mean(dim=0)
        g_all_weights = base_weights + all_dw
        g_all_eval = self.evaluator.evaluate(g_all_weights)
        acc_all = g_all_eval["accuracy"]

        influence_scores: Dict[str, float] = {}

        # 2. For each client, compute leave-one-out aggregate G_-i
        for cid in client_updates:
            other_updates = [dw for other_id, dw in client_updates.items() if other_id != cid]
            if other_updates:
                g_minus_i_dw = torch.stack(other_updates).mean(dim=0)
                g_minus_i_weights = base_weights + g_minus_i_dw
                eval_minus_i = self.evaluator.evaluate(g_minus_i_weights)
                acc_minus_i = eval_minus_i["accuracy"]
                # Positive delta means removing this client improved accuracy
                delta = acc_minus_i - acc_all
                influence_scores[cid] = float(round(delta, 4))
            else:
                influence_scores[cid] = 0.0

        return influence_scores
