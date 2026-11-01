"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  title: string;
  description?: string | undefined;
  type: ToastType;
}

interface ToastOptions {
  description?: string | undefined;
  type?: ToastType | undefined;
}

interface ToastContextValue {
  showToast: (title: string, options?: ToastOptions | undefined) => void;
  success: (title: string, description?: string | undefined) => void;
  error: (title: string, description?: string | undefined) => void;
  info: (title: string, description?: string | undefined) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, options?: ToastOptions | undefined) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = {
        id,
        title,
        ...(options?.description !== undefined ? { description: options.description } : {}),
        type: options?.type ?? "info",
      };
      setToasts((prev) => [...prev.slice(-4), newToast]);
    },
    []
  );

  const success = useCallback(
    (title: string, description?: string | undefined) => {
      showToast(title, {
        ...(description !== undefined ? { description } : {}),
        type: "success",
      });
    },
    [showToast]
  );

  const error = useCallback(
    (title: string, description?: string | undefined) => {
      showToast(title, {
        ...(description !== undefined ? { description } : {}),
        type: "error",
      });
    },
    [showToast]
  );

  const info = useCallback(
    (title: string, description?: string | undefined) => {
      showToast(title, {
        ...(description !== undefined ? { description } : {}),
        type: "info",
      });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
        {children}
        {toasts.map((toast) => {
          const isError = toast.type === "error";
          const isSuccess = toast.type === "success";

          return (
            <ToastPrimitive.Root
              key={toast.id}
              onOpenChange={(open) => {
                if (!open) removeToast(toast.id);
              }}
              // WCAG AA: errors assertive, others polite
              aria-live={isError ? "assertive" : "polite"}
              role={isError ? "alert" : "status"}
              className={`flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 pointer-events-auto ${
                isError
                  ? "bg-red-50 dark:bg-red-950/80 border-red-300 dark:border-red-800 text-red-900 dark:text-red-100"
                  : isSuccess
                  ? "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
                  : "bg-[var(--canvas-card)] border-[var(--border-subtle)] text-[var(--ink-primary)]"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isError && (
                  <AlertCircle className="w-5 h-5 text-[var(--status-danger)]" aria-hidden="true" />
                )}
                {isSuccess && (
                  <CheckCircle2 className="w-5 h-5 text-[var(--status-success)]" aria-hidden="true" />
                )}
                {!isError && !isSuccess && (
                  <Info className="w-5 h-5 text-[var(--brand-teal)]" aria-hidden="true" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <ToastPrimitive.Title className="text-sm font-bold">
                  {toast.title}
                </ToastPrimitive.Title>
                {toast.description && (
                  <ToastPrimitive.Description className="mt-1 text-xs opacity-90">
                    {toast.description}
                  </ToastPrimitive.Description>
                )}
              </div>
              <ToastPrimitive.Close
                aria-label="Dismiss notification"
                className="shrink-0 p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-96 max-w-[calc(100vw-2rem)] p-0 m-0 list-none pointer-events-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
