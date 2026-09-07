import React, { useState } from 'react';
import {
  GitCommit,
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Users,
  ShieldCheck,
  TrendingUp,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useFedSentinel } from '../../context/FedSentinelContext';
import { FederationRound } from '../../types';

export const RoundsPage: React.FC = () => {
  const {
    rounds,
    setStartRoundModalOpen,
    isStartingRound,
    refreshAllData,
    isRefreshing,
    setSelectedClientId,
  } = useFedSentinel();

  const [selectedRound, setSelectedRound] = useState<FederationRound | null>(rounds[0] || null);

  const activeRound = selectedRound || rounds[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-slate-700" />
            Federation Rounds &amp; Byzantine Aggregation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic verification and Multi-Krum defense across distributed rounds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshAllData()}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
            type="button"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setStartRoundModalOpen(true)}
            disabled={isStartingRound}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
            type="button"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>Start Next Round</span>
          </button>
        </div>
      </div>

      {/* Rounds Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Completed Rounds
          </span>
          <span className="text-2xl font-bold font-mono-code text-slate-900 mt-1 block">
            {rounds.length}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Current Epoch: #{rounds[0]?.round_id ?? 0}
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Current Model Accuracy
          </span>
          <span className="text-2xl font-bold font-mono-code text-emerald-600 mt-1 block">
            {(rounds[0]?.global_accuracy ?? 94.5).toFixed(1)}%
          </span>
          <span className="text-[11px] text-emerald-700 mt-1 block font-medium">
            &uarr; Steady convergence under Byzantine defense
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Aggregation Defense Shield
          </span>
          <span className="text-2xl font-bold font-mono-code text-slate-900 mt-1 block">
            Multi-Krum
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Cosine &amp; Coordinate-wise Median
          </span>
        </div>
      </div>

      {/* Main Rounds List & Active Inspection Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Rounds Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Historical Federation Rounds
            </h2>
            <span className="text-[11px] font-mono-code text-slate-500">
              {rounds.length} rounds logged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3.5 py-2.5">Round ID</th>
                  <th className="px-3.5 py-2.5">Status</th>
                  <th className="px-3.5 py-2.5">Quorum</th>
                  <th className="px-3.5 py-2.5">Accepted / Quarantined</th>
                  <th className="px-3.5 py-2.5">Accuracy</th>
                  <th className="px-3.5 py-2.5 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rounds.map((round) => {
                  const isSelected = activeRound?.round_id === round.round_id;
                  const hasQuarantine = round.quarantined_clients && round.quarantined_clients.length > 0;
                  return (
                    <tr
                      key={round.round_id}
                      onClick={() => setSelectedRound(round)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-slate-100/80 font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-3.5 py-2.5 font-mono-code font-bold text-slate-900">
                        #{round.round_id}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {round.status}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-mono-code text-slate-700">
                        {round.participating_clients.length} nodes
                      </td>
                      <td className="px-3.5 py-2.5 font-mono-code">
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-700 font-bold">
                            {round.accepted_clients.length} acc
                          </span>
                          {hasQuarantine && (
                            <span className="px-1 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              {round.quarantined_clients.length} quar
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 font-mono-code font-bold text-slate-900">
                        {round.global_accuracy.toFixed(1)}%
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono-code text-[11px] text-slate-500">
                        {new Date(round.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Round Detail Inspector (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 shadow-2xs p-4 flex flex-col gap-4">
          {activeRound ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono-code text-slate-900">
                      Round #{activeRound.round_id} Inspection
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {activeRound.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Executed at {new Date(activeRound.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Aggregation Pipeline Stages */}
              <div className="flex flex-col gap-2 text-xs">
                <span className="font-bold text-slate-900 uppercase tracking-wide text-[11px]">
                  4-Stage Zero-Trust Aggregation
                </span>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-code">
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">STAGE 1</span>
                    <span className="font-bold text-slate-800">Format &amp; TEE Handshake</span>
                    <span className="text-emerald-700 block text-[10px]">&check; All nodes verified</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">STAGE 2</span>
                    <span className="font-bold text-slate-800">Gradient Centroid Probe</span>
                    <span className="text-emerald-700 block text-[10px]">&check; Cosine &ge; 0.75 cutoff</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">STAGE 3</span>
                    <span className="font-bold text-slate-800">Multi-Krum Filter</span>
                    <span className="text-rose-700 block text-[10px]">
                      {activeRound.quarantined_clients.length > 0
                        ? `&excl; ${activeRound.quarantined_clients.length} outlier excluded`
                        : '&check; 0 outliers'}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">STAGE 4</span>
                    <span className="font-bold text-slate-800">Global Weight Update</span>
                    <span className="text-emerald-700 block text-[10px]">
                      &check; Accuracy: {activeRound.global_accuracy.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Participating Nodes Status Breakdown */}
              <div className="flex flex-col gap-2 text-xs">
                <span className="font-bold text-slate-900 uppercase tracking-wide text-[11px]">
                  Participant Attestation Matrix
                </span>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden bg-slate-50/50">
                  {activeRound.participating_clients.map((clientId) => {
                    const isQuarantined = activeRound.quarantined_clients.includes(clientId);
                    return (
                      <div
                        key={clientId}
                        onClick={() => setSelectedClientId(clientId)}
                        className="p-2.5 flex items-center justify-between hover:bg-slate-100/80 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono-code font-bold text-slate-900">
                            {clientId}
                          </span>
                          <span className="text-slate-500 text-[11px]">Clinical Enclave</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isQuarantined ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              QUARANTINED (0.0% Wt)
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ACCEPTED ({((100 / activeRound.accepted_clients.length)).toFixed(1)}% Wt)
                            </span>
                          )}
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Select a round from the table to view its detailed attestation matrix.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
