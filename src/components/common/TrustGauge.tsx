import React from 'react';

interface TrustGaugeProps {
  score: number;
  showLabel?: boolean;
}

export const TrustGauge: React.FC<TrustGaugeProps> = ({ score, showLabel = true }) => {
  let colorClass = 'bg-emerald-500';
  let textClass = 'text-emerald-400';
  
  if (score <= 25) {
    colorClass = 'bg-rose-500';
    textClass = 'text-rose-400';
  } else if (score <= 50) {
    colorClass = 'bg-amber-500';
    textClass = 'text-amber-400';
  } else if (score <= 80) {
    colorClass = 'bg-cyan-500';
    textClass = 'text-cyan-400';
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
        <div 
          className={`h-full rounded-full ${colorClass} transition-all duration-500 ease-out`}
          style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-mono-code font-bold ${textClass} w-8 text-right`}>
          {score}%
        </span>
      )}
    </div>
  );
};
