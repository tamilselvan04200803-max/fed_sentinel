import React, { useState } from 'react';
import { Play, RotateCw, AlertTriangle, Check, X, ShieldCheck } from 'lucide-react';
import { useFedSentinel } from '../../context/FedSentinelContext';

export const StartRoundModal: React.FC = () => {
  const {
    isStartRoundModalOpen,
    setStartRoundModalOpen,
    clients,
    rounds,
    startRound,
    isStartingRound,
  } = useFedSentinel();

  const currentRoundId = rounds[0]?.round_id ?? 24;
  const nextRoundId = currentRoundId + 1;

  // By default all non-blocked clients are selected
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>(() =>
    clients.filter((c) => c.status !== 'BLOCKED').map((c) => c.client_id)
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isStartRoundModalOpen) return null;

  const toggleClient = (clientId: string) => {
    setSelectedClientIds((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    setSelectedClientIds(clients.map((c) => c.client_id));
  };

  const handleSelectTrustedOnly = () => {
    setSelectedClientIds(clients.filter((c) => c.status === 'TRUSTED').map((c) => c.client_id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (selectedClientIds.length === 0) {
      setErrorMsg('At least one client must be selected for federation.');
      return;
    }

    try {
      await startRound(selectedClientIds);
      setStartRoundModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to start federation round.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-slate-900 flex items-center justify-center text-white">
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Confirm Federation Round {nextRoundId}
              </h3>
              <p className="text-xs text-slate-500">
                Initiate distributed gradient aggregation with zero-trust verification.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStartRoundModalOpen(false)}
            disabled={isStartingRound}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Round summary card */}
          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex flex-col">
              <span className="text-slate-500 font-medium">Target Round</span>
              <span className="text-sm font-bold text-slate-900 font-mono-code">Round #{nextRoundId}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-slate-500 font-medium">Target Quorum</span>
              <span className="text-sm font-bold text-slate-900 font-mono-code">
                {selectedClientIds.length} / {clients.length} Nodes
              </span>
            </div>
          </div>

          {/* Client Selection */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-900">
                Participating Enclaves ({selectedClientIds.length} selected)
              </label>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectTrustedOnly}
                  className="text-slate-600 hover:text-slate-900 underline"
                >
                  Trusted Only
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-slate-600 hover:text-slate-900 underline"
                >
                  Select All
                </button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-md divide-y divide-slate-100 bg-white">
              {clients.map((client) => {
                const isChecked = selectedClientIds.includes(client.client_id);
                const isQuarantined = client.status === 'QUARANTINED';
                const isBlocked = client.status === 'BLOCKED';
                return (
                  <label
                    key={client.client_id}
                    className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                      isBlocked ? 'opacity-60 bg-slate-50/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleClient(client.client_id)}
                        disabled={isStartingRound}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <span className="font-mono-code font-bold text-slate-900">
                        {client.client_id}
                      </span>
                      <span className="text-slate-600 truncate max-w-[200px]">
                        {client.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold ${
                          client.status === 'TRUSTED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : client.status === 'REVIEW'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {client.status}
                      </span>
                      <span className="text-[11px] font-mono-code text-slate-500">
                        {client.trust_score}%
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
            <span className="text-[11px] text-slate-500">
              Quarantined clients will undergo Layer 0-5 pre-aggregation gatekeeping.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStartRoundModalOpen(false)}
              disabled={isStartingRound}
              className="px-3.5 py-1.5 text-xs font-medium rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isStartingRound || selectedClientIds.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs"
            >
              {isStartingRound ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching Enclave Round...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                  <span>Start Round {nextRoundId}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
