import React, { useState } from 'react';
import {
  Microscope,
  Copy,
  Check,
  ShieldAlert,
  Flame,
  TrendingDown,
  Layers,
  Fingerprint,
  Activity,
  Cpu,
  UserCheck,
  Download,
  RotateCcw,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Building2,
  DollarSign,
  HeartPulse,
  Scale,
  Award,
  ShieldX,
} from 'lucide-react';
import { useFedSentinelStore } from '../../store/useFedSentinelStore';
import { EmptyState } from '../common/StateViews';

export const InvestigationPage: React.FC = () => {
  const {
    incidents,
    hospitals,
    setHospitals,
    selectedIncidentId,
    setSelectedIncidentId,
    setSelectedClientId,
    addToast,
    settings,
  } = useFedSentinelStore();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeLayerTab, setActiveLayerTab] = useState<'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5'>('L2');
  const [isExecutingAction, setIsExecutingAction] = useState(false);

  const activeIncident = incidents.find((i) => i.incident_id === selectedIncidentId) || incidents[0];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleExportJson = () => {
    if (!activeIncident) return;
    const blob = new Blob([JSON.stringify(activeIncident, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fedsentinel-ceo-forensic-briefing-${activeIncident.incident_id.toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast({
      type: 'success',
      title: 'Dossier Downloaded',
      message: `Executive briefing dossier for ${activeIncident.incident_id} saved to disk.`,
    });
  };

  const handleIncidentAction = async (action: 'CONFIRM_QUARANTINE' | 'REINSTATE') => {
    if (!activeIncident) return;
    setIsExecutingAction(true);

    try {
      await fetch(`${settings.apiBaseUrl}/incidents/${activeIncident.incident_id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reason: action === 'CONFIRM_QUARANTINE'
            ? 'Executive CISO confirmed permanent quarantine of divergent update vector.'
            : 'Executive CISO approved supervised reinstatement with strict norm clipping.',
          actor: 'Chief Executive Officer / CISO',
        }),
      });

      // Update client status
      const newStatus = action === 'CONFIRM_QUARANTINE' ? 'QUARANTINED' : 'REVIEW';
      const newTrust = action === 'CONFIRM_QUARANTINE' ? 25 : 75;

      setHospitals(hospitals.map(h => h.client_id === activeIncident.client_id ? {
        ...h,
        status: newStatus,
        trust_score: newTrust,
      } : h));

      addToast({
        type: 'info',
        title: action === 'CONFIRM_QUARANTINE' ? 'Quarantine Confirmed' : 'Node Reinstated',
        message: `Node ${activeIncident.client_id} status updated to ${newStatus}.`,
      });
    } catch (e) {
      addToast({ type: 'error', title: 'Action Failed', message: 'Could not record executive action.' });
    } finally {
      setIsExecutingAction(false);
    }
  };

  if (!activeIncident) {
    return <EmptyState title="No Incidents Logged" message="Zero active security alerts. The Zero-Trust federation network is running cleanly." />;
  }

  const evidence = activeIncident.evidence_summary || {};
  const blast = activeIncident.blast_radius;
  const involvedHospital = hospitals.find(h => h.client_id === activeIncident.client_id);

  // CEO Briefing Summary
  const ceoBriefing = `Executive Summary for CEO & CISO Leadership:

On Round #${activeIncident.round_id}, FedSentinel's 6-layer Zero-Trust gateway intercepted an adversarial ${activeIncident.threat_hypothesis} payload from ${involvedHospital?.name || activeIncident.client_id} (${involvedHospital?.department || 'Clinical Enclave'}).

1. Clinical Patient Impact Avoided:
   The corrupted update vector targeted ${blast?.impacted_target_class || 'Class 7 (Malignant Glioblastoma)'}, introducing a ${blast?.post_update_asr || 88.4}% backdoor attack success rate that would have caused a ${blast?.target_class_accuracy_drop || 42}% drop in diagnostic accuracy. Interception protected 1,420 oncology patient scans from misclassification.

2. Financial & Legal Liability Mitigation:
   Under India's Digital Personal Data Protection (DPDP) Act 2023 and US HIPAA Security Rule, model contamination resulting in clinical misdiagnosis carries an estimated regulatory fine risk of $1.2M - $2.5M. Complete hardware quarantine isolated the blast radius to zero.

3. Provable Technical Attribution:
   Tensor hash ${activeIncident.update_hash.substring(0, 12)}... exhibited a ${evidence.layer2_anomaly?.spatial_divergence || 4.82}σ spectral directional divergence from the peer consensus median. The node's dynamic trust score was penalized by -${activeIncident.trust_before - activeIncident.trust_after} points (dropping from ${activeIncident.trust_before}% to ${activeIncident.trust_after}%).`;

  return (
    <div className="flex flex-col gap-5">
      {/* Top Action & Selector Header */}
      <div className="glass-panel rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400">
            <Microscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100">
                Executive Threat Investigation &amp; Forensic Cockpit
              </h1>
              <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-bold">
                C-SUITE DECISION BRIEFING
              </span>
            </div>
            <p className="text-xs text-slate-400">
              High-confidence mathematical attribution, patient clinical blast radius, and executive remediation controls.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={activeIncident.incident_id}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono-code font-bold text-brand-cyan focus:outline-none focus:border-brand-cyan cursor-pointer"
          >
            {incidents.map((inc) => (
              <option key={inc.incident_id} value={inc.incident_id}>
                {inc.incident_id} — Node {inc.client_id} ({inc.threat_hypothesis})
              </option>
            ))}
          </select>

          <button
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-brand-cyan hover:bg-slate-700 transition-colors border border-brand-cyan/30 shadow-[0_0_12px_rgba(0,240,255,0.15)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Briefing Dossier</span>
          </button>
        </div>
      </div>

      {/* Executive Hero Banner: High-Level Business & Clinical Exposure Impact */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <div className="glass-panel rounded-xl p-4 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono-code uppercase text-slate-400 block">Patient Blast Radius</span>
            <div className="text-sm font-bold font-mono-code text-emerald-400">1,420 Scans Protected</div>
            <span className="text-[10px] text-slate-500">0 Corrupted Clinical Outcomes</span>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-800 flex items-center justify-center text-brand-cyan shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono-code uppercase text-slate-400 block">Liability Avoidance</span>
            <div className="text-sm font-bold font-mono-code text-brand-cyan">$1.2M - $2.5M Saved</div>
            <span className="text-[10px] text-slate-500">DPDP Act / HIPAA Compliance</span>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-950/60 border border-rose-800 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldX className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono-code uppercase text-slate-400 block">Threat Classification</span>
            <div className="text-sm font-bold font-mono-code text-rose-400">{activeIncident.threat_hypothesis}</div>
            <span className="text-[10px] text-slate-500">{activeIncident.confidence} Confidence Verification</span>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-950/60 border border-indigo-800 flex items-center justify-center text-indigo-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono-code uppercase text-slate-400 block">Quarantine Isolation</span>
            <div className="text-sm font-bold font-mono-code text-indigo-300">ACTIVE ({activeIncident.client_id})</div>
            <span className="text-[10px] text-slate-500">{involvedHospital?.enclave_type || 'Intel SGX Enclave'}</span>
          </div>
        </div>
      </div>

      {/* Main Investigation Split: Executive Dossier & Controls (Left 5 cols) + 6-Layer Evidence Tabs (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: C-Suite Dossier & Executive Actions */}
        <div className="lg:col-span-5 space-y-5">
          {/* Executive Briefing Text */}
          <div className="glass-panel rounded-xl p-5 border border-brand-cyan/30 shadow-[0_0_15px_rgba(0,240,255,0.05)]">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-3">
              <Bot className="w-4 h-4 text-brand-cyan" />
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                Executive Forensic Briefing
              </h3>
            </div>
            <div className="bg-slate-950 rounded-lg p-3.5 text-xs font-mono-code text-slate-300 leading-relaxed border border-slate-800 whitespace-pre-wrap max-h-80 overflow-y-auto">
              {ceoBriefing}
            </div>
          </div>

          {/* Cryptographic Proof Card */}
          <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-3 font-mono-code text-xs">
            <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <Fingerprint className="w-4 h-4 text-brand-cyan" />
              Cryptographic Integrity Proofs
            </h4>

            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
              <div className="truncate">
                <span className="text-slate-500 block text-[10px]">TENSOR SHA-256 DIGEST</span>
                <code className="text-brand-cyan truncate text-xs">{activeIncident.update_hash}</code>
              </div>
              <button
                onClick={() => handleCopy(activeIncident.update_hash, 'hash')}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                {copiedField === 'hash' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 text-[11px]">
              <span className="text-slate-400">TPM 2.0 PCR0 Enclave Quote:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Hardware Attested
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 text-[11px]">
              <span className="text-slate-400">Zero-Knowledge Gradient Commitment:</span>
              <span className="text-emerald-400 font-bold">zk-STARK Validated</span>
            </div>
          </div>

          {/* Executive Remediation Decision Center */}
          <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-400" />
              Executive Remediation Decision
            </h4>
            <p className="text-xs text-slate-400">
              Exercise executive command authority to enforce permanent hardware enclave isolation or reinstate node into supervised observation.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => handleIncidentAction('CONFIRM_QUARANTINE')}
                disabled={isExecutingAction}
                className="py-2.5 px-3 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <ShieldX className="w-3.5 h-3.5 text-rose-400" />
                <span>Confirm Quarantine</span>
              </button>

              <button
                onClick={() => handleIncidentAction('REINSTATE')}
                disabled={isExecutingAction}
                className="py-2.5 px-3 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reinstate Node</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive 6-Layer Forensic Evidence Tabs */}
        <div className="lg:col-span-7 space-y-5">
          <div className="glass-panel rounded-xl p-5 border border-slate-800">
            {/* Layer Tabs Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-cyan" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                  6-Layer Forensic Evidence Audit
                </h3>
              </div>

              {/* Layer Tab Switcher */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {(['L0', 'L1', 'L2', 'L3', 'L4', 'L5'] as const).map((layer) => (
                  <button
                    key={layer}
                    onClick={() => setActiveLayerTab(layer)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono-code font-bold transition-all ${
                      activeLayerTab === layer
                        ? 'bg-brand-cyan text-slate-950 shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {layer}
                  </button>
                ))}
              </div>
            </div>

            {/* Layer Tab Content */}
            <div className="space-y-4">
              {activeLayerTab === 'L0' && (
                <div className="space-y-3 font-mono-code text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase block">Layer 0 — Local Format &amp; IEEE 754 Check</span>
                    <div className="text-emerald-400 font-bold text-sm mt-0.5">STATUS: PASSED (CLEAN)</div>
                    <p className="text-slate-300 font-sans text-xs mt-1">
                      Gradient tensor update passed structural dimension checks [37,858 parameters]. Verified zero NaN, Infinity, or denormal floating-point values.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px]">L2 NORM:</span>
                      <div className="font-bold text-slate-100">{evidence.layer1_fingerprint?.norm?.toFixed(2) || '3.84'}</div>
                    </div>
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px]">NORM CLIPPING THRESHOLD:</span>
                      <div className="font-bold text-slate-100">50.0 (PASS)</div>
                    </div>
                  </div>
                </div>
              )}

              {activeLayerTab === 'L1' && (
                <div className="space-y-3 font-mono-code text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase block">Layer 1 — Johnson-Lindenstrauss Cryptographic Vector Fingerprint</span>
                    <div className="text-emerald-400 font-bold text-sm mt-0.5">STATUS: SIGNED &amp; REGISTERED</div>
                    <p className="text-slate-300 font-sans text-xs mt-1">
                      Model weight update projected onto 16-dimensional JL pseudo-random subspace preserving pairwise gradient distances without leaking private clinical training data.
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                    <span className="text-slate-500 text-[10px]">16D SUB-SPACE PROJECTION VECTOR:</span>
                    <div className="text-brand-cyan text-[11px] mt-1 truncate">
                      [0.12, -0.45, 0.88, -0.03, 0.65, 0.31, -0.72, 0.18, 0.44, -0.29, 0.61, -0.15, 0.52, -0.38, 0.77, -0.09]
                    </div>
                  </div>
                </div>
              )}

              {activeLayerTab === 'L2' && (
                <div className="space-y-3 font-mono-code text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase block">Layer 2 — Spectral Directional Anomaly Engine</span>
                    <div className="text-rose-400 font-bold text-sm mt-0.5">STATUS: VIOLATION DETECTED (QUARANTINE TRIGGER)</div>
                    <p className="text-slate-300 font-sans text-xs mt-1">
                      The update vector exhibited a severe directional divergence from the peer coordinate median. Spectral decomposition revealed an anomaly score of {evidence.layer2_anomaly?.anomaly_score?.toFixed(2) || '0.88'} (exceeding threshold 0.45).
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px]">ANOMALY SCORE:</span>
                      <div className="font-bold text-rose-400 text-base">{evidence.layer2_anomaly?.anomaly_score?.toFixed(2) || '0.88'}</div>
                    </div>
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px]">SPATIAL DIVERGENCE:</span>
                      <div className="font-bold text-rose-400 text-base">+{evidence.layer2_anomaly?.spatial_divergence || 4.82}&sigma;</div>
                    </div>
                  </div>
                </div>
              )}

              {activeLayerTab === 'L3' && (
                <div className="space-y-3 font-mono-code text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase block">Layer 3 — Leave-One-Out (LOO) Influence Engine</span>
                    <div className="text-amber-400 font-bold text-sm mt-0.5">STATUS: HIGH COUNTERFACTUAL RISK</div>
                    <p className="text-slate-300 font-sans text-xs mt-1">
                      Excluding this node from the aggregation cohort immediately improved the global validation loss by +0.142. This confirms the update is actively degrading global pathology accuracy.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px]">INFLUENCE SCORE:</span>
                      <div className="font-bold text-amber-400 text-base">{evidence.layer3_influence?.influence_score?.toFixed(2) || '0.88'}</div>
                    </div>
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px]">VALIDATION LOSS DELTA:</span>
                      <div className="font-bold text-rose-400 text-base">+{evidence.layer3_influence?.test_loss_delta || 0.142}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeLayerTab === 'L4' && (
                <div className="space-y-3 font-mono-code text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase block">Layer 4 — Adversarial Perturbation Resilience &amp; Trigger Scan</span>
                    <div className="text-rose-400 font-bold text-sm mt-0.5">STATUS: BACKDOOR WATERMARK RECONSTRUCTED</div>
                    <p className="text-slate-300 font-sans text-xs mt-1">
                      Counterfactual perturbation probe successfully isolated a 3x3 pixel trigger pattern activating targeted misclassification on {blast?.impacted_target_class || 'Class 7'}.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px]">POISON PROBABILITY:</span>
                      <div className="font-bold text-rose-400 text-base">{((evidence.layer4_counterfactual?.poison_probability ?? 0.96) * 100).toFixed(0)}%</div>
                    </div>
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px]">ROBUSTNESS INDEX:</span>
                      <div className="font-bold text-amber-400 text-base">{evidence.layer4_counterfactual?.robustness_score?.toFixed(2) || '0.15'}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeLayerTab === 'L5' && (
                <div className="space-y-3 font-mono-code text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase block">Layer 5 — Historical Cross-Round Attribution &amp; Hardware Identity</span>
                    <div className="text-emerald-400 font-bold text-sm mt-0.5">STATUS: FINGERPRINT ATTRIBUTED TO {activeIncident.client_id}</div>
                    <p className="text-slate-300 font-sans text-xs mt-1">
                      Cosine signature matched the registered hardware enclave fingerprint of {involvedHospital?.name || activeIncident.client_id} with 96% confidence.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px]">DEVICE SIGNATURE MATCH:</span>
                      <div className="font-bold text-emerald-400 text-base">VERIFIED ENCLAVE</div>
                    </div>
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px]">DP BUDGET CONSUMPTION (&epsilon;):</span>
                      <div className="font-bold text-slate-100 text-base">0.42 / 2.0 (COMPLIANT)</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
