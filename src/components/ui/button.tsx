import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-cyan disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40 hover:bg-brand-cyan/30 hover:border-brand-cyan",
        primary:
          "bg-cyan-600 text-white shadow hover:bg-cyan-500",
        destructive:
          "bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30 hover:border-rose-500",
        outline:
          "border border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white",
        secondary:
          "bg-slate-800 text-slate-200 hover:bg-slate-700",
        ghost:
          "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100",
        link:
          "text-brand-cyan underline-offset-4 hover:underline",
        emerald:
          "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30",
        amber:
          "bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
