import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  HospitalClient,
  FederationRound,
  Incident,
  FedSentinelEvent,
  ConnectionStatus,
  NavigationPage,
  ClientTrustInfo,
} from '../types';
import { apiClient, getApiBaseUrl, setApiBaseUrl, ApiError } from '../api/client';
import { wsClient } from '../api/websocket';
import {
  MOCK_CLIENTS,
  MOCK_ROUNDS,
  MOCK_INCIDENTS,
  MOCK_EVENTS,
  MOCK_TRUST_MAP,
} from '../data/mockData';

interface FedSentinelContextType {
  // Navigation & Selection
  activeTab: NavigationPage;
  setActiveTab: (tab: NavigationPage) => void;
  selectedIncidentId: string | null;
  setSelectedIncidentId: (id: string | null) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;

  // Data
  clients: HospitalClient[];
  rounds: FederationRound[];
  incidents: Incident[];
  events: FedSentinelEvent[];

  // Status & Connectivity
  connectionStatus: ConnectionStatus;
  wsError: string | null;
  apiBaseUrl: string;
  updateApiBaseUrl: (url: string) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  isMockModeActive: boolean;
  toggleMockMode: (force?: boolean) => void;

  // Actions
  refreshAllData: () => Promise<void>;
  startRound: (targetClients?: string[]) => Promise<FederationRound>;
  isStartingRound: boolean;
  startSimulation: () => Promise<Incident>;
  isSimulating: boolean;
  lastSimulationIncident: Incident | null;
  clearLastSimulationIncident: () => void;

  // Modals
  isStartRoundModalOpen: boolean;
  setStartRoundModalOpen: (open: boolean) => void;
  isSimulationModalOpen: boolean;
  setSimulationModalOpen: (open: boolean) => void;

  // Helpers
  getIncident: (incidentId: string) => Promise<Incident | null>;
  getClientTrust: (clientId: string) => Promise<ClientTrustInfo | null>;
  navigateToInvestigation: (incidentId: string) => void;
}

const FedSentinelContext = createContext<FedSentinelContextType | undefined>(undefined);

