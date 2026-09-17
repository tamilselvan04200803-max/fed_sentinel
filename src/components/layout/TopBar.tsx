import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  Play,
  Zap,
  Search,
  Radio,
  Building,
  UserCheck,
  Globe,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { StatusBadge } from "@/src/components/data-display/StatusBadge";
import { useFedSentinelStore } from "@/src/store/useFedSentinelStore";
import { useAuthStore } from "@/src/services/auth/authStore";
import { useDashboardSummary } from "@/src/hooks/queries/useDashboardSummary";
import { cn } from "@/src/lib/utils";

interface TopBarProps {
  onOpenCommandPalette: () => void;
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenCommandPalette,
  className,
}) => {
  const { data: summary } = useDashboardSummary();
  const systemStatus = useFedSentinelStore((s) => s.systemStatus);
  const activePersona = useFedSentinelStore((s) => s.activePersona);
  const setActivePersona = useFedSentinelStore((s) => s.setActivePersona);
  const setStartRoundModalOpen = useFedSentinelStore((s) => s.setStartRoundModalOpen);
  const setSimulationModalOpen = useFedSentinelStore((s) => s.setSimulationModalOpen);
  const density = useFedSentinelStore((s) => s.density);
  const setDensity = useFedSentinelStore((s) => s.setDensity);
  const user = useAuthStore((s) => s.user);

  const threatLevel = summary?.threat_level || "NOMINAL";
  const isWsConnected = systemStatus.wsStatus === "connected";

  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between px-6 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md z-20",
        className
      )}
    >
      {/* Left items: Federation Consortium Selector & Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-brand-cyan" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-200">
              National Health Federated Grid
            </span>
            <span className="text-xs font-mono text-slate-400">
              FED-HEALTH-NATIONAL-01
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-800" />

        {/* Live WS connection status */}
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              isWsConnected ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-rose-500"
            )}
          />
          <span className="text-xs font-mono text-slate-300 font-medium">
            {isWsConnected ? "LIVE TELEMETRY" : "CONNECTING..."}
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <StatusBadge
            status={threatLevel}
            label={`THREAT: ${threatLevel}`}
            className="text-xs py-0.5"
          />
          {summary?.defense_mode === "ARMED" && (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
              ZERO-TRUST: ENFORCED
            </span>
          )}
        </div>
      </div>

      {/* Right items: Actions, Search, Density & Persona Switch */}
      <div className="flex items-center gap-3">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-800 bg-slate-900/60 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Quick actions & search</span>
          <kbd className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Ctrl+K
          </kbd>
        </button>

        {/* Action Buttons */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSimulationModalOpen(true)}
          className="hidden md:inline-flex text-xs text-rose-400 border-rose-900/50 bg-rose-950/20 hover:bg-rose-900/30 hover:border-rose-700 gap-1.5"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Simulate Attack</span>
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={() => setStartRoundModalOpen(true)}
          className="text-xs gap-1.5"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Execute Round</span>
        </Button>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* Density Mode Switch */}
        <div className="flex items-center rounded-md border border-slate-800 bg-slate-900 p-0.5 text-xs">
          <button
            onClick={() => setDensity("comfortable")}
            title="Comfortable layout: 16px body, relaxed spacing"
            className={cn(
              "px-2 py-1 rounded font-medium transition-all cursor-pointer",
              density === "comfortable"
                ? "bg-slate-800 text-cyan-400 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Comfortable
          </button>
          <button
            onClick={() => setDensity("compact")}
            title="Compact layout: 14px body, dense spacing"
            className={cn(
              "px-2 py-1 rounded font-medium transition-all cursor-pointer",
              density === "compact"
                ? "bg-slate-800 text-cyan-400 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Compact
          </button>
        </div>

        {/* Persona toggle */}
        <div className="flex items-center rounded-md border border-slate-800 bg-slate-900 p-0.5 text-xs">
          <button
            onClick={() => setActivePersona("SOC")}
            className={cn(
              "px-2.5 py-1 rounded font-medium transition-all cursor-pointer",
              activePersona === "SOC"
                ? "bg-slate-800 text-cyan-400 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            SOC
          </button>
          <button
            onClick={() => setActivePersona("HOSPITAL")}
            className={cn(
              "px-2.5 py-1 rounded font-medium transition-all cursor-pointer",
              activePersona === "HOSPITAL"
                ? "bg-slate-800 text-cyan-400 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Hospital
          </button>
        </div>
      </div>
    </header>
  );
};
