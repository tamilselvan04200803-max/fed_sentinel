import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

export type StatusType = 'TRUSTED' | 'REVIEW' | 'QUARANTINED' | 'BLOCKED' | 'PENDING' | 'COMPLETED' | 'FAILED' | 'IN_PROGRESS';

interface StatusBadgeProps {
  status: StatusType | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let config = {
    color: 'text-slate-400',
    bg: 'bg-slate-800',
    border: 'border-slate-700',
    icon: <Clock className="w-3 h-3" />,
    label: status
  };

  const s = status.toUpperCase();

  if (s === 'TRUSTED' || s === 'COMPLETED' || s === 'PASS') {
    config = {
      color: 'text-emerald-400',
      bg: 'bg-emerald-950',
      border: 'border-emerald-800',
      icon: <CheckCircle2 className="w-3 h-3" />,
      label: s === 'TRUSTED' ? 'Trusted' : s === 'COMPLETED' ? 'Completed' : 'Pass'
    };
  } else if (s === 'REVIEW' || s === 'PENDING' || s === 'IN_PROGRESS') {
    config = {
      color: 'text-amber-400',
      bg: 'bg-amber-950',
      border: 'border-amber-800',
      icon: <Clock className="w-3 h-3" />,
      label: s === 'REVIEW' ? 'Review' : s === 'PENDING' ? 'Pending' : 'In Progress'
    };
  } else if (s === 'QUARANTINED' || s === 'FAILED' || s === 'FAIL') {
    config = {
      color: 'text-rose-400',
      bg: 'bg-rose-950',
      border: 'border-rose-800',
      icon: <AlertTriangle className="w-3 h-3" />,
      label: s === 'QUARANTINED' ? 'Quarantined' : s === 'FAILED' ? 'Failed' : 'Fail'
    };
  } else if (s === 'BLOCKED') {
    config = {
      color: 'text-slate-300',
      bg: 'bg-slate-900',
      border: 'border-slate-600',
      icon: <XCircle className="w-3 h-3" />,
      label: 'Blocked'
    };
  }

  const px = size === 'sm' ? 'px-1.5' : 'px-2.5';
  const py = size === 'sm' ? 'py-0.5' : 'py-1';
  const text = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 ${px} ${py} rounded ${text} font-mono-code font-bold uppercase ${config.bg} ${config.color} border ${config.border}`}>
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
