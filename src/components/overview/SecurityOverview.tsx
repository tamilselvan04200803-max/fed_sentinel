import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Building2,
  GitCommit,
  Flame,
  Percent,
  Radio,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Microscope,
  CheckCircle2,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useFedSentinel } from '../../context/FedSentinelContext';

export const SecurityOverview: React.FC = () => {
  const {
    clients,
    rounds,
    incidents,
    events,
    connectionStatus,
    isLoading,
    error,
    isMockModeActive,
    navigateToInvestigation,
    setSelectedClientId,
    setActiveTab,
  } = useFedSentinel();

  const [filterEventType, setFilterEventType] = useState<string>('ALL');

  // Computed Metrics
  const totalClients = clients.length;
  const trustedCount = clients.filter((c) => c.status === 'TRUSTED').length;
  const reviewCount = clients.filter((c) => c.status === 'REVIEW').length;
  const quarantinedCount = clients.filter((c) => c.status === 'QUARANTINED').length;
  const blockedCount = clients.filter((c) => c.status === 'BLOCKED').length;

  const currentRound = rounds[0]?.round_id ?? 0;
  const globalAccuracy = rounds[0]?.global_accuracy ?? 0;

  const openIncidents = incidents.filter(
    (i) => i.action_taken === 'QUARANTINED' || i.action_taken === 'FLAGGED_REVIEW'
  ).length;

  const avgTrustScore = useMemo(() => {
    if (clients.length === 0) return 0;
    const sum = clients.reduce((acc, c) => acc + c.trust_score, 0);
    return Math.round(sum / clients.length);
  }, [clients]);

  // Threat distribution computation
  const threatCounts = useMemo(() => {
    const map: Record<string, number> = {};
    incidents.forEach((i) => {
      const type = i.threat_hypothesis || 'UNKNOWN';
      map[type] = (map[type] || 0) + 1;
    });
    return map;
  }, [incidents]);

  // Trust score distribution bins: 0-25, 26-50, 51-75, 76-100
  const trustBins = useMemo(() => {
    const bins = {
      '0-25 (Critical)': 0,
      '26-50 (Quarantine)': 0,
      '51-75 (Review)': 0,
      '76-100 (Trusted)': 0,
    };
    clients.forEach((c) => {
      if (c.trust_score <= 25) bins['0-25 (Critical)']++;
      else if (c.trust_score <= 50) bins['26-50 (Quarantine)']++;
      else if (c.trust_score <= 75) bins['51-75 (Review)']++;
      else bins['76-100 (Trusted)']++;
    });
    return bins;
  }, [clients]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (filterEventType === 'ALL') return events;
    return events.filter((e) => e.event_type === filterEventType);
  }, [events, filterEventType]);

  const eventTypes = useMemo(() => {
    const set = new Set(events.map((e) => e.event_type));
    return ['ALL', ...Array.from(set)];
  }, [events]);

  if (isLoading && clients.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-slate-900 border-t-transparent animate-spin mb-3" />
        <span className="text-sm font-medium text-slate-700">Connecting to FedSentinel telemetry...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Principle Banner */}
      <div className="bg-slate-900 text-white rounded-lg p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-code font-bold tracking-wider text-emerald-400 uppercase">
                Zero-Trust Control Plane
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-code bg-slate-800 text-slate-300">
                Layer 0-5 Active
              </span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
              &ldquo;DON&apos;T TRUST THE UPDATE. VERIFY IT.&rdquo;
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('investigation')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            type="button"
          >
            <Microscope className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open Forensic Lab</span>
          </button>
        </div>
      </div>

      {/* 6 Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Clients */}
        <div
          onClick={() => setActiveTab('clients')}
          className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs hover:border-slate-300 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Clients</span>
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono-code text-slate-900">{totalClients}</span>
            <span className="text-[11px] font-mono-code text-slate-500">Enclaves</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span>{trustedCount} Trusted</span>
            <span className="text-rose-600 font-bold">{quarantinedCount} Quarantined</span>
          </div>
        </div>

        {/* Node Health Status Pill */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Health Status</span>
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title={`${trustedCount} Trusted`} />
            <span className="text-xs font-mono-code font-bold text-emerald-700">{trustedCount}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ml-1" title={`${reviewCount} Review`} />
            <span className="text-xs font-mono-code font-bold text-amber-700">{reviewCount}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ml-1" title={`${quarantinedCount} Quarantined`} />
            <span className="text-xs font-mono-code font-bold text-rose-700">{quarantinedCount}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 ml-1" title={`${blockedCount} Blocked`} />
            <span className="text-xs font-mono-code font-bold text-slate-900">{blockedCount}</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex justify-between">
            <span>Gated Isolation</span>
            <span className="text-emerald-700 font-semibold">{((trustedCount / (totalClients || 1)) * 100).toFixed(0)}% Nominal</span>
          </div>
        </div>

        {/* Current Round */}
        <div
          onClick={() => setActiveTab('rounds')}
          className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs hover:border-slate-300 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Round</span>
            <GitCommit className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono-code text-slate-900">#{currentRound}</span>
            <span className="text-[11px] font-mono-code text-emerald-700 font-semibold">Active</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Aggregated</span>
            <span className="font-mono-code text-slate-700">{rounds[0]?.accepted_clients?.length ?? 0} Accepted</span>
          </div>
        </div>

        {/* Global Accuracy */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Global Acc</span>
            <Percent className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono-code text-slate-900">
              {globalAccuracy.toFixed(1)}%
            </span>
            <span className="text-[11px] font-mono-code text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +0.7%
            </span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Byzantine Resilient</span>
            <span className="text-emerald-700 font-semibold">Protected</span>
          </div>
        </div>

        {/* Open Incidents */}
        <div
          onClick={() => setActiveTab('incidents')}
          className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs hover:border-slate-300 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Open Incidents</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono-code text-rose-600">{openIncidents}</span>
            <span className="text-[11px] font-mono-code text-slate-500">
              Total {incidents.length}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Active Triage</span>
            <span className="text-rose-600 font-bold">{quarantinedCount} Quarantined</span>
          </div>
        </div>

        {/* Average Trust Score */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Trust</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono-code text-slate-900">{avgTrustScore}%</span>
            <span className="text-[11px] font-mono-code text-slate-500">Weighted</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Network Health</span>
            <span className="font-semibold text-emerald-700">Stable</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Threat Distribution & Trust Score Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Threat Distribution Chart */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Threat Vector Distribution
                </h3>
              </div>
              <span className="text-[11px] font-mono-code text-slate-500">
                {incidents.length} Total Incidents Logged
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {Object.keys(threatCounts).length > 0 ? (
                Object.entries(threatCounts).map(([threat, count]) => {
                  const numCount = Number(count);
                  const pct = Math.round((numCount / (incidents.length || 1)) * 100);
                  const isBackdoor = threat.includes('BACKDOOR');
                  const isPoison = threat.includes('POISON');
                  return (
                    <div key={threat} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 font-mono-code">{threat}</span>
                        <div className="flex items-center gap-2 font-mono-code text-slate-600">
                          <span>{numCount} incidents</span>
                          <span className="text-slate-400">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isBackdoor
                              ? 'bg-rose-500'
                              : isPoison
                              ? 'bg-amber-500'
                              : 'bg-indigo-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  No threat vectors identified yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Primary mitigation: Multi-Krum + Coordinate-wise Median</span>
            <button
              onClick={() => setActiveTab('incidents')}
              className="text-slate-900 font-semibold hover:underline inline-flex items-center gap-1"
            >
              View incident details &rarr;
            </button>
          </div>
        </div>

        {/* Trust Score Distribution Chart */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Enclave Trust Distribution
                </h3>
              </div>
              <span className="text-[11px] font-mono-code text-slate-500">
                {clients.length} Total Enclaves
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {Object.entries(trustBins).map(([bin, count]) => {
                const numCount = Number(count);
                const pct = clients.length > 0 ? Math.round((numCount / clients.length) * 100) : 0;
                const isCritical = bin.includes('Critical') || bin.includes('Quarantine');
                return (
                  <div key={bin} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 font-mono-code">{bin}</span>
                      <div className="flex items-center gap-2 font-mono-code text-slate-600">
                        <span>{numCount} enclaves</span>
                        <span className="text-slate-400">({pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          bin.includes('Critical')
                            ? 'bg-red-900'
                            : bin.includes('Quarantine')
                            ? 'bg-rose-500'
                            : bin.includes('Review')
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Enclave root-of-trust baseline: 80% cutoff for auto-aggregation</span>
            <button
              onClick={() => setActiveTab('clients')}
              className="text-slate-900 font-semibold hover:underline inline-flex items-center gap-1"
            >
              Manage clients &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Round Activity Timeline & Live WebSocket Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Round Activity Timeline (7 Cols) */}
        <div className="lg:col-span-7 p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Federation Round Activity Timeline
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('rounds')}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              View all ({rounds.length})
            </button>
          </div>

          <div className="mt-3 flex flex-col divide-y divide-slate-100">
            {rounds.slice(0, 5).map((round) => {
              const hasQuarantined = round.quarantined_clients && round.quarantined_clients.length > 0;
              return (
                <div key={round.round_id} className="py-2.5 flex items-start justify-between text-xs hover:bg-slate-50/70 px-1 rounded transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono-code font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        R#{round.round_id}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {round.participating_clients.length} Nodes Quorum
                        </span>
                        {hasQuarantined ? (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            {round.quarantined_clients.length} Quarantined ({round.quarantined_clients.join(', ')})
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            100% Accepted
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5">
                        Accepted: {round.accepted_clients.join(', ')} &bull; Accuracy: {round.global_accuracy.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono-code text-slate-400 whitespace-nowrap">
                    {new Date(round.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live WebSocket Event Feed (5 Cols) */}
        <div className="lg:col-span-5 p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Live WebSocket Feed
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <select
                value={filterEventType}
                onChange={(e) => setFilterEventType(e.target.value)}
                className="text-[11px] font-mono-code bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 focus:outline-none"
              >
                {eventTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1">
            {filteredEvents.length > 0 ? (
              filteredEvents.slice(0, 8).map((evt, idx) => {
                const isAlert =
                  evt.event_type.includes('QUARANTINE') ||
                  evt.event_type.includes('INCIDENT') ||
                  evt.event_type.includes('SIMULATION');
                return (
                  <div
                    key={`${evt.timestamp}-${idx}`}
                    className={`p-2.5 rounded-md border text-xs flex flex-col gap-1 transition-all ${
                      isAlert
                        ? 'bg-rose-50/50 border-rose-200/80 text-rose-950'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold uppercase ${
                            isAlert ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {evt.event_type}
                        </span>
                        <span className="font-mono-code font-bold text-slate-900">
                          {evt.client_id}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono-code text-slate-400">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Payload Details */}
                    <div className="text-[11px] font-mono-code text-slate-600 bg-white/70 p-1.5 rounded border border-slate-200/60 overflow-x-auto">
                      {Object.entries(evt.payload || {}).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-normal">{k}:</span>
                          <span className="font-semibold text-slate-800">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
                <Radio className="w-5 h-5 text-slate-300 mb-1" />
                <span>Listening for real-time WebSocket events...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
