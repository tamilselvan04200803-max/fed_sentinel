import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/src/lib/utils";

const ROUTE_LABELS: Record<string, string> = {
  "": "Command Center",
  federation: "Federation Rounds",
  incidents: "Security Incidents",
  trust: "Trust Center",
  security: "Security Gateway",
  models: "Model Registry",
  hospital: "Hospital Enclave",
  audit: "Audit Ledger",
  health: "System Health",
  login: "Authentication",
};

export const Breadcrumbs: React.FC<{ className?: string }> = ({ className }) => {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-1.5 text-xs text-slate-400 py-2.5 px-6 border-b border-slate-800/40 bg-slate-950/40", className)}
    >
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-slate-200 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Command Center</span>
      </Link>

      {segments.map((segment, idx) => {
        const path = `/${segments.slice(0, idx + 1).join("/")}`;
        const isLast = idx === segments.length - 1;
        const label = ROUTE_LABELS[segment] || segment.toUpperCase();

        return (
          <React.Fragment key={path}>
            <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
            {isLast ? (
              <span className="font-medium text-slate-200 truncate">{label}</span>
            ) : (
              <Link to={path} className="hover:text-slate-200 transition-colors truncate">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
