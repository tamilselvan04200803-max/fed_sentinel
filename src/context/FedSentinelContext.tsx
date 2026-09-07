import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  HospitalClient,
  FederationRound,
  Incident,
  FedSentinelEvent,
  ConnectionStatus,
  NavigationPage,
  ClientTrustInfo,
  UserProfile,
  UserRole,
  CreateClientRequest,
  ClientActionRequest,
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

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  timestamp: string;
}

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

  // Authentication
  currentUser: UserProfile | null;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalTab: 'signin' | 'signup';
  setAuthModalTab: (tab: 'signin' | 'signup') => void;
  signIn: (email: string, password: string, role?: UserRole, name?: string) => Promise<UserProfile>;
  signUp: (name: string, email: string, password: string, role?: UserRole, hospitalAffiliation?: string) => Promise<UserProfile>;
  signOut: () => void;

  // Hospital Node Registration
  isAddClientModalOpen: boolean;
  setAddClientModalOpen: (open: boolean) => void;
  addHospitalClient: (clientData: CreateClientRequest) => Promise<HospitalClient>;
  isAddingClient: boolean;
  overrideClientStatus: (clientId: string, action: 'REINSTATE' | 'QUARANTINE' | 'BLOCK' | 'ADJUST_TRUST', trustScore?: number, reason?: string) => Promise<HospitalClient>;

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

  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
  removeToast: (id: string) => void;

  // Helpers
  getIncident: (incidentId: string) => Promise<Incident | null>;
  getClientTrust: (clientId: string) => Promise<ClientTrustInfo | null>;
  navigateToInvestigation: (incidentId: string) => void;
}

const FedSentinelContext = createContext<FedSentinelContextType | undefined>(undefined);

