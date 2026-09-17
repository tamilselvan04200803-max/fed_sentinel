import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-slate-800 text-slate-200",
        secondary:
          "border-slate-700 bg-slate-850 text-slate-300",
        destructive:
          "border-rose-500/40 bg-rose-500/20 text-rose-400",
        outline:
          "text-slate-300 border-slate-700",
        success:
          "border-emerald-500/40 bg-emerald-500/20 text-emerald-400",
        warning:
          "border-amber-500/40 bg-amber-500/20 text-amber-400",
        cyan:
          "border-cyan-500/40 bg-cyan-500/20 text-cyan-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
