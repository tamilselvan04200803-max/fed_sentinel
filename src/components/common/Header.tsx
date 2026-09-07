import React, { useState } from 'react';
import {
  ShieldAlert,
  Play,
  RotateCw,
  Settings,
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  PlusCircle,
  User,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Building2,
  KeyRound,
  UserPlus,
} from 'lucide-react';
import { useFedSentinel } from '../../context/FedSentinelContext';

export const Header: React.FC = () => {
  const {
    apiBaseUrl,
    updateApiBaseUrl,
    connectionStatus,
    error,
    isMockModeActive,
    toggleMockMode,
    isRefreshing,
    refreshAllData,
    setStartRoundModalOpen,
    setSimulationModalOpen,
    isSimulating,
    isStartingRound,
    rounds,
    currentUser,
    setAuthModalOpen,
    setAuthModalTab,
    signOut,
    setAddClientModalOpen,
  } = useFedSentinel();

  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState(apiBaseUrl);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const currentRound = rounds[0]?.round_id ?? 24;

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      updateApiBaseUrl(urlInput.trim());
      setIsUrlModalOpen(false);
    }
  };

  const getWsStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <span
            title="WebSocket live event feed is actively receiving telemetry."
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium font-mono-code bg-emerald-50 text-emerald-700 border border-emerald-200"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            WS: Live
          </span>
        );
      case 'connecting':
      case 'reconnecting':
        return (
          <span
            title="Reconnecting to WebSocket server..."
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium font-mono-code bg-amber-50 text-amber-700 border border-amber-200"
          >
            <Clock className="w-3 h-3 animate-spin text-amber-500" />
            WS: Reconnecting
          </span>
        );
      case 'error':
      case 'disconnected':
      default:
        return (
          <span
            title="WebSocket disconnected. Will retry automatically."
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium font-mono-code bg-slate-100 text-slate-600 border border-slate-300"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            WS: Offline
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand & Principle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 tracking-tight text-base">
                    FedSentinel
                  </span>
                  <span className="text-[10px] font-mono-code uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    SecOps Console
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden xl:flex items-center pl-3 border-l border-slate-200">
              <span className="text-xs text-slate-500 font-mono-code tracking-tight font-medium">
                &ldquo;DON&apos;T TRUST THE UPDATE. VERIFY IT.&rdquo;
              </span>
            </div>
          </div>

          {/* Center Connection Status Pills */}
          <div className="hidden lg:flex items-center gap-2">
            {/* API Endpoint button */}
            <button
              onClick={() => {
                setUrlInput(apiBaseUrl);
                setIsUrlModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono-code font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
              title="Click to configure backend API base URL"
              type="button"
            >
              {error && !isMockModeActive ? (
                <XCircle className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span className="truncate max-w-[140px]">{apiBaseUrl}</span>
              <Settings className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {/* WebSocket status pill */}
            {getWsStatusBadge()}

            {/* Demo Mode Toggle Button */}
            <button
              onClick={() => toggleMockMode()}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border transition-colors ${
                isMockModeActive
                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title={
                isMockModeActive
                  ? 'Demo Mock Mode is ON. Click to switch to live backend API requests.'
                  : 'Click to enable local Demo Mock Mode for offline preview.'
              }
              type="button"
            >
              <Sparkles className={`w-3 h-3 ${isMockModeActive ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>{isMockModeActive ? 'Preview Demo' : 'Live API'}</span>
            </button>
          </div>

          {/* Right Actions & User Profile */}
          <div className="flex items-center gap-2">
            {/* Add Hospital Node Button */}
            <button
              onClick={() => setAddClientModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors shadow-2xs"
              title="Register a new hospital client node into federation"
              type="button"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Add Node</span>
            </button>

            {/* Run Backdoor Simulation */}
            <button
              onClick={() => setSimulationModalOpen(true)}
              disabled={isSimulating}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shadow-2xs active:scale-95 disabled:opacity-50"
              title="Trigger simulated backdoor injection to test Zero-Trust defense"
              type="button"
            >
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Simulate Attack</span>
            </button>

            {/* Start Round */}
            <button
              onClick={() => setStartRoundModalOpen(true)}
              disabled={isStartingRound}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-xs active:scale-95 disabled:opacity-50"
              title="Initiate next federated aggregation round"
              type="button"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              <span>Round #{currentRound + 1}</span>
            </button>

            {/* Refresh Data */}
            <button
              onClick={() => refreshAllData()}
              disabled={isRefreshing}
              className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-50"
              title="Refresh telemetry"
              type="button"
              aria-label="Refresh Data"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-slate-900' : ''}`} />
            </button>

            {/* User Profile / Auth Area */}
            <div className="relative pl-1 border-l border-slate-200 ml-1">
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1 rounded-md hover:bg-slate-100 transition-colors"
                    type="button"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center border border-slate-300">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="hidden md:flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-900 truncate max-w-[110px]">
                        {currentUser.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono-code uppercase">
                        {currentUser.role === 'SECOPS_ADMIN'
                          ? 'SecOps Admin'
                          : currentUser.role === 'FORENSIC_ANALYST'
                          ? 'Analyst'
                          : 'Auditor'}
                      </span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50 animate-fade-in text-xs">
                      <div className="px-3.5 py-2 border-b border-slate-100">
                        <span className="font-bold text-slate-900 block truncate">{currentUser.name}</span>
                        <span className="text-slate-500 font-mono-code text-[11px] block truncate">{currentUser.email}</span>
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-mono-code text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{currentUser.hospitalAffiliation || 'Federal Health Enclave'}</span>
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setAddClientModalOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                          type="button"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Register Hospital Node</span>
                        </button>
                        <button
                          onClick={() => {
                            setAuthModalTab('signin');
                            setAuthModalOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                          type="button"
                        >
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Switch User Profile</span>
                        </button>
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={() => {
                            signOut();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full px-3.5 py-2 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
                          type="button"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setAuthModalTab('signin');
                      setAuthModalOpen(true);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold rounded-md text-slate-700 hover:bg-slate-100 border border-slate-300"
                    type="button"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setAuthModalTab('signup');
                      setAuthModalOpen(true);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-900 text-white hover:bg-slate-800 shadow-2xs"
                    type="button"
                  >
                    Create Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Backend API Configuration Modal */}
      {isUrlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-lg p-5 max-w-md w-full shadow-xl border border-slate-200">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-600" />
              Configure FastAPI Backend API
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure the REST API endpoint URL. The WebSocket URL will be derived automatically.
            </p>

            <form onSubmit={handleSaveUrl} className="mt-4 flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  API Base URL
                </label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="http://127.0.0.1:8000/api"
                  className="w-full px-3 py-1.5 text-xs font-mono-code rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Default: http://127.0.0.1:8000/api</span>
                <button
                  type="button"
                  onClick={() => setUrlInput('http://127.0.0.1:8000/api')}
                  className="text-slate-700 hover:underline font-medium"
                >
                  Reset to Default
                </button>
              </div>

              {/* Endpoint Manifest Reference */}
              <div className="mt-2 p-2.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-mono-code flex flex-col gap-1 text-slate-600">
                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                  Configured Endpoints:
                </span>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-emerald-700 font-semibold">GET</span>
                  <span className="text-slate-600 truncate">/health</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-emerald-700 font-semibold">GET/POST</span>
                  <span className="text-slate-600 truncate">/api/clients</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-emerald-700 font-semibold">GET/POST</span>
                  <span className="text-slate-600 truncate">/api/rounds</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-emerald-700 font-semibold">GET</span>
                  <span className="text-slate-600 truncate">/api/incidents</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-amber-700 font-semibold">POST</span>
                  <span className="text-slate-600 truncate">/api/simulation/start</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-sky-700 font-semibold">WS</span>
                  <span className="text-slate-600 truncate">/ws/events</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUrlModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-900 text-white hover:bg-slate-800"
                >
                  Save &amp; Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
