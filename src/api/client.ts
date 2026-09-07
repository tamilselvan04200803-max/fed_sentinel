import {
  HospitalClient,
  FederationRound,
  StartRoundRequest,
  Incident,
  ClientTrustInfo,
  SimulationResponse,
  CreateClientRequest,
  ClientActionRequest,
} from '../types';

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getApiBaseUrl(): string {
  // Check localStorage first for dynamic user overrides
  const stored = typeof window !== 'undefined' ? localStorage.getItem('fedsentinel_api_url') : null;
  if (stored && stored.trim().length > 0) {
    return stored.replace(/\/+$/, '');
  }

  // Fallback to environment variable or default
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.replace(/\/+$/, '');
  }

  return 'http://127.0.0.1:8000/api';
}

export function setApiBaseUrl(url: string) {
  if (typeof window !== 'undefined') {
    if (!url || url.trim() === 'http://127.0.0.1:8000/api' || url.trim() === 'http://127.0.0.1:8000') {
      localStorage.removeItem('fedsentinel_api_url');
    } else {
      localStorage.setItem('fedsentinel_api_url', url.trim().replace(/\/+$/, ''));
    }
  }
}

export function getWebSocketUrl(apiBase?: string): string {
  const base = apiBase || getApiBaseUrl();
  try {
    const url = new URL(base);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    // WebSocket endpoint ws://127.0.0.1:8000/ws/events
    return `${protocol}//${url.host}/ws/events`;
  } catch (e) {
    // If not a full URL, attempt string replacement
    const wsBase = base
      .replace(/\/api\/?$/i, '')
      .replace(/^https?:\/\//i, (match) =>
        match.toLowerCase() === 'https://' ? 'wss://' : 'ws://'
      );
    return `${wsBase}/ws/events`;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const configuredBase = getApiBaseUrl();
  // Strip trailing /api to obtain the root host for /health if needed
  const rootHostUrl = configuredBase.replace(/\/api\/?$/i, '');
  const apiBaseUrl = configuredBase.endsWith('/api') ? configuredBase : `${configuredBase}/api`;

  let url: string;
  const isHealthCheck = endpoint === '/health' || endpoint === 'health';
  if (isHealthCheck) {
    // GET http://127.0.0.1:8000/health
    url = `${rootHostUrl}/health`;
  } else {
    // Strip leading slash and any duplicate /api prefix
    const cleanPath = endpoint.replace(/^\/?(api\/)?/, '');
    url = `${apiBaseUrl}/${cleanPath}`;
  }

  const controller = new AbortController();
  const timeoutMs = 8000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });

    // If health check gave 404 at root, attempt /api/health as fallback
    if (isHealthCheck && response.status === 404) {
      try {
        const fallbackUrl = `${apiBaseUrl}/health`;
        const altResponse = await fetch(fallbackUrl, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(options.headers || {}),
          },
        });
        if (altResponse.ok) {
          response = altResponse;
        }
      } catch {
        // keep original response
      }
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorBody: any = null;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }
      throw new ApiError(
        errorBody?.detail || errorBody?.message || `HTTP ${response.status} from ${endpoint}`,
        response.status,
        errorBody
      );
    }

    return (await response.json()) as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new ApiError(`Request to ${endpoint} timed out after ${timeoutMs}ms`, 408);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || `Network error connecting to ${url}`, 0);
  }
}

export const apiClient = {
  // GET http://127.0.0.1:8000/health
  async checkHealth(): Promise<{ status: string; [key: string]: any }> {
    return request<{ status: string; [key: string]: any }>('/health');
  },

  // GET http://127.0.0.1:8000/api/clients
  async getClients(): Promise<HospitalClient[]> {
    const res = await request<any>('/api/clients');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.clients)) return res.clients;
    return [];
  },

  // GET http://127.0.0.1:8000/api/rounds
  async getRounds(): Promise<FederationRound[]> {
    const res = await request<any>('/api/rounds');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.rounds)) return res.rounds;
    return [];
  },

  // POST http://127.0.0.1:8000/api/rounds/start
  async startRound(req: StartRoundRequest = {}): Promise<FederationRound> {
    const res = await request<any>('/api/rounds/start', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    if (res && res.round) return res.round;
    return res as FederationRound;
  },

  // GET http://127.0.0.1:8000/api/incidents
  async getIncidents(): Promise<Incident[]> {
    const res = await request<any>('/api/incidents');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.incidents)) return res.incidents;
    return [];
  },

  // GET http://127.0.0.1:8000/api/incidents/{incident_id}
  async getIncident(incidentId: string): Promise<Incident> {
    const res = await request<any>(`/api/incidents/${encodeURIComponent(incidentId)}`);
    if (res && res.incident) return res.incident;
    return res as Incident;
  },

  // GET http://127.0.0.1:8000/api/trust/{client_id}
  async getClientTrust(clientId: string): Promise<ClientTrustInfo> {
    const res = await request<any>(`/api/trust/${encodeURIComponent(clientId)}`);
    if (res && res.trust_info) return res.trust_info;
    return res as ClientTrustInfo;
  },

  // POST http://127.0.0.1:8000/api/simulation/start
  async startSimulation(): Promise<SimulationResponse> {
    const res = await request<any>('/api/simulation/start', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    if (res && res.incident) return res;
    if (res && res.incident_id) {
      return { status: 'SIMULATION_COMPLETE', incident: res };
    }
    return res as SimulationResponse;
  },

  // POST http://127.0.0.1:8000/api/clients
  async createClient(req: CreateClientRequest): Promise<HospitalClient> {
    const res = await request<any>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    if (res && res.client) return res.client;
    return res as HospitalClient;
  },

  // POST http://127.0.0.1:8000/api/clients/{client_id}/action
  async overrideClientStatus(clientId: string, req: ClientActionRequest): Promise<HospitalClient> {
    const res = await request<any>(`/api/clients/${encodeURIComponent(clientId)}/action`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
    if (res && res.client) return res.client;
    return res as HospitalClient;
  },

  // POST http://127.0.0.1:8000/api/auth/login
  async login(email: string, password: string, role?: string, name?: string): Promise<any> {
    return request<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role, name }),
    });
  },

  // POST http://127.0.0.1:8000/api/auth/register
  async register(data: { name: string; email: string; password: string; role?: string; hospital_affiliation?: string }): Promise<any> {
    return request<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
