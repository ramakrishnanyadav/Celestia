"use client";

import React from "react";
import { Sparkles, ShieldCheck, Database, Calculator, HelpCircle } from "lucide-react";

export type ProvenanceSource =
  | "Benchmark"
  | "Formula"
  | "User prompt"
  | "Vendor quote"
  | "CPM Solver"
  | "What-If Engine"
  | string;

export type ConfidenceLevel = "High" | "Medium" | "Low" | string;

interface ProvenanceBadgeProps {
  source: ProvenanceSource;
  confidence?: ConfidenceLevel | undefined;
  assumption?: string | undefined;
  className?: string | undefined;
}

export function ProvenanceBadge({
  source,
  confidence = "High",
  assumption,
  className = "",
}: ProvenanceBadgeProps) {
  const getSourceIcon = (src: string) => {
    const s = src.toLowerCase();
    if (s.includes("formula") || s.includes("math")) {
      return <Calculator className="w-3 h-3 text-[var(--brand-teal)]" aria-hidden="true" />;
    }
    if (s.includes("benchmark") || s.includes("data")) {
      return <Database className="w-3 h-3 text-[var(--brand-indigo)]" aria-hidden="true" />;
    }
    if (s.includes("cpm") || s.includes("solver")) {
      return <ShieldCheck className="w-3 h-3 text-[var(--brand-marigold)]" aria-hidden="true" />;
    }
    return <Sparkles className="w-3 h-3 text-[var(--brand-teal)]" aria-hidden="true" />;
  };

  const confidenceColor =
    confidence.toLowerCase().includes("high")
      ? "text-[var(--status-success)] bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40"
      : confidence.toLowerCase().includes("med")
      ? "text-[var(--brand-marigold)] bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40"
      : "text-[var(--status-danger)] bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40";

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1.5 text-[11px] font-medium ${className}`}
      role="note"
      aria-label={`Data provenance: Source ${source}, confidence ${confidence}${assumption ? `, assumption: ${assumption}` : ""}`}
    >
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] text-[var(--ink-secondary)]">
        {getSourceIcon(source)}
        <span className="font-semibold text-[var(--ink-primary)]">Src:</span>
        <span className="truncate max-w-[120px]">{source}</span>
      </span>

      {confidence && (
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wider ${confidenceColor}`}
        >
          {confidence}
        </span>
      )}

      {assumption && (
        <span
          className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-help inline-flex items-center"
          title={`Underlying Assumption: ${assumption}`}
        >
          <HelpCircle className="w-3 h-3 ml-0.5" aria-hidden="true" />
          <span className="sr-only">Assumption: {assumption}</span>
        </span>
      )}
    </div>
  );
}
