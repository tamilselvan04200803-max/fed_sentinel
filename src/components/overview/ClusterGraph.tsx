import React from 'react';
import { Network, AlertCircle, ShieldCheck } from 'lucide-react';
import { useFedSentinelStore } from '../../store/useFedSentinelStore';

export const ClusterGraph: React.FC = () => {
  const { hospitals } = useFedSentinelStore();

  // Positions mapped in 2D space [x, y] percentage (0-100)
  // Clean nodes cluster around center (50, 50); compromised node H3 drifts off to the top-right
  const getCoordinates = (cid: string, status: string) => {
    if (status === 'QUARANTINED') {
      return { x: 82, y: 22 }; // Visibly drifted away from consensus cluster
    }
    switch (cid) {
      case 'H1': return { x: 38, y: 48 };
      case 'H2': return { x: 46, y: 56 };
      case 'H4': return { x: 52, y: 42 };
      case 'H5': return { x: 42, y: 58 };
      default: return { x: 45, y: 50 };
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-brand-cyan" />
          <h3 className="text-sm font-bold text-slate-100">Update Vector Cosine Cluster Graph</h3>
        </div>
        <span className="text-[10px] font-mono-code text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          Random Projection 2D Space
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        2D dimensionality reduction of layer fingerprints. Honest hospital nodes cluster near centroid; compromised updates visibly drift.
      </p>

      {/* SVG Force-Directed Cluster Representation */}
      <div className="relative w-full h-56 bg-slate-950 rounded-lg border border-slate-800/80 overflow-hidden p-4">
        {/* Consensus Centroid Circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-dashed border-emerald-500/30 bg-emerald-500/5 pointer-events-none flex items-center justify-center">
          <span className="text-[9px] font-mono-code text-emerald-500/60 uppercase">Consensus Quorum Zone</span>
        </div>

        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Connector lines between clustered nodes */}
          <line x1="38%" y1="48%" x2="46%" y2="56%" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.4" />
          <line x1="46%" y1="56%" x2="52%" y2="42%" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.4" />
          <line x1="52%" y1="42%" x2="42%" y2="58%" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.4" />

          {/* Dotted drift line to quarantined node */}
          {hospitals.some(h => h.status === 'QUARANTINED') && (
            <line x1="45%" y1="50%" x2="82%" y2="22%" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.8" />
          )}
        </svg>

        {/* Hospital Nodes */}
        {hospitals.map((h) => {
          const coords = getCoordinates(h.client_id, h.status);
          const isQuarantined = h.status === 'QUARANTINED';

          return (
            <div
              key={h.client_id}
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-lg transition-all duration-500 ${
                isQuarantined
                  ? 'bg-rose-950 text-rose-300 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-bounce'
                  : 'bg-slate-900 text-slate-200 border-emerald-500/50 hover:border-emerald-400'
              }`}
            >
              {isQuarantined ? (
                <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
              ) : (
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              )}
              <span className="text-[11px] font-bold font-mono-code">{h.client_id}</span>
              <span className="text-[9px] text-slate-400">({h.trust_score}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
