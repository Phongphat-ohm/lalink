import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-[#a8c3de]/60 bg-white px-3.5 py-2 text-xs sm:text-sm text-[#0d253d] placeholder:text-[#64748d]/60 focus-visible:outline-none focus-visible:border-[#533afd] focus-visible:ring-2 focus-visible:ring-[#533afd]/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all box-border min-w-0 leading-normal",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
