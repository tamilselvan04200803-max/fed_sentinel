import { create } from 'zustand';
import {
  HospitalClient,
  FederationRound,
  Incident,
  FedSentinelEvent,
  ConnectionStatus,
  NavigationPage,
  UserProfile,
} from '../types';

interface SystemStatus {
  apiStatus: 'online' | 'offline';
  wsStatus: ConnectionStatus;
  activeHospitals: number;
  quarantinedNodes: number;
}

interface Settings {
  apiBaseUrl: string;
  theme: 'dark' | 'light';
  autoQuarantine: boolean;
  density: 'comfortable' | 'compact';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  timestamp: string;
}

export interface FedSentinelState {
  // Navigation & Persona
  activeTab: NavigationPage;
  setActiveTab: (tab: NavigationPage) => void;
  activePersona: 'SOC' | 'HOSPITAL';
  setActivePersona: (persona: 'SOC' | 'HOSPITAL') => void;
  activeHospitalId: string;
  setActiveHospitalId: (id: string) => void;
  selectedIncidentId: string | null;
  setSelectedIncidentId: (id: string | null) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  isSimulationModalOpen: boolean;
  setSimulationModalOpen: (open: boolean) => void;
  isStartRoundModalOpen: boolean;
  setStartRoundModalOpen: (open: boolean) => void;

  // Data
  systemStatus: SystemStatus;
  hospitals: HospitalClient[];
  federationRounds: FederationRound[];
  incidents: Incident[];
  events: FedSentinelEvent[];
  toasts: ToastMessage[];
  strategyComparison: Record<string, number> | null;
  
  // Settings & Modes
  settings: Settings;
  density: 'comfortable' | 'compact';
  setDensity: (density: 'comfortable' | 'compact') => void;
  isDemoMode: boolean;
  isSimulating: boolean;

