import React from 'react';

interface KPICardProps {
  title: string;
  icon: React.ReactNode;
  value: string | number;
  subValue?: React.ReactNode;
  subtitleLeft?: string;
  subtitleRight?: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  icon,
  value,
  subValue,
  subtitleLeft,
  subtitleRight,
  onClick,
  isActive
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-3.5 rounded-lg border shadow-2xs transition-all ${
        onClick ? 'cursor-pointer hover:border-brand-cyan hover:shadow-[0_0_10px_rgba(0,240,255,0.15)]' : ''
      } ${
        isActive 
          ? 'bg-slate-900 border-brand-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]' 
          : 'bg-slate-850 border-slate-700 hover:bg-slate-800'
      }`}
    >
      <div className="flex items-center justify-between text-slate-400">
        <span className="text-[11px] font-semibold uppercase tracking-wider">{title}</span>
        {icon}
      </div>
      <div className="mt-1.5 flex items-baseline justify-between">
        <span className="text-2xl font-bold font-mono-code text-slate-100">{value}</span>
        {subValue && <span className="text-[11px] font-mono-code text-slate-400">{subValue}</span>}
      </div>
      {(subtitleLeft || subtitleRight) && (
        <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-700/50 pt-2">
          <span>{subtitleLeft}</span>
          <span className="font-semibold">{subtitleRight}</span>
        </div>
      )}
    </div>
  );
};
