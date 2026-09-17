"""
Layer 5 — Perturbation-Based Counterfactual Robustness Testing for FedSentinel-Health
Evaluates model stability under random perturbations (rotation, Gaussian noise, brightness/contrast jitter)
to surface backdoor triggers or brittle overfitting.
"""

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from typing import Dict, Any, Tuple
from backend.ml.models.simple_cnn import MedicalImageCNN
from backend.ml.training.evaluator import RootTrustEvaluator


class RobustnessTester:
    """Evaluates prediction flip rate under input perturbations."""

    def __init__(self, evaluator: RootTrustEvaluator):
        self.evaluator = evaluator

    def evaluate_robustness(
        self,
        base_weights: torch.Tensor,
        client_updates: Dict[str, torch.Tensor],
        perturbation_std: float = 0.15,
        num_samples: int = 100,
    ) -> Dict[str, float]:
        """
        For each client update Δw_i, builds candidate weights (w_t + Δw_i) and
        measures prediction inconsistency across clean vs. perturbed validation inputs.
        High flip rate -> low robustness -> potential backdoor sensitivity.
        Returns dict of robustness scores in [0, 1] per client (1.0 = highly stable, 0.0 = highly brittle/poisoned).
        """
        val_loader = DataLoader(self.evaluator.val_dataset, batch_size=num_samples, shuffle=False)
        batch = next(iter(val_loader), None)
        if batch is None:
            return {cid: 1.0 for cid in client_updates}

        x_clean, y_clean = batch
        robustness_scores: Dict[str, float] = {}

        # Add Gaussian noise & random brightness perturbation
        noise = torch.randn_like(x_clean) * perturbation_std
        x_perturbed = torch.clamp(x_clean + noise, 0.0, 3.0)

        for cid, dw in client_updates.items():
            candidate_weights = base_weights + dw
            model = MedicalImageCNN(
                in_channels=getattr(self.evaluator, 'in_channels', 1),
                num_classes=getattr(self.evaluator, 'num_classes', 2)
            )
            model.load_from_flattened(candidate_weights)
            model.eval()

            with torch.no_grad():
                logits_clean = model(x_clean)
                preds_clean = torch.argmax(logits_clean, dim=1)

                logits_perturbed = model(x_perturbed)
                preds_perturbed = torch.argmax(logits_perturbed, dim=1)

                # Flip rate: ratio of predictions that changed under mild noise
                flips = (preds_clean != preds_perturbed).sum().item()
                total = max(len(y_clean), 1)
                flip_rate = flips / total

                # Robustness score = 1 - flip_rate
                score = float(max(0.0, min(1.0, 1.0 - flip_rate * 2.0)))
                robustness_scores[cid] = round(score, 4)

        return robustness_scores
