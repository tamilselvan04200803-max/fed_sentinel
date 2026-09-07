import { FedSentinelEvent, ConnectionStatus } from '../types';
import { getWebSocketUrl } from './client';

export type EventListener = (event: FedSentinelEvent) => void;
export type StatusListener = (status: ConnectionStatus, error?: string) => void;

class FedSentinelWebSocketClient {
  private ws: WebSocket | null = null;
  private eventListeners: Set<EventListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private reconnectTimeoutId: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 30;
  private baseDelay = 1000;
  private maxDelay = 15000;
  private shouldReconnect = true;
  private seenEventKeys: Set<string> = new Set();
  private status: ConnectionStatus = 'disconnected';

  constructor() {
    // Intentionally lazy or explicit connect
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public addEventListener(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  public addStatusListener(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  private setStatus(newStatus: ConnectionStatus, errorMsg?: string) {
    this.status = newStatus;
    this.statusListeners.forEach((fn) => fn(newStatus, errorMsg));
  }

  public connect(customWsUrl?: string) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.shouldReconnect = true;
    const url = customWsUrl || getWebSocketUrl();
    this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('connected');
      };

      this.ws.onmessage = (messageEvent) => {
        try {
          const rawData = JSON.parse(messageEvent.data);
          // Format validation
          if (!rawData || typeof rawData !== 'object') return;

          const event: FedSentinelEvent = {
            event_type: rawData.event_type || 'SYSTEM_EVENT',
            round_id: typeof rawData.round_id === 'number' ? rawData.round_id : 0,
            client_id: rawData.client_id || 'SYSTEM',
            payload: rawData.payload || {},
            timestamp: rawData.timestamp || new Date().toISOString(),
          };

          // Deduplication key
          const dedupeKey = `${event.event_type}_${event.round_id}_${event.client_id}_${event.timestamp}_${JSON.stringify(event.payload)}`;
          if (this.seenEventKeys.has(dedupeKey)) {
            return;
          }
          this.seenEventKeys.add(dedupeKey);
          if (this.seenEventKeys.size > 500) {
            // Trim old dedupe keys to prevent memory growth
            const keysArray = Array.from(this.seenEventKeys);
            this.seenEventKeys = new Set(keysArray.slice(keysArray.length - 250));
          }

          // Broadcast to listeners
          this.eventListeners.forEach((fn) => {
            try {
              fn(event);
            } catch (err) {
              console.error('Error in FedSentinel event listener:', err);
            }
          });
        } catch (err) {
          console.warn('Invalid JSON received on WebSocket:', messageEvent.data);
        }
      };

      this.ws.onerror = (err) => {
        this.setStatus('error', 'WebSocket connection failed');
      };

      this.ws.onclose = (closeEvent) => {
        this.ws = null;
        if (this.shouldReconnect) {
          this.scheduleReconnect(customWsUrl);
        } else {
          this.setStatus('disconnected');
        }
      };
    } catch (e: any) {
      this.setStatus('error', e?.message || 'WebSocket creation error');
      if (this.shouldReconnect) {
        this.scheduleReconnect(customWsUrl);
      }
    }
  }

  private scheduleReconnect(customWsUrl?: string) {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setStatus('disconnected', 'Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.baseDelay * Math.pow(1.5, this.reconnectAttempts - 1) + Math.random() * 500,
      this.maxDelay
    );

    this.setStatus('reconnecting');
    this.reconnectTimeoutId = setTimeout(() => {
      this.connect(customWsUrl);
    }, delay);
  }

  public disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  public reconnect(newUrl?: string) {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect(newUrl);
  }
}

export const wsClient = new FedSentinelWebSocketClient();
