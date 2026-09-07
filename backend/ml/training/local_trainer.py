"""
Local Hospital Node Trainer for FedSentinel-Health
Executes private on-premise model training and computes weight updates Δw_i.
Includes configurable attack vector execution (label flip, backdoor, model scaling).
"""

import time
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Subset
from typing import Dict, Any, Tuple, Optional
from backend.ml.models.simple_cnn import MedicalImageCNN
from backend.core.constants import AttackType


class LocalHospitalTrainer:
    """Simulates local training inside a hospital's private hardware enclave."""

    def __init__(self, in_channels: int = 1, num_classes: int = 2):
        self.in_channels = in_channels
        self.num_classes = num_classes

    def train_client_update(
        self,
        client_id: str,
        global_model_flat: torch.Tensor,
        client_dataset: Subset,
        epochs: int = 3,
        batch_size: int = 32,
        lr: float = 0.01,
        attack_type: Optional[AttackType] = None,
        attack_intensity: float = 0.75,
        poison_ratio: float = 0.5,
    ) -> Dict[str, Any]:
        """
        Runs local training epochs on private clinical cohort.
        Returns:
            - delta_w: 1D torch.Tensor representing Δw_i = w_i^(t+1) - w_t
            - new_weights: 1D torch.Tensor w_i^(t+1)
            - metrics: local loss, accuracy, update norm, training duration
        """
        start_time = time.time()
        
        # Instantiate local model initialized with global weights w_t
        local_model = MedicalImageCNN(in_channels=self.in_channels, num_classes=self.num_classes)
        local_model.load_from_flattened(global_model_flat.clone())
        local_model.train()

        criterion = nn.CrossEntropyLoss()
        optimizer = optim.SGD(local_model.parameters(), lr=lr, momentum=0.9, weight_decay=1e-4)
        data_loader = DataLoader(client_dataset, batch_size=batch_size, shuffle=True)

        total_loss = 0.0
        correct = 0
        total_samples = 0

        for epoch in range(epochs):
            for batch_x, batch_y in data_loader:
                x, y = batch_x.clone(), batch_y.clone()

                # --- Attack Simulation on Compromised Node ---
                if attack_type == AttackType.LABEL_POISONING:
                    # Invert target diagnostic labels (Normal <-> Pneumonia) on poison_ratio of samples
                    mask = torch.rand(y.size()) < poison_ratio
                    y[mask] = 1 - y[mask]

                elif attack_type == AttackType.BACKDOOR_TRIGGER:
                    # Inject 3x3 pixel trigger in top-left corner and force target label to 0 (Normal)
                    mask = torch.rand(y.size()) < poison_ratio
                    x[mask, :, :3, :3] = 2.5
                    y[mask] = 0

                optimizer.zero_grad()
                outputs = local_model(x)
                loss = criterion(outputs, y)
                loss.backward()
                optimizer.step()

                total_loss += loss.item() * len(y)
                preds = torch.argmax(outputs, dim=1)
                correct += (preds == y).sum().item()
                total_samples += len(y)

        local_loss = total_loss / max(total_samples, 1)
        local_acc = correct / max(total_samples, 1)
        training_time_ms = (time.time() - start_time) * 1000.0

        # Compute model update Δw_i = w_i^(t+1) - w_t
        new_weights = local_model.get_flattened_parameters()
        delta_w = new_weights - global_model_flat

        # --- Model Poisoning / Magnitude Attack on Update Vector ---
        if attack_type == AttackType.MODEL_POISONING:
            # Scale update in opposite or corrupted gradient direction
            scale_factor = -(1.0 + attack_intensity * 5.0)
            delta_w = delta_w * scale_factor
            new_weights = global_model_flat + delta_w

        elif attack_type == AttackType.ABNORMAL_MAGNITUDE:
            # Massive gradient magnitude spike
            magnitude_boost = 10.0 + (attack_intensity * 40.0)
            delta_w = delta_w * magnitude_boost
            new_weights = global_model_flat + delta_w

        update_norm = float(torch.norm(delta_w, p=2).item())

        return {
            "client_id": client_id,
            "delta_w": delta_w,
            "new_weights": new_weights,
            "update_norm": update_norm,
            "local_loss": float(local_loss),
            "local_accuracy": float(local_acc),
            "sample_count": len(client_dataset),
            "training_time_ms": float(training_time_ms),
        }
