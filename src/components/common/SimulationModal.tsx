import React, { useState } from 'react';
import { Flame, RotateCw, AlertTriangle, CheckCircle2, Microscope, X, ArrowRight } from 'lucide-react';
import { useFedSentinel } from '../../context/FedSentinelContext';
import { Incident } from '../../types';

export const SimulationModal: React.FC = () => {
  const {
    isSimulationModalOpen,
    setSimulationModalOpen,
    startSimulation,
    isSimulating,
    lastSimulationIncident,
    navigateToInvestigation,
  } = useFedSentinel();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedIncident, setCompletedIncident] = useState<Incident | null>(null);

  if (!isSimulationModalOpen) return null;

  const handleRunSimulation = async () => {
    setErrorMsg(null);
    setCompletedIncident(null);
    try {
      const incident = await startSimulation();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Run Backdoor Attack Simulation
              </h3>
              <p className="text-xs text-slate-500">
                Executes POST /api/simulation/start to benchmark Zero-Trust quarantine defense.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSimulating}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!completedIncident ? (
            <>
              <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Adversarial Simulation Pipeline Warning</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  This action will inject a malicious poisoned gradient update (label-flip watermark trigger) into client <strong>H3 (Hospital 3 - St. Jude Regional)</strong>. FedSentinel will route the tensor through Layer 0–5 detection and evaluate Multi-Krum / Bulyan isolation.
                </p>
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <span className="font-semibold text-slate-900">Simulated Threat Vector:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-code">
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block">Target Node</span>
                    <span className="font-bold text-slate-900">H3 (St. Jude)</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block">Attack Type</span>
                    <span className="font-bold text-rose-600">Backdoor Watermark</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block">Target Class</span>
                    <span className="font-bold text-slate-900">Class 7 (Malignant)</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block">Expected Action</span>
                    <span className="font-bold text-emerald-700">Immediate Quarantine</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSimulating}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs"
                >
                  {isSimulating ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Running Simulation &amp; Layer 0-5 Audit...</span>
                    </>
                  ) : (
                    <>
                      <Flame className="w-3.5 h-3.5 text-rose-200" />
                      <span>Confirm &amp; Run Simulation</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Simulation Completed Result */
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Simulation Complete &bull; Threat Neutralized</span>
                  <span className="text-emerald-800">
                    FedSentinel detected the backdoor payload and generated incident{' '}
                    <strong className="font-mono-code">{completedIncident.incident_id}</strong>.
                  </span>
                </div>
              </div>

              {/* Incident summary card */}
              <div className="p-3 rounded-md border border-slate-200 bg-slate-50 flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-code font-bold text-slate-900">
                      {completedIncident.incident_id}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono-code bg-rose-100 text-rose-700">
                      {completedIncident.action_taken}
                    </span>
                  </div>
                  <span className="text-slate-500 font-mono-code text-[11px]">
                    Client: {completedIncident.client_id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Threat Hypothesis</span>
                    <span className="font-semibold text-slate-900">{completedIncident.threat_hypothesis}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Confidence</span>
                    <span className="font-semibold text-emerald-700">{completedIncident.confidence}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Trust Impact</span>
                    <span className="font-mono-code font-bold text-rose-600">
                      {completedIncident.trust_before} &rarr; {completedIncident.trust_after} (-
                      {completedIncident.trust_before - completedIncident.trust_after})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Attack Success Rate (ASR)</span>
                    <span className="font-mono-code font-bold text-slate-900">
                      Baseline {completedIncident.blast_radius?.baseline_asr ?? 0}% &rarr; {completedIncident.blast_radius?.post_update_asr ?? 86}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleInspect}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
                >
                  <Microscope className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Inspect in Investigation Lab</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
