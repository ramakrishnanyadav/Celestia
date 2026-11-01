"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    console.error("CELESTIA Route Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink-primary)] flex flex-col items-center justify-center p-6 text-center relative">
      <div className="mesh-backdrop" aria-hidden="true">
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
      </div>

      <div className="max-w-md p-8 rounded-3xl glass-card space-y-5 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-[var(--status-danger)] flex items-center justify-center mx-auto shadow-xs" aria-hidden="true">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--status-danger)]">
            Execution Interruption
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink-primary)] tracking-tight">
            Something Went Awry
          </h1>
          <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
            A temporary runtime exception occurred while synchronizing celebration state. Your persistent database ledger is untouched.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <Button
            onClick={() => reset()}
            variant="primary"
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Retry Synchronization
          </Button>
        </div>
      </div>
    </div>
  );
}

