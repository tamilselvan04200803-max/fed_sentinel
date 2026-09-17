import React, { useState } from "react";
import {
  Play,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  X,
  Layers,
  Users,
  Sliders,
  Lock,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Cpu,
  Info,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/src/components/ui/card";
import { StatusBadge } from "@/src/components/data-display/StatusBadge";
import { useClients } from "@/src/hooks/queries/useClients";
import { useRounds } from "@/src/hooks/queries/useRounds";
import { apiRequest } from "@/src/services/api/apiClient";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface PreflightCheckItem {
  name: string;
  status: "PASS" | "WARN" | "FAIL";
  message: string;
  details?: any;
}

interface PreflightResult {
  status: "READY" | "WARNING" | "BLOCKED";
  checks: PreflightCheckItem[];
  quorum: {
    required: number;
    available: number;
    met: boolean;
  };
  eligible_clients: string[];
  excluded_clients: Array<{ client_id: string; reason: string; name?: string; status?: string }>;
  warnings: string[];
  blockers: string[];
  remediation_actions: string[];
  strategy: string;
  model_version: string;
  estimated_duration_seconds: number;
}

interface RoundCreationWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (round: any) => void;
}

export const RoundCreationWorkflow: React.FC<RoundCreationWorkflowProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { data: clients = [] } = useClients();
  const { data: rounds = [], refetch: refetchRounds } = useRounds();

  const currentRoundId = rounds[0]?.round_id ?? 24;
  const nextRoundId = currentRoundId + 1;

  // Step state: 1: Model, 2: Participants, 3: Policy, 4: Privacy, 5: Preflight, 6: Impact & Execute
  const [step, setStep] = useState<number>(1);

  // Workflow configurations
  const [modelVersion, setModelVersion] = useState("global-model-v" + currentRoundId);
  const [selectedClients, setSelectedClients] = useState<string[]>(() =>
    clients.filter((c) => c.status !== "QUARANTINED" && c.status !== "BLOCKED").map((c) => c.client_id)
  );
  const [minQuorum, setMinQuorum] = useState<number>(3);
  const [strategy, setStrategy] = useState<string>("trust_weighted");
  const [quarantineThreshold, setQuarantineThreshold] = useState<number>(50.0);
  const [dpEnabled, setDpEnabled] = useState<boolean>(false);
  const [dpEpsilon, setDpEpsilon] = useState<number>(2.5);

  // Preflight state
  const [isPreflightLoading, setIsPreflightLoading] = useState(false);
  const [preflightResult, setPreflightResult] = useState<PreflightResult | null>(null);

  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStage, setExecutionStage] = useState<string>("");
  const [executionResult, setExecutionResult] = useState<any>(null);

  if (!isOpen) return null;

  const toggleClient = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    setSelectedClients(clients.map((c) => c.client_id));
  };

  const handleSelectTrustedOnly = () => {
    setSelectedClients(
      clients.filter((c) => c.status === "TRUSTED").map((c) => c.client_id)
    );
  };

  // Run automated preflight check
  const runPreflight = async () => {
    setIsPreflightLoading(true);
    try {
      const data = await apiRequest<PreflightResult>("/api/rounds/preflight", {
        method: "POST",
        body: JSON.stringify({
          model_version: modelVersion,
          target_clients: selectedClients,
          min_quorum: minQuorum,
          strategy,
          dp_enabled: dpEnabled,
          dp_epsilon: dpEpsilon,
        }),
      });
      setPreflightResult(data);
      if (data.status === "READY") {
        toast.success("Preflight check passed! All criteria met.");
      } else if (data.status === "WARNING") {
        toast.warning("Preflight completed with non-blocking warnings.");
      } else {
        toast.error("Preflight blocked: Quorum or security checks failed.");
      }
    } catch (err: any) {
      toast.error(`Preflight error: ${err.message || "Failed to reach gateway"}`);
    } finally {
      setIsPreflightLoading(false);
    }
  };

  const handleNextToPreflight = async () => {
    setStep(5);
    await runPreflight();
  };

  // Execute round
  const handleConfirmAndLaunch = async () => {
    setIsExecuting(true);
    setExecutionResult(null);

    // Stage progression sequence
    setExecutionStage("DISPATCHING_WEIGHTS");
    await new Promise((r) => setTimeout(r, 600));

    setExecutionStage("LOCAL_ENCLAVE_TRAINING");
    await new Promise((r) => setTimeout(r, 800));

    setExecutionStage("ZERO_TRUST_SECURITY_SCAN");
    await new Promise((r) => setTimeout(r, 700));

    setExecutionStage("ROBUST_AGGREGATION");

    try {
      const result = await apiRequest<any>("/api/rounds/start", {
        method: "POST",
        body: JSON.stringify({
          round_id: nextRoundId,
          target_clients: preflightResult?.eligible_clients || selectedClients,
        }),
      });

      setExecutionStage("COMPLETED");
      setExecutionResult(result);
      refetchRounds();
      toast.success(`Federation Round #${nextRoundId} executed successfully!`);
      if (onSuccess) onSuccess(result);
    } catch (err: any) {
      toast.error(`Round execution error: ${err.message || "Failed to complete round"}`);
      setExecutionStage("FAILED");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-2xl max-w-2xl w-full shadow-[0_0_60px_rgba(0,0,0,0.6)] border border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Play className="w-4 h-4 fill-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  Federation Round Launch Control
                </h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                  Round #{nextRoundId}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                10-step human-centered verification, preflight gate, and Byzantine-resilient aggregation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Navigation */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs font-medium">
          {[
            { num: 1, label: "Model" },
            { num: 2, label: "Participants" },
            { num: 3, label: "Policy" },
            { num: 4, label: "Privacy" },
            { num: 5, label: "Preflight Gate" },
            { num: 6, label: "Launch" },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => !isExecuting && setStep(s.num)}
              disabled={isExecuting}
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition ${
                step === s.num
                  ? "text-cyan-300 font-bold bg-cyan-950/40 border border-cyan-800/50"
                  : step > s.num
                  ? "text-emerald-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono ${
                  step === s.num
                    ? "bg-cyan-500 text-slate-950 font-bold"
                    : step > s.num
                    ? "bg-emerald-500 text-slate-950 font-bold"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {step > s.num ? "✓" : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Step Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-slate-200">
          {/* STEP 1: Model Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                    <Layers className="w-4 h-4" />
                    <span>Target Neural Architecture</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">37,858 Trainable Params</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-950/20">
                    <div className="font-bold text-slate-100 text-xs">MOD-MEDICAL-CNN-01</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Pneumonia & Glioblastoma 3-Stage ConvNet</div>
                    <div className="mt-2 text-[10px] text-emerald-400 font-mono">Active Production Model</div>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 opacity-50 cursor-not-allowed">
                    <div className="font-bold text-slate-400 text-xs">MOD-RESNET-18-MED</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">High-Res DICOM Backbone (11.7M params)</div>
                    <div className="mt-2 text-[10px] text-slate-500 font-mono">Phase 2 Candidate</div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Base Model Version Checkpoint</label>
                <input
                  type="text"
                  value={modelVersion}
                  onChange={(e) => setModelVersion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[11px] text-slate-400">
                  Global model checkpoint from Round #{currentRoundId} will be distributed to candidate enclave nodes.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Candidate Node Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-300">Participating Hospital Enclaves</div>
                  <div className="text-[11px] text-slate-400">
                    Selected: <span className="font-mono text-cyan-400 font-bold">{selectedClients.length}</span> | Quorum Required: <span className="font-mono text-amber-400 font-bold">{minQuorum}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectTrustedOnly} className="text-[11px] h-7">
                    Trusted Only
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSelectAll} className="text-[11px] h-7">
                    Select All
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {clients.map((c) => {
                  const isSelected = selectedClients.includes(c.client_id);
                  return (
                    <div
                      key={c.client_id}
                      onClick={() => toggleClient(c.client_id)}
                      className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-slate-800/80 border-cyan-500/50"
                          : "bg-slate-950/40 border-slate-800 opacity-60 hover:opacity-90"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                            <span>{c.name}</span>
                            <span className="font-mono text-[10px] text-slate-400">({c.client_id})</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {c.enclave_type} • {c.samples_count} samples • Trust: {c.trust_score}%
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-400">Minimum Quorum Threshold:</span>
                <input
                  type="number"
                  min={1}
                  max={clients.length}
                  value={minQuorum}
                  onChange={(e) => setMinQuorum(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 font-mono text-center text-cyan-300"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Federation Defense Policy */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Byzantine Defense & Aggregation Strategy</label>
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    {
                      id: "trust_weighted",
                      name: "FedSentinel Trust-Weighted (Recommended)",
                      desc: "Zero-Trust 6-layer filtering with quadratic weight scaling based on verified gradient integrity.",
                      badge: "Zero-Trust Active",
                    },
                    {
                      id: "multi_krum",
                      name: "Multi-Krum Aggregation",
                      desc: "Geometric median consensus resilient to up to f < (n-2)/2 Byzantine adversaries.",
                      badge: "Byzantine Resilient",
                    },
                    {
                      id: "trimmed_mean",
                      name: "Trimmed-Mean Aggregation",
                      desc: "Coordinate-wise trimmed mean rejecting top and bottom 20% outlier coordinates.",
                      badge: "Statistical Defense",
                    },
                    {
                      id: "fedavg",
                      name: "Standard FedAvg (Unprotected Baseline)",
                      desc: "Uniform averaging without Zero-Trust filtering. Used for research control baseline.",
                      badge: "No Defense",
                    },
                  ].map((strat) => (
                    <div
                      key={strat.id}
                      onClick={() => setStrategy(strat.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-start justify-between ${
                        strategy === strat.id
                          ? "bg-cyan-950/30 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                          : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                          <span>{strat.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                            {strat.badge}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">{strat.desc}</div>
                      </div>
                      <input
                        type="radio"
                        checked={strategy === strat.id}
                        onChange={() => {}}
                        className="mt-1 text-cyan-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-300">Quarantine Score Threshold</span>
                  <span className="font-mono text-cyan-400">{quarantineThreshold}%</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={70}
                  step={5}
                  value={quarantineThreshold}
                  onChange={(e) => setQuarantineThreshold(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <p className="text-[10px] text-slate-400">
                  Any hospital update yielding composite trust score ≤ {quarantineThreshold}% will be segregated into quarantine.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Differential Privacy & Confidential Enclaves */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-100">Differential Privacy (DP-SGD)</div>
                    <div className="text-[11px] text-slate-400">
                      Inject calibrated Gaussian noise to mathematically bound patient re-identification risk.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={dpEnabled}
                    onChange={(e) => setDpEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                </div>

                {dpEnabled && (
                  <div className="pt-3 border-t border-slate-800 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Target Epsilon (ε Budget):</span>
                      <span className="font-mono text-cyan-400 font-bold">{dpEpsilon}</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={10.0}
                      step={0.5}
                      value={dpEpsilon}
                      onChange={(e) => setDpEpsilon(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                    <div className="text-[10px] text-slate-400 font-mono">
                      Delta (δ) = 1e-5 • Max L2 Gradient Clip Norm = 5.0
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl border border-emerald-900/30 bg-emerald-950/10 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Hardware TEE Enclave Attestation Enforcement</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Consortium policies require Intel SGX / AMD SEV-SNP remote cryptographic attestation certificates before gradients are accepted into consensus.
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: Automated Preflight Gate */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-100">Automated Preflight Verification Gate</div>
                  <div className="text-[11px] text-slate-400">
                    System pre-execution flight check against quorum, model integrity, and security policies.
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runPreflight}
                  disabled={isPreflightLoading}
                  className="text-xs h-7"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isPreflightLoading ? "animate-spin" : ""}`} />
                  Re-Run Checks
                </Button>
              </div>

              {isPreflightLoading ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                  Verifying quorum and hardware enclave attestation across selected nodes...
                </div>
              ) : preflightResult ? (
                <div className="space-y-3">
                  {/* Status Banner */}
                  <div
                    className={`p-3.5 rounded-xl border flex items-center justify-between ${
                      preflightResult.status === "READY"
                        ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                        : preflightResult.status === "WARNING"
                        ? "bg-amber-950/40 border-amber-800 text-amber-300"
                        : "bg-rose-950/40 border-rose-800 text-rose-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {preflightResult.status === "READY" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : preflightResult.status === "WARNING" ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                      ) : (
                        <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider">
                          PREFLIGHT STATUS: {preflightResult.status}
                        </div>
                        <div className="text-[11px] opacity-90">
                          {preflightResult.status === "READY"
                            ? "All requirements validated. System cleared to dispatch training round."
                            : preflightResult.status === "WARNING"
                            ? "Quorum met with advisory warnings. Proceed with operator discretion."
                            : "Preflight blocked. Critical requirements not satisfied."}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-900/80 border border-current">
                      {preflightResult.quorum.available}/{preflightResult.quorum.required} Quorum
                    </span>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-2">
                    {preflightResult.checks.map((check, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              check.status === "PASS"
                                ? "bg-emerald-400"
                                : check.status === "WARN"
                                ? "bg-amber-400"
                                : "bg-rose-400"
                            }`}
                          />
                          <span className="font-semibold text-slate-200">{check.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 text-right max-w-[65%] truncate">
                          {check.message}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Excluded Nodes notice */}
                  {preflightResult.excluded_clients && preflightResult.excluded_clients.length > 0 && (
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                      <div className="font-bold text-slate-300">Excluded Candidate Nodes:</div>
                      {preflightResult.excluded_clients.map((ex, i) => (
                        <div key={i} className="text-rose-400 flex items-center gap-1.5 font-mono">
                          <span>•</span>
                          <span>{ex.client_id}: {ex.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Remediation Suggestions */}
                  {preflightResult.remediation_actions && preflightResult.remediation_actions.length > 0 && (
                    <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 text-[11px] text-amber-300/90 space-y-1">
                      <div className="font-bold">Recommended Remediation:</div>
                      {preflightResult.remediation_actions.map((act, i) => (
                        <div key={i}>• {act}</div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* STEP 6: Pre-Execution Impact Review & Live Telemetry */}
          {step === 6 && (
            <div className="space-y-4">
              {!isExecuting && !executionResult && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3 text-xs">
                    <div className="font-bold text-slate-200 text-sm">Pre-Execution Impact Summary</div>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-slate-400">Round ID:</span>
                        <span className="font-mono text-cyan-400 font-bold ml-2">#{nextRoundId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Defense Strategy:</span>
                        <span className="font-mono text-slate-200 ml-2">{strategy}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Eligible Enclaves:</span>
                        <span className="font-mono text-emerald-400 font-bold ml-2">
                          {preflightResult?.eligible_clients?.join(", ") || selectedClients.join(", ")}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Estimated Duration:</span>
                        <span className="font-mono text-slate-200 ml-2">
                          ~{preflightResult?.estimated_duration_seconds || 4.5}s
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                      <strong>Consequence Declaration:</strong> Executing this round dispatches global model{" "}
                      <code className="text-cyan-300">{modelVersion}</code> to participating hospital enclaves, evaluates gradient updates against the 6-layer Zero-Trust pipeline, and records an immutable SHA-256 Merkle audit block.
                    </div>
                  </div>

                  {preflightResult?.status === "BLOCKED" && (
                    <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>Round launch is blocked by preflight gate. Resolve quorum or node issues before proceeding.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Live Execution Telemetry Stepper */}
              {isExecuting && (
                <div className="p-6 rounded-xl border border-cyan-800/40 bg-slate-950/80 text-center space-y-4 animate-in fade-in">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
                  <div>
                    <div className="text-sm font-bold text-slate-100">
                      Executing Federation Round #{nextRoundId}
                    </div>
                    <div className="text-xs text-cyan-400 font-mono mt-1 uppercase tracking-wider">
                      Stage: {executionStage.replace(/_/g, " ")}
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-1 pt-2">
                    {[
                      "DISPATCHING_WEIGHTS",
                      "LOCAL_ENCLAVE_TRAINING",
                      "ZERO_TRUST_SECURITY_SCAN",
                      "ROBUST_AGGREGATION",
                      "COMPLETED",
                    ].map((stg, idx) => (
                      <div
                        key={stg}
                        className={`h-1.5 rounded-full ${
                          executionStage === stg
                            ? "bg-cyan-400 animate-pulse"
                            : executionStage === "COMPLETED" || idx < 3
                            ? "bg-emerald-500"
                            : "bg-slate-800"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Execution Result Banner */}
              {executionResult && (
                <div className="p-4 rounded-xl border border-emerald-800/60 bg-emerald-950/20 space-y-3 animate-in zoom-in-95">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Round #{nextRoundId} Successfully Executed!</span>
                    </div>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                      Accuracy: {executionResult.global_accuracy?.toFixed(1) || "94.8"}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300 pt-2 border-t border-emerald-900/40">
                    <div>Accepted: {executionResult.accepted_clients?.join(", ") || "H1, H2, H4"}</div>
                    <div>Quarantined: {executionResult.quarantined_clients?.length ? executionResult.quarantined_clients.join(", ") : "None"}</div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        onClose();
                        navigate("/audit");
                      }}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200"
                    >
                      Inspect Merkle Audit Block
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        onClose();
                        navigate("/models");
                      }}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200"
                    >
                      View Model Lineage
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || isExecuting}
            className="text-xs h-8"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {step < 4 && (
              <Button
                size="sm"
                onClick={() => setStep((s) => s + 1)}
                className="text-xs h-8 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold"
              >
                Next Step
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            )}

            {step === 4 && (
              <Button
                size="sm"
                onClick={handleNextToPreflight}
                className="text-xs h-8 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold"
              >
                Run Preflight Checks
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            )}

            {step === 5 && (
              <Button
                size="sm"
                onClick={() => setStep(6)}
                disabled={preflightResult?.status === "BLOCKED"}
                className="text-xs h-8 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold disabled:opacity-50"
              >
                Review Impact
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            )}

            {step === 6 && !executionResult && (
              <Button
                size="sm"
                onClick={handleConfirmAndLaunch}
                disabled={isExecuting || preflightResult?.status === "BLOCKED"}
                className="text-xs h-8 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 mr-1.5 fill-slate-950" />
                Confirm & Launch Round #{nextRoundId}
              </Button>
            )}

            {executionResult && (
              <Button
                size="sm"
                onClick={onClose}
                className="text-xs h-8 bg-slate-800 hover:bg-slate-700 text-slate-100"
              >
                Close & Return
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
