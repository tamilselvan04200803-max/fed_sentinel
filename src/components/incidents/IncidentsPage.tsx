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
  ExternalLink,
} from 'lucide-react';
import { useFedSentinelStore } from '../../store/useFedSentinelStore';
import { Incident } from '../../types';

export const IncidentsPage: React.FC = () => {
  const {
    incidents,
    setSelectedIncidentId,
    setActiveTab,
    addToast,
    settings,
  } = useFedSentinelStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [threatFilter, setThreatFilter] = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const matchesSearch =
        inc.incident_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.client_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.update_hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.threat_hypothesis.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesThreat = threatFilter === 'ALL' || inc.threat_hypothesis === threatFilter;
      const matchesAction = actionFilter === 'ALL' || inc.action_taken === actionFilter;

      return matchesSearch && matchesThreat && matchesAction;
    });
  }, [incidents, searchQuery, threatFilter, actionFilter]);

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(incidents, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fedsentinel-incident-ledger-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast({
      type: 'info',
      title: 'Ledger Exported',
      message: `Exported ${incidents.length} security incident records to JSON.`,
    });
  };

  const openInvestigation = (incidentId: string) => {
    setSelectedIncidentId(incidentId);
    setActiveTab('investigation');
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header Banner */}
      <div className="glass-panel rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100">
                SecOps Threat & Incident Ledger
              </h1>
              <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                {incidents.length} INCIDENTS LOGGED
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cryptographically verified adversarial model manipulation attempts, gradient poisoning, and backdoor triggers.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportJson}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-cyan font-bold text-xs border border-brand-cyan/30 transition-all shadow-[0_0_12px_rgba(0,240,255,0.15)]"
        >
          <Download className="w-4 h-4" />
          <span>Export Incident Ledger (JSON)</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel rounded-lg p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, client, threat, or hash..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-slate-950 border border-slate-800 focus:outline-none focus:border-brand-cyan text-slate-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={threatFilter}
            onChange={(e) => setThreatFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono-code rounded-md bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-brand-cyan"
          >
            <option value="ALL">All Threat Types</option>
            <option value="BACKDOOR">Backdoor Trigger</option>
            <option value="MODEL_POISONING">Model Poisoning</option>
            <option value="LABEL_POISONING">Label Poisoning</option>
            <option value="FREE_RIDER">Free Rider (Zero Delta)</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono-code rounded-md bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-brand-cyan"
          >
            <option value="ALL">All Actions</option>
            <option value="QUARANTINED">Quarantined</option>
            <option value="FLAGGED_REVIEW">Flagged Review</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono-code text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Incident ID</th>
                <th className="py-3 px-4">Node Identity</th>
                <th className="py-3 px-4">Threat Hypothesis</th>
                <th className="py-3 px-4 text-center">Confidence</th>
                <th className="py-3 px-4 text-center">Trust Delta</th>
                <th className="py-3 px-4 text-center">Blast Radius</th>
                <th className="py-3 px-4 text-center">Action Taken</th>
                <th className="py-3 px-4 text-right">Forensic Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-code">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    No matching incidents found in active register.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => {
                  const blast = inc.blast_radius;
                  const delta = inc.trust_after - inc.trust_before;

                  return (
                    <tr key={inc.incident_id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-100">{inc.incident_id}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[130px]" title={inc.update_hash}>
                          {inc.update_hash.slice(0, 10)}...
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-brand-cyan">{inc.client_id}</span>
                        <div className="text-[10px] text-slate-500">Round #{inc.round_id}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          {inc.threat_hypothesis}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="text-emerald-400 font-bold">{inc.confidence}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-rose-400 font-bold">
                          <TrendingDown className="w-3 h-3" />
                          <span>{delta} pts</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {inc.trust_before}% &rarr; {inc.trust_after}%
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {blast ? (
                          <div className="text-[10px]">
                            <span className="text-rose-400 font-bold">ASR {blast.post_update_asr}%</span>
                            <div className="text-slate-400 truncate max-w-[120px]">{blast.impacted_target_class}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                          inc.action_taken === 'QUARANTINED'
                            ? 'bg-rose-950 text-rose-400 border-rose-800'
                            : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}>
                          {inc.action_taken}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openInvestigation(inc.incident_id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-cyan border border-brand-cyan/30 text-xs font-bold transition-all shadow-[0_0_10px_rgba(0,240,255,0.1)] font-sans"
                        >
                          <Microscope className="w-3.5 h-3.5" />
                          <span>Audit</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
