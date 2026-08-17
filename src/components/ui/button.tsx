import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#533afd] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#533afd] text-white shadow-xs hover:bg-[#4434d4] active:bg-[#2e2b8c]",
        destructive:
          "bg-[#ea2261] text-white shadow-xs hover:bg-[#d01750] active:bg-[#a81040]",
        outline:
          "border border-[#e3e8ee] bg-white text-[#0d253d] hover:bg-[#f6f9fc] hover:border-[#533afd] hover:text-[#533afd]",
        secondary:
          "border border-[#533afd] bg-white text-[#533afd] hover:bg-[#f6f9fc]",
        ghost: "text-[#273951] hover:bg-[#f6f9fc] hover:text-[#0d253d]",
        link: "text-[#533afd] underline-offset-4 hover:underline p-0 h-auto",
        dark: "bg-[#1c1e54] text-white hover:bg-[#0d253d]",
      },
      size: {
        default: "h-9 px-4 py-2 text-xs sm:text-sm font-medium",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6 text-sm font-semibold",
        icon: "h-9 w-9 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
