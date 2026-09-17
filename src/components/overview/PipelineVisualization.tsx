import React from 'react';
import { ShieldCheck, Fingerprint, Activity, Cpu, Lock, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { useFedSentinelStore } from '../../store/useFedSentinelStore';

interface LayerDef {
  id: string;
  name: string;
  code: string;
  icon: React.FC<{ className?: string }>;
  description: string;
}

const LAYERS: LayerDef[] = [
  { id: 'L0', name: 'Validation', code: 'L0-VALIDATE', icon: ShieldCheck, description: 'Format, NaN/Inf & gradient norm clipping' },
  { id: 'L1', name: 'Fingerprint', code: 'L1-SKETCH', icon: Fingerprint, description: 'Random JL Gaussian projection down to 16D' },
  { id: 'L2', name: 'Anomaly', code: 'L2-COSINE', icon: Activity, description: 'Cosine divergence vs. Root-of-Trust reference' },
  { id: 'L3', name: 'Influence', code: 'L3-COUNTER', icon: Cpu, description: 'Leave-One-Out validation accuracy delta' },
  { id: 'L4', name: 'Robustness', code: 'L4-PERTURB', icon: Lock, description: 'Input perturbation prediction flip rate' },
  { id: 'L5', name: 'Attribution', code: 'L5-EMA-TRUST', icon: CheckCircle2, description: 'Exponential moving average historical trust' },
];

export const PipelineVisualization: React.FC = () => {
  const { events, hospitals } = useFedSentinelStore();

  // Find latest incident or client evaluation
  const latestEvent = events.find(e => e.event_type.includes('ANOMALY') || e.event_type.includes('QUARANTINED') || e.event_type.includes('ROUND')) || events[0];
  const targetHospitalId = latestEvent?.client_id || 'H3';
  const targetHospital = hospitals.find(h => h.client_id === targetHospitalId) || hospitals[0];
  const isQuarantined = targetHospital?.status === 'QUARANTINED';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Zero-Trust Security Pipeline Live Visualizer
              <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30">
                ACTIVE PIPELINE
              </span>
            </h3>
            <p className="text-xs text-slate-400">Inspecting client model update vectors through 6 verification layers</p>
          </div>
        </div>

        {targetHospital && (
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-xs font-mono-code text-slate-400">Evaluating Node:</span>
            <span className="text-xs font-bold text-slate-200">{targetHospital.client_id} ({targetHospital.name.split('-')[0]})</span>
            <span className={`w-2 h-2 rounded-full ${isQuarantined ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
          </div>
        )}
      </div>

      {/* 6-Layer Pipeline Flow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        {LAYERS.map((layer, idx) => {
          const Icon = layer.icon;
          let statusColor = 'border-slate-800 bg-slate-950/60 text-slate-400';
          let badgeColor = 'bg-slate-800 text-slate-400';
          let statusText = 'VERIFIED';

          if (isQuarantined && idx >= 2) {
            statusColor = 'border-rose-800/80 bg-rose-950/20 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.15)]';
            badgeColor = 'bg-rose-950 text-rose-400 border border-rose-800';
            statusText = idx === 2 ? 'ANOMALY DETECTED' : idx === 3 ? 'HIGH RISK' : 'FAIL';
          } else {
            statusColor = 'border-emerald-800/60 bg-emerald-950/10 text-emerald-300';
            badgeColor = 'bg-emerald-950 text-emerald-400 border border-emerald-800';
          }

          return (
            <div key={layer.id} className={`p-3.5 rounded-lg border flex flex-col justify-between transition-all duration-300 ${statusColor}`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono-code font-bold tracking-wider text-slate-400">{layer.code}</span>
                  <span className={`text-[9px] font-bold font-mono-code px-1.5 py-0.5 rounded ${badgeColor}`}>
                    {statusText}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="w-4 h-4 shrink-0 text-brand-cyan" />
                  <span className="text-xs font-bold text-slate-100">{layer.name}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{layer.description}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/50 flex items-center justify-between text-[10px] font-mono-code">
                <span className="text-slate-500">Layer {idx}</span>
                {idx < 5 && <ArrowRight className="w-3 h-3 text-slate-600 hidden lg:block" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
