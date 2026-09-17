import React, { useState } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Server,
  Activity,
  Cpu,
  Radio,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { HospitalClient } from "@/src/types";
import { StatusBadge } from "@/src/components/data-display/StatusBadge";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

interface NetworkTopologyProps {
  clients: HospitalClient[];
  selectedClientId: string | null;
  onSelectClient: (clientId: string) => void;
  onNavigateToWorkstation?: (clientId: string) => void;
  className?: string;
}

export const NetworkTopology: React.FC<NetworkTopologyProps> = ({
  clients,
  selectedClientId,
  onSelectClient,
  onNavigateToWorkstation,
  className,
}) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Selected client details
  const selectedClient = clients.find((c) => c.client_id === selectedClientId) || null;

  // Geometry calculations for a radial layout:
  // Center is at (300, 240) in a 600x480 coordinate space
  const centerX = 300;
  const centerY = 240;
  const radius = 175;

  const totalClients = clients.length;

  return (
    <div
      className={cn(
        "relative rounded-xl border border-slate-800 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-md overflow-hidden",
        className
      )}
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h2 className="text-base font-semibold text-slate-100 tracking-wide">
              Live Operational Network Topology
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800">
              ZERO-TRUST STAR TOPOLOGY
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time gradient vector links between local hospital enclaves and central aggregation gateway.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span>Clean Enclave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span>Free-Rider / Drift</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
            <span>Quarantined</span>
          </div>
        </div>
      </div>

      {/* Main Container: SVG Graph + Details Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* SVG Visualization Canvas (7 cols on large displays) */}
        <div className="lg:col-span-7 flex justify-center relative">
          <svg
            viewBox="0 0 600 480"
            className="w-full max-w-[540px] h-auto select-none overflow-visible"
          >
            {/* Background grid concentric circles */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke="#1e293b"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <circle
              cx={centerX}
              cy={centerY}
              r={radius * 0.55}
              fill="none"
              stroke="#0f172a"
              strokeWidth="1"
            />

            {/* Connecting Edges from Central Gateway to Nodes */}
            {clients.map((client, index) => {
              const angle = (index * 2 * Math.PI) / totalClients - Math.PI / 2;
              const nodeX = centerX + radius * Math.cos(angle);
              const nodeY = centerY + radius * Math.sin(angle);

              const isQuarantined = client.status === "QUARANTINED";
              const isSelected = client.client_id === selectedClientId;
              const isHovered = client.client_id === hoveredNodeId;

              const strokeColor = isQuarantined
                ? "#e11d48" // rose-600
                : isSelected || isHovered
                ? "#06b6d4" // cyan-500
                : "#334155"; // slate-700

              return (
                <g key={`edge-${client.client_id}`}>
                  {/* Connection Line */}
                  <line
                    x1={centerX}
                    y1={centerY}
                    x2={nodeX}
                    y2={nodeY}
                    stroke={strokeColor}
                    strokeWidth={isSelected || isHovered ? 2.5 : 1.5}
                    strokeDasharray={isQuarantined ? "6 4" : undefined}
                    className="transition-colors duration-300"
                  />

                  {/* Animated telemetry pulse for non-quarantined nodes */}
                  {!isQuarantined && (
                    <circle r="3.5" fill="#38bdf8">
                      <animateMotion
                        dur={`${2.5 + index * 0.4}s`}
                        repeatCount="indefinite"
                        path={`M ${nodeX} ${nodeY} L ${centerX} ${centerY}`}
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Central Gateway Hub */}
            <g className="cursor-pointer">
              {/* Outer pulsing beacon ring */}
              <circle
                cx={centerX}
                cy={centerY}
                r="46"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1"
                opacity="0.3"
                className="animate-ping"
                style={{ animationDuration: "3s" }}
              />

              {/* Gateway Core */}
              <circle
                cx={centerX}
                cy={centerY}
                r="38"
                fill="#09182a"
                stroke="#06b6d4"
                strokeWidth="2.5"
                className="drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]"
              />

              <Shield
                x={centerX - 13}
                y={centerY - 16}
                width="26"
                height="26"
                className="text-cyan-400 pointer-events-none"
              />

              <text
                x={centerX}
                y={centerY + 20}
                textAnchor="middle"
                className="text-[11px] font-bold fill-cyan-300 font-mono tracking-wider pointer-events-none"
              >
                GATEWAY
              </text>
            </g>

            {/* Hospital Enclave Nodes */}
            {clients.map((client, index) => {
              const angle = (index * 2 * Math.PI) / totalClients - Math.PI / 2;
              const nodeX = centerX + radius * Math.cos(angle);
              const nodeY = centerY + radius * Math.sin(angle);

              const isQuarantined = client.status === "QUARANTINED";
              const isFreeRider = client.trust_score < 60 && !isQuarantined;
              const isSelected = client.client_id === selectedClientId;
              const isHovered = client.client_id === hoveredNodeId;

              const nodeColor = isQuarantined
                ? "#f43f5e" // rose-500
                : isFreeRider
                ? "#f59e0b" // amber-500
                : "#10b981"; // emerald-500

              return (
                <g
                  key={`node-${client.client_id}`}
                  className="cursor-pointer transition-transform duration-200"
                  onClick={() => onSelectClient(client.client_id)}
                  onMouseEnter={() => setHoveredNodeId(client.client_id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  {/* Selection Glow */}
                  {(isSelected || isHovered) && (
                    <circle
                      cx={nodeX}
                      cy={nodeY}
                      r="34"
                      fill="none"
                      stroke={nodeColor}
                      strokeWidth="2"
                      strokeDasharray="4 3"
                      className="animate-spin"
                      style={{ animationDuration: "8s" }}
                    />
                  )}

                  {/* Node Background */}
                  <circle
                    cx={nodeX}
                    cy={nodeY}
                    r="26"
                    fill="#0f172a"
                    stroke={nodeColor}
                    strokeWidth={isSelected ? "3" : "2"}
                    className="drop-shadow-md"
                  />

                  {/* Node Icon */}
                  {isQuarantined ? (
                    <ShieldAlert
                      x={nodeX - 11}
                      y={nodeY - 11}
                      width="22"
                      height="22"
                      className="text-rose-400 pointer-events-none"
                    />
                  ) : (
                    <Server
                      x={nodeX - 10}
                      y={nodeY - 10}
                      width="20"
                      height="20"
                      className={cn(
                        "pointer-events-none",
                        isFreeRider ? "text-amber-400" : "text-emerald-400"
                      )}
                    />
                  )}

                  {/* Node Client ID Pill */}
                  <rect
                    x={nodeX - 22}
                    y={nodeY + 32}
                    width="44"
                    height="18"
                    rx="4"
                    fill="#020617"
                    stroke={isSelected ? "#38bdf8" : "#334155"}
                    strokeWidth="1"
                  />
                  <text
                    x={nodeX}
                    y={nodeY + 45}
                    textAnchor="middle"
                    className={cn(
                      "text-xs font-bold font-mono pointer-events-none",
                      isQuarantined
                        ? "fill-rose-400"
                        : isFreeRider
                        ? "fill-amber-400"
                        : "fill-slate-200"
                    )}
                  >
                    {client.client_id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Node Inspection Drawer (5 cols on large displays) */}
        <div className="lg:col-span-5">
          {selectedClient ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      {selectedClient.client_name}
                    </h3>
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {selectedClient.client_id}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {selectedClient.hospital_type || "Tertiary Referral Hospital"} &bull; {selectedClient.city || "Regional Hub"}
                  </p>
                </div>
                <StatusBadge status={selectedClient.status} />
              </div>

              {/* Key Diagnostic Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-md bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400 block">Trust Score</span>
                  <span
                    className={cn(
                      "text-xl font-bold font-mono",
                      selectedClient.trust_score >= 80
                        ? "text-emerald-400"
                        : selectedClient.trust_score >= 60
                        ? "text-amber-400"
                        : "text-rose-400"
                    )}
                  >
                    {selectedClient.trust_score.toFixed(1)} / 100
                  </span>
                </div>

                <div className="p-3 rounded-md bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400 block">Enclave Type</span>
                  <span className="text-sm font-semibold text-cyan-300 truncate block">
                    {selectedClient.enclave_type || "Intel SGX Enclave"}
                  </span>
                </div>

                <div className="p-3 rounded-md bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400 block">Attestation Status</span>
                  <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    SIMULATED (DEV)
                  </span>
                </div>

                <div className="p-3 rounded-md bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400 block">Dataset Volume</span>
                  <span className="text-sm font-semibold text-slate-200 block mt-0.5">
                    {selectedClient.samples_count.toLocaleString()} DICOM Scans
                  </span>
                </div>
              </div>

              {/* Status Rationale / Alert Box */}
              {selectedClient.status === "QUARANTINED" ? (
                <div className="p-3 rounded-md bg-rose-950/40 border border-rose-800/80 text-rose-300 text-sm space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Quarantined Node Notice</span>
                  </div>
                  <p className="text-xs text-rose-300/90 leading-relaxed">
                    This node has been isolated by the Layer-2 Anomaly Gate due to directional gradient divergence. Parameter updates are dropped at gateway boundary.
                  </p>
                </div>
              ) : selectedClient.trust_score < 60 ? (
                <div className="p-3 rounded-md bg-amber-950/40 border border-amber-800/80 text-amber-300 text-sm space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <Info className="w-4 h-4" />
                    <span>Elevated Free-Rider Risk</span>
                  </div>
                  <p className="text-xs text-amber-300/90 leading-relaxed">
                    Norm ratio relative to cohort median is under threshold (&rho; &lt; 0.05). Contribution integrity penalized to prevent free-riding.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-md bg-emerald-950/30 border border-emerald-800/60 text-emerald-300 text-sm">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Healthy Enclave Partner</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Node is in good standing. Quorum eligible for next consensus iteration.
                  </p>
                </div>
              )}

              {/* Action Button */}
              {onNavigateToWorkstation && (
                <Button
                  variant="outline"
                  onClick={() => onNavigateToWorkstation(selectedClient.client_id)}
                  className="w-full text-sm font-medium gap-2 justify-center border-slate-700 hover:border-cyan-500 hover:bg-cyan-950/20"
                >
                  <span>Open Node Workstation</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[260px] rounded-lg border border-dashed border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center p-6 text-center">
              <Activity className="w-8 h-8 text-slate-500 mb-2" />
              <h4 className="text-sm font-semibold text-slate-300">Select a Node to Inspect</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-[260px]">
                Click on any hospital enclave icon in the network topology diagram to review hardware quotes, dataset volumes, and trust telemetry.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
