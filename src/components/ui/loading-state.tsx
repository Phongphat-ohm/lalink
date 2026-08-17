import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  size?: "sm" | "default" | "lg";
}

export function LoadingState({
  message = "กำลังโหลดข้อมูล...",
  size = "default",
  className,
  ...props
}: LoadingStateProps) {
  const iconSize = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12",
  }[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center text-slate-500",
        className,
      )}
      {...props}
    >
      <Loader2 className={cn("animate-spin text-teal-600 mb-3", iconSize)} />
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
}
