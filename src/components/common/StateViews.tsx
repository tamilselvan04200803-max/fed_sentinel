import React from 'react';
import { AlertTriangle, Clock, XCircle, Database } from 'lucide-react';

interface StateViewProps {
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export const LoadingState: React.FC<StateViewProps> = ({ title, message }) => (
  <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px] w-full h-full">
    <div className="w-8 h-8 rounded-full border-2 border-brand-cyan border-t-transparent animate-spin mb-4" />
    <h3 className="text-sm font-bold text-slate-200">{title}</h3>
    {message && <p className="text-xs text-slate-400 mt-2 max-w-sm">{message}</p>}
  </div>
);

export const ErrorState: React.FC<StateViewProps> = ({ title, message, action }) => (
  <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px] w-full h-full bg-slate-900 border border-slate-800 rounded-lg">
    <XCircle className="w-8 h-8 text-rose-500 mb-4" />
    <h3 className="text-sm font-bold text-slate-200">{title}</h3>
    {message && <p className="text-xs text-slate-400 mt-2 max-w-sm font-mono-code">{message}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const EmptyState: React.FC<StateViewProps> = ({ title, message, action }) => (
  <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px] w-full h-full border border-dashed border-slate-700 rounded-lg bg-slate-850/50">
    <Database className="w-8 h-8 text-slate-500 mb-4" />
    <h3 className="text-sm font-bold text-slate-300">{title}</h3>
    {message && <p className="text-xs text-slate-500 mt-2 max-w-sm">{message}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const DisconnectedState: React.FC<StateViewProps> = ({ title, message, action }) => (
  <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px] w-full h-full bg-amber-950/20 border border-amber-900/50 rounded-lg">
    <AlertTriangle className="w-8 h-8 text-amber-500 mb-4" />
    <h3 className="text-sm font-bold text-slate-200">{title}</h3>
    {message && <p className="text-xs text-amber-500/70 mt-2 max-w-sm">{message}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
