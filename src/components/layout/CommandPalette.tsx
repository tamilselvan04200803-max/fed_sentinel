import React, { useEffect } from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Network,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Layers,
  FileCheck2,
  Server,
  Building2,
  Zap,
  Play,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useFedSentinelStore } from "@/src/store/useFedSentinelStore";
import { apiRequest } from "@/src/services/api/apiClient";
import { queryClient } from "@/src/lib/queryClient";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const setSimulationModalOpen = useFedSentinelStore((s) => s.setSimulationModalOpen);
  const setStartRoundModalOpen = useFedSentinelStore((s) => s.setStartRoundModalOpen);
  const setActivePersona = useFedSentinelStore((s) => s.setActivePersona);
  const addToast = useFedSentinelStore((s) => s.addToast);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  if (!open) return null;

  const runCommand = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  const handleResetDemo = async () => {
    try {
      await apiRequest("/api/demo/reset", { method: "POST" });
      queryClient.invalidateQueries();
      addToast({
        type: "success",
        title: "Demo State Reset",
        message: "All hospital nodes, trust scores, and telemetry reset to pristine baseline.",
      });
    } catch (e: any) {
      addToast({
        type: "error",
        title: "Reset Failed",
        message: e.message || "Failed to reset demo state",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-xl border border-slate-750 bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
        <Command label="Command Palette" className="w-full">
          <div className="flex items-center border-b border-slate-800 px-3">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <Command.Input
              placeholder="Type a command, page, or action..."
              className="w-full bg-transparent py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              autoFocus
            />
            <button
              onClick={() => onOpenChange(false)}
              className="p-1 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2 text-xs text-slate-300">
            <Command.Empty className="py-6 text-center text-slate-500">
              No matching commands or navigation routes.
            </Command.Empty>

            <Command.Group heading="Navigation" className="px-2 py-1.5 text-[10px] uppercase font-bold text-slate-500">
              <Command.Item
                onSelect={() => runCommand(() => navigate("/"))}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-slate-800 hover:text-cyan-400 cursor-pointer"
              >
                <Activity className="w-4 h-4 text-slate-400" />
                <span>Command Center Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate("/federation"))}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-slate-800 hover:text-cyan-400 cursor-pointer"
              >
                <Network className="w-4 h-4 text-slate-400" />
                <span>Federation Consensus Rounds</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate("/incidents"))}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-slate-800 hover:text-rose-400 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Security Incidents & Forensics Cockpit</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate("/trust"))}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-slate-800 hover:text-emerald-400 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Trust Center & Explainability Profiles</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate("/models"))}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-slate-800 hover:text-cyan-400 cursor-pointer"
              >
                <Layers className="w-4 h-4 text-slate-400" />
                <span>Model Registry & Clinical Model Card</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate("/hospital/H1"))}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-slate-800 hover:text-cyan-400 cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>Hospital Workstation (Local Training Enclave)</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate("/audit"))}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-slate-800 hover:text-cyan-400 cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4 text-slate-400" />
                <span>Tamper-Evident SHA-256 Audit Ledger</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate("/health"))}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-slate-800 hover:text-cyan-400 cursor-pointer"
              >
                <Server className="w-4 h-4 text-slate-400" />
                <span>System Health & Prometheus Telemetry</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="SecOps Actions" className="px-2 py-1.5 text-[10px] uppercase font-bold text-slate-500 mt-2">
              <Command.Item
                onSelect={() => runCommand(() => setStartRoundModalOpen(true))}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-slate-800 hover:text-cyan-400 cursor-pointer"
              >
                <Play className="w-4 h-4 text-cyan-400" />
                <span>Execute Federated Learning Consensus Round</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => setSimulationModalOpen(true))}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-slate-800 hover:text-rose-400 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-rose-400" />
                <span>Simulate Adversarial Attack (Backdoor, Poisoning)</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => setActivePersona("HOSPITAL"))}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-slate-800 hover:text-cyan-400 cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>Switch Persona: Hospital Clinical ML Operator</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => setActivePersona("SOC"))}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-slate-800 hover:text-cyan-400 cursor-pointer"
              >
                <Activity className="w-4 h-4 text-slate-400" />
                <span>Switch Persona: SecOps Analyst</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(handleResetDemo)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-slate-800 hover:text-amber-400 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <span>Reset Demonstration Telemetry to Baseline</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="border-t border-slate-800 px-3 py-2 text-[10px] text-slate-500 flex justify-between items-center bg-slate-950/60">
            <span>Use Arrow keys to navigate, Enter to select</span>
            <kbd className="font-mono px-1 rounded bg-slate-800 text-slate-400">ESC to close</kbd>
          </div>
        </Command>
      </div>
    </div>
  );
};
