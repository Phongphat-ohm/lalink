import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-tight transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-[#533afd] text-white",
        secondary: "bg-[#b9b9f9] text-[#2e2b8c] font-semibold",
        destructive:
          "bg-[#ffe4e6] text-[#ea2261] border border-[#fecdd3] font-semibold",
        success:
          "bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] font-semibold",
        warning:
          "bg-[#fffbeb] text-[#d97706] border border-[#fde68a] font-semibold",
        outline: "border border-[#e3e8ee] text-[#273951] bg-white",
        dark: "bg-[#1c1e54] text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
