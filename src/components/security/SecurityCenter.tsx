import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Activity,
  Fingerprint,
  Cpu,
  Layers,
  UserCheck,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { useFedSentinelStore } from '../../store/useFedSentinelStore';

export const SecurityCenter: React.FC = () => {
  const { hospitals, incidents, settings, addToast } = useFedSentinelStore();

  const [selectedLayerId, setSelectedLayerId] = useState<'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5'>('L2');
  const [anomalyThreshold, setAnomalyThreshold] = useState<number>(0.45);
  const [defenseMode, setDefenseMode] = useState<'ARMED' | 'BYPASS'>('ARMED');

  const pipelineStages = [
    {
      id: 'L0' as const,
      name: 'Layer 0: Format & Validation',
      shortName: 'Validation',
      icon: ShieldCheck,
      desc: 'IEEE-754 / Tensor Syntax & NaN Checks',
      algo: 'Clipped Gradient Norm & IEEE 754 Float Checker',
      thresholdStr: 'L2 Norm <= 50.0, zero NaN/Inf',
    },
    {
      id: 'L1' as const,
      name: 'Layer 1: Privacy Fingerprinting',
      shortName: 'Fingerprint',
      icon: Fingerprint,
      desc: '16D Johnson-Lindenstrauss Projection',
      algo: 'Random Subspace Projection + SHA-256 Digest',
      thresholdStr: 'Pairwise epsilon-isometric embedding',
    },
    {
      id: 'L2' as const,
      name: 'Layer 2: Spectral Anomaly Engine',
      shortName: 'Anomaly Engine',
      icon: Activity,
      desc: 'Median Perturbation & Directional Divergence',
      algo: 'Spectral Decomposition & Cosine Drift Detector',
      thresholdStr: `Cosine distance <= ${anomalyThreshold.toFixed(2)}`,
    },
    {
      id: 'L3' as const,
      name: 'Layer 3: LOO Influence Testing',
      shortName: 'Influence',
      icon: Layers,
      desc: 'Counterfactual Loss Delta Evaluation',
      algo: 'Leave-One-Out (LOO) Root Loss Probe',
      thresholdStr: 'Delta Loss <= +0.05 on server validation set',
    },
    {
      id: 'L4' as const,
      name: 'Layer 4: Adversarial Perturbation',
      shortName: 'Robustness',
      icon: Cpu,
      desc: 'Backdoor Watermark & Trigger Reconstruction',
      algo: 'Adversarial Noise Perturbation & Class Flip Rate',
      thresholdStr: 'Poison probability <= 40%',
    },
    {
      id: 'L5' as const,
      name: 'Layer 5: Hardware Attribution',
      shortName: 'Attribution',
      icon: UserCheck,
      desc: 'TPM PCR Enclave Signature Verification',
      algo: 'Historical Cosine Pattern + PCR Quote Match',
      thresholdStr: 'Fingerprint match >= 85%, DP epsilon <= 2.0',
    },
  ];

  const currentStage = pipelineStages.find(s => s.id === selectedLayerId) || pipelineStages[2];

  const handleToggleDefense = async () => {
    const newMode = defenseMode === 'ARMED' ? 'BYPASS' : 'ARMED';
    setDefenseMode(newMode);

    try {
      await fetch(`${settings.apiBaseUrl}/defense/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: newMode === 'ARMED',
          strategy: 'trust_weighted',
        }),
      });

      addToast({
        type: newMode === 'ARMED' ? 'success' : 'warning',
        title: `Defense Gateway: ${newMode}`,
        message: newMode === 'ARMED' ? 'Zero-Trust 6-layer gating is ARMED.' : 'Defense in BYPASS mode. All updates will pass directly.',
      });
    } catch (e) {
      addToast({ type: 'info', title: `Defense Mode: ${newMode} (Local)`, message: 'Updated defense state.' });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 border border-brand-cyan/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-brand-cyan" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100">
                Zero-Trust Multi-Layer Security Architecture
              </h1>
              <span className={`text-[10px] font-mono-code px-2 py-0.5 rounded font-bold border ${
                defenseMode === 'ARMED'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-rose-950 text-rose-400 border-rose-800'
              }`}>
                GATEWAY: {defenseMode}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive 6-layer security gateway pipeline. Inspect layer-by-layer pass/fail rosters and tune detection thresholds.
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleDefense}
          className={`px-4 py-2 rounded-lg font-bold text-xs font-mono-code transition-all shadow-lg ${
            defenseMode === 'ARMED'
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)]'
          }`}
        >
          {defenseMode === 'ARMED' ? '🛡️ Defense Status: ARMED' : '⚠️ Defense Status: BYPASS'}
        </button>
      </div>

      {/* 6-Layer Animated Pipeline Interactive Visualizer */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 font-mono-code">
          Select Layer to Inspect Real-Time Verification Telemetry:
        </h3>

        <div className="py-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center min-w-max px-2">
            {pipelineStages.map((stage, idx) => {
              const isSelected = selectedLayerId === stage.id;

              return (
                <React.Fragment key={stage.id}>
                  <div
                    onClick={() => setSelectedLayerId(stage.id)}
                    className="flex flex-col items-center gap-2.5 cursor-pointer group"
                  >
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-brand-cyan text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.4)] scale-110'
                          : 'bg-slate-950 border border-slate-800 text-brand-cyan hover:border-brand-cyan/50 hover:bg-slate-900'
                      }`}
                    >
                      <stage.icon className="w-6 h-6" />
                    </div>

                    <div className="text-center">
                      <span className={`text-xs font-bold font-mono-code block ${isSelected ? 'text-brand-cyan' : 'text-slate-200'}`}>
                        {stage.id}
                      </span>
                      <span className="text-[10px] text-slate-400 max-w-[100px] truncate block">
                        {stage.shortName}
                      </span>
                    </div>
                  </div>

                  {idx < pipelineStages.length - 1 && (
                    <div className="flex items-center px-3 text-slate-700">
                      <div className="w-8 border-t-2 border-dashed border-slate-700" />
                      <ArrowRight className="w-4 h-4 -ml-1 text-slate-600" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Layer Inspection & Thresholds (Left 6 cols) + Cohort Node Status (Right 6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Layer Technical Blueprint */}
        <div className="lg:col-span-6 glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <currentStage.icon className="w-5 h-5 text-brand-cyan" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">{currentStage.name}</h3>
                <span className="text-[10px] font-mono-code text-brand-cyan">{currentStage.algo}</span>
              </div>
            </div>
            <span className="text-xs font-bold font-mono-code px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              ACTIVE
            </span>
          </div>

          <div className="space-y-3 font-mono-code text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-slate-500 text-[10px] uppercase block">Security Operational Role:</span>
              <p className="text-slate-200 font-sans">{currentStage.desc}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-slate-500 text-[10px] uppercase block">Verification Rule &amp; Mathematical Threshold:</span>
              <div className="text-emerald-400 font-bold">{currentStage.thresholdStr}</div>
            </div>

            {selectedLayerId === 'L2' && (
              <div className="p-3.5 rounded-lg bg-cyan-950/20 border border-brand-cyan/30 space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-brand-cyan font-bold">L2 Anomaly Threshold Slider:</span>
                  <span className="text-slate-100 font-bold">{anomalyThreshold.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.20}
                  max={0.80}
                  step={0.05}
                  value={anomalyThreshold}
                  onChange={(e) => setAnomalyThreshold(parseFloat(e.target.value))}
                  className="w-full accent-brand-cyan bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 font-sans">
                  Lower values increase sensitivity against subtle backdoors; higher values tolerate natural clinical heterogeneity.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Hospital Cohort Layer Pass/Fail Status */}
        <div className="lg:col-span-6 glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-cyan" />
              Connected Hospital Nodes Roster — {selectedLayerId} Verdict
            </h3>
            <span className="text-[10px] font-mono-code text-slate-400">
              Round #24 Telemetry
            </span>
          </div>

          <div className="space-y-2 font-mono-code text-xs">
            {hospitals.map(h => {
              const isQ = h.status === 'QUARANTINED';
              const isBlocked = h.status === 'BLOCKED';
              const isFailed = (selectedLayerId === 'L2' || selectedLayerId === 'L4') && (isQ || isBlocked);

              return (
                <div
                  key={h.client_id}
                  className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                    isFailed
                      ? 'bg-rose-950/20 border-rose-800/60'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-slate-200 text-xs">
                      {h.client_id}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200">{h.name}</div>
                      <span className="text-[10px] text-slate-500 font-sans">{h.enclave_type}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                    isFailed
                      ? 'bg-rose-950 text-rose-400 border-rose-800'
                      : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  }`}>
                    {isFailed ? 'FAILED 🔴' : 'PASSED ✅'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
