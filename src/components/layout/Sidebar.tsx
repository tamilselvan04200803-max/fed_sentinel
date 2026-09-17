import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ShieldAlert,
  Activity,
  Network,
  Building2,
  FileCheck2,
  Sliders,
  Sparkles,
  Server,
  Layers,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "@/src/services/auth/authStore";
import { useFedSentinelStore } from "@/src/store/useFedSentinelStore";
import { StatusBadge } from "@/src/components/data-display/StatusBadge";
import { cn } from "@/src/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: string;
  roles?: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  className,
}) => {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const activeHospitalId = useFedSentinelStore((s) => s.activeHospitalId);

  const navGroups: { label: string; items: NavItem[] }[] = [
    {
      label: "OPERATIONS",
      items: [
        {
          title: "Command Center",
          path: "/",
          icon: <Activity className="w-4 h-4" />,
        },
        {
          title: "Federation Rounds",
          path: "/federation",
          icon: <Network className="w-4 h-4" />,
        },
        {
          title: "Hospital Workstation",
          path: `/hospital/${activeHospitalId || "H1"}`,
          icon: <Building2 className="w-4 h-4" />,
          badge: activeHospitalId || "H1",
        },
      ],
    },
    {
      label: "SECURITY & TRUST",
      items: [
        {
          title: "Incidents & Forensics",
          path: "/incidents",
          icon: <ShieldAlert className="w-4 h-4" />,
        },
        {
          title: "Trust Center",
          path: "/trust",
          icon: <ShieldCheck className="w-4 h-4" />,
        },
        {
          title: "Security Gateway",
          path: "/security",
          icon: <Sliders className="w-4 h-4" />,
        },
      ],
    },
    {
      label: "GOVERNANCE & AUDIT",
      items: [
        {
          title: "Model Registry",
          path: "/models",
          icon: <Layers className="w-4 h-4" />,
        },
        {
          title: "Tamper-Evident Audit",
          path: "/audit",
          icon: <FileCheck2 className="w-4 h-4" />,
        },
        {
          title: "System Health",
          path: "/health",
          icon: <Server className="w-4 h-4" />,
        },
      ],
    },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-slate-800/80 bg-slate-950/95 backdrop-blur-md transition-all duration-300 z-30",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/80">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>FedSentinel</span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40">
                  HEALTH
                </span>
              </div>
              <div className="text-[10px] text-slate-400">Zero-Trust Control Plane</div>
            </div>
          </Link>
        )}

        {collapsed && (
          <Link to="/" className="mx-auto flex items-center justify-center w-8 h-8 rounded-md bg-cyan-500 text-white">
            <ShieldCheck className="w-5 h-5" />
          </Link>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-500">
                {group.label}
              </div>
            )}
            {group.items.map((item, iIdx) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={iIdx}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all group",
                    active
                      ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <span className={cn("transition-colors", active ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200")}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="flex-1 truncate">{item.title}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-cyan-400">
                {user?.name ? user.name[0] : "A"}
              </div>
              <div className="truncate">
                <div className="text-xs font-medium text-slate-200 truncate">{user?.name || "Analyst"}</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{user?.role || "SOC_ANALYST"}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full flex justify-center p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
