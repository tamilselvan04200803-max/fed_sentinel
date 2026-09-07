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
  Download,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { useFedSentinel } from '../../context/FedSentinelContext';
import { Incident } from '../../types';

export const InvestigationPage: React.FC = () => {
  const {
    incidents,
    selectedIncidentId,
    setSelectedIncidentId,
    setSelectedClientId,
    getIncident,
    overrideClientStatus,
    showToast,
  } = useFedSentinel();

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

  const handleExportJson = () => {
    if (!activeIncident) return;
    const exportData = {
      reportTitle: "FedSentinel Cryptographic Forensics Audit Dossier",
      incidentId: activeIncident.incident_id,
      nodeId: activeIncident.client_id,
      roundId: activeIncident.round_id,
      timestamp: activeIncident.timestamp,
      exportedAt: new Date().toISOString(),
      threatHypothesis: activeIncident.threat_hypothesis,
      confidence: activeIncident.confidence,
      actionTaken: activeIncident.action_taken,
      updateSha256: activeIncident.update_hash,
      blastRadius: activeIncident.blast_radius,
      layer0LocalValidation: activeIncident.evidence_summary?.layer0_local_validation,
      layer1Fingerprint: activeIncident.evidence_summary?.layer1_fingerprint,
      layer2AnomalyDetection: activeIncident.evidence_summary?.layer2_anomaly,
      layer3InfluenceTesting: activeIncident.evidence_summary?.layer3_influence,
      layer4CounterfactualRobustness: activeIncident.evidence_summary?.layer4_counterfactual,
      layer5ClientAttribution: activeIncident.evidence_summary?.layer5_attribution,
      trustEngineResult: activeIncident.evidence_summary?.trust_engine,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fedsentinel-forensic-${activeIncident.incident_id.toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Forensic Dossier for ticket ${activeIncident.incident_id} exported.`, 'success', 'Dossier Exported');
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
      {/* Top Selector & Action Bar */}
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

        {/* Incident Selector Dropdown & Export Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Ticket:</span>
          <div className="relative">
            <select
              value={activeIncident.incident_id}
              onChange={(e) => setSelectedIncidentId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-md px-3 py-1.5 text-xs font-mono-code font-bold text-slate-900 pr-8 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              {incidents.map((inc) => (
                <option key={inc.incident_id} value={inc.incident_id}>
                  {inc.incident_id} - Node {inc.client_id} ({inc.threat_hypothesis})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs"
            title="Download full JSON forensic evidence report"
            type="button"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Dossier (JSON)</span>
          </button>
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

          <div className="flex items-center gap-3 text-xs font-mono-code">
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-slate-500 uppercase">Threat Hypothesis</span>
              <span className="font-bold text-slate-900">{activeIncident.threat_hypothesis}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-slate-500 uppercase">Confidence</span>
              <span className="font-bold text-emerald-700">{activeIncident.confidence}</span>
            </div>

            {/* Quick Override Button in Header */}
            <button
              onClick={() => overrideClientStatus(activeIncident.client_id, 'REINSTATE')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs"
              title="Reinstate node if audit verified"
              type="button"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reinstate</span>
            </button>
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

                  {/* Impacted Target Class & Drop */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono-code pt-1">
                    <div className="p-2 rounded bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Impacted Target Class</span>
                      <span className="font-bold text-slate-900 truncate block">
                        {blast.impacted_target_class || 'Class 7 (Malignant Glioblastoma)'}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Class Accuracy Drop</span>
                      <span className="font-bold text-rose-600 block">
                        -{blast.target_class_accuracy_drop ?? 42}% Drop
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-mono-code">
                  No blast radius telemetry attached.
                </div>
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>Countermeasure Applied:</span>
              <span className="font-bold font-mono-code text-rose-700">
                Multi-Krum Zero-Weight Ring Isolation
              </span>
            </div>
          </div>

          {/* Trust Ledger Score Delta Card */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  Trust Engine Penalty Ledger
                </span>
                <span className="text-[10px] font-mono-code text-slate-500">
                  Node Reputation Degradation
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between p-3 rounded-md bg-white border border-slate-200">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-medium">Prior Trust</span>
                  <span className="text-lg font-bold font-mono-code text-slate-900">
                    {activeIncident.trust_before}%
                  </span>
                </div>
                <div className="flex items-center gap-1 text-rose-600 font-mono-code font-bold text-xs bg-rose-50 px-2 py-1 rounded">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>{activeIncident.trust_after - activeIncident.trust_before} pts</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-medium">Post-Incident Trust</span>
                  <span className="text-lg font-bold font-mono-code text-rose-600">
                    {activeIncident.trust_after}%
                  </span>
                </div>
              </div>

              {/* Penalty Breakdown Table */}
              {evidence.trust_engine?.penalty_breakdown && (
                <div className="mt-3 flex flex-col gap-1 text-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Audit Penalty Breakdown:
                  </span>
                  <div className="divide-y divide-slate-100 bg-white rounded border border-slate-200 font-mono-code text-[11px]">
                    {Object.entries(evidence.trust_engine.penalty_breakdown).map(([k, v]) => (
                      <div key={k} className="p-1.5 px-2 flex justify-between">
                        <span className="text-slate-600">{k.replace(/_/g, ' ')}</span>
                        <span className="font-bold text-rose-600">{v} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>Trust Action Recommendation:</span>
              <span className="font-bold font-mono-code text-slate-900">
                {evidence.trust_engine?.recommended_action || activeIncident.action_taken}
              </span>
            </div>
          </div>
        </div>

        {/* 6-Layer Forensic Deep Dive Breakdown */}
        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/30">
          {/* Layer 0: Local Syntactic & Enclave Validation */}
          <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-slate-900 text-white font-mono-code text-[10px] font-bold flex items-center justify-center">
                    L0
                  </span>
                  <span className="text-xs font-bold text-slate-900">Local Tensor Validation</span>
                </div>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {evidence.layer0_local_validation?.status || 'PASS'}
                </span>
              </div>

              {evidence.layer0_local_validation ? (
                <div className="flex flex-col gap-2 text-xs font-mono-code mt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Format Integrity:</span>
                    <span className="font-bold text-emerald-700">
                      {evidence.layer0_local_validation.format_valid ? 'VALID_IEEE_754' : 'INVALID'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">NaN/Inf Floats:</span>
                    <span className="font-bold text-emerald-700">
                      {evidence.layer0_local_validation.nan_inf_check || 'CLEAN'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Syntactic Checks:</span>
                    <span className="font-bold text-slate-800">
                      {evidence.layer0_local_validation.checks_passed}/
                      {evidence.layer0_local_validation.total_checks} passed
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans mt-1">
                    {evidence.layer0_local_validation.details || 'Tensor format passed IEEE-754 validation.'}
                  </p>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-mono-code">
                  No data available
                </div>
              )}
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono-code">
              Gate: Hardware Enclave &amp; Syntactic Gate
            </div>
          </div>

          {/* Layer 1: Update Fingerprint */}
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
                    <span className="text-slate-500">L2 Norm:</span>
                    <span className="font-bold text-slate-900">
                      {evidence.layer1_fingerprint.norm?.toFixed(2) ?? 'No data available'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cosine Dist to Median:</span>
                    <span className="font-bold text-rose-600">
                      {evidence.layer1_fingerprint.cosine_distance_to_median?.toFixed(2) ?? 'No data available'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Parameter Dims:</span>
                    <span className="font-bold text-slate-800">
                      {evidence.layer1_fingerprint.dimensions?.toLocaleString() ?? '24,576'}
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
              Gate: Spectral gradient embedding
            </div>
          </div>

          {/* Layer 2: Anomaly Detection */}
          <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-slate-900 text-white font-mono-code text-[10px] font-bold flex items-center justify-center">
                    L2
                  </span>
                  <span className="text-xs font-bold text-slate-900">Spatial Anomaly Detection</span>
                </div>
                <Activity className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {evidence.layer2_anomaly ? (
                <div className="flex flex-col gap-2 text-xs font-mono-code mt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Anomaly Score:</span>
                    <span className="font-bold text-rose-600">
                      {evidence.layer2_anomaly.anomaly_score?.toFixed(2) ?? 'No data available'} (Threshold: {evidence.layer2_anomaly.threshold ?? 0.45})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Spatial Divergence:</span>
                    <span className="font-bold text-rose-600">
                      +{evidence.layer2_anomaly.spatial_divergence ?? 4.82}&sigma;
                    </span>
                  </div>
                  <div className="flex flex-col mt-1">
                    <span className="text-slate-500 text-[10px]">Flagged Dimensions:</span>
                    <span className="font-bold text-slate-800 text-[11px] truncate">
                      {evidence.layer2_anomaly.flagged_dimensions?.join(', ') || 'conv5_3.weight, dense_out'}
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
              Gate: Coordinate-wise Median Perturbation
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
                  <span className="text-xs font-bold text-slate-900">Influence Function Probe</span>
                </div>
                <Layers className="w-3.5 h-3.5 text-slate-400" />
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
                    <span className="font-bold text-rose-600">
                      +{evidence.layer3_influence.test_loss_delta ?? 0.042}
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
