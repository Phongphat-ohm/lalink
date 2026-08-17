import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-10 w-full rounded-xl border border-[#a8c3de]/60 bg-white px-3.5 py-2 text-xs sm:text-sm text-[#0d253d] focus-visible:outline-none focus-visible:border-[#533afd] focus-visible:ring-2 focus-visible:ring-[#533afd]/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all box-border min-w-0 leading-normal",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";

export { Select };
