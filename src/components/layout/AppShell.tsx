import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/src/components/layout/Sidebar";
import { TopBar } from "@/src/components/layout/TopBar";
import { Breadcrumbs } from "@/src/components/layout/Breadcrumbs";
import { CommandPalette } from "@/src/components/layout/CommandPalette";
import { Toaster } from "@/src/components/ui/sonner";
import { SimulationModal } from "@/src/components/common/SimulationModal";
import { StartRoundModal } from "@/src/components/common/StartRoundModal";
import { wsManager } from "@/src/services/realtime/wsManager";

export const AppShell: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Initialize and maintain authenticated WebSocket connection on app shell mount
  useEffect(() => {
    wsManager.connect();
    return () => {
      wsManager.disconnect();
    };
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Persistent left sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      {/* Main app viewport */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
        <Breadcrumbs />

        <main className="flex-1 overflow-y-auto p-6 bg-slate-950/60">
          <Outlet />
        </main>
      </div>

      {/* Global Modals & Controls */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
      <SimulationModal />
      <StartRoundModal />
      <Toaster position="top-right" richColors />
    </div>
  );
};
