"""
Federated Dataset Partitioner for FedSentinel-Health
Distributes private medical samples across hospital nodes using IID or non-IID cohorts.
"""

import torch
from torch.utils.data import TensorDataset, Subset
from typing import Dict, List


class DataPartitioner:
    """Partitions medical training samples across hospital nodes."""

    @staticmethod
    def partition_iid(dataset: TensorDataset, client_ids: List[str]) -> Dict[str, Subset]:
        """Uniform random distribution across clients."""
        n_samples = len(dataset)
        n_clients = len(client_ids)
        shard_size = n_samples // n_clients
        indices = torch.randperm(n_samples).tolist()

        partitions = {}
        for idx, cid in enumerate(client_ids):
            start = idx * shard_size
            end = start + shard_size if idx < n_clients - 1 else n_samples
            partitions[cid] = Subset(dataset, indices[start:end])
        return partitions

    @staticmethod
    def partition_non_iid(dataset: TensorDataset, client_ids: List[str], imbalance_ratio: float = 0.85) -> Dict[str, Subset]:
        """
        Non-IID partitioning simulating hospital specialization.
        Even clients get dominant Class 1 (Pathology/Pneumonia), Odd clients get dominant Class 0 (Normal).
        """
        targets = dataset.tensors[1]
        class_0_idx = (targets == 0).nonzero(as_tuple=True)[0].tolist()
        class_1_idx = (targets == 1).nonzero(as_tuple=True)[0].tolist()

        n_clients = len(client_ids)
        partitions = {}

        # Split indices into chunks for distribution
        chunk_c0 = len(class_0_idx) // n_clients
        chunk_c1 = len(class_1_idx) // n_clients

        for i, cid in enumerate(client_ids):
            # Skew ratio: alternate between pathological heavy (85% C1) and normal heavy (85% C0)
            if i % 2 == 0:
                n_c1 = int(chunk_c1 * imbalance_ratio * 1.5)
                n_c0 = max(10, chunk_c0 // 3)
            else:
                n_c0 = int(chunk_c0 * imbalance_ratio * 1.5)
                n_c1 = max(10, chunk_c1 // 3)

            start_c0 = (i * chunk_c0) % len(class_0_idx)
            start_c1 = (i * chunk_c1) % len(class_1_idx)

            idx_0 = class_0_idx[start_c0 : min(start_c0 + n_c0, len(class_0_idx))]
            idx_1 = class_1_idx[start_c1 : min(start_c1 + n_c1, len(class_1_idx))]

            client_indices = idx_0 + idx_1
            torch.manual_seed(i + 42)
            shuffled_indices = [client_indices[k] for k in torch.randperm(len(client_indices)).tolist()]
            partitions[cid] = Subset(dataset, shuffled_indices)

        return partitions
