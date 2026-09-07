import React from 'react';
import { AlertTriangle, Sparkles, Terminal, RotateCw, CheckCircle } from 'lucide-react';
import { useFedSentinel } from '../../context/FedSentinelContext';

export const ConnectionBanner: React.FC = () => {
  const {
    error,
    isMockModeActive,
    toggleMockMode,
    apiBaseUrl,
    refreshAllData,
    isRefreshing,
  } = useFedSentinel();

  // If there's an error and mock mode is not active, display clear connection issue banner
  if (error && !isMockModeActive) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                FastAPI Backend Unreachable
              </span>
              <p className="text-xs text-amber-800 mt-0.5">
                Could not connect to <code className="font-mono-code bg-amber-100 px-1 py-0.5 rounded font-semibold text-amber-900">{apiBaseUrl}</code>.
                Make sure your local service is active:
              </p>
              <div className="flex items-center gap-1.5 mt-1 font-mono-code text-[11px] bg-amber-100/70 border border-amber-300/60 px-2 py-1 rounded text-amber-900 w-fit">
                <Terminal className="w-3 h-3 text-amber-700" />
                <span>uvicorn main:app --reload --port 8000</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => refreshAllData()}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
              type="button"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Retry Connection</span>
            </button>
            <button
              onClick={() => toggleMockMode(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-700 text-white hover:bg-amber-800 transition-colors shadow-2xs"
              type="button"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Enable Preview Demo Mode</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If mock mode is explicitly turned on, show clear development mode banner
  if (isMockModeActive) {
    return (
      <div className="bg-slate-900 text-white px-4 py-2 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-bold font-mono-code text-[10px] uppercase">
              Preview Demo Mode Active
            </span>
            <span className="text-slate-300">
              Viewing development sample data. All actions (rounds, incidents, simulations) work locally for review.
            </span>
          </div>
          <button
            onClick={() => toggleMockMode(false)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors shrink-0"
            type="button"
          >
            <RotateCw className="w-3 h-3" />
            <span>Connect to Live Backend</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};
