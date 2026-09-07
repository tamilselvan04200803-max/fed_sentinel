"""
Medical Image CNN Architecture for FedSentinel-Health
Lightweight PyTorch Convolutional Neural Network for federated pneumonia/tumor classification.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict


class MedicalImageCNN(nn.Module):
    """
    Lightweight 3-stage CNN for medical pathology / chest X-ray classification.
    Input: [B, in_channels, H, W] (e.g. 1x28x28 or 1x32x32)
    Output: [B, num_classes] logits (e.g. 2 classes: Normal vs Pneumonia)
    """
    def __init__(self, in_channels: int = 1, num_classes: int = 2):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, 16, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(16)
        self.conv2 = nn.Conv2d(16, 32, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(32)
        self.pool = nn.MaxPool2d(2, 2)
        
        # Adaptive pool ensures fixed output spatial size regardless of input resolution
        self.adaptive_pool = nn.AdaptiveAvgPool2d((4, 4))
        self.fc1 = nn.Linear(32 * 4 * 4, 64)
        self.dropout = nn.Dropout(0.25)
        self.fc2 = nn.Linear(64, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.pool(F.relu(self.bn1(self.conv1(x))))
        x = self.pool(F.relu(self.bn2(self.conv2(x))))
        x = self.adaptive_pool(x)
        x = torch.flatten(x, 1)
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        return x

    def get_flattened_parameters(self) -> torch.Tensor:
        """Returns all trainable model parameters flattened into a 1D tensor vector."""
        return torch.cat([p.data.view(-1) for p in self.parameters()])

    def load_from_flattened(self, flat_params: torch.Tensor) -> None:
        """Loads weights from a 1D parameter vector."""
        idx = 0
        for p in self.parameters():
            num_el = p.numel()
            p.data.copy_(flat_params[idx:idx + num_el].view(p.size()))
            idx += num_el
