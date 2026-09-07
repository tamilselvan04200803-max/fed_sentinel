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
    def partition_non_iid(dataset: TensorDataset, client_ids: List[str], imbalance_ratio: float = 0.8) -> Dict[str, Subset]:
        """
        Non-IID partitioning simulating hospital specialization
        (e.g. oncology/emergency centers seeing 80% pathological cases, community clinics seeing mostly normal).
        """
        targets = dataset.tensors[1]
        class_0_idx = (targets == 0).nonzero(as_tuple=True)[0].tolist()
        class_1_idx = (targets == 1).nonzero(as_tuple=True)[0].tolist()

        partitions = {}
        n_clients = len(client_ids)
        c0_per_client = len(class_0_idx) // n_clients
        c1_per_client = len(class_1_idx) // n_clients

        for i, cid in enumerate(client_ids):
            # Introduce controlled demographic variance per hospital node
            if i % 2 == 0:
                client_indices = (
                    class_0_idx[i * c0_per_client : (i + 1) * c0_per_client] +
                    class_1_idx[i * c1_per_client : (i + 1) * c1_per_client]
                )
            else:
                client_indices = (
                    class_0_idx[i * c0_per_client : (i + 1) * c0_per_client] +
                    class_1_idx[i * c1_per_client : (i + 1) * c1_per_client]
                )
            partitions[cid] = Subset(dataset, client_indices)
        return partitions
