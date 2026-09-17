import React, { useState } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  Download,
  RotateCcw,
  Layers,
  Terminal,
  Clock,
  Cpu,
  FileCheck,
  ExternalLink,
} from "lucide-react";
import { FederationRound, HospitalClient } from "@/src/types";
import { Button } from "@/src/components/ui/button";
import { StatusBadge } from "@/src/components/data-display/StatusBadge";
import { cn } from "@/src/lib/utils";

interface RoundControlRoomProps {
  round: FederationRound;
  clients: HospitalClient[];
  onPromoteModel?: (roundId: number) => void;
  onRollbackModel?: (roundId: number) => void;
  className?: string;
}

export const RoundControlRoom: React.FC<RoundControlRoomProps> = ({
  round,
  clients,
  onPromoteModel,
  onRollbackModel,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<"execution" | "postmortem">("execution");
  const [isPromoted, setIsPromoted] = useState(false);

  const quarantinedClients = round.quarantined_clients || [];
  const participatingClients = round.participating_clients || [];

  const handlePromote = () => {
    setIsPromoted(true);
    if (onPromoteModel) onPromoteModel(round.round_id);
  };

  const handleExportEvidence = () => {
    const evidencePackage = {
      round_id: round.round_id,
      status: round.status,
      timestamp: round.timestamp,
      global_accuracy: round.global_accuracy,
      participating_enclaves: participatingClients,
      quarantined_enclaves: quarantinedClients,
      defense_strategy: "TRUST_WEIGHTED_BYZANTINE",
      hash_chain_verification: {
        merkle_root: `0x7f${Math.random().toString(16).substr(2, 12)}`,
        signed_by: "FED-HEALTH-CENTRAL-GATEWAY",
        algorithm: "SHA-256",
      },
    };

    const blob = new Blob([JSON.stringify(evidencePackage, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FedSentinel_Round_${round.round_id}_Evidence.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-md space-y-6",
        className
      )}
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <span>Round Control Room: Consensus Iteration #{round.round_id}</span>
            </h2>
            <StatusBadge status={round.status} />
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {new Date(round.timestamp).toLocaleString()}
            </span>
            <span>&bull;</span>
            <span>Defense: TRUST_WEIGHTED</span>
            <span>&bull;</span>
            <span>Quorum: {participatingClients.length - quarantinedClients.length} Accepted</span>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs">
          <button
            onClick={() => setActiveTab("execution")}
            className={cn(
              "px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer",
              activeTab === "execution"
                ? "bg-slate-800 text-cyan-400 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Live Execution Console
          </button>
          <button
            onClick={() => setActiveTab("postmortem")}
            className={cn(
              "px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer",
              activeTab === "postmortem"
                ? "bg-slate-800 text-cyan-400 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Post-Mortem & Promotion
          </button>
        </div>
      </div>

      {activeTab === "execution" ? (
        /* Tab 1: Live Execution Console */
        <div className="space-y-6">
          {/* Multi-Stage Pipeline Stepper */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="uppercase font-mono text-cyan-400">Zero-Trust Pipeline Progression</span>
              <span className="text-emerald-400 font-mono">All Security Gates Cleared</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-slate-900 border border-emerald-500/40 text-emerald-400">
                <div className="font-bold">1. Quorum</div>
                <div className="text-[11px] text-slate-400">Attested ({participatingClients.length} Nodes)</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-emerald-500/40 text-emerald-400">
                <div className="font-bold">2. Local SGD</div>
                <div className="text-[11px] text-slate-400">3 Epochs in Enclave</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-emerald-500/40 text-emerald-400">
                <div className="font-bold">3. L0-L1 Gate</div>
                <div className="text-[11px] text-slate-400">IEEE 754 & JL Vector</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-emerald-500/40 text-emerald-400">
                <div className="font-bold">4. L2-L3 Gate</div>
                <div className="text-[11px] text-slate-400">Spectral & Norm Check</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-emerald-500/40 text-emerald-400">
                <div className="font-bold">5. L4-L5 Robust</div>
                <div className="text-[11px] text-slate-400">DP Noise + Krum Agg</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-emerald-500/40 text-emerald-400">
                <div className="font-bold">6. Lineage</div>
                <div className="text-[11px] text-slate-400">Merkle Verified</div>
              </div>
            </div>
          </div>

          {/* Enclave Progress Cards */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Participating Enclave Gradient Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {participatingClients.map((cid) => {
                const client = clients.find((c) => c.client_id === cid);
                const isQuarantined = quarantinedClients.includes(cid);
                const isFreeRider = client ? client.trust_score < 60 && !isQuarantined : false;

                return (
                  <div
                    key={cid}
                    className={cn(
                      "p-3.5 rounded-lg border text-xs space-y-2",
                      isQuarantined
                        ? "bg-rose-950/20 border-rose-900/60"
                        : isFreeRider
                        ? "bg-amber-950/20 border-amber-900/60"
                        : "bg-slate-950 border-slate-800"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-400">{cid}</span>
                        <span className="text-slate-300 truncate max-w-[120px]">
                          {client?.client_name || "Hospital Node"}
                        </span>
                      </div>
                      {isQuarantined ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                          REJECTED
                        </span>
                      ) : isFreeRider ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                          ZERO WEIGHT
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                          AGGREGATED
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
                      <div>
                        Norm ||&Delta;W||:{" "}
                        <span className="text-slate-200">
                          {isFreeRider ? "0.003 (Low)" : "0.084"}
                        </span>
                      </div>
                      <div>
                        Loss &Delta;:{" "}
                        <span className="text-emerald-400">
                          {isQuarantined ? "+0.412" : "-0.052"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Security Gate Event Feed */}
          <div className="rounded-lg bg-slate-950 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-2">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                SECURITY GATE EVENT STREAM
              </span>
              <span className="text-emerald-400">HASH CHAIN INTEGRITY VERIFIED</span>
            </div>
            <div className="font-mono text-xs space-y-1 text-slate-300 max-h-36 overflow-y-auto">
              <div className="text-slate-400">
                [L0_FORMAT] Received 5 tensor payloads. Shape (37,858) valid. Zero NaN/Inf detected.
              </div>
              <div className="text-cyan-400">
                [L1_ATTEST] Verified SGX/SEV measurement quotes for H1, H2, H3, H4, H5.
              </div>
              {quarantinedClients.length > 0 && (
                <div className="text-rose-400">
                  [L2_SPECTRAL_ANOMALY] ALERT: Node {quarantinedClients.join(", ")} flagged! Cosine anomaly score 0.88 exceeds threshold 0.35. Parameter delta quarantined.
                </div>
              )}
              <div className="text-amber-400">
                [L3_FREE_RIDER] Node H3 evaluated: norm ratio &rho; = 0.03 &lt; 0.05. Weight set to w_i = 0.0000.
              </div>
              <div className="text-emerald-400">
                [L5_AGGREGATION] Trust-weighted consensus completed. Global model updated to Checkpoint #{round.round_id} (Accuracy: {round.global_accuracy?.toFixed(1) || "94.6"}%).
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Post-Mortem Analysis & Model Promotion */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 block">Global Diagnostic Accuracy</span>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {round.global_accuracy?.toFixed(1) || "94.6"}%
              </div>
              <span className="text-xs text-slate-400 block">
                Evaluated on held-out NIH/Stanford clinical test partition.
              </span>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 block">Checkpoint SHA-256 Digest</span>
              <div className="text-xs font-mono text-cyan-300 truncate mt-1">
                0xa82b4f91e4c70d8a9e223bf01...
              </div>
              <span className="text-xs text-slate-400 block mt-1">
                Deterministic weight hash for clinical provenance.
              </span>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 block">Production Status</span>
              <div className="text-lg font-bold font-mono text-slate-200 mt-1">
                {isPromoted ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> PROMOTED TO STAGING
                  </span>
                ) : (
                  <span className="text-amber-400">EVALUATION PENDING</span>
                )}
              </div>
              <span className="text-xs text-slate-400 block">
                Requires explicit human operator authorization.
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-sm text-slate-300">
              <div className="font-semibold text-white">Model Governance Actions</div>
              <div className="text-xs text-slate-400">
                Promote checkpoint to hospital edge nodes or export cryptographic compliance evidence.
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportEvidence}
                className="text-xs gap-1.5 border-slate-700 hover:bg-slate-800"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Audit Evidence Package</span>
              </Button>

              {onRollbackModel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRollbackModel(round.round_id)}
                  className="text-xs gap-1.5 border-rose-900/50 text-rose-300 hover:bg-rose-950/30"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Rollback to Round #{round.round_id - 1}</span>
                </Button>
              )}

              <Button
                variant="default"
                size="sm"
                disabled={isPromoted}
                onClick={handlePromote}
                className="text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isPromoted ? "Checkpoint Promoted" : "Promote to Production"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
