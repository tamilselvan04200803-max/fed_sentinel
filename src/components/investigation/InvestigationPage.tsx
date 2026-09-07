import React, { useState, useEffect } from 'react';
import {
  Microscope,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingDown,
  Layers,
  Fingerprint,
  Activity,
  Cpu,
  UserCheck,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { useFedSentinel } from '../../context/FedSentinelContext';
import { Incident } from '../../types';

export const InvestigationPage: React.FC = () => {
  const { incidents, selectedIncidentId, setSelectedIncidentId, setSelectedClientId, getIncident } = useFedSentinel();

  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (selectedIncidentId) {
      getIncident(selectedIncidentId);
    }
  }, [selectedIncidentId, getIncident]);

  const activeIncident = incidents.find((i) => i.incident_id === selectedIncidentId) || incidents[0];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1800);
  };

  if (!activeIncident) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">
        <Microscope className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <h3 className="text-sm font-semibold text-slate-700">No Incidents Selected for Investigation</h3>
        <p className="text-xs text-slate-500 mt-1">Select an incident from the Incidents register or run a simulation.</p>
      </div>
    );
  }

  const evidence = activeIncident.evidence_summary || {};
  const blast = activeIncident.blast_radius;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Top Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
            <Microscope className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono-code uppercase font-bold text-slate-400 block">
              Forensic Lab &bull; Evidence Deep Dive
            </span>
            <h1 className="text-sm font-bold text-slate-900">
              Layer 0 through Layer 5 Security Audit
            </h1>
          </div>
        </div>

        {/* Incident Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Selected Ticket:</span>
          <div className="relative">
            <select
              value={activeIncident.incident_id}
              onChange={(e) => setSelectedIncidentId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-md px-3 py-1.5 text-xs font-mono-code font-bold text-slate-900 pr-8 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              {incidents.map((inc) => (
                <option key={inc.incident_id} value={inc.incident_id}>
                  {inc.incident_id} - {inc.client_id} ({inc.threat_hypothesis})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Primary Verdict & Evidence Distinction Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        {/* Header Ribbon */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold font-mono-code text-slate-900">
                {activeIncident.incident_id}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-mono-code font-bold bg-rose-50 text-rose-700 border border-rose-200">
                {activeIncident.action_taken}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-mono-code font-bold bg-slate-100 text-slate-800">
                Integrity: {activeIncident.integrity_status}
              </span>
              <span className="text-xs text-slate-500 font-mono-code">
                Round #{activeIncident.round_id} &bull; Node:{' '}
                <button
                  onClick={() => setSelectedClientId(activeIncident.client_id)}
                  className="font-bold text-slate-900 hover:underline"
                >
                  {activeIncident.client_id}
                </button>
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Recorded at {new Date(activeIncident.timestamp).toUTCString()}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono-code">
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-slate-500 uppercase">Threat Hypothesis</span>
              <span className="font-bold text-slate-900">{activeIncident.threat_hypothesis}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-slate-500 uppercase">Confidence</span>
              <span className="font-bold text-emerald-700">{activeIncident.confidence}</span>
            </div>
          </div>
        </div>

        {/* Cryptographic Identifiers Bar */}
        <div className="px-4 py-2.5 bg-slate-100/60 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono-code">
          <div className="flex items-center gap-2 flex-wrap text-slate-700">
            <span className="text-slate-500">Update SHA-256:</span>
            <code className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-900 font-bold truncate max-w-[280px] sm:max-w-md">
              {activeIncident.update_hash}
            </code>
            <button
              onClick={() => handleCopy(activeIncident.update_hash, 'hash')}
              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200"
              title="Copy SHA-256 Hash"
              type="button"
            >
              {copiedField === 'hash' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <span>Copy Incident ID:</span>
            <button
              onClick={() => handleCopy(activeIncident.incident_id, 'id')}
              className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-800"
              type="button"
            >
              {copiedField === 'id' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{activeIncident.incident_id}</span>
            </button>
          </div>
        </div>

        {/* Blast Radius & Trust Shift Visualizer */}
        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100">
          {/* Blast Radius Card */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-600" />
                  Blast-Radius Assessment
                </span>
                <span className="text-[10px] font-mono-code text-slate-500">
                  Targeted Attack Vector
                </span>
              </div>

              {blast ? (
                <div className="mt-3 flex flex-col gap-3">
                  {/* Attack Success Rate (ASR) */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">Attack Success Rate (ASR)</span>
                      <span className="font-mono-code font-bold text-rose-600">
                        {blast.baseline_asr ?? 0}% &rarr; {blast.post_update_asr ?? 'N/A'}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${blast.baseline_asr ?? 5}%` }}
                      />
                      <div
                        className="bg-rose-500 h-full"
                        style={{ width: `${(blast.post_update_asr ?? 0) - (blast.baseline_asr ?? 0)}%` }}
                      />
                    </div>
                  </div>

                  {/* Model Accuracy Drop */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">Model Accuracy Impact</span>
                      <span className="font-mono-code font-bold text-slate-800">
                        {blast.baseline_accuracy ?? 'N/A'}% &rarr; {blast.post_update_accuracy ?? 'N/A'}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full"
                        style={{ width: `${blast.post_update_accuracy ?? 90}%` }}
                      />
                    </div>
                  </div>

                  {/* Impacted Class */}
                  <div className="p-2.5 rounded bg-white border border-slate-200 flex items-center justify-between text-xs font-mono-code mt-1">
                    <span className="text-slate-500">Impacted Target Class:</span>
                    <span className="font-bold text-rose-700">
                      {blast.impacted_target_class || 'No data available'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  No data available for blast radius metrics.
                </div>
              )}
            </div>
          </div>

          {/* Trust Score Delta Card */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                  Trust Engine Penalty Breakdown
                </span>
                <span className="text-[10px] font-mono-code text-slate-500">
                  Client {activeIncident.client_id}
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-3">
                <div className="flex items-center justify-between p-3 rounded bg-white border border-slate-200">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase">Baseline Trust</span>
                    <span className="text-xl font-bold font-mono-code text-slate-700">
                      {activeIncident.trust_before}%
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-rose-500" />
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-slate-500 uppercase">Post-Incident Trust</span>
                    <span className="text-xl font-bold font-mono-code text-rose-600">
                      {activeIncident.trust_after}%
                    </span>
                  </div>
                </div>

                {/* Penalties list if available */}
                {evidence.trust_engine?.penalty_breakdown ? (
                  <div className="flex flex-col gap-1.5 text-xs font-mono-code">
                    <span className="text-[11px] font-semibold text-slate-600">Applied Deductions:</span>
                    {Object.entries(evidence.trust_engine.penalty_breakdown).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-slate-700 bg-white px-2 py-1 rounded border border-slate-100">
                        <span>{k.replace(/_/g, ' ')}</span>
                        <span className="font-bold text-rose-600">{v} pts</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 p-2 text-center font-mono-code">
                    No detailed penalty breakdown available.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layer 0 Through Layer 5 Evidence Inspection Grid */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Layer 0 through Layer 5 Evidence Pipeline
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            &ldquo;DON&apos;T TRUST THE UPDATE. VERIFY IT.&rdquo;
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Layer 0: Local Validation */}
          <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-slate-900 text-white font-mono-code text-[10px] font-bold flex items-center justify-center">
                    L0
                  </span>
                  <span className="text-xs font-bold text-slate-900">Local Validation</span>
                </div>
                {evidence.layer0_local_validation?.status ? (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {evidence.layer0_local_validation.status}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono-code">No data</span>
                )}
              </div>

              {evidence.layer0_local_validation ? (
                <div className="flex flex-col gap-2 text-xs font-mono-code mt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Checks Passed:</span>
                    <span className="font-bold text-slate-900">
                      {evidence.layer0_local_validation.checks_passed ?? 'N/A'} /{' '}
                      {evidence.layer0_local_validation.total_checks ?? 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">NaN/Inf Sanitization:</span>
                    <span className="font-bold text-emerald-700">
                      {evidence.layer0_local_validation.nan_inf_check ?? 'PASS'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-sans mt-1 p-2 rounded bg-slate-50 border border-slate-100">
                    {evidence.layer0_local_validation.details ?? 'Syntactic format verified.'}
                  </p>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-mono-code">
                  No data available
                </div>
              )}
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono-code">
              Gate: Format, tensor shape, non-empty delta
            </div>
          </div>

          {/* Layer 1: Privacy-Safe Update Fingerprint */}
          <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-slate-900 text-white font-mono-code text-[10px] font-bold flex items-center justify-center">
                    L1
                  </span>
                  <span className="text-xs font-bold text-slate-900">Update Fingerprint</span>
                </div>
                <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {evidence.layer1_fingerprint ? (
                <div className="flex flex-col gap-2 text-xs font-mono-code mt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dimensions:</span>
                    <span className="font-bold text-slate-900">
                      {evidence.layer1_fingerprint.dimensions?.toLocaleString() ?? 'No data available'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gradient L2 Norm:</span>
                    <span className="font-bold text-slate-900">
                      {evidence.layer1_fingerprint.norm?.toFixed(2) ?? 'No data available'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cosine Dist to Median:</span>
                    <span className={`font-bold ${
                      (evidence.layer1_fingerprint.cosine_distance_to_median ?? 0) > 0.5
                        ? 'text-rose-600'
                        : 'text-slate-900'
                    }`}>
                      {evidence.layer1_fingerprint.cosine_distance_to_median?.toFixed(2) ?? 'No data available'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-mono-code">
                  No data available
                </div>
              )}
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono-code">
              Gate: Privacy-preserving sketch &amp; norm bound
            </div>
          </div>

          {/* Layer 2: Robust Anomaly Detection */}
          <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-slate-900 text-white font-mono-code text-[10px] font-bold flex items-center justify-center">
                    L2
                  </span>
                  <span className="text-xs font-bold text-slate-900">Robust Anomaly Detection</span>
                </div>
                {evidence.layer2_anomaly?.anomaly_score !== undefined ? (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    ANOMALY DETECTED
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono-code">No data</span>
                )}
              </div>

              {evidence.layer2_anomaly ? (
                <div className="flex flex-col gap-2 text-xs font-mono-code mt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Anomaly Score:</span>
                    <span className="font-bold text-rose-600">
                      {evidence.layer2_anomaly.anomaly_score?.toFixed(2) ?? 'No data available'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cutoff Threshold:</span>
                    <span className="text-slate-600">
                      {evidence.layer2_anomaly.threshold ?? '0.45'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Method:</span>
                    <span className="text-slate-800 truncate max-w-[160px]">
                      {evidence.layer2_anomaly.method ?? 'Multi-Krum'}
                    </span>
                  </div>
                  {evidence.layer2_anomaly.flagged_dimensions && (
                    <div className="text-[11px] mt-1">
                      <span className="text-slate-500 block">Flagged Kernels:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {evidence.layer2_anomaly.flagged_dimensions.map((d) => (
                          <span key={d} className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 text-[10px] border border-rose-200">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-mono-code">
                  No data available
                </div>
              )}
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono-code">
              Gate: Spatial deviation &amp; Krum score
            </div>
          </div>

          {/* Layer 3: Influence Testing */}
          <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-slate-900 text-white font-mono-code text-[10px] font-bold flex items-center justify-center">
                    L3
                  </span>
                  <span className="text-xs font-bold text-slate-900">Influence Testing</span>
                </div>
                <Activity className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {evidence.layer3_influence ? (
                <div className="flex flex-col gap-2 text-xs font-mono-code mt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Influence Score:</span>
                    <span className="font-bold text-rose-600">
                      {evidence.layer3_influence.influence_score?.toFixed(2) ?? 'No data available'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Counterfactual Risk:</span>
                    <span className="font-bold text-rose-600">
                      {evidence.layer3_influence.counterfactual_risk?.toFixed(2) ?? 'No data available'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Test Loss Delta:</span>
                    <span className="font-bold text-slate-800">
                      +{evidence.layer3_influence.test_loss_delta ?? 'No data available'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-mono-code">
                  No data available
                </div>
              )}
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono-code">
              Gate: Hessian-free influence function probe
            </div>
          </div>

          {/* Layer 4: Counterfactual Robustness Testing */}
          <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-slate-900 text-white font-mono-code text-[10px] font-bold flex items-center justify-center">
                    L4
                  </span>
                  <span className="text-xs font-bold text-slate-900">Counterfactual Robustness</span>
                </div>
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {evidence.layer4_counterfactual ? (
                <div className="flex flex-col gap-2 text-xs font-mono-code mt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Robustness Index:</span>
                    <span className="font-bold text-rose-600">
                      {evidence.layer4_counterfactual.robustness_score?.toFixed(2) ?? 'No data available'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Poison Probability:</span>
                    <span className="font-bold text-rose-600">
                      {((evidence.layer4_counterfactual.poison_probability ?? 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex flex-col mt-1">
                    <span className="text-slate-500 text-[10px]">Targeted Shift:</span>
                    <span className="font-bold text-slate-800 text-[11px] truncate">
                      {evidence.layer4_counterfactual.targeted_class_shift ?? 'No data available'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-mono-code">
                  No data available
                </div>
              )}
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono-code">
              Gate: Leave-one-out adversarial reconstruction
            </div>
          </div>

          {/* Layer 5: Client Attribution & Trust Engine */}
          <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-slate-900 text-white font-mono-code text-[10px] font-bold flex items-center justify-center">
                    L5
                  </span>
                  <span className="text-xs font-bold text-slate-900">Client Attribution</span>
                </div>
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {evidence.layer5_attribution ? (
                <div className="flex flex-col gap-2 text-xs font-mono-code mt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Attributed Node:</span>
                    <span className="font-bold text-slate-900">
                      {evidence.layer5_attribution.attributed_client_id ?? activeIncident.client_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Signature Verification:</span>
                    <span className="font-bold text-emerald-700">
                      {evidence.layer5_attribution.signature_match ? 'VALID_CERT' : 'FAIL'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pattern Similarity:</span>
                    <span className="font-bold text-rose-600">
                      {evidence.layer5_attribution.historical_pattern_similarity
                        ? `${(evidence.layer5_attribution.historical_pattern_similarity * 100).toFixed(0)}%`
                        : 'No data available'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-mono-code">
                  No data available
                </div>
              )}
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono-code">
              Gate: TEE enclave signature &amp; historical identity
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
