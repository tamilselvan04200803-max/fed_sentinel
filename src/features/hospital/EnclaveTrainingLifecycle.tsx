import React from "react";
import {
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
} from "lucide-react";
import { TrainingJob, TrainingJobStage } from "@/src/types";

interface EnclaveTrainingLifecycleProps {
  isTraining: boolean;
  trainingStage?: string;
  result?: any;
  epochs: number;
}

const DEFAULT_STAGES = [
  { stage: "QUEUED", label: "Job Enqueued", desc: "Enclave allocated & sandbox secured" },
  { stage: "INITIALIZING", label: "Model Initialized", desc: "MedicalImageCNN base weights loaded" },
  { stage: "TRAINING", label: "PyTorch Training", desc: "Local SGD backpropagation" },
  { stage: "VALIDATING", label: "Local Validation", desc: "Confusion matrix & loss checked" },
  { stage: "SECURITY_SCAN", label: "Zero-Trust Pre-Gate", desc: "Norm bounds & free-rider check" },
  { stage: "COMPLETED", label: "Federation Transmit", desc: "Gradient encrypted & dispatched" },
];

export const EnclaveTrainingLifecycle: React.FC<EnclaveTrainingLifecycleProps> = ({
  isTraining,
  trainingStage,
  result,
  epochs,
}) => {
  if (!isTraining && !result) {
    return null;
  }

  // Determine stage progress
  const getStageStatus = (stageName: string, index: number) => {
    if (result) {
      if (stageName === "COMPLETED" && (result.quarantined || result.is_free_rider)) {
        return "WARNING";
      }
      return "COMPLETED";
    }

    if (!isTraining) return "PENDING";

    // Simulate/display active phase during in-progress training
    return "RUNNING";
  };

  const isFreeRider = result?.is_free_rider;
  const isQuarantined = result?.quarantined;

  return (
    <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {isTraining ? (
            <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
          ) : isFreeRider ? (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          ) : isQuarantined ? (
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          )}
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
            Enclave Training Execution & Verification Lifecycle
          </h3>
        </div>

        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
            isTraining
              ? "bg-cyan-950 text-cyan-300 border-cyan-700 animate-pulse"
              : isFreeRider
              ? "bg-amber-950 text-amber-300 border-amber-700"
              : isQuarantined
              ? "bg-rose-950 text-rose-300 border-rose-700"
              : "bg-emerald-950 text-emerald-300 border-emerald-700"
          }`}
        >
          {isTraining ? "ACTIVE EXECUTION" : isFreeRider ? "FREE-RIDER DETECTED" : isQuarantined ? "ISOLATED IN QUARANTINE" : "ACCEPTED BY GATEWAY"}
        </span>
      </div>

      {/* 6-Stage Progress Stepper */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {DEFAULT_STAGES.map((s, idx) => {
          const status = getStageStatus(s.stage, idx);
          const isCurrent = isTraining && idx === 2; // Active training phase
          return (
            <div
              key={s.stage}
              className={`p-2.5 rounded-lg border text-xs space-y-1 transition-all ${
                status === "COMPLETED"
                  ? "bg-slate-950/80 border-emerald-800/60 text-slate-200"
                  : status === "WARNING"
                  ? "bg-amber-950/20 border-amber-800/60 text-amber-200"
                  : isCurrent
                  ? "bg-cyan-950/30 border-cyan-500 text-cyan-200 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                  : "bg-slate-950/40 border-slate-800/60 text-slate-500"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span>STAGE {idx + 1}</span>
                {status === "COMPLETED" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : status === "WARNING" ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                ) : isCurrent ? (
                  <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
                ) : (
                  <Clock className="w-3 h-3 text-slate-600" />
                )}
              </div>
              <div className="font-bold text-[11px] truncate">{s.label}</div>
              <div className="text-[9px] text-slate-400 leading-tight truncate">{s.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Free-Rider Distinction Alert */}
      {isFreeRider && (
        <div className="p-4 rounded-xl border border-amber-500/50 bg-amber-950/20 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="uppercase tracking-wide font-mono">
              Free-Rider Update Detected &bull; Zero Aggregation Weight Assigned
            </span>
          </div>
          <p className="text-xs text-amber-100/90 leading-relaxed">
            The local node submitted a gradient delta with norm ratio{" "}
            <strong className="font-mono text-amber-300">
              &rho; = {result?.evidence_summary?.contribution_integrity?.norm_ratio?.toFixed(4) || "0.0010"}
            </strong>{" "}
            (&lt; 0.05 threshold relative to peer cohort median). While the update contains no malicious poison (Security Cleanliness{" "}
            <strong className="text-emerald-400 font-mono">95.0%</strong>), it contributes virtually zero utility.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-amber-800/40 font-mono text-[11px]">
            <div className="p-2 rounded bg-amber-950/40 border border-amber-900/60">
              <span className="text-amber-400/80 block text-[10px]">Contribution Integrity</span>
              <span className="text-amber-300 font-bold text-xs">
                {result?.trust_res?.contribution_integrity?.toFixed(1) || "15.0"}% (Penalized)
              </span>
            </div>
            <div className="p-2 rounded bg-amber-950/40 border border-amber-900/60">
              <span className="text-emerald-400/80 block text-[10px]">Security Cleanliness</span>
              <span className="text-emerald-300 font-bold text-xs">95.0% (Clean format)</span>
            </div>
            <div className="p-2 rounded bg-amber-950/40 border border-amber-900/60">
              <span className="text-slate-400 block text-[10px]">Aggregation Weight</span>
              <span className="text-rose-300 font-bold text-xs">w_i = 0.0000 (Excluded)</span>
            </div>
          </div>
        </div>
      )}

      {/* Loss History & Metrics if Result Available */}
      {result && (
        <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">Training Loss Progression</div>
            <div className="flex items-center gap-1.5 font-mono text-xs mt-1">
              {result.loss_progression?.map((l: number, i: number) => (
                <React.Fragment key={i}>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200">
                    Ep{i + 1}: {l.toFixed(3)}
                  </span>
                  {i < (result.loss_progression?.length || 0) - 1 && (
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-right shrink-0">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Update Norm ||&Delta;W||</div>
              <div className="font-mono text-cyan-300 font-bold text-xs">
                {result.update_norm?.toFixed(4) || "0.0012"}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">SHA-256 Digest</div>
              <div className="font-mono text-slate-300 text-[10px]" title={result.update_hash}>
                {result.update_hash ? `${result.update_hash.slice(0, 8)}...` : "—"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
