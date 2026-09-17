import React from "react";
import { FolderSearch, Inbox } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No records found",
  description = "No items match your query or filter criteria in the current federation state.",
  icon,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-lg border border-dashed border-slate-800 bg-slate-900/40",
        className
      )}
    >
      <div className="p-3 rounded-full bg-slate-800/80 border border-slate-750 text-slate-400 mb-3">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
      <p className="mt-1 text-xs text-slate-400 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          className="mt-4 text-xs"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
