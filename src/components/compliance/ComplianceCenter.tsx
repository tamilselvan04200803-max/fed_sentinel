import React from 'react';
import { ShieldCheck, Lock, FileText, CheckCircle2, Server, Globe, Scale, BookOpen } from 'lucide-react';

export const ComplianceCenter: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Compliance & Security Trust Center
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
                VERIFIED ALIGNMENT
              </span>
            </h1>
            <p className="text-sm text-slate-400">Regulatory standards alignment, architectural privacy guarantees, and operational safeguards</p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
          <span className="px-3 py-1.5 bg-slate-950 rounded border border-slate-800 text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> DPDP ACT 2023 ALIGNED
          </span>
          <span className="px-3 py-1.5 bg-slate-950 rounded border border-slate-800 text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> HIPAA SAFEGUARDS (45 CFR &sect; 164.312)
          </span>
        </div>
      </div>

      {/* Core Data Boundary Declaration */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-100 uppercase font-mono-code flex items-center gap-2 border-b border-slate-800 pb-3">
          <Lock className="w-4 h-4 text-brand-cyan" />
          Fundamental Healthcare Privacy Boundary Declaration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
              <CheckCircle2 className="w-4 h-4" /> LOCAL ON-PREMISE ENCLAVE (STAYS AT HOSPITAL)
            </div>
            <ul className="text-sm text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>Raw Patient Health Information (PHI) &amp; DICOM Scans</li>
              <li>Clinical pathology notes &amp; diagnostic measurements</li>
              <li>Identifiable demographic records &amp; patient IDs</li>
              <li>Private local gradient computation &amp; enclave SGD</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="flex items-center gap-2 text-brand-cyan font-bold text-sm mb-2">
              <Globe className="w-4 h-4" /> TRANSMITTED LEARNING ARTIFACTS (SENT TO FEDSENTINEL)
            </div>
            <ul className="text-sm text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>Clipped mathematical parameter gradient updates (&Delta;W<sub>i</sub>)</li>
              <li>16D JL random projection update fingerprints</li>
              <li>Cryptographic update nonces &amp; timestamp metadata</li>
              <li>Multi-layer security assessment scores &amp; trust history</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Regulatory Alignment Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center gap-2 text-brand-cyan font-bold text-sm mb-2">
            <FileText className="w-4 h-4" /> DPDP Act 2023 Alignment
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Provides strict data localization and purpose limitation. Patient data processing remains exclusively inside facility boundaries, fulfilling data minimization principles under Indian privacy regulations.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
            <ShieldCheck className="w-4 h-4" /> HIPAA Security Rule Controls
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Enforces technical safeguards, access controls, audit logs, and gradient norm sanitization to prevent reconstruction of protected health information from transmitted model weights (45 CFR &sect; 164.312).
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-2">
            <Server className="w-4 h-4" /> ABDM / HIE-CM Interoperability
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Complements ABDM's patient consent &amp; health data exchange layer by providing the dedicated security and integrity plane for collaborative AI model development.
          </p>
        </div>
      </div>
    </div>
  );
};
