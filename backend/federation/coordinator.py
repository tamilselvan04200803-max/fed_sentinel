"""
Federation Coordinator for FedSentinel-Health
Master state machine coordinating local hospital training, Zero-Trust security gating,
trust updates, aggregation, and real-time WebSocket event emission.
"""

import asyncio
import time
import torch
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, timezone

from backend.core.config import settings
from backend.core.constants import AttackType, AggregationStrategy, ClientStatus, RoundStatus, WSEventType
from backend.ml.models.simple_cnn import MedicalImageCNN
from backend.ml.datasets.data_loader import generate_medical_dataset
from backend.ml.datasets.partitioner import DataPartitioner
from backend.ml.training.local_trainer import LocalHospitalTrainer
from backend.ml.training.evaluator import RootTrustEvaluator
from backend.security.pipeline import SecurityPipeline
from backend.trust.trust_engine import TrustEngine
from backend.aggregation.aggregator import ModelAggregator
from backend.incidents.manager import IncidentManager
from backend.schemas.clients import HospitalClient
from backend.schemas.rounds import FederationRound
from backend.schemas.trust import TrustScore
from backend.schemas.incidents import Incident, BlastRadius


class FederationCoordinator:
    """Master orchestrator for FedSentinel-Health."""

    def __init__(self, event_emitter: Optional[Callable[[str, Dict[str, Any]], None]] = None):
        self.event_emitter = event_emitter or (lambda event_type, data: None)
        
        # 1. Initialize Datasets & Partitioning
        self.train_dataset, self.val_dataset = generate_medical_dataset(
            num_samples=4000,
            in_channels=settings.MODEL_IN_CHANNELS,
            image_size=settings.MODEL_IMAGE_SIZE,
            random_seed=settings.RANDOM_SEED
        )
        
        # 2. Initialize Models & Evaluator
        self.global_model = MedicalImageCNN(
            in_channels=settings.MODEL_IN_CHANNELS,
            num_classes=settings.MODEL_NUM_CLASSES
        )
        self.global_weights = self.global_model.get_flattened_parameters()
        self.evaluator = RootTrustEvaluator(self.val_dataset)

        # 3. Security, Trust, Aggregation & Incidents
        self.security_pipeline = SecurityPipeline(self.evaluator)
        self.trust_engine = TrustEngine()
        self.incident_manager = IncidentManager()
        self.trainer = LocalHospitalTrainer()

        # 4. State Tracking
        self.current_round_id = 0
        self.defense_enabled = True
        self.aggregation_strategy = AggregationStrategy.TRUST_WEIGHTED
        
        # Hospital Clients State
        self.clients: Dict[str, HospitalClient] = {}
        self._init_default_clients()

        # Data partitions per client
        self.partitions = DataPartitioner.partition_iid(self.train_dataset, list(self.clients.keys()))

        # Active Attack Simulation Config
        self.active_attack: Optional[Dict[str, Any]] = None
        self.is_simulating = False
        
        # Round history
        self.round_history: List[FederationRound] = []

    def _init_default_clients(self):
        defaults = [
            ("H1", "Apollo General Hospital", "Intel SGX Enclave", "Pulmonology & Radiology", 1200),
            ("H2", "St. Mary Regional Medical Center", "AMD SEV-SNP", "Oncology & Pathology", 980),
            ("H3", "Metro General Hospital", "AWS Nitro Enclaves", "Emergency Radiology", 1450),
            ("H4", "Riverside Community Health", "Intel SGX Enclave", "Diagnostic Imaging", 870),
            ("H5", "University Medical Institute", "Apple Secure Enclave", "Clinical Research & AI", 1100),
        ]
        for cid, name, enclave, dept, samples in defaults:
            self.clients[cid] = HospitalClient(
                client_id=cid,
                name=name,
                status="ACTIVE",
                trust_score=95.0,
                anomaly_score=0.04,
                samples_count=samples,
                enclave_type=enclave,
                department=dept,
                contribution_weight=0.20,
                registered_at=datetime.now(timezone.utc).isoformat(),
                last_seen=datetime.now(timezone.utc).isoformat(),
            )

    def set_defense(self, enabled: bool, strategy: str = "trust_weighted"):
        self.defense_enabled = enabled
        if strategy == "fedavg":
            self.aggregation_strategy = AggregationStrategy.FEDAVG
        elif strategy == "trimmed_mean":
            self.aggregation_strategy = AggregationStrategy.TRIMMED_MEAN
        else:
            self.aggregation_strategy = AggregationStrategy.TRUST_WEIGHTED

    def configure_attack(
        self,
        target_client_id: str = "H3",
        target_client_ids: Optional[List[str]] = None,
        attack_type: AttackType = AttackType.MODEL_POISONING,
        intensity: float = 0.75,
        defense_enabled: bool = True,
    ):
        """Sets the attack simulation configuration with selectable target nodes."""
        targets = target_client_ids if target_client_ids else [target_client_id]
        self.active_attack = {
            "target_client_ids": targets,
            "attack_type": attack_type,
            "intensity": intensity,
            "defense_enabled": defense_enabled,
        }
        self.defense_enabled = defense_enabled

    def clear_attack(self):
        self.active_attack = None

    async def execute_round(
        self,
        target_clients: Optional[List[str]] = None,
        epochs: int = settings.DEFAULT_LOCAL_EPOCHS,
        batch_size: int = settings.DEFAULT_BATCH_SIZE,
    ) -> FederationRound:
        """Executes a single end-to-end federated training and security round."""
        self.current_round_id += 1
        round_id = self.current_round_id
        start_time = time.time()

        participating = target_clients if target_clients else list(self.clients.keys())
        
        # 1. Emit Round Started Event
        self.event_emitter(WSEventType.ROUND_STARTED.value, {
            "round_id": round_id,
            "participating_clients": participating,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

        # 2. Local Training across hospital nodes
        raw_updates: Dict[str, torch.Tensor] = {}
        client_metrics: Dict[str, Dict[str, Any]] = {}

        for cid in participating:
            if cid not in self.partitions:
                # Dynamically partition if newly registered client
                self.partitions[cid] = self.partitions.get("H1")

            client_data = self.partitions[cid]
            
            # Check if this client is a target in active attack simulation
            attack_for_client = None
            intensity = 0.75
            if self.active_attack and cid in self.active_attack.get("target_client_ids", []):
                attack_for_client = self.active_attack.get("attack_type")
                intensity = self.active_attack.get("intensity", 0.75)

            # Train locally
            train_res = self.trainer.train_client_update(
                client_id=cid,
                global_model_flat=self.global_weights,
                client_dataset=client_data,
                epochs=epochs,
                batch_size=batch_size,
                attack_type=attack_for_client,
                attack_intensity=intensity,
            )

            raw_updates[cid] = train_res["delta_w"]
            client_metrics[cid] = {
                "local_loss": train_res["local_loss"],
                "local_accuracy": train_res["local_accuracy"],
                "update_norm": train_res["update_norm"],
                "training_time_ms": train_res["training_time_ms"],
            }

            self.event_emitter(WSEventType.CLIENT_UPDATE_RECEIVED.value, {
                "round_id": round_id,
                "client_id": cid,
                "update_norm": train_res["update_norm"],
            })

        # 3. Process through Zero-Trust Security Pipeline
        sanitized_dw, fingerprints, detections, influence_scores, robustness_scores, attribution_scores = (
            self.security_pipeline.process_round_updates(
                round_id=round_id,
                base_weights=self.global_weights,
                raw_updates=raw_updates,
            )
        )

        # 4. Update Trust Scores and Quarantine Logic
        trust_scores: Dict[str, TrustScore] = {}
        quarantined: List[str] = []
        accepted: List[str] = []

        for cid in participating:
            det = detections[cid]
            inf = influence_scores.get(cid, 0.0)
            rob = robustness_scores.get(cid, 1.0)
            attr = attribution_scores.get(cid, 0.0)

            trust_res = self.trust_engine.compute_trust(
                client_id=cid,
                anomaly_score=det.anomaly_score,
                influence_score=inf,
                attribution_score=attr,
                robustness_score=rob,
            )
            trust_scores[cid] = trust_res

            # Update Client object
            client = self.clients[cid]
            old_trust = client.trust_score
            client.trust_score = trust_res.score
            client.anomaly_score = det.anomaly_score
            client.last_active_round = round_id
            client.last_seen = datetime.now(timezone.utc).isoformat()

            # Quarantine decision
            if self.defense_enabled and trust_res.score <= 30.0:
                client.status = "QUARANTINED"
                quarantined.append(cid)
                client.historical_anomalies += 1

                # Create Incident
                ev_items = [s.model_dump() for s in det.signals]
                blast = BlastRadius(
                    baseline_accuracy=0.94,
                    post_update_accuracy=0.72 if not self.defense_enabled else 0.94,
                    target_class_accuracy_drop=0.22 if not self.defense_enabled else 0.0,
                )
                inc = self.incident_manager.create_incident(
                    round_id=round_id,
                    client_id=cid,
                    detection=det,
                    trust_before=old_trust,
                    trust_after=trust_res.score,
                    evidence_items=ev_items,
                    threat_hypothesis=str(self.active_attack.get("attack_type", "MODEL_POISONING")) if self.active_attack else "MODEL_POISONING",
                    blast_radius=blast,
                )

                self.event_emitter(WSEventType.CLIENT_QUARANTINED.value, {
                    "client_id": cid,
                    "round_id": round_id,
                    "trust_score": trust_res.score,
                    "incident_id": inc.incident_id,
                })
                self.event_emitter(WSEventType.INCIDENT_CREATED.value, inc.model_dump())

            else:
                if client.status == "QUARANTINED" and trust_res.score > 30.0:
                    client.status = "ACTIVE"
                accepted.append(cid)

            self.event_emitter(WSEventType.TRUST_SCORE_CHANGED.value, {
                "client_id": cid,
                "round_id": round_id,
                "old_score": old_trust,
                "new_score": trust_res.score,
                "state": trust_res.state,
            })

        # 5. Robust Aggregation
        agg_weights = self.trust_engine.calculate_aggregation_weights(trust_scores, self.defense_enabled)
        for cid, w in agg_weights.items():
            self.clients[cid].contribution_weight = w

        self.global_weights = ModelAggregator.aggregate(
            base_weights=self.global_weights,
            client_updates=sanitized_dw,
            aggregation_weights=agg_weights,
            strategy=self.aggregation_strategy,
        )

        # 6. Global Model Evaluation on Root-of-Trust Dataset
        eval_metrics = self.evaluator.evaluate(self.global_weights)
        duration_ms = (time.time() - start_time) * 1000.0

        fed_round = FederationRound(
            round_id=round_id,
            status=RoundStatus.COMPLETED.value,
            participating_clients=participating,
            quarantined_clients=quarantined,
            accepted_clients=accepted,
            global_accuracy=eval_metrics["accuracy"],
            global_loss=eval_metrics["loss"],
            aggregation_strategy=str(self.aggregation_strategy.value),
            duration_ms=round(duration_ms, 1),
            timestamp=datetime.now(timezone.utc).isoformat(),
            started_at=datetime.fromtimestamp(start_time, tz=timezone.utc).isoformat(),
            completed_at=datetime.now(timezone.utc).isoformat(),
            client_metrics=client_metrics,
        )

        self.round_history.append(fed_round)

        # 7. Broadcast Aggregation Completed
        self.event_emitter(WSEventType.AGGREGATION_COMPLETED.value, {
            "round_id": round_id,
            "global_accuracy": eval_metrics["accuracy"],
            "global_loss": eval_metrics["loss"],
            "accepted_clients": accepted,
            "quarantined_clients": quarantined,
            "duration_ms": duration_ms,
        })

        return fed_round

    def compare_aggregation_strategies(self, raw_updates: Dict[str, torch.Tensor]) -> Dict[str, float]:
        """
        Runs identical round updates through all 4 aggregation strategies
        and returns global validation accuracy for side-by-side benchmarking.
        """
        if not raw_updates:
            return {"trust_weighted": 0.0, "multi_krum": 0.0, "trimmed_mean": 0.0, "fedavg": 0.0}

        results = {}
        # 1. Trust-Weighted
        sanitized_dw, _, detections, inf, rob, attr = self.security_pipeline.process_round_updates(
            self.current_round_id, self.global_weights, raw_updates
        )
        trust_scores = {}
        for cid in raw_updates:
            ts = self.trust_engine.compute_trust(cid, detections[cid].anomaly_score, inf.get(cid, 0.0), attr.get(cid, 0.0), rob.get(cid, 1.0))
            trust_scores[cid] = ts

        agg_weights = self.trust_engine.calculate_aggregation_weights(trust_scores, True)
        tw_w = ModelAggregator.aggregate(self.global_weights, sanitized_dw, agg_weights, AggregationStrategy.TRUST_WEIGHTED)
        results["trust_weighted"] = round(self.evaluator.evaluate(tw_w)["accuracy"] * 100.0, 1)

        # 2. Multi-Krum
        mk_w = ModelAggregator.aggregate(self.global_weights, raw_updates, {}, AggregationStrategy.MULTI_KRUM)
        results["multi_krum"] = round(self.evaluator.evaluate(mk_w)["accuracy"] * 100.0, 1)

        # 3. Trimmed-Mean
        tm_w = ModelAggregator.aggregate(self.global_weights, raw_updates, {}, AggregationStrategy.TRIMMED_MEAN)
        results["trimmed_mean"] = round(self.evaluator.evaluate(tm_w)["accuracy"] * 100.0, 1)

        # 4. FedAvg (No defense)
        fa_w = ModelAggregator.aggregate(self.global_weights, raw_updates, {}, AggregationStrategy.FEDAVG)
        results["fedavg"] = round(self.evaluator.evaluate(fa_w)["accuracy"] * 100.0, 1)

        return results
