import { queryClient } from "@/src/lib/queryClient";
import { useFedSentinelStore } from "@/src/store/useFedSentinelStore";
import { getApiBaseUrl, apiRequest } from "@/src/services/api/apiClient";
import { FedSentinelEvent } from "@/src/types";

class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectTimer: any = null;
  private reconnectAttempts = 0;
  private isIntentionalClose = false;

  public async connect(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isIntentionalClose = false;

    // 1. Fetch short-lived ticket from gateway
    let ticket = "";
    try {
      const ticketRes = await apiRequest<{ ticket: string }>("/api/auth/ws-ticket", {
        method: "POST",
      });
      ticket = ticketRes.ticket;
    } catch {
      // In demo mode or if unauthed, connect without ticket
    }

    // 2. Build WebSocket URL
    const apiBase = getApiBaseUrl();
    let wsUrl: string;
    try {
      const url = new URL(apiBase);
      const protocol = url.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${protocol}//${url.host}/ws/events${ticket ? `?ticket=${ticket}` : ""}`;
    } catch {
      wsUrl = `ws://127.0.0.1:8000/ws/events${ticket ? `?ticket=${ticket}` : ""}`;
    }

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        useFedSentinelStore.getState().setSystemStatus({ wsStatus: "connected", apiStatus: "online" });
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.handleEvent(parsed);
        } catch {
          // Non-JSON frame
        }
      };

      this.ws.onclose = () => {
        useFedSentinelStore.getState().setSystemStatus({ wsStatus: "disconnected" });
        if (!this.isIntentionalClose) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        useFedSentinelStore.getState().setSystemStatus({ wsStatus: "error" });
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.isIntentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    useFedSentinelStore.getState().setSystemStatus({ wsStatus: "disconnected" });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 15000);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private handleEvent(rawEvent: any): void {
    const event: FedSentinelEvent = {
      event_type: rawEvent.event_type || rawEvent.type || "TELEMETRY",
      round_id: rawEvent.round_id ?? 0,
      client_id: rawEvent.client_id || "GATEWAY",
      payload: rawEvent.payload || rawEvent.data || {},
      timestamp: rawEvent.timestamp || new Date().toISOString(),
    };

    // 1. Push to Zustand ring buffer (capped at 200 items)
    useFedSentinelStore.getState().addEvent(event);

    // 2. Automatically invalidate TanStack Query caches based on event type
    switch (event.event_type) {
      case "ROUND_COMPLETED":
      case "ROUND_STARTED":
      case "ROUND_EXECUTED":
        queryClient.invalidateQueries({ queryKey: ["rounds"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["model"] });
        break;

      case "CLIENT_QUARANTINED":
      case "CLIENT_REGISTERED":
      case "CLIENT_UPDATED":
      case "SIMULATION_TRIGGERED":
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        queryClient.invalidateQueries({ queryKey: ["incidents"] });
        queryClient.invalidateQueries({ queryKey: ["trust"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        break;

      case "INCIDENT_CREATED":
      case "INCIDENT_ACTION_LOGGED":
      case "ANOMALY_DETECTED":
        queryClient.invalidateQueries({ queryKey: ["incidents"] });
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["audit"] });
        break;

      case "DEMO_RESET":
        queryClient.invalidateQueries();
        break;
    }
  }
}

export const wsManager = new WebSocketManager();
