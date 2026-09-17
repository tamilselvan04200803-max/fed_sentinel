import React, { useState } from 'react';
import { ShieldAlert, Play, Settings, XCircle, CheckCircle2, Clock, Sparkles, PlusCircle, ShieldCheck, FileText } from 'lucide-react';
import { useFedSentinelStore } from '../../store/useFedSentinelStore';
import { SystemTruthPanel } from './SystemTruthPanel';
import { ModelCardModal } from '../model/ModelCardModal';

export const Header: React.FC = () => {
  const { systemStatus, settings, updateSettings, isDemoMode, toggleDemoMode, federationRounds, isSimulating, activePersona, setActivePersona } = useFedSentinelStore();
  
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState(settings.apiBaseUrl);
  const [isTruthPanelOpen, setIsTruthPanelOpen] = useState(false);
  const [isModelCardOpen, setIsModelCardOpen] = useState(false);

  const currentRound = federationRounds[0]?.round_id ?? 0;

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      updateSettings({ apiBaseUrl: urlInput.trim() });
      setIsUrlModalOpen(false);
    }
  };

  const getWsStatusBadge = () => {
    switch (systemStatus.wsStatus) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium font-mono-code bg-emerald-950 text-emerald-400 border border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            WS: Live
          </span>
        );
      case 'connecting':
      case 'reconnecting':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium font-mono-code bg-amber-950 text-amber-400 border border-amber-800">
            <Clock className="w-3 h-3 animate-spin text-amber-500" />
            WS: Wait
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium font-mono-code bg-slate-900 text-slate-500 border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            WS: Offline
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Brand & Persona Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-slate-900 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan shadow-[0_0_10px_rgba(0,240,255,0.1)]">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-100 tracking-tight text-sm">FedSentinel-Health</span>
              </div>
            </div>

            {/* PERSONA SWITCHER */}
            <div className="flex items-center p-1 bg-slate-900 rounded-lg border border-slate-800 font-mono-code text-xs">
              <button
                onClick={() => setActivePersona('SOC')}
                className={`px-3 py-1 rounded font-bold transition-all ${
                  activePersona === 'SOC'
                    ? 'bg-brand-cyan text-slate-950 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🛡️ SOC Analyst View
              </button>
              <button
                onClick={() => setActivePersona('HOSPITAL')}
                className={`px-3 py-1 rounded font-bold transition-all ${
                  activePersona === 'HOSPITAL'
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🏥 Hospital Workstation
              </button>
            </div>
          </div>

          {/* Center Connection Status Pills & Technical Honesty Trigger */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => setIsTruthPanelOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono-code font-bold bg-cyan-950/60 hover:bg-cyan-900/60 text-brand-cyan border border-cyan-800/80 shadow-[0_0_10px_rgba(0,240,255,0.15)] transition-all"
              title="Inspect System Truth & Technical Honesty Disclosure"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>System Truth</span>
            </button>

            <button
              onClick={() => setIsModelCardOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono-code bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
              title="Inspect Clinical Model Card"
            >
              <FileText className="w-3 h-3 text-emerald-400" />
              <span>Model Card</span>
            </button>

            <button
              onClick={() => {
                setUrlInput(settings.apiBaseUrl);
                setIsUrlModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono-code bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
              title="Configure API URL"
            >
              {systemStatus.apiStatus === 'offline' && !isDemoMode ? (
                <XCircle className="w-3 h-3 text-rose-500" />
              ) : (
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              )}
              <span className="truncate max-w-[120px]">{settings.apiBaseUrl}</span>
            </button>

            {getWsStatusBadge()}

            {/* DEMO MODE TOGGLE */}
            <button
              onClick={toggleDemoMode}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono-code font-bold border transition-colors ${
                isDemoMode
                  ? 'bg-amber-950/50 text-amber-400 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-900 text-slate-500 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>DEMO: {isDemoMode ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTruthPanelOpen(true)}
              className="text-slate-400 hover:text-brand-cyan transition-colors"
              title="System Settings & Truth"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* System Truth Modal */}
      <SystemTruthPanel isOpen={isTruthPanelOpen} onClose={() => setIsTruthPanelOpen(false)} />

      {/* Model Card Modal */}
      <ModelCardModal isOpen={isModelCardOpen} onClose={() => setIsModelCardOpen(false)} />

      {/* URL Config Modal */}
      {isUrlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-lg p-5 max-w-md w-full border border-slate-700 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-brand-cyan" />
              Backend Configuration
            </h3>
            <form onSubmit={handleSaveUrl} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-mono-code text-slate-400 mb-1.5">API Base URL</label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 font-mono-code focus:outline-none focus:border-brand-cyan"
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setIsUrlModalOpen(false)} className="px-3 py-1.5 rounded text-xs font-semibold text-slate-400 hover:text-slate-200">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 rounded bg-brand-cyan text-slate-950 font-bold text-xs hover:bg-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
