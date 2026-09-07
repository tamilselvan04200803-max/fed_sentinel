"""
Trust History Tracker for FedSentinel-Health
Maintains Exponential Moving Average (EMA) of historical client anomaly scores:
Hist_i^t = λ * Hist_i^(t-1) + (1 - λ) * A_i^t
"""

from typing import Dict
from backend.core.config import settings


class TrustHistoryTracker:
    """Tracks historical anomaly decay across federation rounds."""

    def __init__(self, decay_rate: float = settings.TRUST_HISTORY_DECAY):
        self.decay_rate = decay_rate
        self.history: Dict[str, float] = {}

    def update_history(self, client_id: str, current_anomaly: float) -> float:
        """Updates and returns the EMA historical anomaly for a client."""
        prev = self.history.get(client_id, 0.0)
        updated = self.decay_rate * prev + (1.0 - self.decay_rate) * current_anomaly
        self.history[client_id] = float(round(updated, 4))
        return self.history[client_id]

    def get_history(self, client_id: str) -> float:
        return self.history.get(client_id, 0.0)
