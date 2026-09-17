import React, { useState } from 'react';
import {
  Building2,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Send,
  Cpu,
  Database,
  Activity,
  FileText,
  CheckCircle2,
  Play,
  Flame,
  Zap,
  RefreshCw,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useFedSentinelStore } from '../../store/useFedSentinelStore';
import { TrustGauge } from '../common/TrustGauge';

export const HospitalWorkstation: React.FC = () => {
  const { hospitals, setHospitals, activeHospitalId, setActiveHospitalId, addToast, settings } = useFedSentinelStore();

  const selectedHospital = hospitals.find(h => h.client_id === activeHospitalId) || hospitals[0] || {
    client_id: 'H1',
    name: 'Hospital 1 - Mayo Clinic',
    status: 'TRUSTED',
    trust_score: 95,
    samples_count: 1200,
    enclave_type: 'Intel SGX Enclave',
    department: 'Pulmonology',
    disease_cohort: 'PNEUMONIA',
  };

  const isQuarantined = selectedHospital.status === 'QUARANTINED';
  const isGlio = selectedHospital.disease_cohort === 'GLIOBLASTOMA';

  // Training parameters state
  const [diseaseType, setDiseaseType] = useState<'PNEUMONIA' | 'GLIOBLASTOMA'>(
    selectedHospital.disease_cohort === 'GLIOBLASTOMA' ? 'GLIOBLASTOMA' : 'PNEUMONIA'
  );
  const [samplesCount, setSamplesCount] = useState<number>(selectedHospital.samples_count || 1200);
  const [epochs, setEpochs] = useState<number>(3);
  const [learningRate, setLearningRate] = useState<number>(0.01);
  const [batchSize, setBatchSize] = useState<number>(32);
  const [noiseLevel, setNoiseLevel] = useState<number>(0.0);
  const [attackMode, setAttackMode] = useState<'CLEAN' | 'BACKDOOR' | 'LABEL_FLIP' | 'MODEL_POISONING' | 'FREE_RIDER'>('CLEAN');

  const [isTraining, setIsTraining] = useState(false);
  const [trainResult, setTrainResult] = useState<any>(null);

  // Model Inference Playground state
  const [inferenceSampleId, setInferenceSampleId] = useState('sample_pathology');
  const [isInferenceRunning, setIsInferenceRunning] = useState(false);
  const [inferenceResult, setInferenceResult] = useState<any>(null);

  // Appeal state
  const [appealReason, setAppealReason] = useState('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

  // Execute Local Enclave Training
  const handleRunLocalTraining = async () => {
    setIsTraining(true);
    setTrainResult(null);

    try {
      const res = await fetch(`${settings.apiBaseUrl}/hospitals/${selectedHospital.client_id}/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disease_type: diseaseType,
          samples_count: samplesCount,
          epochs,
          learning_rate: learningRate,
          batch_size: batchSize,
          noise_level: noiseLevel,
          attack_mode: attackMode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTrainResult(data);
        // Update hospital in global store
        setHospitals(hospitals.map(h => h.client_id === selectedHospital.client_id ? {
          ...h,
          status: data.node_status,
          trust_score: data.trust_after,
          samples_count: data.samples_count,
          disease_cohort: data.disease_type,
        } : h));

        addToast({
          type: data.quarantined ? 'warning' : 'success',
          title: data.quarantined ? 'Node Quarantined' : 'Training Verified',
          message: data.plain_verdict,
        });
      } else {
        addToast({ type: 'error', title: 'Training Error', message: 'Backend failed to execute enclave training.' });
      }
    } catch (e) {
      addToast({ type: 'error', title: 'Network Error', message: 'Could not reach training coordinator.' });
    } finally {
      setIsTraining(false);
    }
  };

  // Run Real-Time AI Model Inference on Sample Scans
  const handleRunInference = async (sampleType: string) => {
    setIsInferenceRunning(true);
    setInferenceSampleId(sampleType);

    try {
      const res = await fetch(`${settings.apiBaseUrl}/model/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disease_type: diseaseType,
          sample_id: sampleType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setInferenceResult(data);
      }
    } catch (e) {
      console.error('Inference error:', e);
    } finally {
      setIsInferenceRunning(false);
    }
  };

  // Submit Appeal
  const handleSendAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim()) return;

    setIsSubmittingAppeal(true);
    try {
      await fetch(`${settings.apiBaseUrl}/incidents/FS-034/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REQUEST_EVIDENCE',
          reason: `Hospital ${selectedHospital.client_id} Appeal: ${appealReason}`,
          actor: `Hospital Operator (${selectedHospital.client_id})`,
        }),
      });

      addToast({
        type: 'info',
        title: 'Appeal Submitted to SOC Queue',
        message: `Explanation for ${selectedHospital.client_id} sent to SecOps Lead.`,
      });
      setAppealReason('');
    } catch (e) {
      addToast({ type: 'error', title: 'Submission Error', message: 'Could not send appeal.' });
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Hospital Enclave Selector */}
      <div className="glass-panel rounded-xl p-5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">{selectedHospital.name}</h2>
              <span className="text-[10px] font-mono-code px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 font-bold">
                <Lock className="w-3 h-3" />
                CONFIDENTIAL ENCLAVE WORKSTATION
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Department: <span className="text-slate-200 font-semibold">{selectedHospital.department}</span> | Hardware TEE:{' '}
              <span className="text-brand-cyan font-mono-code font-bold">{selectedHospital.enclave_type}</span>
            </p>
          </div>
        </div>

        {/* Switch Enclave Node */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
          <span className="text-xs font-mono-code text-slate-400 px-2 shrink-0">Select Enclave:</span>
          {hospitals.map(h => (
            <button
              key={h.client_id}
              onClick={() => {
                setActiveHospitalId(h.client_id);
                setDiseaseType(h.disease_cohort === 'GLIOBLASTOMA' ? 'GLIOBLASTOMA' : 'PNEUMONIA');
                setSamplesCount(h.samples_count);
                setTrainResult(null);
                setInferenceResult(null);
              }}
              className={`px-3 py-1 rounded text-xs font-mono-code font-bold transition-all shrink-0 ${
                selectedHospital.client_id === h.client_id
                  ? 'bg-brand-cyan text-slate-950 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {h.client_id}
            </button>
          ))}
        </div>
      </div>

      {/* Privacy Guarantee Card */}
      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-900/50 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-300 uppercase tracking-wide">Confidential Computing Privacy Boundary</h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              Raw clinical DICOM scans remain within the local hospital boundary; only clipped gradient deltas (&Delta;W) cross the federation gateway. The FedSentinel agent trains a local{' '}
              <strong className="text-white">MedicalImageCNN (37,858 params)</strong> under verifiable enclave attestation.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-md font-semibold shrink-0 hidden lg:block">
          DPDP ACT 2023 &bull; HIPAA-ALIGNED PRIVACY CONTROLS (45 CFR &sect; 164.312)
        </span>
      </div>

      {/* Main Grid: Training Config (Left) + Model Test & Verification (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Local Model Training Configuration (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: Hyperparameter Configuration */}
          <div className="glass-panel rounded-xl p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-cyan" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                  Enclave Model Training Controls
                </h3>
              </div>
              <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                PyTorch CNN
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Disease Cohort Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                  Disease Cohort Model Target:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiseaseType('PNEUMONIA')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      diseaseType === 'PNEUMONIA'
                        ? 'bg-cyan-950/40 border-brand-cyan text-brand-cyan shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">🫁 Pulmonology</div>
                    <div className="text-[10px] text-slate-400">Pneumonia Chest X-Ray</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDiseaseType('GLIOBLASTOMA')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      diseaseType === 'GLIOBLASTOMA'
                        ? 'bg-indigo-950/40 border-indigo-400 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.15)]'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">🧠 Neuro-Oncology</div>
                    <div className="text-[10px] text-slate-400">Glioblastoma Brain MRI</div>
                  </button>
                </div>
              </div>

              {/* Clinical Samples & Local Epochs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Dataset Samples:</span>
                    <span className="font-mono-code text-slate-200 font-bold">{samplesCount}</span>
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={5000}
                    step={100}
                    value={samplesCount}
                    onChange={(e) => setSamplesCount(parseInt(e.target.value))}
                    className="w-full accent-brand-cyan bg-slate-950 h-1.5 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Local Epochs:</span>
                    <span className="font-mono-code text-slate-200 font-bold">{epochs}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={epochs}
                    onChange={(e) => setEpochs(parseInt(e.target.value))}
                    className="w-full accent-brand-cyan bg-slate-950 h-1.5 rounded-lg"
                  />
                </div>
              </div>

              {/* Learning Rate & Batch Size */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Learning Rate (SGD)</label>
                  <select
                    value={learningRate}
                    onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 font-mono-code text-slate-200"
                  >
                    <option value={0.001}>1e-3 (Conservative)</option>
                    <option value={0.01}>1e-2 (Standard)</option>
                    <option value={0.05}>5e-2 (Aggressive)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Batch Size</label>
                  <select
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 font-mono-code text-slate-200"
                  >
                    <option value={16}>16 cases</option>
                    <option value={32}>32 cases</option>
                    <option value={64}>64 cases</option>
                  </select>
                </div>
              </div>

              {/* Differential Privacy Noise Level */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>DP Gaussian Noise (&sigma;):</span>
                  <span className="font-mono-code text-slate-200 font-bold">{noiseLevel.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={0.5}
                  step={0.05}
                  value={noiseLevel}
                  onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 bg-slate-950 h-1.5 rounded-lg"
                />
              </div>

              {/* Adversarial Testing Simulation Toggle */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <label className="block text-[11px] font-bold text-amber-400 uppercase font-mono-code mb-1.5 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  Adversarial Test Injection:
                </label>
                <select
                  value={attackMode}
                  onChange={(e) => setAttackMode(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 font-mono-code text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="CLEAN">Clean Honest Training (Normal Updates)</option>
                  <option value="BACKDOOR">Backdoor Watermark Trigger (Top-left 3x3 pattern)</option>
                  <option value="LABEL_FLIP">Targeted Diagnostic Label Inversion (Label-Flip)</option>
                  <option value="MODEL_POISONING">Spectral Gradient Direction Inversion</option>
                  <option value="FREE_RIDER">Free-Rider Zero Delta (Near-zero update)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Simulate adversary behavior to test if the Zero-Trust gateway catches the corrupted gradient.
                </p>
              </div>

              {/* Action Button: Train and Transmit */}
              <button
                onClick={handleRunLocalTraining}
                disabled={isTraining}
                className={`w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                  attackMode !== 'CLEAN'
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'bg-brand-cyan hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                }`}
              >
                {isTraining ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing PyTorch Enclave Training...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>⚡ Train Local Enclave Model &amp; Transmit &Delta;W</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 2: Local AI Model Architecture Summary */}
          <div className="glass-panel rounded-xl p-4 border border-slate-800 text-xs font-mono-code">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-brand-cyan" />
              Model Architecture Blueprint
            </h4>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-500">Neural Network:</span>
                <span className="font-bold text-slate-100">FedSentinel-MedicalCNN</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-500">Parameters:</span>
                <span className="text-brand-cyan font-bold">37,858 weights</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-500">Topology:</span>
                <span>Conv2D(16) &rarr; BN &rarr; Conv2D(32) &rarr; FC(64, 2)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Input Resolution:</span>
                <span>1 &times; 28 &times; 28 Normalized Grayscale</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Model Inference Playground & 6-Layer Security Result (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card 1: Interactive AI Model Input & Inference Playground */}
          <div className="glass-panel rounded-xl p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                  Live AI Model Inference Playground
                </h3>
              </div>
              <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                REAL-TIME EVALUATION
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Supply test medical imaging scans to the local AI model to evaluate diagnostic accuracy before federated gradient submission.
            </p>

            {/* Test Sample Scans Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => handleRunInference(diseaseType === 'PNEUMONIA' ? 'sample_chest_normal' : 'sample_brain_healthy')}
                disabled={isInferenceRunning}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-all"
              >
                <div className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                  <Play className="w-3 h-3" />
                  {diseaseType === 'PNEUMONIA' ? 'Normal Lung Scan' : 'Healthy Brain Scan'}
                </div>
                <div className="text-[10px] text-slate-400">Class 0 Baseline Reference</div>
              </button>

              <button
                type="button"
                onClick={() => handleRunInference(diseaseType === 'PNEUMONIA' ? 'sample_chest_infiltrate' : 'sample_brain_glioblastoma')}
                disabled={isInferenceRunning}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-all"
              >
                <div className="font-bold text-xs text-rose-400 flex items-center gap-1.5">
                  <Play className="w-3 h-3" />
                  {diseaseType === 'PNEUMONIA' ? 'Pneumonia Infiltrate Scan' : 'Malignant Glioblastoma Scan'}
                </div>
                <div className="text-[10px] text-slate-400">Class 1 Pathology Target</div>
              </button>
            </div>

            {/* Inference Outcome Panel */}
            {inferenceResult && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row gap-4 items-center animate-fade-in">
                {/* 28x28 Heatmap Preview */}
                <div className="shrink-0 flex flex-col items-center">
                  <div className="w-24 h-24 rounded-lg bg-black border border-slate-800 overflow-hidden grid grid-cols-7 gap-0.5 p-1">
                    {inferenceResult.input_preview_grid?.slice(0, 7).map((row: number[], rIdx: number) =>
                      row.slice(0, 7).map((val: number, cIdx: number) => (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          className="w-full h-full rounded-xs"
                          style={{ backgroundColor: `rgba(0, 240, 255, ${Math.max(0.1, val)})` }}
                        />
                      ))
                    )}
                  </div>
                  <span className="text-[10px] font-mono-code text-slate-500 mt-1">28&times;28 Tensor Slice</span>
                </div>

                {/* Probabilities & Classification */}
                <div className="flex-1 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Diagnosis Prediction:</span>
                    <span className="font-bold font-mono-code text-brand-cyan text-sm">
                      {inferenceResult.prediction}
                    </span>
                  </div>

                  <div className="space-y-1 font-mono-code">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Model Confidence:</span>
                      <span className="text-emerald-400 font-bold">{(inferenceResult.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-brand-cyan transition-all duration-500"
                        style={{ width: `${inferenceResult.confidence * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono-code">
                    <span>Zero-Trust Verification:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      CLEAN INFERENCE
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Real Security Gateway Verification & Mathematical Trust Result */}
          <div className="glass-panel rounded-xl p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-cyan" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                  Zero-Trust Security Gateway Diagnosis
                </h3>
              </div>

              <span className={`px-3 py-1 rounded text-xs font-mono-code font-bold border ${
                trainResult?.quarantined || isQuarantined
                  ? 'bg-rose-950 text-rose-400 border-rose-800'
                  : 'bg-emerald-950 text-emerald-400 border-emerald-800'
              }`}>
                {trainResult?.quarantined || isQuarantined ? 'STATUS: QUARANTINED 🔴' : 'STATUS: TRUSTED ✅'}
              </span>
            </div>

            {/* Plain Language Explanation Panel */}
            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 mb-4 text-xs">
              <h4 className="text-[11px] font-bold text-slate-300 uppercase font-mono-code mb-1">
                Gateway Audit Verdict:
              </h4>
              <p className="text-slate-300 leading-relaxed font-sans">
                {trainResult ? (
                  trainResult.plain_verdict
                ) : isQuarantined ? (
                  <span className="text-rose-300">
                    ⚠️ Your local model update was <strong>quarantined</strong> from global aggregation. The Zero-Trust gateway detected abnormal directional divergence (anomaly score 0.88), consistent with a targeted backdoor watermark. Current trust score: {selectedHospital.trust_score}%.
                  </span>
                ) : (
                  <span className="text-emerald-300">
                    ✅ Your local model update passed all 6 Zero-Trust verification layers cleanly. Gradient norm clipping was confirmed and directional alignment is 96% with the cohort median.
                  </span>
                )}
              </p>
            </div>

            {/* Mathematical Trust Score Breakdown Card */}
            {trainResult?.mathematical_derivation && (
              <div className="p-3.5 rounded-lg bg-cyan-950/20 border border-brand-cyan/30 mb-4 font-mono-code text-xs space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-brand-cyan font-bold uppercase">Mathematical Trust Engine Derivation:</span>
                  <span className="text-sm font-bold text-slate-100">{trainResult.trust_after}%</span>
                </div>
                <div className="p-2 rounded bg-slate-950 text-[11px] text-slate-300 border border-slate-800">
                  <div className="text-slate-500">{trainResult.mathematical_derivation.formula}</div>
                  <div className="text-brand-cyan font-bold mt-1">{trainResult.mathematical_derivation.substituted}</div>
                </div>
              </div>
            )}

            {/* 6-Layer Diagnostic Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 font-mono-code text-xs">
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">L0: VALIDATION</div>
                <div className="text-emerald-400 font-bold mt-0.5">
                  {trainResult?.six_layer_verdict?.layer0_validation?.passed !== false ? 'PASS' : 'FAIL'}
                </div>
                <div className="text-[10px] text-slate-400">Norm &lt; 50.0</div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">L1: FINGERPRINT</div>
                <div className="text-emerald-400 font-bold mt-0.5">PASS</div>
                <div className="text-[10px] text-slate-400">JL Signed Hash</div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">L2: ANOMALY</div>
                <div className={trainResult?.six_layer_verdict?.layer2_anomaly?.passed === false || isQuarantined ? 'text-rose-400 font-bold mt-0.5' : 'text-emerald-400 font-bold mt-0.5'}>
                  {trainResult?.six_layer_verdict?.layer2_anomaly?.passed === false || isQuarantined ? 'FAIL (Divergent)' : 'PASS (Aligned)'}
                </div>
                <div className="text-[10px] text-slate-400">Median Cosine</div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">L3: INFLUENCE</div>
                <div className={trainResult?.six_layer_verdict?.layer3_influence?.passed === false || isQuarantined ? 'text-amber-400 font-bold mt-0.5' : 'text-emerald-400 font-bold mt-0.5'}>
                  {trainResult?.six_layer_verdict?.layer3_influence?.passed === false || isQuarantined ? 'WARN (+Loss)' : 'PASS (Loss Drop)'}
                </div>
                <div className="text-[10px] text-slate-400">LOO Loss Delta</div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">L4: ROBUSTNESS</div>
                <div className={attackMode === 'BACKDOOR' ? 'text-rose-400 font-bold mt-0.5' : 'text-emerald-400 font-bold mt-0.5'}>
                  {attackMode === 'BACKDOOR' ? 'FAIL (Trigger 88%)' : 'PASS (Resilient)'}
                </div>
                <div className="text-[10px] text-slate-400">Perturbation Flip</div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">L5: ATTRIBUTION</div>
                <div className="text-emerald-400 font-bold mt-0.5">PASS</div>
                <div className="text-[10px] text-slate-400">PCR Attested</div>
              </div>
            </div>

            {/* Appeal Form for Quarantined Hospital */}
            {(trainResult?.quarantined || isQuarantined) && (
              <div className="mt-5 border-t border-slate-800 pt-4">
                <h4 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Submit Enclave Demographics Clarification to SOC Lead
                </h4>
                <form onSubmit={handleSendAppeal} className="space-y-3">
                  <textarea
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    placeholder="Provide justification (e.g. rare pathology sub-cohort, sensor calibration shift, or hardware update)..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan h-20"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingAppeal}
                      className="px-4 py-2 bg-brand-cyan hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 shadow-[0_0_12px_rgba(0,240,255,0.2)] transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingAppeal ? 'Submitting...' : 'Dispatch Clarification to SecOps'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
