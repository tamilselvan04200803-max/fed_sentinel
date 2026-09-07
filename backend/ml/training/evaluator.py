"""
Root-of-Trust Evaluator for FedSentinel-Health
Evaluates global model candidate checkpoints and calculates reference root gradients r_t on server-side clean validation data.
"""

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from typing import Dict, Any, Tuple
from backend.ml.models.simple_cnn import MedicalImageCNN


class RootTrustEvaluator:
    """Server-side evaluator holding the clean baseline Root-of-Trust dataset."""

    def __init__(self, val_dataset: TensorDataset, in_channels: int = 1, num_classes: int = 2):
        self.val_dataset = val_dataset
        self.val_loader = DataLoader(val_dataset, batch_size=64, shuffle=False)
        self.in_channels = in_channels
        self.num_classes = num_classes
        self.criterion = nn.CrossEntropyLoss()

    def evaluate(self, weights_flat: torch.Tensor) -> Dict[str, float]:
        """Evaluates model weights on the clean validation set."""
        model = MedicalImageCNN(in_channels=self.in_channels, num_classes=self.num_classes)
        model.load_from_flattened(weights_flat)
        model.eval()

        total_loss = 0.0
        correct = 0
        total_samples = 0
        class_correct = [0] * self.num_classes
        class_totals = [0] * self.num_classes

        with torch.no_grad():
            for x, y in self.val_loader:
                outputs = model(x)
                loss = self.criterion(outputs, y)
                total_loss += loss.item() * len(y)
                preds = torch.argmax(outputs, dim=1)
                correct += (preds == y).sum().item()
                total_samples += len(y)

                for c in range(self.num_classes):
                    mask = (y == c)
                    class_totals[c] += mask.sum().item()
                    class_correct[c] += ((preds == c) & mask).sum().item()

        accuracy = correct / max(total_samples, 1)
        loss = total_loss / max(total_samples, 1)
        c0_acc = class_correct[0] / max(class_totals[0], 1)
        c1_acc = class_correct[1] / max(class_totals[1], 1)

        return {
            "accuracy": float(accuracy),
            "loss": float(loss),
            "class_0_accuracy": float(c0_acc),
            "class_1_accuracy": float(c1_acc),
            "total_samples": total_samples,
        }

    def compute_root_gradient(self, weights_flat: torch.Tensor) -> torch.Tensor:
        """
        Computes reference gradient vector r_t = ∇F_root(w_t) on the clean validation set.
        Used as the spatial ground truth reference direction for Layer 2 cosine alignment.
        """
        model = MedicalImageCNN(in_channels=self.in_channels, num_classes=self.num_classes)
        model.load_from_flattened(weights_flat)
        model.train()

        total_grads = None
        n_batches = 0

        for x, y in self.val_loader:
            model.zero_grad()
            outputs = model(x)
            loss = self.criterion(outputs, y)
            loss.backward()

            batch_grad = torch.cat([p.grad.view(-1) for p in model.parameters() if p.grad is not None])
            if total_grads is None:
                total_grads = batch_grad
            else:
                total_grads += batch_grad
            n_batches += 1

        if total_grads is not None and n_batches > 0:
            root_grad = total_grads / n_batches
        else:
            root_grad = torch.zeros_like(weights_flat)

        return root_grad
