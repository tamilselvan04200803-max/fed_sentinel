"""
Dataset Loader and Synthetic Medical Data Generator for FedSentinel-Health
Generates realistic medical imaging tensor distributions (normal vs pneumonia) without requiring real patient PHI.
"""

import torch
from torch.utils.data import TensorDataset, DataLoader, Subset
from typing import Dict, Tuple


def generate_medical_dataset(
    num_samples: int = 5000,
    in_channels: int = 1,
    image_size: int = 28,
    random_seed: int = 42
) -> Tuple[TensorDataset, TensorDataset]:
    """
    Generates synthetic medical imaging dataset with class-specific Gaussian features
    simulating normal lung tissue (class 0) vs pathological infiltrates / pneumonia opacity (class 1).
    Returns (train_dataset, server_root_val_dataset).
    """
    torch.manual_seed(random_seed)
    
    # Class 0: Normal tissue - low central attenuation
    n_class0 = num_samples // 2
    x0 = torch.randn(n_class0, in_channels, image_size, image_size) * 0.5 + 0.2
    y0 = torch.zeros(n_class0, dtype=torch.long)
    
    # Class 1: Pneumonia/Infiltrates - elevated localized bilateral opacity
    n_class1 = num_samples - n_class0
    x1 = torch.randn(n_class1, in_channels, image_size, image_size) * 0.7 + 0.8
    # Add localized pathological consolidation pattern in center quadrant
    mid = image_size // 2
    w = image_size // 4
    x1[:, :, mid-w:mid+w, mid-w:mid+w] += 1.2
    y1 = torch.ones(n_class1, dtype=torch.long)
    
    x = torch.cat([x0, x1], dim=0)
    y = torch.cat([y0, y1], dim=0)
    
    # Shuffle
    perm = torch.randperm(num_samples)
    x = x[perm]
    y = y[perm]
    
    # Split 80% train, 20% server root-of-trust validation
    n_train = int(0.8 * num_samples)
    train_dataset = TensorDataset(x[:n_train], y[:n_train])
    root_val_dataset = TensorDataset(x[n_train:], y[n_train:])
    
    return train_dataset, root_val_dataset
