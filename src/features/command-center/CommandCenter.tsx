import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Network,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Building2,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { MetricCard } from "@/src/components/data-display/MetricCard";
import { StatusBadge } from "@/src/components/data-display/StatusBadge";
import { DataTable, Column } from "@/src/components/data-display/DataTable";
import { TrustIndicator } from "@/src/components/data-display/TrustIndicator";
import { LoadingState } from "@/src/components/feedback/LoadingState";
import { ErrorState } from "@/src/components/feedback/ErrorState";
import { useDashboardSummary } from "@/src/hooks/queries/useDashboardSummary";
import { useClients } from "@/src/hooks/queries/useClients";
import { useRounds } from "@/src/hooks/queries/useRounds";
import { useIncidents } from "@/src/hooks/queries/useIncidents";
import { HospitalClient, FederationRound, Incident } from "@/src/types";

export const CommandCenter: React.FC = () => {
  const navigate = useNavigate();
  const { data: summary, isLoading: summaryLoading, error: summaryError, refetch } = useDashboardSummary();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: rounds = [], isLoading: roundsLoading } = useRounds();
  const { data: incidents = [], isLoading: incidentsLoading } = useIncidents();

  if (summaryLoading || clientsLoading) {
    return <LoadingState message="Connecting to Zero-Trust Gateway & Aggregating Fleet Telemetry..." />;
  }

  if (summaryError) {
    return (
      <ErrorState
        title="Gateway Connection Error"
        message="Unable to fetch command center metrics from the FedSentinel backend."
        onRetry={() => refetch()}
        details={summaryError}
      />
    );
  }

  const clientColumns: Column<HospitalClient>[] = [
    {
      header: "Node ID",
      accessorKey: "client_id",
      cell: (item) => (
        <span className="font-mono font-bold text-cyan-400">{item.client_id}</span>
      ),
      sortable: true,
    },
    {
      header: "Hospital Name",
      accessorKey: "name",
      cell: (item) => (
        <div>
          <div className="font-medium text-slate-100">{item.name}</div>
          <div className="text-[10px] text-slate-400">{item.department}</div>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Enclave Security",
      accessorKey: "enclave_type",
      cell: (item) => (
        <span className="text-xs font-mono text-slate-300 flex items-center gap-1">
          <Lock className="w-3 h-3 text-cyan-400" />
          {item.enclave_type}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (item) => <StatusBadge status={item.status} />,
      sortable: true,
    },
    {
      header: "Trust Score",
      accessorKey: "trust_score",
      cell: (item) => <TrustIndicator score={item.trust_score} size="sm" showLabel={false} />,
      sortable: true,
    },
    {
      header: "Clinical Samples",
      accessorKey: "samples_count",
      cell: (item) => (
        <span className="font-mono text-slate-300">{item.samples_count.toLocaleString()}</span>
      ),
      sortable: true,
    },
    {
      header: "Action",
      cell: (item) => (
        <button
          onClick={() => navigate(`/hospital/${item.client_id}`)}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Enclave</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      ),
    },
  ];

  const roundColumns: Column<FederationRound>[] = [
    {
      header: "Round",
      accessorKey: "round_id",
      cell: (item) => <span className="font-mono font-bold text-slate-100">Round #{item.round_id}</span>,
      sortable: true,
    },
    {
      header: "Consensus Status",
      accessorKey: "status",
      cell: (item) => <StatusBadge status={item.status} />,
      sortable: true,
    },
    {
      header: "Global Accuracy",
      accessorKey: "global_accuracy",
      cell: (item) => (
        <span className="font-mono font-bold text-emerald-400">
          {item.global_accuracy ? `${item.global_accuracy.toFixed(1)}%` : "N/A"}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Participating",
      cell: (item) => (
        <span className="font-mono text-xs text-slate-300">
          {item.participating_clients?.length || 0} nodes
        </span>
      ),
    },
    {
      header: "Quarantined",
      cell: (item) => (
        <span className="font-mono text-xs text-rose-400">
          {item.quarantined_clients?.length || 0} quarantined
        </span>
      ),
    },
    {
      header: "Timestamp",
      accessorKey: "timestamp",
      cell: (item) => (
        <span className="text-[11px] text-slate-400 font-mono">
          {new Date(item.timestamp).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Federation SecOps Command Center</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              ZERO-TRUST
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Byzantine anomaly detection, gradient verification, and consensus monitoring across clinical nodes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/audit")}
            className="text-xs px-3 py-1.5 rounded-md border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
          >
            Audit Chain
          </button>
          <button
            onClick={() => navigate("/federation")}
            className="text-xs px-3 py-1.5 rounded-md bg-cyan-600 text-white hover:bg-cyan-500 transition-colors font-medium"
          >
            View All Rounds
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Hospital Nodes"
          value={summary?.active_hospitals || clients.length}
          subValue="Consortium Enclaves"
          icon={<Building2 className="w-4 h-4 text-cyan-400" />}
          trend="up"
          trendValue="+1 node"
          trendLabel="this month"
          onClick={() => navigate("/trust")}
        />

        <MetricCard
          title="Consensus Accuracy"
          value={`${summary?.global_accuracy ? summary.global_accuracy.toFixed(1) : "94.5"}%`}
          subValue="Medical CNN (37.8k params)"
          icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
          trend="up"
          trendValue="+1.2%"
          trendLabel="vs baseline"
          onClick={() => navigate("/models")}
        />

        <MetricCard
          title="Adversarial Quarantines"
          value={summary?.quarantined_nodes ?? 0}
          subValue="Compromised Nodes"
          icon={<ShieldAlert className="w-4 h-4 text-rose-400" />}
          trend={summary && summary.quarantined_nodes > 0 ? "down" : "neutral"}
          trendValue={summary && summary.quarantined_nodes > 0 ? "Threat Active" : "Nominal"}
          trendLabel="quarantine active"
          onClick={() => navigate("/incidents")}
          className={summary && summary.quarantined_nodes > 0 ? "border-rose-900/60 bg-rose-950/20" : ""}
        />

        <MetricCard
          title="Total Federation Rounds"
          value={summary?.latest_round_id || rounds[0]?.round_id || 24}
          subValue="Byzantine-Robust Consensus"
          icon={<Network className="w-4 h-4 text-cyan-400" />}
          trend="neutral"
          trendValue="Trust-Weighted"
          trendLabel="aggregation"
          onClick={() => navigate("/federation")}
        />
      </div>

      {/* Incidents Attention Alert (if open incidents exist) */}
      {incidents.filter((i) => i.action_taken === "QUARANTINED").length > 0 && (
        <div className="p-4 rounded-lg border border-rose-800/80 bg-rose-950/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-rose-900/50 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-rose-200">
                Adversarial Attack Isolated — Node Quarantined
              </div>
              <div className="text-xs text-rose-300/80">
                Layer 2 MAD Anomaly Detector flagged anomalous gradient deltas. Consensus integrity preserved.
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate("/incidents")}
            className="text-xs font-semibold px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
          >
            Investigate Incident
          </button>
        </div>
      )}

      {/* Hospital Enclave Nodes Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Registered Hospital Enclaves
          </h2>
          <span className="text-xs text-slate-400">
            {clients.length} nodes registered across 7 regional health sectors
          </span>
        </div>
        <DataTable
          columns={clientColumns}
          data={clients}
          searchPlaceholder="Search hospital or department..."
          searchAccessor={(c) => `${c.name} ${c.client_id} ${c.department}`}
          pageSize={6}
        />
      </div>

      {/* Recent Consensus Rounds */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Consensus Round Lineage
          </h2>
          <span className="text-xs text-slate-400">
            Tamper-evident verification applied to all parameter checkpoints
          </span>
        </div>
        <DataTable
          columns={roundColumns}
          data={rounds}
          searchPlaceholder="Search rounds..."
          searchAccessor={(r) => `Round #${r.round_id} ${r.status}`}
          pageSize={5}
        />
      </div>
    </div>
  );
};
