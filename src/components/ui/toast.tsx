"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  subscribe(listener: ToastListener) {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  show(type: ToastType, message: string, title?: string, duration: number = 4000) {
    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastItem = { id, type, message, title, duration };
    this.toasts.push(item);
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
    return id;
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  success(message: string, title?: string) {
    return this.show("success", message, title);
  }

  error(message: string, title?: string) {
    return this.show("error", message, title);
  }

  warning(message: string, title?: string) {
    return this.show("warning", message, title);
  }

  info(message: string, title?: string) {
    return this.show("info", message, title);
  }
}

export const toast = new ToastManager();

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    return toast.subscribe((updatedToasts) => {
      setToasts(updatedToasts);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none p-2 sm:p-0">
      {toasts.map((item) => {
        let borderClass = "border-[#e3e8ee] bg-white text-[#0d253d]";
        let icon = <Info className="h-4 w-4 text-[#533afd] shrink-0" />;

        if (item.type === "success") {
          borderClass = "border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46]";
          icon = <CheckCircle2 className="h-4 w-4 text-[#059669] shrink-0" />;
        } else if (item.type === "error") {
          borderClass = "border-[#fecdd3] bg-[#ffe4e6] text-[#9f1239]";
          icon = <AlertCircle className="h-4 w-4 text-[#ea2261] shrink-0" />;
        } else if (item.type === "warning") {
          borderClass = "border-[#fde68a] bg-[#fffbeb] text-[#92400e]";
          icon = <AlertTriangle className="h-4 w-4 text-[#d97706] shrink-0" />;
        }

        return (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start justify-between p-3.5 rounded-2xl border shadow-lg transition-all duration-300 animate-in slide-in-from-top-3 fade-in ${borderClass}`}
          >
            <div className="flex items-start space-x-2.5 min-w-0 pr-2">
              <div className="mt-0.5">{icon}</div>
              <div className="space-y-0.5 min-w-0">
                {item.title && (
                  <p className="font-bold text-xs tracking-tight">{item.title}</p>
                )}
                <p className="text-xs leading-relaxed break-words">{item.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toast.dismiss(item.id)}
              className="text-current opacity-60 hover:opacity-100 p-0.5 rounded-lg transition-opacity cursor-pointer shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
