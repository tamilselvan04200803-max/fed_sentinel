import React, { useState } from 'react';
import { ShieldCheck, Info, CheckCircle2, AlertTriangle, Compass, X, Lock, Cpu, Database, Award } from 'lucide-react';

interface SystemTruthPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemTruthPanel: React.FC<SystemTruthPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'LIVE' | 'SIMULATED' | 'ROADMAP'>('LIVE');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-cyan/10 border border-brand-cyan/40 flex items-center justify-center text-brand-cyan shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                System Truth & Technical Honesty Panel
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  LEVEL 2 TRANSPARENCY
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono-code">
                Full technical disclosure of genuine algorithms, simulated demo state, and production roadmap.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab('LIVE')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono-code font-bold border-b-2 transition-all ${
              activeTab === 'LIVE'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>LIVE IMPLEMENTATION (REAL)</span>
          </button>
          <button
            onClick={() => setActiveTab('SIMULATED')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono-code font-bold border-b-2 transition-all ${
              activeTab === 'SIMULATED'
                ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>SIMULATED DEMO DATA</span>
          </button>
          <button
            onClick={() => setActiveTab('ROADMAP')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono-code font-bold border-b-2 transition-all ${
              activeTab === 'ROADMAP'
                ? 'border-brand-cyan text-brand-cyan bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4 text-brand-cyan" />
            <span>ROADMAP CAPABILITY</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono-code">
          {activeTab === 'LIVE' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/60 rounded-lg">
                <div className="flex items-center gap-2 font-bold text-emerald-300 mb-1">
                  <Cpu className="w-4 h-4" />
                  <span>Real PyTorch MedicalImageCNN (37,858 Trainable Parameters)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  The local enclave training and global consensus inference run genuine PyTorch tensor operations
                  (3-stage ConvNet with BatchNorm, Adaptive Pooling, and Dropout). Parameter count and gradient norms are measured live on host CPU.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-2 font-bold text-slate-200 mb-1">
                  <ShieldCheck className="w-4 h-4 text-brand-cyan" />
                  <span>Real 6-Layer Zero-Trust Security Pipeline</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Every gradient update vector $\Delta w_i$ is evaluated against:
                  (L0) IEEE 754 finite values and norm clipping, (L1) Cosine similarity to server Root-of-Trust gradient $r_t$,
                  (L2) Median Absolute Deviation (MAD) cohort anomaly detection, (L3) Leave-one-out candidate accuracy influence,
                  (L4) Perturbation prediction flip rate, and (L5) Gradient attribution.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-2 font-bold text-slate-200 mb-1">
                  <Award className="w-4 h-4 text-brand-cyan" />
                  <span>Exact Mathematical Trust Formula & Dynamic Quarantine</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Trust score $T_i = 100 \times (1 - [0.35 A_i + 0.25 I_i + 0.10 C_i + 0.10 R_i + 0.20 H_i])$.
                  When $T_i \le 50$, the aggregation weight is strictly zeroed ($q_i = 0.0$) and the node is segregated into quarantine.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-2 font-bold text-slate-200 mb-1">
                  <Lock className="w-4 h-4 text-brand-cyan" />
                  <span>Cryptographic SHA-256 Hash-Chained Audit Trail</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Every SecOps event and incident triage decision is appended to an immutable SHA-256 chained ledger.
                  The <code className="text-brand-cyan">/api/audit/verify</code> endpoint cryptographically recomputes all hash links in real-time.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'SIMULATED' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-amber-950/30 border border-amber-800/60 rounded-lg">
                <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Multi-Hospital Consortium Fleet & Edge Nodes</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  The 6 hospital nodes (Apollo, Johns Hopkins, St. Jude, Cleveland Clinic, Charité, Toronto General)
                  are hosted in-process inside the control plane backend to facilitate single-machine evaluation without deploying 6 physical hospital clusters.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-2 font-bold text-slate-200 mb-1">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span>Simulated Hardware Enclave Quotes ([DEMO_SIMULATED_ATTESTATION])</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  TPM 2.0 PCR-4/PCR-10 measurements and Intel SGX/AMD SEV quotes are generated via cryptographic SHA-256 simulation.
                  Physical TPM 2.0 TSS calls require local hardware TPM chips and are abstracted via the <code className="text-amber-400">AttestationProvider</code> interface.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-2 font-bold text-slate-200 mb-1">
                  <Database className="w-4 h-4 text-amber-400" />
                  <span>Synthetic Medical Imaging Distribution</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  To protect patient privacy, training uses synthetic 28x28 chest radiography tensors with localized Gaussian opacity consolidation
                  rather than real patient DICOM/PHI records.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'ROADMAP' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-cyan-950/30 border border-cyan-800/60 rounded-lg">
                <div className="flex items-center gap-2 font-bold text-brand-cyan mb-1">
                  <Compass className="w-4 h-4" />
                  <span>Hardware TPM 2.0 Endorsement Key Attestation</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Integration with hardware TPM2 TSS tools and CA-signed Endorsement Key (EK) certificates to cryptographically verify hardware identity before enclave execution.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-2 font-bold text-slate-200 mb-1">
                  <Database className="w-4 h-4 text-brand-cyan" />
                  <span>ABDM (Ayushman Bharat Digital Mission) Health Facility Registry</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Direct REST adapter connecting to the National Health Authority (NHA) ABDM sandbox to validate hospital HFR IDs and institutional credentials.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-2 font-bold text-slate-200 mb-1">
                  <Lock className="w-4 h-4 text-brand-cyan" />
                  <span>Opacus Rényi Differential Privacy Accounting</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Formal $(\varepsilon, \delta)$ differential privacy accounting tracking cumulative privacy budgets across continuous federation training rounds.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/60">
          <span className="text-[11px] text-slate-400 font-mono-code">
            FedSentinel Technical Honesty Standard — Version 3.0.0
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
