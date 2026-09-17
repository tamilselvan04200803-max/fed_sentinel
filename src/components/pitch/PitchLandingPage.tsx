import React from 'react';
import { ShieldCheck, Lock, Activity, Globe, ArrowRight, CheckCircle2, Cpu, BarChart2, Award } from 'lucide-react';
import { useFedSentinelStore } from '../../store/useFedSentinelStore';

export const PitchLandingPage: React.FC = () => {
  const { setActivePersona, setActiveTab } = useFedSentinelStore();

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-cyan/10 border border-brand-cyan/30 rounded-full text-brand-cyan text-xs font-mono-code font-bold">
            <ShieldCheck className="w-4 h-4" /> FEDERATED AI SECURITY FOR HEALTHCARE
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight">
            Collaborative Healthcare AI. <br />
            <span className="text-brand-cyan">Protected by Zero-Trust Model Security.</span>
          </h1>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            FedSentinel-Health enables hospital networks across India to collaboratively train state-of-the-art diagnostic AI models without ever exposing raw patient data or succumbing to model poisoning and backdoor attacks.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => setActivePersona('SOC')}
              className="px-6 py-3 bg-brand-cyan hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all"
            >
              <span>Launch SecOps Command Center</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActivePersona('HOSPITAL')}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
            >
              <span>Hospital Client Workstation</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Value Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-100">1. On-Premise Privacy</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Raw patient scans, DICOM images, and clinical records remain within local hospital trust boundaries; only clipped gradient deltas (&Delta;W) cross the federation gateway. Aligned with DPDP Act 2023 &amp; HIPAA Technical Safeguards (45 CFR &sect; 164.312).
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-3">
          <div className="w-10 h-10 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-100">2. 6-Layer Zero-Trust Gateway</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Inspects every model parameter update using JL projection fingerprinting, FLTrust cosine anomaly scoring, Leave-One-Out influence testing, and perturbation robustness.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
            <BarChart2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-100">3. Byzantine Robust Defense</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Prevents model degradation under attack, maintaining 94.6% global model accuracy compared to 52.1% under unprotected FedAvg baselines.
          </p>
        </div>
      </div>
    </div>
  );
};
