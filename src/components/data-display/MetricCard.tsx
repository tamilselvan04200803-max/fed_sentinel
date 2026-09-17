import React from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  subtitleLeft?: React.ReactNode;
  subtitleRight?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  trendLabel?: string;
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subValue,
  subtitleLeft,
  subtitleRight,
  icon,
  trend,
  trendValue,
  trendLabel,
  onClick,
  className,
}) => {
  const isClickable = !!onClick;

  return (
    <Card
      onClick={onClick}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? "button" : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "relative overflow-hidden transition-all duration-200 border-slate-800/80 bg-slate-900/70",
        isClickable && "cursor-pointer hover:border-slate-700 hover:bg-slate-850/80 hover:shadow-md active:scale-[0.99]",
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {title}
          </span>
          {icon && (
            <div className="p-2 rounded-md bg-slate-800/60 border border-slate-750 text-slate-300">
              {icon}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-100 font-mono">
            {value}
          </span>
          {subValue && (
            <span className="text-xs text-slate-400">
              {subValue}
            </span>
          )}
        </div>

        {trend && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {trend === "up" && (
              <span className="flex items-center font-medium text-emerald-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {trendValue}
              </span>
            )}
            {trend === "down" && (
              <span className="flex items-center font-medium text-rose-400">
                <ArrowDownRight className="w-3.5 h-3.5" />
                {trendValue}
              </span>
            )}
            {trend === "neutral" && (
              <span className="flex items-center font-medium text-slate-400">
                <Minus className="w-3.5 h-3.5" />
                {trendValue}
              </span>
            )}
            {trendLabel && <span className="text-slate-500">{trendLabel}</span>}
          </div>
        )}

        {(subtitleLeft || subtitleRight) && (
          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <div>{subtitleLeft}</div>
            <div>{subtitleRight}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
