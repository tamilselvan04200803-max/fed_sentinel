import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Flame,
  Filter,
  Search,
  CheckCircle2,
  Copy,
  Check,
  Microscope,
  ArrowRight,
  TrendingDown,
  Shield,
  Layers,
  ChevronRight,
  Download,
  RotateCcw,
} from 'lucide-react';
import { useFedSentinel } from '../../context/FedSentinelContext';
import { Incident } from '../../types';

export const IncidentsPage: React.FC = () => {
  const { incidents, navigateToInvestigation, setSelectedClientId, showToast } = useFedSentinel();

  const [searchQuery, setSearchQuery] = useState('');
  const [threatFilter, setThreatFilter] = useState<string>('ALL');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleExportLedger = () => {
    const blob = new Blob([JSON.stringify(incidents, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fedsentinel-incident-register-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${incidents.length} incident tickets to JSON.`, 'success', 'Ledger Exported');
  };

  const clientList = useMemo(() => {
    const set = new Set(incidents.map((i) => i.client_id));
    return ['ALL', ...Array.from(set)];
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const matchesSearch =
        inc.incident_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.client_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.update_hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.threat_hypothesis.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesThreat = threatFilter === 'ALL' || inc.threat_hypothesis === threatFilter;
      const matchesConfidence = confidenceFilter === 'ALL' || inc.confidence === confidenceFilter;
      const matchesAction = actionFilter === 'ALL' || inc.action_taken === actionFilter;
      const matchesClient = clientFilter === 'ALL' || inc.client_id === clientFilter;

      return matchesSearch && matchesThreat && matchesConfidence && matchesAction && matchesClient;
    });
  }, [incidents, searchQuery, threatFilter, confidenceFilter, actionFilter, clientFilter]);

  const hasActiveFilters = threatFilter !== 'ALL' || confidenceFilter !== 'ALL' || actionFilter !== 'ALL' || clientFilter !== 'ALL' || searchQuery.trim().length > 0;

  const resetFilters = () => {
    setSearchQuery('');
    setThreatFilter('ALL');
    setConfidenceFilter('ALL');
    setActionFilter('ALL');
    setClientFilter('ALL');
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'QUARANTINED':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono-code font-bold bg-rose-50 text-rose-700 border border-rose-200">
            QUARANTINED
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono-code font-bold bg-red-950 text-rose-200 border border-rose-900">
            BLOCKED
          </span>
        );
      case 'FLAGGED_REVIEW':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono-code font-bold bg-amber-50 text-amber-700 border border-amber-200">
            FLAGGED REVIEW
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono-code font-bold bg-slate-100 text-slate-700">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            Security Incident Register &amp; Blast Radius Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Traceable cryptographic evidence, threat hypotheses, and containment actions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleExportLedger}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
            type="button"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Register (JSON)</span>
          </button>

          <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-semibold font-mono-code">
            Total {incidents.length} Tickets
          </span>
          <span className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold font-mono-code">
            {incidents.filter((i) => i.action_taken === 'QUARANTINED').length} Quarantined
          </span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Ticket ID, node, SHA-256 hash, or threat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-sans"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto">
            {/* Threat Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">Threat:</span>
              <select
                value={threatFilter}
                onChange={(e) => setThreatFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 font-mono-code text-[11px]"
              >
                <option value="ALL">All Threats</option>
                <option value="BACKDOOR">BACKDOOR</option>
                <option value="MODEL_POISONING">MODEL_POISONING</option>
                <option value="FREE_RIDER">FREE_RIDER</option>
              </select>
            </div>

            {/* Confidence Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">Confidence:</span>
              <select
                value={confidenceFilter}
                onChange={(e) => setConfidenceFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 font-mono-code text-[11px]"
              >
                <option value="ALL">All Confidences</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            {/* Action Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">Action:</span>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 font-mono-code text-[11px]"
              >
                <option value="ALL">All Actions</option>
                <option value="QUARANTINED">QUARANTINED</option>
                <option value="BLOCKED">BLOCKED</option>
                <option value="FLAGGED_REVIEW">FLAGGED_REVIEW</option>
              </select>
            </div>

            {/* Node Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">Node:</span>
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 font-mono-code text-[11px]"
              >
                {clientList.map((cid) => (
                  <option key={cid} value={cid}>
                    {cid === 'ALL' ? 'All Nodes' : `Node ${cid}`}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors ml-auto"
                type="button"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Ticket ID</th>
                <th className="px-4 py-3">Node</th>
                <th className="px-4 py-3">Round</th>
                <th className="px-4 py-3">Threat Hypothesis</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Mitigation Action</th>
                <th className="px-4 py-3">Trust Impact</th>
                <th className="px-4 py-3">Target Class Impact</th>
                <th className="px-4 py-3 text-right">Forensics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredIncidents.length > 0 ? (
                filteredIncidents.map((incident) => {
                  const delta = incident.trust_after - incident.trust_before;
                  const isBackdoor = incident.threat_hypothesis === 'BACKDOOR';
                  return (
                    <tr
                      key={incident.incident_id}
                      onClick={() => navigateToInvestigation(incident.incident_id)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3 font-mono-code font-bold text-slate-900 flex items-center gap-1.5">
                        {isBackdoor ? (
                          <Flame className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span>{incident.incident_id}</span>
                      </td>
                      <td className="px-4 py-3 font-mono-code font-bold">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClientId(incident.client_id);
                          }}
                          className="text-slate-900 hover:underline hover:text-emerald-700"
                        >
                          {incident.client_id}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono-code text-slate-600">
                        Round #{incident.round_id}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {incident.threat_hypothesis}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-mono-code font-bold text-[11px] ${
                            incident.confidence === 'HIGH'
                              ? 'text-rose-700'
                              : incident.confidence === 'MEDIUM'
                              ? 'text-amber-700'
                              : 'text-slate-600'
                          }`}
                        >
                          {incident.confidence}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {getActionBadge(incident.action_taken)}
                      </td>
                      <td className="px-4 py-3 font-mono-code">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">{incident.trust_before}%</span>
                          <span className="text-slate-400">&rarr;</span>
                          <span className="font-bold text-rose-600">{incident.trust_after}%</span>
                          <span className="text-[10px] text-rose-600 font-bold ml-1">
                            ({delta} pts)
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate">
                        {incident.blast_radius?.impacted_target_class || 'General Performance'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToInvestigation(incident.incident_id);
                          }}
                          className="inline-flex items-center gap-1 text-slate-900 font-semibold group-hover:underline text-[11px]"
                          type="button"
                        >
                          <Microscope className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Audit</span>
                          <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-slate-900" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No incident tickets found matching current query and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
