import React, { useEffect, useState } from 'react';
import {
  Building2,
  X,
  Shield,
  AlertTriangle,
  History,
  TrendingDown,
  TrendingUp,
  FileText,
  Microscope,
  RotateCw,
} from 'lucide-react';
import { useFedSentinel } from '../../context/FedSentinelContext';
import { ClientTrustInfo } from '../../types';

export const ClientDetailModal: React.FC = () => {
  const {
    selectedClientId,
    setSelectedClientId,
    clients,
    incidents,
    getClientTrust,
    navigateToInvestigation,
  } = useFedSentinel();

  const [trustInfo, setTrustInfo] = useState<ClientTrustInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const client = clients.find((c) => c.client_id === selectedClientId);

  useEffect(() => {
    if (!selectedClientId) {
      setTrustInfo(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    getClientTrust(selectedClientId).then((res) => {
      if (isMounted) {
        setTrustInfo(res);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedClientId, getClientTrust]);

  if (!selectedClientId || !client) return null;

  const relatedIncidents = incidents.filter((i) => i.client_id === selectedClientId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'TRUSTED':
        return <span className="px-2 py-0.5 rounded text-xs font-mono-code font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">TRUSTED</span>;
      case 'REVIEW':
        return <span className="px-2 py-0.5 rounded text-xs font-mono-code font-bold bg-amber-50 text-amber-700 border border-amber-200">UNDER REVIEW</span>;
      case 'QUARANTINED':
        return <span className="px-2 py-0.5 rounded text-xs font-mono-code font-bold bg-rose-50 text-rose-700 border border-rose-200">QUARANTINED</span>;
      case 'BLOCKED':
        return <span className="px-2 py-0.5 rounded text-xs font-mono-code font-bold bg-red-950 text-rose-200 border border-rose-900">BLOCKED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-mono-code font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-lg max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-code font-bold text-sm text-slate-900">
                  {client.client_id}
                </span>
                {getStatusBadge(client.status)}
              </div>
              <h3 className="text-sm font-semibold text-slate-800 mt-0.5">
                {client.name}
              </h3>
            </div>
          </div>
          <button
            onClick={() => setSelectedClientId(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex flex-col gap-5">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block">
                Trust Score
              </span>
              <span className="text-lg font-bold font-mono-code text-slate-900 mt-0.5 block">
                {client.trust_score}%
              </span>
            </div>
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block">
                Samples Count
              </span>
              <span className="text-lg font-bold font-mono-code text-slate-900 mt-0.5 block">
                {client.samples_count.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block">
                Anomalies Logged
              </span>
              <span className={`text-lg font-bold font-mono-code mt-0.5 block ${
                client.historical_anomalies > 0 ? 'text-rose-600' : 'text-slate-900'
              }`}>
                {client.historical_anomalies}
              </span>
            </div>
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block">
                Last Active
              </span>
              <span className="text-lg font-bold font-mono-code text-slate-900 mt-0.5 block">
                Round #{client.last_active_round}
              </span>
            </div>
          </div>

          {/* Trust Engine Robustness Factors */}
          {trustInfo?.factors && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Trust Engine Robustness Factors
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {Object.entries(trustInfo.factors).map(([key, val]) => {
                  const label = key.replace(/_/g, ' ');
                  const pct = Math.round((val as number) * 100);
                  return (
                    <div key={key} className="p-2.5 rounded-md border border-slate-200 bg-white">
                      <span className="text-[10px] text-slate-500 capitalize block truncate">
                        {label}
                      </span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-mono-code font-bold text-slate-900">{pct}%</span>
                        <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct > 75 ? 'bg-emerald-500' : pct > 45 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trust History Timeline */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-500" />
              Trust Score History &amp; Decisions
            </span>

            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Loading trust ledger...</span>
              </div>
            ) : trustInfo?.trust_history && trustInfo.trust_history.length > 0 ? (
              <div className="border border-slate-200 rounded-md overflow-hidden divide-y divide-slate-100 text-xs">
                {trustInfo.trust_history.map((h, i) => (
                  <div key={i} className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <span className="font-mono-code font-bold text-slate-700 w-16">
                        Round #{h.round_id}
                      </span>
                      <span className="text-slate-600">{h.reason}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-0.5 font-mono-code font-bold ${
                          h.delta < 0
                            ? 'text-rose-600'
                            : h.delta > 0
                            ? 'text-emerald-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {h.delta < 0 ? <TrendingDown className="w-3 h-3" /> : h.delta > 0 ? <TrendingUp className="w-3 h-3" /> : null}
                        {h.delta > 0 ? `+${h.delta}` : h.delta}
                      </span>
                      <span className="font-mono-code font-bold text-slate-900 w-12 text-right">
                        {h.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-md border border-slate-200 bg-slate-50 text-xs text-slate-500 text-center">
                No historical trust modifications recorded for this node.
              </div>
            )}
          </div>

          {/* Related Incidents */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              Related Security Incidents ({relatedIncidents.length})
            </span>

            {relatedIncidents.length > 0 ? (
              <div className="flex flex-col gap-2">
                {relatedIncidents.map((inc) => (
                  <div
                    key={inc.incident_id}
                    className="p-3 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-code font-bold text-slate-900">
                          {inc.incident_id}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold bg-rose-100 text-rose-700">
                          {inc.action_taken}
                        </span>
                        <span className="text-slate-500 font-mono-code">
                          Round #{inc.round_id}
                        </span>
                      </div>
                      <span className="text-slate-700">
                        Threat: <strong>{inc.threat_hypothesis}</strong> ({inc.confidence} Confidence)
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        navigateToInvestigation(inc.incident_id);
                        setSelectedClientId(null);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs"
                      type="button"
                    >
                      <Microscope className="w-3 h-3 text-emerald-400" />
                      <span>Investigate</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-md border border-slate-200 bg-slate-50 text-xs text-slate-500 text-center">
                Clean audit record &bull; Zero security incident tickets on file.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end bg-slate-50">
          <button
            onClick={() => setSelectedClientId(null)}
            className="px-4 py-1.5 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 hover:bg-white transition-colors"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
