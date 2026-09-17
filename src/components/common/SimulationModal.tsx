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
import { useFedSentinelStore } from '../../store/useFedSentinelStore';
import { Incident } from '../../types';

export const SimulationModal: React.FC = () => {
  const {
    isSimulationModalOpen,
    setSimulationModalOpen,
    isSimulating,
    setIsSimulating,
    hospitals,
    setActiveTab,
    setSelectedIncidentId,
    runDemoSequence,
  } = useFedSentinelStore();

  const [targetClientId, setTargetClientId] = useState<string>('H3');
  const [attackType, setAttackType] = useState<string>('BACKDOOR');
  const [intensity, setIntensity] = useState<number>(0.75);
  const [defenseEnabled, setDefenseEnabled] = useState<boolean>(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedIncident, setCompletedIncident] = useState<Incident | null>(null);

  if (!isSimulationModalOpen) return null;

  const selectedClient = hospitals.find(
    (c) => c.client_id.toUpperCase() === targetClientId.toUpperCase()
  ) || hospitals[0];

  const handleRunSimulation = async () => {
    setErrorMsg(null);
    setCompletedIncident(null);
    setIsSimulating(true);
    try {
      // In Demo Mode, trigger the orchestrated fixture sequence
      await runDemoSequence();
      
      // Simulate wait time for UI effect
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Since it's a demo mockup, we just grab the mock incident to show completion
      const { PHASE_2_ATTACK_INCIDENT } = await import('../../api/demoFixture');
      setCompletedIncident(PHASE_2_ATTACK_INCIDENT);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Simulation execution failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleClose = () => {
    setCompletedIncident(null);
    setErrorMsg(null);
    setSimulationModalOpen(false);
  };

  const handleInspect = () => {
    if (completedIncident) {
      setSelectedIncidentId(completedIncident.incident_id);
      setActiveTab('investigation');
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
      <div className="bg-slate-900 text-slate-100 rounded-xl max-w-xl w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Adversarial Attack Simulation
              </h3>
              <p className="text-xs text-slate-400">
                Configure adversary target node and test Zero-Trust defenses.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSimulating}
            className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3.5 rounded bg-rose-950/50 border border-rose-700/50 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!completedIncident ? (
            <>
              {/* Configuration Controls */}
              <div className="flex flex-col gap-4">
                {/* 1. Target Hospital Node Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-brand-cyan" />
                      Compromised Client Node
                    </span>
                  </label>
                  <select
                    value={targetClientId}
                    onChange={(e) => setTargetClientId(e.target.value)}
                    disabled={isSimulating}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-brand-cyan font-mono-code"
                  >
                    {hospitals.map((c) => (
                      <option key={c.client_id} value={c.client_id}>
                        {c.client_id} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-rose-400" />
                      Attack Vector
                    </label>
                    <select
                      value={attackType}
                      onChange={(e) => setAttackType(e.target.value)}
                      disabled={isSimulating}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-brand-cyan font-mono-code"
                    >
                      <option value="BACKDOOR">Backdoor Trigger</option>
                      <option value="MODEL_POISONING">Model Poisoning</option>
                      <option value="LABEL_POISONING">Label Poisoning</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
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
                      className="w-full accent-brand-cyan h-1.5 bg-slate-800 rounded cursor-pointer mt-2"
                    />
                  </div>
                </div>

                {/* 3. Defense Gateway Mode Toggle */}
                <div className="p-3 rounded bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {defenseEnabled ? (
                      <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Shield className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        Zero-Trust Security Gateway
                      </span>
                      <span className="text-[10px] text-slate-400 block max-w-[200px]">
                        {defenseEnabled
                          ? 'ARMED: Detects and isolates anomalous updates.'
                          : 'BYPASS: Permits anomalous updates (Poisoning risk).'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setDefenseEnabled(!defenseEnabled)}
                    disabled={isSimulating}
                    className={`px-3 py-1.5 text-[10px] font-bold font-mono-code rounded transition-colors ${
                      defenseEnabled
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                        : 'bg-amber-950 text-amber-400 border border-amber-900'
                    }`}
                  >
                    {defenseEnabled ? 'DEFENSE ON' : 'DEFENSE OFF'}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  onClick={handleClose}
                  disabled={isSimulating}
                  className="px-4 py-1.5 text-xs font-bold rounded border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded bg-rose-600 text-white hover:bg-rose-500 transition-colors shadow-[0_0_15px_rgba(225,29,72,0.3)]"
                >
                  {isSimulating ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin text-rose-200" />
                      <span>Running L0-L5 Audit...</span>
                    </>
                  ) : (
                    <>
                      <Flame className="w-3.5 h-3.5 text-rose-200" />
                      <span>Launch Attack</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Simulation Completed Result */
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="p-4 rounded bg-emerald-950/40 border border-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-400 text-sm block mb-1">
                    Simulation Executed &bull; Threat Gated
                  </span>
                  <span className="text-emerald-200/70 text-xs leading-relaxed">
                    Zero-Trust security engine analyzed client {completedIncident.client_id}, detected anomalous update behavior, and issued forensic ticket {completedIncident.incident_id}.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  onClick={handleClose}
                  className="px-4 py-1.5 text-xs font-bold rounded border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleInspect}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/50 hover:bg-brand-cyan/30 transition-colors"
                >
                  <Microscope className="w-3.5 h-3.5" />
                  <span>Inspect Evidence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
