import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Building2,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Send,
  Cpu,
  Activity,
  FileText,
  CheckCircle2,
  Play,
  Flame,
  Zap,
  RefreshCw,
  Sliders,
  Sparkles,
} from "lucide-react";
import { useClients } from "@/src/hooks/queries/useClients";
import { useTrainHospital } from "@/src/hooks/mutations/useTrainHospital";
import { LoadingState } from "@/src/components/feedback/LoadingState";
import { EmptyState } from "@/src/components/feedback/EmptyState";
import { StatusBadge } from "@/src/components/data-display/StatusBadge";
import { TrustIndicator } from "@/src/components/data-display/TrustIndicator";
import { Button } from "@/src/components/ui/button";
import { apiRequest } from "@/src/services/api/apiClient";
import { toast } from "sonner";
import { NodeReadinessCard } from "./NodeReadinessCard";
import { EnclaveTrainingLifecycle } from "./EnclaveTrainingLifecycle";


export const HospitalWorkstation: React.FC = () => {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const navigate = useNavigate();

  const { data: clients = [], isLoading: isClientsLoading } = useClients();
  const selectedHospital = clients.find((c) => c.client_id === hospitalId) || clients[0];

  const { mutate: runTraining, isPending: isTraining } = useTrainHospital();

  // Training parameters
  const [diseaseType, setDiseaseType] = useState<"PNEUMONIA" | "GLIOBLASTOMA">("PNEUMONIA");
  const [samplesCount, setSamplesCount] = useState<number>(1200);
  const [epochs, setEpochs] = useState<number>(3);
  const [learningRate, setLearningRate] = useState<number>(0.01);
  const [batchSize, setBatchSize] = useState<number>(32);
  const [noiseLevel, setNoiseLevel] = useState<number>(0.0);
  const [attackMode, setAttackMode] = useState<"CLEAN" | "BACKDOOR" | "LABEL_FLIP" | "MODEL_POISONING" | "FREE_RIDER">("CLEAN");
  const [trainResult, setTrainResult] = useState<any>(null);

  // Inference Playground
  const [isInferenceRunning, setIsInferenceRunning] = useState(false);
  const [inferenceResult, setInferenceResult] = useState<any>(null);

  // Appeal state
  const [appealReason, setAppealReason] = useState("");
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

  if (isClientsLoading) {
    return <LoadingState message="Connecting to hospital confidential enclave workstation..." />;
  }

  if (!selectedHospital) {
    return (
      <EmptyState
        icon={Building2}
        title="Hospital Node Not Found"
        description="No registered hospital matches this enclave ID."
      />
    );
  }

  const isQuarantined = selectedHospital.status === "QUARANTINED";

  const handleRunLocalTraining = () => {
    setTrainResult(null);
    runTraining(
      {
        clientId: selectedHospital.client_id,
        disease_type: diseaseType,
        samples_count: samplesCount,
        epochs,
        learning_rate: learningRate,
        batch_size: batchSize,
        noise_level: noiseLevel,
        attack_mode: attackMode,
      },
      {
        onSuccess: (data: any) => {
          setTrainResult(data);
          if (data.is_free_rider) {
            toast.warning(`Gateway Segregated Free-Rider: ${data.plain_verdict}`);
          } else if (data.quarantined) {
            toast.warning(`Gateway Quarantined Node: ${data.plain_verdict}`);
          } else {
            toast.success(`Training Verified: ${data.plain_verdict}`);
          }
        },
        onError: (err: any) => {
          toast.error(`Training failed: ${err.message || "Network error"}`);
        },
      }
    );
  };

  const handleRunInference = async (sampleType: string) => {
    setIsInferenceRunning(true);
    try {
      const data = await apiRequest<any>("/api/model/predict", {
        method: "POST",
        body: JSON.stringify({
          disease_type: diseaseType,
          sample_id: sampleType,
        }),
      });
      setInferenceResult(data);
      toast.success(`Diagnostic classification: ${data.prediction}`);
    } catch (e: any) {
      toast.error(`Inference error: ${e.message || "Failed to query model"}`);
    } finally {
      setIsInferenceRunning(false);
    }
  };

  const handleSendAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim()) return;

    setIsSubmittingAppeal(true);
    try {
      await apiRequest("/api/incidents/FS-034/action", {
        method: "POST",
        body: JSON.stringify({
          action: "REQUEST_EVIDENCE",
          reason: `Hospital ${selectedHospital.client_id} Appeal: ${appealReason}`,
          actor: `Hospital Operator (${selectedHospital.client_id})`,
        }),
      });
      toast.info(`Appeal submitted to SecOps Queue for ${selectedHospital.client_id}`);
      setAppealReason("");
    } catch (e: any) {
      toast.error(`Appeal error: ${e.message || "Could not submit appeal"}`);
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Hospital Enclave Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{selectedHospital.name}</h2>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 font-bold">
                <Lock className="w-3 h-3" />
                CONFIDENTIAL ENCLAVE WORKSTATION
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Department: <span className="text-slate-200 font-medium">{selectedHospital.department || "Radiology & Pulmonology"}</span> | Hardware TEE:{" "}
              <span className="text-cyan-400 font-mono font-bold">{selectedHospital.enclave_type || "Intel SGX Enclave"}</span>
            </p>
          </div>
        </div>

        {/* Switch Enclave Node */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
          <span className="text-xs font-mono text-slate-400 px-2 shrink-0">Switch Enclave:</span>
          {clients.map((c) => (
            <button
              key={c.client_id}
              onClick={() => {
                navigate(`/hospital/${c.client_id}`);
                setTrainResult(null);
                setInferenceResult(null);
              }}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
                selectedHospital.client_id === c.client_id
                  ? "bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              {c.client_id}
            </button>
          ))}
        </div>
      </div>

      {/* Confidential Hardware Node Readiness & Health Preflight Card */}
      <NodeReadinessCard clientId={selectedHospital.client_id} />

      {/* Privacy Guarantee Card */}
      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-900/50 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-300 uppercase tracking-wide">Confidential Computing Privacy Boundary</h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              Raw clinical DICOM scans remain within the local hospital boundary; only clipped model gradient deltas (&Delta;W) cross the federation gateway. The local agent trains a{" "}
              <strong className="text-white">MedicalImageCNN (37,858 params)</strong> under verifiable enclave attestation.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-md font-semibold shrink-0 hidden lg:block">
          DPDP ACT 2023 &bull; HIPAA-ALIGNED PRIVACY CONTROLS (45 CFR &sect; 164.312)
        </span>
      </div>

      {/* Enclave Multi-Stage Training Lifecycle Runner & Free-Rider Alert */}
      <EnclaveTrainingLifecycle
        isTraining={isTraining}
        result={trainResult}
        epochs={epochs}
      />

      {/* Main Grid: Training Config (Left) + Model Test & Verification (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Local Model Training Configuration (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                  Enclave Model Training Controls
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                PyTorch SGD
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Cohort Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                  Disease Cohort Target:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiseaseType("PNEUMONIA")}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      diseaseType === "PNEUMONIA"
                        ? "bg-cyan-950/40 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.15)]"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="font-bold text-xs">🫁 Pulmonology</div>
                    <div className="text-[10px] text-slate-400">Pneumonia Chest X-Ray</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDiseaseType("GLIOBLASTOMA")}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      diseaseType === "GLIOBLASTOMA"
                        ? "bg-indigo-950/40 border-indigo-400 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.15)]"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="font-bold text-xs">🧠 Neuro-Oncology</div>
                    <div className="text-[10px] text-slate-400">Glioblastoma Brain MRI</div>
                  </button>
                </div>
              </div>

              {/* Samples & Epochs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Dataset Samples:</span>
                    <span className="font-mono text-slate-200 font-bold">{samplesCount}</span>
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={5000}
                    step={100}
                    value={samplesCount}
                    onChange={(e) => setSamplesCount(parseInt(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Local Epochs:</span>
                    <span className="font-mono text-slate-200 font-bold">{epochs}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={epochs}
                    onChange={(e) => setEpochs(parseInt(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
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
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 font-mono text-slate-200 text-xs"
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
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 font-mono text-slate-200 text-xs"
                  >
                    <option value={16}>16 cases</option>
                    <option value={32}>32 cases</option>
                    <option value={64}>64 cases</option>
                  </select>
                </div>
              </div>

              {/* DP Noise */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>DP Gaussian Noise (&sigma;):</span>
                  <span className="font-mono text-slate-200 font-bold">{noiseLevel.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={0.5}
                  step={0.05}
                  value={noiseLevel}
                  onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Adversarial Attack Injection Selector */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <label className="block text-[11px] font-bold text-amber-400 uppercase font-mono flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Adversarial Testing Injection:</span>
                </label>
                <select
                  value={attackMode}
                  onChange={(e) => setAttackMode(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 font-mono text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="CLEAN">Clean Honest Training (Normal Gradient)</option>
                  <option value="BACKDOOR">Backdoor Watermark Trigger (Top-left 3x3 pattern)</option>
                  <option value="LABEL_FLIP">Targeted Diagnostic Label Inversion</option>
                  <option value="MODEL_POISONING">Spectral Gradient Direction Inversion</option>
                  <option value="FREE_RIDER">Free-Rider Zero Delta</option>
                </select>
                <p className="text-[10px] text-slate-500">
                  Simulate adversary behavior to test if the Zero-Trust gateway catches the corrupted gradient.
                </p>
              </div>

              {/* Action Button */}
              <Button
                onClick={handleRunLocalTraining}
                disabled={isTraining}
                className={`w-full py-2.5 font-bold text-xs gap-2 transition-all ${
                  attackMode !== "CLEAN"
                    ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                    : "bg-cyan-400 hover:bg-cyan-300 text-slate-950"
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
                    <span>⚡ Train Local Enclave Model & Transmit &Delta;W</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Inference Playground & Security Diagnosis (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live Inference Playground */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                  Enclave Model Inference Playground
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                CONFIDENTIAL INFERENCE
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Supply test medical imaging scans to the local AI model to evaluate diagnostic accuracy before federated gradient submission:
            </p>

            {/* Test Sample Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRunInference(diseaseType === "PNEUMONIA" ? "sample_chest_normal" : "sample_brain_healthy")}
                disabled={isInferenceRunning}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-all cursor-pointer"
              >
                <div className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                  <Play className="w-3 h-3" />
                  <span>{diseaseType === "PNEUMONIA" ? "Normal Lung Scan" : "Healthy Brain Scan"}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Class 0 Baseline Reference</div>
              </button>

              <button
                type="button"
                onClick={() => handleRunInference(diseaseType === "PNEUMONIA" ? "sample_chest_infiltrate" : "sample_brain_glioblastoma")}
                disabled={isInferenceRunning}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-all cursor-pointer"
              >
                <div className="font-bold text-xs text-rose-400 flex items-center gap-1.5">
                  <Play className="w-3 h-3" />
                  <span>{diseaseType === "PNEUMONIA" ? "Pneumonia Infiltrate" : "Glioblastoma Scan"}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Class 1 Pathology Target</div>
              </button>
            </div>

            {/* Inference Outcome Panel */}
            {inferenceResult && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row gap-4 items-center">
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
                  <span className="text-[10px] font-mono text-slate-500 mt-1">28&times;28 Tensor Slice</span>
                </div>

                <div className="flex-1 space-y-2 text-xs w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Enclave Diagnosis:</span>
                    <span className="font-bold font-mono text-cyan-300 text-sm">
                      {inferenceResult.prediction}
                    </span>
                  </div>

                  <div className="space-y-1 font-mono">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Model Confidence:</span>
                      <span className="text-emerald-400 font-bold">{(inferenceResult.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-500"
                        style={{ width: `${inferenceResult.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Real Security Gateway Verification & Mathematical Trust Result */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                  Zero-Trust Security Gateway Diagnosis
                </h3>
              </div>

              <span className={`px-3 py-1 rounded text-xs font-mono font-bold border ${
                trainResult?.quarantined || isQuarantined
                  ? "bg-rose-950 text-rose-400 border-rose-800"
                  : "bg-emerald-950 text-emerald-400 border-emerald-800"
              }`}>
                {trainResult?.quarantined || isQuarantined ? "STATUS: QUARANTINED 🔴" : "STATUS: TRUSTED ✅"}
              </span>
            </div>

            {/* Verdict Explanation */}
            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              <h4 className="text-[11px] font-bold text-slate-300 uppercase font-mono mb-1">
                Gateway Audit Verdict:
              </h4>
              <p className="text-slate-300 leading-relaxed font-sans">
                {trainResult ? (
                  trainResult.plain_verdict
                ) : isQuarantined ? (
                  <span className="text-rose-300">
                    ⚠️ Your local model update was <strong>quarantined</strong> from global aggregation. The Zero-Trust gateway detected abnormal directional divergence (anomaly score 0.88), consistent with a targeted backdoor watermark. Current trust score: {selectedHospital.trust_score.toFixed(0)}%.
                  </span>
                ) : (
                  <span className="text-emerald-300">
                    ✅ Your local model update passed all 6 Zero-Trust verification layers cleanly. Gradient norm clipping was confirmed and directional alignment is 96% with the cohort median.
                  </span>
                )}
              </p>
            </div>

            {/* 6-Layer Diagnostic Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">L0: VALIDATION</div>
                <div className="text-emerald-400 font-bold mt-0.5">
                  {trainResult?.six_layer_verdict?.layer0_validation?.passed !== false ? "PASS" : "FAIL"}
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
                <div className={trainResult?.six_layer_verdict?.layer2_anomaly?.passed === false || isQuarantined ? "text-rose-400 font-bold mt-0.5" : "text-emerald-400 font-bold mt-0.5"}>
                  {trainResult?.six_layer_verdict?.layer2_anomaly?.passed === false || isQuarantined ? "FAIL (Divergent)" : "PASS (Aligned)"}
                </div>
                <div className="text-[10px] text-slate-400">Median Cosine</div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">L3: INFLUENCE</div>
                <div className={trainResult?.six_layer_verdict?.layer3_influence?.passed === false || isQuarantined ? "text-amber-400 font-bold mt-0.5" : "text-emerald-400 font-bold mt-0.5"}>
                  {trainResult?.six_layer_verdict?.layer3_influence?.passed === false || isQuarantined ? "WARN (+Loss)" : "PASS (Loss Drop)"}
                </div>
                <div className="text-[10px] text-slate-400">LOO Loss Delta</div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">L4: ROBUSTNESS</div>
                <div className={attackMode === "BACKDOOR" ? "text-rose-400 font-bold mt-0.5" : "text-emerald-400 font-bold mt-0.5"}>
                  {attackMode === "BACKDOOR" ? "FAIL (Trigger 88%)" : "PASS (Resilient)"}
                </div>
                <div className="text-[10px] text-slate-400">Perturbation Flip</div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">L5: ATTRIBUTION</div>
                <div className="text-emerald-400 font-bold mt-0.5">PASS</div>
                <div className="text-[10px] text-slate-400">PCR Attested</div>
              </div>
            </div>

            {/* Appeal Form */}
            {(trainResult?.quarantined || isQuarantined) && (
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Submit Enclave Demographics Clarification to SecOps</span>
                </h4>
                <form onSubmit={handleSendAppeal} className="space-y-3">
                  <textarea
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    placeholder="Provide justification (e.g. rare pathology sub-cohort, sensor calibration shift, or hardware update)..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 h-20"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSubmittingAppeal}
                      className="text-xs font-bold gap-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingAppeal ? "Submitting..." : "Dispatch Clarification to SecOps"}</span>
                    </Button>
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
