import React, { useState } from "react";
import { AlertOctagon, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  errorCode?: string | number;
  details?: any;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Service Communication Error",
  message = "Unable to complete request with the FedSentinel Zero-Trust Gateway. The backend service may be undergoing maintenance or unreachable.",
  errorCode,
  details,
  onRetry,
  className,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-lg border border-rose-900/40 bg-rose-950/20 max-w-xl mx-auto my-4",
        className
      )}
    >
      <div className="p-3 rounded-full bg-rose-900/30 border border-rose-800/50 text-rose-400 mb-3">
        <AlertOctagon className="w-6 h-6" />
      </div>

      <div className="flex items-center gap-2">
        <h4 className="text-sm font-semibold text-rose-200">{title}</h4>
        {errorCode && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900/40 text-rose-300 border border-rose-700/50">
            {errorCode}
          </span>
        )}
      </div>

      <p className="mt-1.5 text-xs text-rose-300/80 max-w-md">{message}</p>

      <div className="mt-4 flex items-center gap-3">
        {onRetry && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onRetry}
            className="text-xs gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Operation</span>
          </Button>
        )}

        {details && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-slate-400 hover:text-slate-200 gap-1"
          >
            <span>Diagnostic Details</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
        )}
      </div>

      {showDetails && details && (
        <div className="mt-4 w-full text-left p-3 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400 overflow-x-auto max-h-48">
          <pre>{typeof details === "string" ? details : JSON.stringify(details, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