  // Setters
  setSystemStatus: (status: Partial<SystemStatus>) => void;
  setHospitals: (hospitals: HospitalClient[]) => void;
  setFederationRounds: (rounds: FederationRound[]) => void;
  setIncidents: (incidents: Incident[]) => void;
  setStrategyComparison: (comp: Record<string, number> | null) => void;
  addEvent: (event: FedSentinelEvent) => void; // Keeps capped array
  addToast: (toast: Omit<ToastMessage, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  toggleDemoMode: () => void;
  setIsSimulating: (simulating: boolean) => void;

  // Demo playback
  runDemoSequence: () => Promise<void>;
}

export const useFedSentinelStore = create<FedSentinelState>((set, get) => ({
  activeTab: 'overview',
  setActiveTab: (tab) => set({ activeTab: tab }),
  activePersona: 'SOC',
  setActivePersona: (persona) => set({ activePersona: persona }),
  activeHospitalId: 'H1',
  setActiveHospitalId: (id) => set({ activeHospitalId: id }),
  selectedIncidentId: null,
  setSelectedIncidentId: (id) => set({ selectedIncidentId: id }),
  selectedClientId: null,
  setSelectedClientId: (id) => set({ selectedClientId: id }),
  isSimulationModalOpen: false,
  setSimulationModalOpen: (open) => set({ isSimulationModalOpen: open }),
  isStartRoundModalOpen: false,
  setStartRoundModalOpen: (open) => set({ isStartRoundModalOpen: open }),

  systemStatus: {
    apiStatus: 'offline',
    wsStatus: 'disconnected',
    activeHospitals: 0,
    quarantinedNodes: 0,
  },
  hospitals: [],
  federationRounds: [],
  incidents: [],
  events: [],
  toasts: [],
  strategyComparison: null,

  density: (typeof window !== 'undefined' && (localStorage.getItem('fedsentinel_density') as 'comfortable' | 'compact')) || 'comfortable',
  setDensity: (density) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fedsentinel_density', density);
      document.documentElement.setAttribute('data-density', density);
    }
    set((state) => ({
      density,
      settings: { ...state.settings, density },
    }));
  },

  settings: {
    apiBaseUrl: 'http://127.0.0.1:8000/api',
    theme: 'dark',
    autoQuarantine: true,
    density: (typeof window !== 'undefined' && (localStorage.getItem('fedsentinel_density') as 'comfortable' | 'compact')) || 'comfortable',
  },

  setSystemStatus: (status) => set((state) => ({ systemStatus: { ...state.systemStatus, ...status } })),
  setHospitals: (hospitals) => set({ hospitals }),
  setFederationRounds: (rounds) => set({ federationRounds: rounds }),
  setIncidents: (incidents) => set({ incidents }),
  setStrategyComparison: (comp) => set({ strategyComparison: comp }),
  isDemoMode: false,
  isSimulating: false,
  
  addEvent: (event) => set((state) => {
    // Capped ring buffer: 200 events max
    const newEvents = [event, ...state.events];
    if (newEvents.length > 200) newEvents.pop();
    return { events: newEvents };
  }),

  addToast: (toast) => set((state) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastMessage = { ...toast, id, timestamp: new Date().toISOString() };
    return { toasts: [...state.toasts, newToast] };
  }),

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),

  updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
  toggleDemoMode: () => set((state) => ({ isDemoMode: !state.isDemoMode })),
  setIsSimulating: (simulating) => set({ isSimulating: simulating }),

  runDemoSequence: async () => {
    const { isDemoMode, setSystemStatus, setHospitals, setIncidents, setFederationRounds, addEvent } = get();
    if (!isDemoMode) return;
    
    // Lazy import fixture data to prevent circular deps or massive bundle bloat
    const { INITIAL_HOSPITALS, INITIAL_ROUNDS, PHASE_2_ATTACK_INCIDENT } = await import('../api/demoFixture');
    
    // Phase 1: Clean State
    setSystemStatus({ apiStatus: 'online', wsStatus: 'connected', activeHospitals: 5, quarantinedNodes: 0 });
    setHospitals(INITIAL_HOSPITALS);
    setFederationRounds(INITIAL_ROUNDS);
    setIncidents([]);
    
    addEvent({
      event_type: 'SYSTEM_ONLINE',
      round_id: 24,
      client_id: 'GATEWAY',
      payload: { mode: 'DEMO_PLAYBACK', status: 'All nodes trusted' },
      timestamp: new Date().toISOString()
    });

    // Phase 2: Attack Detected (after 3 seconds)
    setTimeout(() => {
      addEvent({
        event_type: 'ANOMALY_DETECTED',
        round_id: 25,
        client_id: 'H3',
        payload: { threat: 'BACKDOOR', anomaly_score: 0.88 },
        timestamp: new Date().toISOString()
      });
      
      const newHospitals = INITIAL_HOSPITALS.map(h => 
        h.client_id === 'H3' ? { ...h, status: 'QUARANTINED', trust_score: 45 } : h
      );
      setHospitals(newHospitals);
      setSystemStatus({ quarantinedNodes: 1 });
      setIncidents([PHASE_2_ATTACK_INCIDENT]);

      // Phase 3: Defense On / Quarantine (after another 3 seconds)
      setTimeout(() => {
        addEvent({
          event_type: 'CLIENT_QUARANTINED',
          round_id: 25,
          client_id: 'H3',
          payload: { action: 'ISOLATED_FROM_ROUND', trust_penalty: -37 },
          timestamp: new Date().toISOString()
        });
        
        setFederationRounds([
          { 
            round_id: 25, 
            status: 'COMPLETED', 
            participating_clients: ['H1','H2','H3','H4','H5'], 
            quarantined_clients: ['H3'], 
            accepted_clients: ['H1','H2','H4','H5'], 
            global_accuracy: 94.6, 
            timestamp: new Date().toISOString() 
          },
          ...INITIAL_ROUNDS
        ]);
        
        // Phase 4: Recovery (after 3 seconds)
        setTimeout(() => {
          addEvent({
            event_type: 'ROUND_COMPLETED',
            round_id: 25,
            client_id: 'GATEWAY',
            payload: { global_accuracy: 94.6, status: 'DEFENSE_SUCCESSFUL' },
            timestamp: new Date().toISOString()
          });
        }, 3000);
      }, 3000);
    }, 3000);
  },
}));