const DEFAULT_DEMO_USER: UserProfile = {
  id: 'usr_secops_lead',
  name: 'Dr. Sarah Chen',
  email: 'sarah.chen@fedsentinel.io',
  role: 'SECOPS_ADMIN',
  hospitalAffiliation: 'National Clinical AI Consortium',
  clearanceLevel: 'LEVEL_4_CHIEF_OFFICER',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
};

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

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('fedsentinel_user_auth');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // fall through
        }
      }
    }
    return DEFAULT_DEMO_USER;
  });
  const [isAuthModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');

  // Hospital Node Onboarding State
  const [isAddClientModalOpen, setAddClientModalOpen] = useState<boolean>(false);
  const [isAddingClient, setIsAddingClient] = useState<boolean>(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', title?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newToast: ToastMessage = {
      id,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
    };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Mock Mode Flag
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

  // Auth Methods
  const signIn = async (email: string, password: string, role?: UserRole, name?: string): Promise<UserProfile> => {
    try {
      const res = await apiClient.login(email, password, role, name);
      const user = res.user || {
        id: `usr_${Date.now()}`,
        name: name || email.split('@')[0].replace('.', ' ').toUpperCase(),
        email,
        role: role || 'SECOPS_ADMIN',
        hospitalAffiliation: 'Consortium Health Enclave',
        clearanceLevel: 'LEVEL_4_OFFICER',
      };
      setCurrentUser(user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('fedsentinel_user_auth', JSON.stringify(user));
      }
      showToast(`Welcome back, ${user.name}! Authenticated as ${user.role.replace('_', ' ')}.`, 'success', 'Signed In');
      setAuthModalOpen(false);
      return user;
    } catch (err: any) {
      // Fallback local sign in if backend auth endpoint unavailable
      const user: UserProfile = {
        id: `usr_${Date.now()}`,
        name: name || email.split('@')[0].replace('.', ' ').toUpperCase(),
        email,
        role: role || 'SECOPS_ADMIN',
        hospitalAffiliation: 'Consortium Health Enclave',
        clearanceLevel: 'LEVEL_4_OFFICER',
      };
      setCurrentUser(user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('fedsentinel_user_auth', JSON.stringify(user));
      }
      showToast(`Welcome back, ${user.name}! Signed in locally.`, 'success', 'Signed In');
      setAuthModalOpen(false);
      return user;
    }
  };

  const signUp = async (
    name: string,
    email: string,
    password: string,
    role: UserRole = 'SECOPS_ADMIN',
    hospitalAffiliation: string = 'Regional Hospital Enclave'
  ): Promise<UserProfile> => {
    try {
      const res = await apiClient.register({ name, email, password, role, hospital_affiliation: hospitalAffiliation });
      const user = res.user || {
        id: `usr_${Date.now()}`,
        name,
        email,
        role,
        hospitalAffiliation,
        clearanceLevel: 'LEVEL_3_ANALYST',
      };
      setCurrentUser(user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('fedsentinel_user_auth', JSON.stringify(user));
      }
      showToast(`Account created successfully for ${name}. Role: ${role.replace('_', ' ')}`, 'success', 'Account Created');
      setAuthModalOpen(false);
      return user;
    } catch (err: any) {
      const user: UserProfile = {
        id: `usr_${Date.now()}`,
        name,
        email,
        role,
        hospitalAffiliation,
        clearanceLevel: 'LEVEL_3_ANALYST',
      };
      setCurrentUser(user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('fedsentinel_user_auth', JSON.stringify(user));
      }
      showToast(`Account created successfully for ${name}.`, 'success', 'Account Created');
      setAuthModalOpen(false);
      return user;
    }
  };

  const signOut = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fedsentinel_user_auth');
    }
    showToast('Signed out of FedSentinel SecOps session.', 'info', 'Signed Out');
  };

  const toggleMockMode = (force?: boolean) => {
    const nextVal = force !== undefined ? force : !isMockModeActive;
    setIsMockModeActive(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fedsentinel_mock_mode', String(nextVal));
    }
    if (nextVal) {
      setClients(MOCK_CLIENTS);
      setRounds(MOCK_ROUNDS);
      setIncidents(MOCK_INCIDENTS);
      setEvents(MOCK_EVENTS);
      setError(null);
      showToast('Switched to Local Preview Demo Mode.', 'info', 'Demo Mode');
    } else {
      fetchData();
      showToast('Connecting to live FastAPI backend at ' + apiBaseUrl, 'info', 'Live Mode');
    }
  };

  const updateApiBaseUrl = (newUrl: string) => {
    setApiBaseUrl(newUrl);
    setApiBaseUrlState(newUrl);
    wsClient.reconnect();
    fetchData();
    showToast('API Base URL updated: ' + newUrl, 'success', 'Config Saved');
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
        setClients((prev) => (prev.length > 0 ? prev : MOCK_CLIENTS));
        setRounds((prev) => (prev.length > 0 ? prev : MOCK_ROUNDS));
        setIncidents((prev) => (prev.length > 0 ? prev : MOCK_INCIDENTS));
        setEvents((prev) => (prev.length > 0 ? prev : MOCK_EVENTS));
      } else {
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

    wsClient.connect();

    const unsubStatus = wsClient.addStatusListener((status, err) => {
      setConnectionStatus(status);
      setWsError(err || null);
    });

    const unsubEvents = wsClient.addEventListener((evt) => {
      addEvent(evt);
      if (
        evt.event_type === 'ROUND_COMPLETED' ||
        evt.event_type === 'INCIDENT_DETECTED' ||
        evt.event_type === 'CLIENT_QUARANTINED' ||
        evt.event_type === 'CLIENT_REGISTERED' ||
        evt.event_type === 'CLIENT_STATUS_UPDATED'
      ) {
        fetchData();
      }
    });

    return () => {
      unsubStatus();
      unsubEvents();
    };
  }, [fetchData, addEvent]);

  // Add Hospital Client Method
  const addHospitalClient = async (clientData: CreateClientRequest): Promise<HospitalClient> => {
    setIsAddingClient(true);
    try {
      if (isMockModeActive) {
        await new Promise((res) => setTimeout(res, 600));
        const newClient: HospitalClient = {
          client_id: clientData.client_id.trim().toUpperCase(),
          name: clientData.name.trim(),
          status: clientData.status || 'TRUSTED',
          trust_score: clientData.trust_score ?? 95,
          samples_count: clientData.samples_count ?? 1000,
          historical_anomalies: 0,
          last_active_round: rounds[0]?.round_id ?? 24,
        };

        setClients((prev) => [...prev, newClient]);
        addEvent({
          event_type: 'CLIENT_REGISTERED',
          round_id: newClient.last_active_round,
          client_id: newClient.client_id,
          payload: {
            name: newClient.name,
            trust_score: newClient.trust_score,
            enclave_type: clientData.enclave_type || 'Intel SGX',
          },
          timestamp: new Date().toISOString(),
        });
        showToast(`Hospital node ${newClient.client_id} (${newClient.name}) successfully registered.`, 'success', 'Node Added');
        return newClient;
      }

      const res = await apiClient.createClient(clientData);
      await fetchData();
      showToast(`Hospital node ${res.client_id} (${res.name}) successfully registered.`, 'success', 'Node Added');
      return res;
    } catch (err: any) {
      const msg = err?.message || 'Failed to add hospital node.';
      showToast(msg, 'error', 'Registration Failed');
      throw err;
    } finally {
      setIsAddingClient(false);
    }
  };

  // Override Client Status Method
  const overrideClientStatus = async (
    clientId: string,
    action: 'REINSTATE' | 'QUARANTINE' | 'BLOCK' | 'ADJUST_TRUST',
    trustScore?: number,
    reason?: string
  ): Promise<HospitalClient> => {
    try {
      if (isMockModeActive) {
        const nextStatus =
          action === 'REINSTATE'
            ? 'TRUSTED'
            : action === 'QUARANTINE'
            ? 'QUARANTINED'
            : action === 'BLOCK'
            ? 'BLOCKED'
            : (trustScore ?? 80) >= 80
            ? 'TRUSTED'
            : (trustScore ?? 80) >= 50
            ? 'REVIEW'
            : 'QUARANTINED';

        const nextScore =
          trustScore !== undefined
            ? trustScore
            : action === 'REINSTATE'
            ? 90
            : action === 'QUARANTINE'
            ? 35
            : action === 'BLOCK'
            ? 10
            : 85;

        setClients((prev) =>
          prev.map((c) =>
            c.client_id === clientId
              ? {
                  ...c,
                  status: nextStatus,
                  trust_score: nextScore,
                  historical_anomalies: action === 'QUARANTINE' ? c.historical_anomalies + 1 : c.historical_anomalies,
                }
              : c
          )
        );

        addEvent({
          event_type: 'CLIENT_STATUS_UPDATED',
          round_id: rounds[0]?.round_id ?? 24,
          client_id: clientId,
          payload: { action, status: nextStatus, trust_score: nextScore, reason },
          timestamp: new Date().toISOString(),
        });

        showToast(`Node ${clientId} updated: ${action} -> ${nextStatus} (${nextScore}%).`, 'success', 'Status Overridden');
        const updated = clients.find((c) => c.client_id === clientId)!;
        return { ...updated, status: nextStatus, trust_score: nextScore };
      }

      const res = await apiClient.overrideClientStatus(clientId, { action, trust_score: trustScore, reason });
      await fetchData();
      showToast(`Node ${clientId} updated: ${action} -> ${res.status} (${res.trust_score}%).`, 'success', 'Status Overridden');
      return res;
    } catch (err: any) {
      const msg = err?.message || 'Failed to update client status.';
      showToast(msg, 'error', 'Override Failed');
      throw err;
    }
  };

  // Start Round Action
  const startRound = async (targetClients?: string[]): Promise<FederationRound> => {
    setIsStartingRound(true);
    try {
      if (isMockModeActive) {
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
        showToast(`Federation Round #${nextRoundId} completed successfully! Accuracy: 94.8%`, 'success', 'Round Completed');
        return newRound;
      }

      const nextRoundId = (rounds[0]?.round_id || 0) + 1;
      const result = await apiClient.startRound({
        round_id: nextRoundId,
        target_clients: targetClients,
      });

      await fetchData();
      showToast(`Federation Round #${result.round_id} completed successfully! Accuracy: ${result.global_accuracy}%`, 'success', 'Round Completed');
      return result;
    } catch (err: any) {
      showToast(err?.message || 'Failed to start federation round.', 'error', 'Round Error');
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
          round_id: rounds[0]?.round_id || 24,
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

        setClients((prev) =>
          prev.map((c) =>
            c.client_id === 'H3'
              ? { ...c, status: 'QUARANTINED', trust_score: 35, historical_anomalies: c.historical_anomalies + 1 }
              : c
          )
        );

        showToast(`Backdoor attack detected and isolated on Node H3! Incident ticket ${simIncident.incident_id} created.`, 'warning', 'Threat Isolated');
        return simIncident;
      }

      const res = await apiClient.startSimulation();
      setLastSimulationIncident(res.incident);
      if (res.incident?.incident_id) {
        setSelectedIncidentId(res.incident.incident_id);
      }
      await fetchData();
      showToast(`Adversarial backdoor simulation executed. Node H3 quarantined under ticket ${res.incident.incident_id}.`, 'warning', 'Threat Isolated');
      return res.incident;
    } catch (err: any) {
      showToast(err?.message || 'Simulation execution failed.', 'error', 'Simulation Error');
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

        currentUser,
        isAuthModalOpen,
        setAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        signIn,
        signUp,
        signOut,

        isAddClientModalOpen,
        setAddClientModalOpen,
        addHospitalClient,
        isAddingClient,
        overrideClientStatus,

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

        toasts,
        showToast,
        removeToast,

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
