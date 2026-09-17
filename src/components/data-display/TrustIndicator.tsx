import React from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface TrustIndicatorProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showExplanation?: boolean;
  factors?: {
    anomaly_resistance?: number;
    influence_safety?: number;
    counterfactual_stability?: number;
    consistency?: number;
  };
  policyVersion?: string;
  className?: string;
}

export const TrustIndicator: React.FC<TrustIndicatorProps> = ({
  score,
  size = "md",
  showLabel = true,
  showExplanation = false,
  factors,
  policyVersion = "v2.1-ByzantineResilient",
  className,
}) => {
  const rounded = Math.max(0, Math.min(100, Math.round(score)));

  let color = "emerald";
  let label = "TRUSTED";
  let Icon = ShieldCheck;
  let textClass = "text-emerald-400";
  let bgClass = "bg-emerald-500/15 border-emerald-500/30";

  if (rounded < 60) {
    color = "rose";
    label = "QUARANTINED";
    Icon = ShieldAlert;
    textClass = "text-rose-400";
    bgClass = "bg-rose-500/15 border-rose-500/30";
  } else if (rounded < 80) {
    color = "amber";
    label = "SUPERVISED_REVIEW";
    Icon = AlertTriangle;
    textClass = "text-amber-400";
    bgClass = "bg-amber-500/15 border-amber-500/30";
  }

  const dimensionClasses = {
    sm: "w-10 h-10 text-xs",
    md: "w-16 h-16 text-base",
    lg: "w-24 h-24 text-2xl",
  };

  return (
    <div className={cn("inline-flex flex-col items-center gap-1.5", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full border-2 font-mono font-bold shadow-inner transition-colors",
          dimensionClasses[size],
          bgClass,
          textClass
        )}
      >
        <span>{rounded}</span>
      </div>

      {showLabel && (
        <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider">
          <Icon className={cn("w-3.5 h-3.5", textClass)} />
          <span className={textClass}>{label}</span>
        </div>
      )}

      {showExplanation && (
        <div className="mt-2 w-full max-w-xs rounded-md border border-slate-800 bg-slate-900/90 p-3 text-xs text-slate-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-slate-400">
            <span>Trust Policy</span>
            <span className="font-mono text-slate-200">{policyVersion}</span>
          </div>

          <div className="mt-2 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Quarantine Threshold:</span>
              <span className="font-mono text-rose-400">&lt; 60 pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Observation Threshold:</span>
              <span className="font-mono text-amber-400">60 - 79 pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Full Aggregation:</span>
              <span className="font-mono text-emerald-400">&ge; 80 pts</span>
            </div>
          </div>

          {factors && (
            <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Signal Decomposition</div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Anomaly Resistance:</span>
                <span className="font-mono text-slate-200">{((factors.anomaly_resistance ?? 0.95) * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Influence Safety:</span>
                <span className="font-mono text-slate-200">{((factors.influence_safety ?? 0.95) * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Counterfactual Stability:</span>
                <span className="font-mono text-slate-200">{((factors.counterfactual_stability ?? 0.95) * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
