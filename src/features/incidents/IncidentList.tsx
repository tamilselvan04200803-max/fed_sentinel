import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Filter,
  Flame,
  Zap,
} from "lucide-react";
import { DataTable, Column } from "@/src/components/data-display/DataTable";
import { StatusBadge } from "@/src/components/data-display/StatusBadge";
import { LoadingState } from "@/src/components/feedback/LoadingState";
import { Button } from "@/src/components/ui/button";
import { useIncidents } from "@/src/hooks/queries/useIncidents";
import { useFedSentinelStore } from "@/src/store/useFedSentinelStore";
import { Incident } from "@/src/types";

export const IncidentList: React.FC = () => {
  const navigate = useNavigate();
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const { data: incidents = [], isLoading } = useIncidents();
  const setSimulationModalOpen = useFedSentinelStore((s) => s.setSimulationModalOpen);

  if (isLoading) {
    return <LoadingState message="Fetching adversarial incident forensics and blast radius assessments..." />;
  }

  const filteredIncidents = filterSeverity === "ALL"
    ? incidents
    : incidents.filter((i) => i.severity?.toUpperCase() === filterSeverity);

  const columns: Column<Incident>[] = [
    {
      header: "Incident ID",
      accessorKey: "incident_id",
      cell: (item) => (
        <span className="font-mono font-bold text-rose-400">{item.incident_id}</span>
      ),
      sortable: true,
    },
    {
      header: "Target Enclave",
      accessorKey: "client_id",
      cell: (item) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
          {item.client_id}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Consensus Round",
      accessorKey: "round_id",
      cell: (item) => <span className="font-mono text-slate-300">Round #{item.round_id}</span>,
      sortable: true,
    },
    {
      header: "Threat Hypothesis",
      accessorKey: "threat_hypothesis",
      cell: (item) => (
        <div className="flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-medium text-slate-200">{item.threat_hypothesis}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Severity",
      accessorKey: "severity",
      cell: (item) => <StatusBadge status={item.severity} />,
      sortable: true,
    },
    {
      header: "Action Taken",
      accessorKey: "action_taken",
      cell: (item) => <StatusBadge status={item.action_taken} />,
      sortable: true,
    },
    {
      header: "Trust Impact",
      cell: (item) => (
        <span className="font-mono text-xs text-rose-400">
          {item.trust_before && item.trust_after
            ? `${item.trust_before.toFixed(0)} → ${item.trust_after.toFixed(0)} (${(item.trust_after - item.trust_before).toFixed(0)})`
            : "-35 pts"}
        </span>
      ),
    },
    {
      header: "Investigation",
      cell: (item) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/incidents/${item.incident_id}`)}
          className="h-7 text-xs text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-500 gap-1"
        >
          <span>Forensics</span>
          <ArrowRight className="w-3 h-3" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span>Adversarial Incidents & Forensics Cockpit</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Zero-Trust quarantine events, model poisoning attempts, and gradient anomaly evidence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setSimulationModalOpen(true)}
            className="text-xs gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Inject Attack Simulation</span>
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-2 p-3 rounded-lg border border-slate-800 bg-slate-900/50">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs text-slate-400 font-medium">Filter Severity:</span>
        {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((lvl) => (
          <button
            key={lvl}
            onClick={() => setFilterSeverity(lvl)}
            className={`text-xs px-2.5 py-1 rounded transition-colors font-medium cursor-pointer ${
              filterSeverity === lvl
                ? "bg-slate-800 text-cyan-400 border border-slate-750"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* Incidents Table */}
      <DataTable
        columns={columns}
        data={filteredIncidents}
        searchPlaceholder="Search by incident ID, client, or threat..."
        searchAccessor={(i) => `${i.incident_id} ${i.client_id} ${i.threat_hypothesis} ${i.severity}`}
        pageSize={10}
      />
    </div>
  );
};
