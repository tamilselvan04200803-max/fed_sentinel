import React from "react";
import { Badge } from "@/src/components/ui/badge";
import { ShieldCheck, ShieldAlert, AlertTriangle, Lock, Clock, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/src/lib/utils";

export type EntityStatus =
  | "TRUSTED"
  | "ACTIVE"
  | "ONLINE"
  | "COMPLETED"
  | "VERIFIED"
  | "REVIEW"
  | "OBSERVATION"
  | "IN_PROGRESS"
  | "WARNING"
  | "QUARANTINED"
  | "CRITICAL"
  | "FAILED"
  | "TAMPER_DETECTED"
  | "BLOCKED"
  | "SUSPENDED"
  | "OFFLINE"
  | "DRAFT"
  | string;

interface StatusBadgeProps {
  status: EntityStatus;
  label?: string;
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  showIcon = true,
  className,
}) => {
  const norm = (status || "").toUpperCase().trim();
  const displayLabel = label || norm.replace(/_/g, " ");

  if (["TRUSTED", "ACTIVE", "ONLINE", "COMPLETED", "VERIFIED", "PASS", "SAFE"].includes(norm)) {
    return (
      <Badge variant="success" className={cn("gap-1 font-medium", className)}>
        {showIcon && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
        <span>{displayLabel}</span>
      </Badge>
    );
  }

  if (["REVIEW", "OBSERVATION", "IN_PROGRESS", "WARNING", "ELEVATED"].includes(norm)) {
    return (
      <Badge variant="warning" className={cn("gap-1 font-medium", className)}>
        {showIcon && <AlertTriangle className="w-3 h-3 text-amber-400" />}
        <span>{displayLabel}</span>
      </Badge>
    );
  }

  if (["QUARANTINED", "CRITICAL", "FAILED", "TAMPER_DETECTED", "FAIL"].includes(norm)) {
    return (
      <Badge variant="destructive" className={cn("gap-1 font-medium", className)}>
        {showIcon && <ShieldAlert className="w-3 h-3 text-rose-400" />}
        <span>{displayLabel}</span>
      </Badge>
    );
  }

  if (["BLOCKED", "SUSPENDED", "OFFLINE"].includes(norm)) {
    return (
      <Badge variant="outline" className={cn("gap-1 border-rose-800/80 bg-rose-950/40 text-rose-300 font-medium", className)}>
        {showIcon && <XCircle className="w-3 h-3 text-rose-400" />}
        <span>{displayLabel}</span>
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={cn("gap-1 text-slate-400 font-medium", className)}>
      {showIcon && <Clock className="w-3 h-3" />}
      <span>{displayLabel}</span>
    </Badge>
  );
};