export const FedSentinelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationPage>('overview');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>('FS-034');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Core Data
  const [clients, setClients] = useState<HospitalClient[]>([]);
  const [rounds, setRounds] = useState<FederationRound[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [events, setEvents] = useState<FedSentinelEvent[]>([]);

  // Connectivity
  const [apiBaseUrl, setApiBaseUrlState] = useState<string>(getApiBaseUrl());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [wsError, setWsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Mock Mode Flag (for preview environment when backend is not running)
  const [isMockModeActive, setIsMockModeActive] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('fedsentinel_mock_mode');
      return stored === 'true';
    }
    return false;
  });

  // Action states
  const [isStartingRound, setIsStartingRound] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [lastSimulationIncident, setLastSimulationIncident] = useState<Incident | null>(null);

  // Modals
  const [isStartRoundModalOpen, setStartRoundModalOpen] = useState<boolean>(false);
  const [isSimulationModalOpen, setSimulationModalOpen] = useState<boolean>(false);

  const toggleMockMode = (force?: boolean) => {
    const nextVal = force !== undefined ? force : !isMockModeActive;
    setIsMockModeActive(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fedsentinel_mock_mode', String(nextVal));
    }
    if (nextVal) {
      // Load mock dataset immediately
      setClients(MOCK_CLIENTS);
      setRounds(MOCK_ROUNDS);
      setIncidents(MOCK_INCIDENTS);
      setEvents(MOCK_EVENTS);
      setError(null);
    } else {
      // Re-trigger live fetch
      fetchData();
    }
  };

  const updateApiBaseUrl = (newUrl: string) => {
    setApiBaseUrl(newUrl);
    setApiBaseUrlState(newUrl);
    wsClient.reconnect();
    fetchData();
  };

  // Helper to add live event without duplicates
  const addEvent = useCallback((event: FedSentinelEvent) => {
    setEvents((prev) => {
      const exists = prev.some(
        (e) =>
          e.event_type === event.event_type &&
          e.round_id === event.round_id &&
          e.client_id === event.client_id &&
          e.timestamp === event.timestamp
      );
      if (exists) return prev;
      return [event, ...prev.slice(0, 99)];
    });
  }, []);

  // Fetch all core datasets from REST API
  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      // Proactively check health and fetch core datasets
      const [, fetchedClients, fetchedRounds, fetchedIncidents] = await Promise.all([
        apiClient.checkHealth().catch((err) => {
          console.debug('Health check endpoint notice:', err?.message);
          return null;
        }),
        apiClient.getClients(),
        apiClient.getRounds(),
        apiClient.getIncidents(),
      ]);

      setClients(fetchedClients);
      setRounds(fetchedRounds);
      setIncidents(fetchedIncidents);
      setError(null);
    } catch (err: any) {
      const msg = err?.message || 'Failed to connect to backend';
      console.warn('FedSentinel API fetch failed:', msg);

      if (isMockModeActive) {
        // In mock mode, keep mock data populated
        setClients((prev) => (prev.length > 0 ? prev : MOCK_CLIENTS));
        setRounds((prev) => (prev.length > 0 ? prev : MOCK_ROUNDS));
        setIncidents((prev) => (prev.length > 0 ? prev : MOCK_INCIDENTS));
        setEvents((prev) => (prev.length > 0 ? prev : MOCK_EVENTS));
      } else {
        // Real mode: explicitly show connection error
        setError(msg);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isMockModeActive]);

  // Initial setup & WebSocket lifecycle
  useEffect(() => {
    fetchData();

    // Connect WebSocket
    wsClient.connect();

    const unsubStatus = wsClient.addStatusListener((status, err) => {
      setConnectionStatus(status);
      setWsError(err || null);
    });

    const unsubEvents = wsClient.addEventListener((evt) => {
      addEvent(evt);
      // Auto-refresh queries if relevant event arrives
      if (
        evt.event_type === 'ROUND_COMPLETED' ||
        evt.event_type === 'INCIDENT_DETECTED' ||
        evt.event_type === 'CLIENT_QUARANTINED'
      ) {
        fetchData();
      }
    });

    return () => {
      unsubStatus();
      unsubEvents();
    };
  }, [fetchData, addEvent]);

  // Start Round Action
  const startRound = async (targetClients?: string[]): Promise<FederationRound> => {
    setIsStartingRound(true);
    try {
      if (isMockModeActive) {
        // Simulated local round
        await new Promise((res) => setTimeout(res, 800));
        const nextRoundId = (rounds[0]?.round_id || 24) + 1;
        const participating = targetClients || clients.map((c) => c.client_id);
        const newRound: FederationRound = {
          round_id: nextRoundId,
          status: 'COMPLETED',
          participating_clients: participating,
          quarantined_clients: participating.includes('H3') ? ['H3'] : [],
          accepted_clients: participating.filter((c) => c !== 'H3'),
          global_accuracy: 94.8,
          timestamp: new Date().toISOString(),
        };

        setRounds((prev) => [newRound, ...prev]);
        addEvent({
          event_type: 'ROUND_COMPLETED',
          round_id: nextRoundId,
          client_id: 'SYSTEM',
          payload: {
            participating_count: participating.length,
            global_accuracy: 94.8,
          },
          timestamp: new Date().toISOString(),
        });
        return newRound;
      }

      const nextRoundId = (rounds[0]?.round_id || 0) + 1;
      const result = await apiClient.startRound({
        round_id: nextRoundId,
        target_clients: targetClients,
      });

      // Refresh data after completion
      await fetchData();
      return result;
    } catch (err: any) {
      throw err;
    } finally {
      setIsStartingRound(false);
    }
  };

  // Start Simulation Action
  const startSimulation = async (): Promise<Incident> => {
    setIsSimulating(true);
    try {
      if (isMockModeActive) {
        await new Promise((res) => setTimeout(res, 1200));
        const simIncident: Incident = {
          incident_id: `FS-${Math.floor(100 + Math.random() * 900)}`,
          client_id: 'H3',
          round_id: (rounds[0]?.round_id || 24),
          update_hash: '3a7ac6497a7e857a04772b502b19937be8bcfe18479c2a13644a66cbbf605901',
          integrity_status: 'PASS',
          threat_hypothesis: 'BACKDOOR',
          confidence: 'HIGH',
          action_taken: 'QUARANTINED',
          trust_before: 85,
          trust_after: 35,
          blast_radius: {
            baseline_asr: 0,
            post_update_asr: 89,
            baseline_accuracy: 94,
            post_update_accuracy: 91,
            impacted_target_class: 'Class 7 (Malignant Glioblastoma)',
            target_class_accuracy_drop: 44,
          },
          evidence_summary: {
            layer0_local_validation: { status: 'PASS', checks_passed: 12, total_checks: 12, details: 'Valid format.' },
            layer1_fingerprint: { norm: 4.12, cosine_distance_to_median: 0.72 },
            layer2_anomaly: { anomaly_score: 0.92, threshold: 0.45, flagged_dimensions: ['conv5_3', 'dense_classifier'] },
            layer3_influence: { influence_score: 0.95, counterfactual_risk: 0.89, test_loss_delta: 0.048 },
            layer4_counterfactual: { robustness_score: 0.19, poison_probability: 0.94 },
            layer5_attribution: { attributed_client_id: 'H3', signature_match: true },
            trust_engine: { trust_before: 85, trust_after: 35, recommended_action: 'QUARANTINE_CLIENT' },
          },
          timestamp: new Date().toISOString(),
        };

        setIncidents((prev) => [simIncident, ...prev]);
        setLastSimulationIncident(simIncident);
        setSelectedIncidentId(simIncident.incident_id);

        addEvent({
          event_type: 'SIMULATION_TRIGGERED',
          round_id: simIncident.round_id,
          client_id: 'H3',
          payload: {
            attack_type: 'Targeted Backdoor Watermark',
            target_class: 'Class 7',
            action_taken: 'QUARANTINED',
          },
          timestamp: new Date().toISOString(),
        });

        // Update H3 in client state
        setClients((prev) =>
          prev.map((c) =>
            c.client_id === 'H3'
              ? { ...c, status: 'QUARANTINED', trust_score: 35, historical_anomalies: c.historical_anomalies + 1 }
              : c
          )
        );

        return simIncident;
      }

      const res = await apiClient.startSimulation();
      setLastSimulationIncident(res.incident);
      if (res.incident?.incident_id) {
        setSelectedIncidentId(res.incident.incident_id);
      }
      await fetchData();
      return res.incident;
    } catch (err: any) {
      throw err;
    } finally {
      setIsSimulating(false);
    }
  };

  const getIncident = async (incidentId: string): Promise<Incident | null> => {
    try {
      if (isMockModeActive) {
        return incidents.find((i) => i.incident_id === incidentId) || null;
      }
      const fullIncident = await apiClient.getIncident(incidentId);
      if (fullIncident && fullIncident.incident_id) {
        setIncidents((prev) => {
          const index = prev.findIndex((i) => i.incident_id === fullIncident.incident_id);
          if (index >= 0) {
            const next = [...prev];
            next[index] = { ...next[index], ...fullIncident };
            return next;
          }
          return [fullIncident, ...prev];
        });
      }
      return fullIncident;
    } catch (err) {
      console.warn(`Failed to fetch incident ${incidentId}:`, err);
      return incidents.find((i) => i.incident_id === incidentId) || null;
    }
  };

  const getClientTrust = async (clientId: string): Promise<ClientTrustInfo | null> => {
    try {
      if (isMockModeActive) {
        return MOCK_TRUST_MAP[clientId] || {
          client_id: clientId,
          current_trust_score: 85,
          status: 'TRUSTED',
          trust_history: [],
          incident_count: 0,
        };
      }
      return await apiClient.getClientTrust(clientId);
    } catch (err) {
      if (MOCK_TRUST_MAP[clientId]) return MOCK_TRUST_MAP[clientId];
      return null;
    }
  };

  const navigateToInvestigation = (incidentId: string) => {
    setSelectedIncidentId(incidentId);
    setActiveTab('investigation');
  };

  return (
    <FedSentinelContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedIncidentId,
        setSelectedIncidentId,
        selectedClientId,
        setSelectedClientId,

        clients,
        rounds,
        incidents,
        events,

        connectionStatus,
        wsError,
        apiBaseUrl,
        updateApiBaseUrl,
        isLoading,
        isRefreshing,
        error,
        isMockModeActive,
        toggleMockMode,

        refreshAllData: fetchData,
        startRound,
        isStartingRound,
        startSimulation,
        isSimulating,
        lastSimulationIncident,
        clearLastSimulationIncident: () => setLastSimulationIncident(null),

        isStartRoundModalOpen,
        setStartRoundModalOpen,
        isSimulationModalOpen,
        setSimulationModalOpen,

        getIncident,
        getClientTrust,
        navigateToInvestigation,
      }}
    >
      {children}
    </FedSentinelContext.Provider>
  );
};

export function useFedSentinel() {
  const context = useContext(FedSentinelContext);
  if (!context) {
    throw new Error('useFedSentinel must be used within a FedSentinelProvider');
  }
  return context;
}
