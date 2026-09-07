import React from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useFedSentinel, ToastMessage } from '../../context/FedSentinelContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useFedSentinel();

  if (toasts.length === 0) return null;

  const getIcon = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />;
    }
  };

  const getBgClass = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return 'bg-slate-900 border-emerald-500/40 text-white';
      case 'error':
        return 'bg-slate-900 border-rose-500/40 text-white';
      case 'warning':
        return 'bg-slate-900 border-amber-500/40 text-white';
      case 'info':
      default:
        return 'bg-slate-900 border-sky-500/40 text-white';
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-3.5 rounded-lg border shadow-xl flex items-start justify-between gap-3 animate-slide-up backdrop-blur-md ${getBgClass(
            toast.type
          )}`}
        >
          <div className="flex items-start gap-2.5">
            {getIcon(toast.type)}
            <div className="flex flex-col">
              {toast.title && (
                <span className="text-xs font-bold font-mono-code tracking-wide">
                  {toast.title}
                </span>
              )}
              <span className="text-xs text-slate-200 mt-0.5 leading-snug">
                {toast.message}
              </span>
            </div>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-white p-0.5 rounded transition-colors shrink-0"
            type="button"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
