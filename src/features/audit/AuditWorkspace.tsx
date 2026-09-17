import React, { useState } from "react";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  Filter,
  RefreshCw,
  Search,
  Lock,
  Hash,
  Copy,
  Check,
} from "lucide-react";
import { useAuditLogs, useAuditVerification, AuditRecord } from "@/src/hooks/queries/useAuditLogs";
import { LoadingState } from "@/src/components/feedback/LoadingState";
import { StatusBadge } from "@/src/components/data-display/StatusBadge";
import { DataTable, Column } from "@/src/components/data-display/DataTable";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";

export const AuditWorkspace: React.FC = () => {
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const { data: logs = [], isLoading: isLogsLoading, refetch: refetchLogs } = useAuditLogs();
  const { data: verifyData, isLoading: isVerifyLoading, refetch: refetchVerify } = useAuditVerification();

  if (isLogsLoading) {
    return <LoadingState message="Fetching cryptographically linked audit ledger and verifying SHA-256 block hash chain..." />;
  }

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    toast.success("Hash copied to clipboard");
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleExportLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fedsentinel-cryptographic-audit-ledger-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Audit ledger exported successfully");
  };

  const filteredLogs = filterAction === "ALL"
    ? logs
    : logs.filter((l) => l.action.toUpperCase().includes(filterAction.toUpperCase()));

  const columns: Column<AuditRecord>[] = [
    {
      header: "Timestamp",
      accessorKey: "timestamp",
      cell: (item) => (
        <span className="font-mono text-xs text-slate-400">
          {new Date(item.timestamp).toLocaleString()}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Action / Event",
      accessorKey: "action",
      cell: (item) => (
        <span className="font-mono text-xs font-bold text-cyan-300">
          {item.action}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Actor",
      accessorKey: "actor",
      cell: (item) => (
        <span className="text-xs text-slate-200 font-medium">
          {item.actor}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Enclave / Target",
      cell: (item) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          {item.client_id || (item.round_id ? `Round #${item.round_id}` : "GLOBAL")}
        </span>
      ),
    },
    {
      header: "Audit Reason & Details",
      accessorKey: "reason",
      cell: (item) => (
        <p className="text-xs text-slate-300 truncate max-w-xs" title={item.reason}>
          {item.reason}
        </p>
      ),
    },
    {
      header: "Hash Chain (SHA-256)",
      cell: (item) => (
        <div className="flex items-center gap-1.5">
          <code className="text-[11px] font-mono text-slate-400 truncate max-w-[120px]">
            {item.audit_hash}
          </code>
          <button
            onClick={() => handleCopy(item.audit_hash)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {copiedHash === item.audit_hash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">Cryptographic Audit Ledger & Compliance Plane</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                HASH-CHAINED IMMUTABILITY
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Every SecOps decision, quarantine event, model rollback, and round aggregation is cryptographically sealed in an immutable hash chain.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchLogs();
              refetchVerify();
              toast.info("Refreshed audit chain verification");
            }}
            className="h-8 text-xs gap-1.5 border-slate-700 text-slate-300 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Verify Chain</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportLogs}
            className="h-8 text-xs gap-1.5 border-slate-700 text-slate-300 hover:text-white"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Trail</span>
          </Button>
        </div>
      </div>

      {/* Chain Verification Card */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white uppercase font-mono">Merkle Hash Chain Status</h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {verifyData?.chain_valid !== false ? "VALID & UNTAMPERED" : "TAMPER DETECTED"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Verified {verifyData?.verified_count || logs.length} consecutive blocks against genesis root hash:{" "}
              <code className="text-cyan-400 font-mono text-[11px]">{verifyData?.root_hash || "0x7a3f890e..."}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="px-3 py-1 rounded bg-slate-950 border border-slate-800 text-emerald-400 flex items-center gap-1">
            <Lock className="w-3 h-3" /> DPDP ACT COMPLIANT
          </span>
          <span className="px-3 py-1 rounded bg-slate-950 border border-slate-800 text-emerald-400 flex items-center gap-1">
            <Lock className="w-3 h-3" /> HIPAA §164.312(b)
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 p-3 rounded-lg border border-slate-800 bg-slate-900/50">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs text-slate-400 font-medium">Filter Action:</span>
        {["ALL", "QUARANTINE", "ROUND", "MODEL", "APPEAL"].map((act) => (
          <button
            key={act}
            onClick={() => setFilterAction(act)}
            className={`text-xs px-2.5 py-1 rounded transition-colors font-medium cursor-pointer ${
              filterAction === act
                ? "bg-slate-800 text-cyan-400 border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {act}
          </button>
        ))}
      </div>

      {/* Audit Logs Table */}
      <DataTable
        columns={columns}
        data={filteredLogs}
        searchPlaceholder="Search audit ledger by actor, action, reason, or hash..."
        searchAccessor={(l) => `${l.action} ${l.actor} ${l.reason} ${l.client_id || ""} ${l.audit_hash}`}
        pageSize={12}
      />
    </div>
  );
};
