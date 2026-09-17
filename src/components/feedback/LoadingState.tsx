import React from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils";

interface LoadingStateProps {
  message?: string;
  variant?: "spinner" | "skeleton" | "card";
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Verifying cryptographic telemetry...",
  variant = "spinner",
  className,
}) => {
  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-3 p-4", className)}>
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-2", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-5 rounded-lg border border-slate-800 bg-slate-900/50 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center rounded-lg border border-slate-800/60 bg-slate-900/30",
        className
      )}
    >
      <div className="relative flex items-center justify-center mb-3">
        <Loader2 className="w-8 h-8 text-brand-cyan animate-spin" />
        <ShieldCheck className="w-4 h-4 text-brand-cyan/60 absolute" />
      </div>
      <p className="text-xs font-medium text-slate-300 tracking-wide">{message}</p>
      <span className="text-[10px] text-slate-500 mt-1">FedSentinel-Health Enclave Gateway</span>
    </div>
  );
};
