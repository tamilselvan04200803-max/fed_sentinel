import React, { useState } from 'react';
import {
  Flame,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  Microscope,
  X,
  ArrowRight,
  Shield,
  ShieldAlert,
  Sliders,
  Server,
  Zap,
} from 'lucide-react';
import { useFedSentinel } from '../../context/FedSentinelContext';
import { Incident } from '../../types';

export const SimulationModal: React.FC = () => {
  const {
    isSimulationModalOpen,
    setSimulationModalOpen,
    startSimulation,
    isSimulating,
    clients,
    navigateToInvestigation,
  } = useFedSentinel();

  // Configurable Attack Simulation Parameters
  const [targetClientId, setTargetClientId] = useState<string>('H3');
  const [attackType, setAttackType] = useState<string>('BACKDOOR');
  const [intensity, setIntensity] = useState<number>(0.75);
  const [defenseEnabled, setDefenseEnabled] = useState<boolean>(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedIncident, setCompletedIncident] = useState<Incident | null>(null);

  if (!isSimulationModalOpen) return null;

  // Selected client metadata
  const selectedClient = clients.find(
    (c) => c.client_id.toUpperCase() === targetClientId.toUpperCase()
  ) || clients[0];

  const handleRunSimulation = async () => {
    setErrorMsg(null);
    setCompletedIncident(null);
    try {
      const incident = await startSimulation({
        target_client_id: targetClientId,
        attack_type: attackType,
        intensity,
        defense_enabled: defenseEnabled,
      });
      setCompletedIncident(incident);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Simulation execution failed.');
    }
  };

  const handleClose = () => {
    setCompletedIncident(null);
    setErrorMsg(null);
    setSimulationModalOpen(false);
  };

  const handleInspect = () => {
    if (completedIncident) {
      navigateToInvestigation(completedIncident.incident_id);
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 text-slate-100 rounded-xl max-w-xl w-full shadow-2xl border border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Adversarial Attack Simulation Console
              </h3>
              <p className="text-xs text-slate-400">
                Configure adversary target node, attack vector, and evaluate Zero-Trust defenses.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSimulating}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-rose-950/50 border border-rose-700/50 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!completedIncident ? (
            <>
              {/* Configuration Controls */}
              <div className="flex flex-col gap-3.5">
                {/* 1. Target Hospital Node Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-cyan-400" />
                      Target Hospital Node (Compromised Client)
                    </span>
                    <span className="text-[11px] text-cyan-400 font-mono-code font-normal">
                      Current Trust: {selectedClient?.trust_score ?? 95}%
                    </span>
                  </label>
                  <select
                    value={targetClientId}
                    onChange={(e) => setTargetClientId(e.target.value)}
                    disabled={isSimulating}
                    className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono-code"
                  >
                    {clients.map((c) => (
                      <option key={c.client_id} value={c.client_id} className="bg-slate-900 text-white">
                        {c.client_id} &mdash; {c.name} (Status: {c.status}, Trust: {c.trust_score}%)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Attack Vector & Intensity Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-rose-400" />
                      Attack Vector
                    </label>
                    <select
                      value={attackType}
                      onChange={(e) => setAttackType(e.target.value)}
                      disabled={isSimulating}
                      className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-cyan-500 font-mono-code"
                    >
                      <option value="BACKDOOR" className="bg-slate-900">Backdoor Trigger Watermark</option>
                      <option value="MODEL_POISONING" className="bg-slate-900">Gradient Model Poisoning</option>
                      <option value="LABEL_POISONING" className="bg-slate-900">Diagnostic Label Poisoning</option>
                      <option value="ABNORMAL_MAGNITUDE" className="bg-slate-900">Extreme Magnitude Spike</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-amber-400" />
                        Intensity
                      </label>
                      <span className="text-[11px] font-mono-code text-amber-400 font-bold">
                        {Math.round(intensity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1.0"
                      step="0.05"
                      value={intensity}
                      onChange={(e) => setIntensity(parseFloat(e.target.value))}
                      disabled={isSimulating}
                      className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer mt-2"
                    />
                  </div>
                </div>

                {/* 3. Defense Gateway Mode Toggle */}
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {defenseEnabled ? (
                      <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Shield className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Zero-Trust Security Gateway
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {defenseEnabled
                          ? 'ARMED: Intercepts poisoned gradient, isolates node, assigns weight 0.0%'
                          : 'BYPASS: Lets poisoned update into aggregation to observe accuracy collapse'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDefenseEnabled(!defenseEnabled)}
                    disabled={isSimulating}
                    className={`px-3 py-1 text-xs font-bold font-mono-code rounded-md transition-colors ${
                      defenseEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    }`}
                  >
                    {defenseEnabled ? 'DEFENSE ON' : 'DEFENSE OFF'}
                  </button>
                </div>
              </div>

              {/* Threat Matrix Summary */}
              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                <span className="font-semibold text-slate-300 block mb-2">
                  Simulated Execution Blueprint:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-code">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">TARGET NODE</span>
                    <span className="font-bold text-cyan-400">
                      {targetClientId} ({selectedClient?.name || 'Hospital'})
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">VECTOR</span>
                    <span className="font-bold text-rose-400">{attackType}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">GATEWAY ACTION</span>
                    <span className={`font-bold ${defenseEnabled ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {defenseEnabled ? 'Auto-Quarantine & Segregate' : 'Pass-Through Unfiltered'}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">GLOBAL IMPACT</span>
                    <span className="font-bold text-slate-300">
                      {defenseEnabled ? 'Global Accuracy Protected' : 'Model Poisoning Injected'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSimulating}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition-colors shadow-lg shadow-rose-950/50"
                >
                  {isSimulating ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin text-rose-200" />
                      <span>Injecting Tensor &amp; Running L0-L5 Audit...</span>
                    </>
                  ) : (
                    <>
                      <Flame className="w-3.5 h-3.5 text-rose-200" />
                      <span>Launch Simulated Attack on {targetClientId}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Simulation Completed Result */
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-700/50 flex items-start gap-3 text-xs text-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-300 text-sm block mb-0.5">
                    Simulation Executed &bull; Threat Gated
                  </span>
                  <span className="text-emerald-200/90 leading-relaxed">
                    Zero-Trust security engine analyzed client{' '}
                    <strong className="font-mono-code text-white">{completedIncident.client_id}</strong>,
                    detected anomalous update behavior, and issued forensic incident ticket{' '}
                    <strong className="font-mono-code text-cyan-300">{completedIncident.incident_id}</strong>.
                  </span>
                </div>
              </div>

              {/* Incident Summary Card */}
              <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/70 flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-code font-bold text-white text-sm">
                      {completedIncident.incident_id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono-code ${
                      completedIncident.action_taken === 'QUARANTINED'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {completedIncident.action_taken}
                    </span>
                  </div>
                  <span className="text-cyan-400 font-mono-code text-xs font-semibold">
                    Target Node: {completedIncident.client_id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">THREAT HYPOTHESIS</span>
                    <span className="font-semibold text-white">{completedIncident.threat_hypothesis}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">DETECTION CONFIDENCE</span>
                    <span className="font-semibold text-emerald-400">{completedIncident.confidence}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">TRUST SCORE IMPACT</span>
                    <span className="font-mono-code font-bold text-rose-400">
                      {completedIncident.trust_before} &rarr; {completedIncident.trust_after} (-
                      {completedIncident.trust_before - completedIncident.trust_after})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">POST-UPDATE ASR</span>
                    <span className="font-mono-code font-bold text-amber-300">
                      {completedIncident.blast_radius?.post_update_asr ?? 86}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Close Console
                </button>
                <button
                  type="button"
                  onClick={handleInspect}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-950/50"
                >
                  <Microscope className="w-4 h-4 text-cyan-200" />
                  <span>Inspect in Investigation Lab</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-200" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
