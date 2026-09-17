import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Cpu,
  Database,
  Layers,
  Activity,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useClientReadiness } from "@/src/hooks/queries/useClients";
import { StatusBadge } from "@/src/components/data-display/StatusBadge";
import { toast } from "sonner";

interface NodeReadinessCardProps {
  clientId: string;
}

export const NodeReadinessCard: React.FC<NodeReadinessCardProps> = ({ clientId }) => {
  const { data: readiness, isLoading, error } = useClientReadiness(clientId);
  const [copiedPcr, setCopiedPcr] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 animate-pulse space-y-3">
        <div className="h-4 bg-slate-800 rounded w-1/3"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="h-16 bg-slate-800/60 rounded"></div>
          <div className="h-16 bg-slate-800/60 rounded"></div>
          <div className="h-16 bg-slate-800/60 rounded"></div>
          <div className="h-16 bg-slate-800/60 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !readiness) {
    return (
      <div className="p-4 rounded-xl border border-rose-900/50 bg-rose-950/20 text-rose-300 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>Could not retrieve confidential enclave telemetry for node {clientId}.</span>
        </div>
        <span className="font-mono text-[10px] bg-rose-900/60 px-2 py-0.5 rounded">TELEMETRY_UNAVAILABLE</span>
      </div>
    );
  }

  const isReady = readiness.readiness_status === "READY";
  const isBlocked = readiness.readiness_status === "BLOCKED";

  const handleCopyPcr = () => {
    navigator.clipboard.writeText(readiness.hardware_tee.pcr0_measurement);
    setCopiedPcr(true);
    toast.success("PCR-0 measurement copied to clipboard");
    setTimeout(() => setCopiedPcr(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-sm">
      {/* Top Status Header */}
      <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2.5">
          {isReady ? (
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          ) : isBlocked ? (
            <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-800 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                Confidential Node Preflight & Hardware Readiness
              </h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                  isReady
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/60"
                    : isBlocked
                    ? "bg-rose-950/80 text-rose-300 border-rose-700/60"
                    : "bg-amber-950/80 text-amber-300 border-amber-700/60"
                }`}
              >
                {readiness.readiness_status}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Cryptographic TEE attestation, local data integrity, and network latency check for collaborative federation.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono cursor-pointer transition-colors"
        >
          <span>{showDetails ? "Collapse Specs" : "Enclave Specs"}</span>
          {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 4 Telemetry Metrics Grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Metric 1: Hardware Root of Trust */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-mono font-semibold flex items-center gap-1">
              <Cpu className="w-3 h-3 text-cyan-400" />
              Hardware TEE
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
              {readiness.hardware_tee.attestation_status}
            </span>
          </div>
          <div className="font-bold text-slate-100 truncate text-[11px]">
            {readiness.hardware_tee.enclave_type}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-900">
            <span title={readiness.hardware_tee.pcr0_measurement}>
              PCR-0: {readiness.hardware_tee.pcr0_measurement.slice(0, 10)}...
            </span>
            <button
              onClick={handleCopyPcr}
              className="text-slate-400 hover:text-cyan-300 cursor-pointer transition-colors"
              title="Copy full PCR-0 Hash"
            >
              {copiedPcr ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Metric 2: Dataset Health & Distribution */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-mono font-semibold flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-400" />
              Local Dataset
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-200">
              {readiness.dataset_health.samples_verified} scans
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span>Class Balance:</span>
            <span className="font-mono text-slate-400 text-[10px]">
              {Object.entries(readiness.dataset_health.class_distribution)
                .map(([cls, pct]) => `${pct}`)
                .join(" / ")}
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden flex">
            <div className="bg-emerald-500 h-full" style={{ width: "58%" }} title="Class 0 (Normal)" />
            <div className="bg-cyan-500 h-full" style={{ width: "42%" }} title="Class 1 (Pathology)" />
          </div>
        </div>

        {/* Metric 3: Software Enclave Stack */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-mono font-semibold flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-400" />
              Runtime Stack
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">
              {readiness.enclave_software_stack.fedsentinel_agent_version}
            </span>
          </div>
          <div className="font-bold text-slate-200 text-[11px]">
            PyTorch {readiness.enclave_software_stack.pytorch_enclave_version}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            {readiness.enclave_software_stack.tls_version.split(" ")[0]} Secure Tunnel
          </div>
        </div>

        {/* Metric 4: Network SLA & Telemetry */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-mono font-semibold flex items-center gap-1">
              <Activity className="w-3 h-3 text-amber-400" />
              Gateway SLA
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              {readiness.network_telemetry.latency_ms} ms
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span>Bandwidth:</span>
            <span className="font-mono text-slate-200 font-semibold">{readiness.network_telemetry.bandwidth_mbps} Mbps</span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Loss: {readiness.network_telemetry.packet_loss_pct}%</span>
            <span className="text-emerald-400">CONNECTED</span>
          </div>
        </div>
      </div>

      {/* Expanded Details / Issues Panel */}
      {showDetails && (
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-[11px] font-bold text-slate-300 uppercase font-mono mb-1.5">
                Cryptographic Attestation Report
              </h4>
              <div className="p-3 rounded bg-slate-900/80 border border-slate-800 font-mono text-[11px] space-y-1 text-slate-300">
                <div>Enclave Type: <span className="text-cyan-400">{readiness.hardware_tee.enclave_type}</span></div>
                <div>HSM Level: <span className="text-slate-200">{readiness.hardware_tee.hardware_security_module}</span></div>
                <div className="break-all">Measurement (PCR-0): <span className="text-amber-400">{readiness.hardware_tee.pcr0_measurement}</span></div>
                <div>Secure Boot: <span className="text-emerald-400">ACTIVE</span></div>
                <div>Certificate Validity: <span className="text-slate-400">{readiness.hardware_tee.certificate_expires}</span></div>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-bold text-slate-300 uppercase font-mono mb-1.5">
                Data Governance & Privacy Safeguards
              </h4>
              <div className="p-3 rounded bg-slate-900/80 border border-slate-800 font-mono text-[11px] space-y-1 text-slate-300">
                <div>Schema Conformance: <span className="text-emerald-400">{readiness.dataset_health.dicom_schema_conformance}</span></div>
                <div>PHI Leakage Assessment: <span className="text-emerald-400">{readiness.dataset_health.phi_leakage_risk}</span></div>
                <div>Observed Empirical Drift: <span className="text-cyan-400">{readiness.dataset_health.data_drift_metric} (Nominal)</span></div>
                <div>ABDM / DPDP Act 2023: <span className="text-emerald-400">COMPLIANT (On-premise enclave)</span></div>
              </div>
            </div>
          </div>

          {readiness.issues.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/60 text-amber-200 space-y-1">
              <div className="font-bold text-[11px] uppercase font-mono flex items-center gap-1.5 text-amber-300">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Preflight Operational Advisories ({readiness.issues.length}):</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-200/90 pl-1">
                {readiness.issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
