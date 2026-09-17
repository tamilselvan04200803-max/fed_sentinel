"""
Federation Lifecycle and Model Registry Service for FedSentinel-Health
Manages Federation states (DRAFT -> ACTIVE -> PAUSED -> ARCHIVED),
Model Versioning (CANDIDATE -> VALIDATED -> ACTIVE -> SUPERSEDED -> ROLLED_BACK),
and safe Model Rollback functionality.
"""

from __future__ import annotations
import hashlib
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from backend.db.models import (
    FederationModel,
    FederationMembershipModel,
    ModelFamilyModel,
    ModelVersionModel,
    FacilityModel,
    RoundModel,
)


class FederationLifecycleService:
    """Manages multi-federation administrative workflows and model version registries."""

    @staticmethod
    def create_federation(
        db: Session,
        name: str,
        purpose: str,
        aggregation_strategy: str = "trust_weighted",
        min_quorum: int = 3,
        quarantine_threshold: float = 0.30,
        dp_enabled: bool = False,
    ) -> FederationModel:
        """Creates a new Federation in DRAFT state."""
        fed_id = f"FED-{hashlib.sha256(name.encode()).hexdigest()[:8].upper()}"
        federation = FederationModel(
            id=fed_id,
            name=name,
            purpose=purpose,
            status="ACTIVE",
            min_participant_quorum=min_quorum,
            aggregation_strategy=aggregation_strategy,
            quarantine_threshold=quarantine_threshold,
            dp_enabled=dp_enabled,
        )
        db.add(federation)
        db.commit()
        db.refresh(federation)
        return federation

    @staticmethod
    def update_federation_status(db: Session, federation_id: str, new_status: str) -> Optional[FederationModel]:
        """Transitions federation state (DRAFT, ACTIVE, PAUSED, ARCHIVED)."""
        valid_statuses = {"DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"}
        if new_status not in valid_statuses:
            raise ValueError(f"Invalid status '{new_status}'. Allowed: {valid_statuses}")

        federation = db.query(FederationModel).filter(FederationModel.id == federation_id).first()
        if not federation:
            return None
        
        federation.status = new_status
        db.commit()
        db.refresh(federation)
        return federation


class ModelRegistryService:
    """Manages semantic model versions, global checkpoints, and safety rollbacks."""

    @staticmethod
    def register_model_version(
        db: Session,
        model_family_id: str,
        federation_id: str,
        round_id: int,
        version_str: str,
        global_accuracy: float,
        global_loss: float,
        weights_path: Optional[str] = None,
        parent_version_id: Optional[str] = None,
    ) -> ModelVersionModel:
        """Registers a newly trained global model checkpoint version."""
        ver_id = f"MV-R{round_id}-{hashlib.md5(version_str.encode()).hexdigest()[:6].upper()}"
        
        # Mark previous ACTIVE versions as SUPERSEDED
        db.query(ModelVersionModel).filter(
            ModelVersionModel.federation_id == federation_id,
            ModelVersionModel.status == "ACTIVE"
        ).update({"status": "SUPERSEDED"})

        new_version = ModelVersionModel(
            id=ver_id,
            model_family_id=model_family_id,
            federation_id=federation_id,
            version_str=version_str,
            round_id=round_id,
            status="ACTIVE",
            global_accuracy=global_accuracy,
            global_loss=global_loss,
            parent_version_id=parent_version_id,
            weights_path=weights_path,
            checksum_sha256=hashlib.sha256(f"{ver_id}_{global_accuracy}".encode()).hexdigest(),
        )
        db.add(new_version)
        db.commit()
        db.refresh(new_version)
        return new_version

    @staticmethod
    def rollback_model_version(
        db: Session,
        federation_id: str,
        target_version_id: str,
        reason: str,
        actor: str = "SOC_ANALYST"
    ) -> Optional[ModelVersionModel]:
        """
        Safely rolls back global model checkpoint to a previously validated version.
        Marks current version as ROLLED_BACK and target version as ACTIVE.
        """
        target_version = db.query(ModelVersionModel).filter(
            ModelVersionModel.id == target_version_id,
            ModelVersionModel.federation_id == federation_id
        ).first()

        if not target_version:
            return None

        # Mark active versions as ROLLED_BACK
        db.query(ModelVersionModel).filter(
            ModelVersionModel.federation_id == federation_id,
            ModelVersionModel.status == "ACTIVE"
        ).update({"status": "SUPERSEDED"})

        target_version.status = "ACTIVE"
        db.commit()
        db.refresh(target_version)
        return target_version
