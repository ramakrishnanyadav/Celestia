"use client";

import React, { useEffect, useState } from "react";
import { ProvenanceBadge, ProvenanceSource, ConfidenceLevel } from "./ProvenanceBadge";
import { TrendingUp, TrendingDown, HelpCircle } from "lucide-react";

export interface KPICardProps {
  title: string;
  value: string;
  numericTarget?: number | undefined;
  subtext?: string | undefined;
  delta?: { value: string; isPositive: boolean } | undefined;
  icon: React.ElementType;
  iconColor?: string | undefined;
  isMoney?: boolean | undefined;
  source?: ProvenanceSource | undefined;
  confidence?: ConfidenceLevel | undefined;
  assumption?: string | undefined;
  className?: string | undefined;
}

export function KPICard({
  title,
  value,
  numericTarget,
  subtext,
  delta,
  icon: Icon,
  iconColor = "var(--brand-teal)",
  isMoney = false,
  source,
  confidence = "High",
  assumption,
  className = "",
}: KPICardProps) {
  const [displayNum, setDisplayNum] = useState<number | null>(null);

  // Smooth count-up animation on numericTarget via rAF
  useEffect(() => {
    if (numericTarget === undefined || isNaN(numericTarget)) {
      setDisplayNum(null);
      return;
    }

    // Skip animation under reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setDisplayNum(numericTarget);
      return;
    }

    let start = 0;
    const duration = 800; // ms
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(start + (numericTarget - start) * easeOut);
      setDisplayNum(currentVal);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [numericTarget]);

  return (
    <div
      className={`p-5 rounded-2xl glass-card flex flex-col justify-between space-y-3 ${className}`}
      role="region"
      aria-label={`${title}: ${value}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
          {title}
        </span>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[var(--canvas-sunken)]"
          style={{ color: iconColor }}
          aria-hidden="true"
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <span
            className="text-2xl sm:text-3xl font-extrabold text-[var(--ink-primary)] tracking-tight tabular-nums"
            lang={isMoney ? "en-IN" : undefined}
          >
            {displayNum !== null ? displayNum.toLocaleString("en-IN") : value}
          </span>

          {delta && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-md ${
                delta.isPositive
                  ? "text-[var(--status-success)] bg-emerald-50 dark:bg-emerald-950/40"
                  : "text-[var(--status-danger)] bg-rose-50 dark:bg-rose-950/40"
              }`}
              aria-label={`Change: ${delta.value}`}
            >
              {delta.isPositive ? (
                <TrendingUp className="w-3 h-3" aria-hidden="true" />
              ) : (
                <TrendingDown className="w-3 h-3" aria-hidden="true" />
              )}
              <span>{delta.value}</span>
            </span>
          )}
        </div>

        {subtext && (
          <p
            className="text-xs sm:text-sm text-[var(--ink-muted)] mt-1 truncate"
            lang={isMoney ? "en-IN" : undefined}
          >
            {subtext}
          </p>
        )}
      </div>

      {source && (
        <div className="pt-2 border-t border-[var(--border-subtle)]/60">
          <ProvenanceBadge
            source={source}
            confidence={confidence}
            assumption={assumption}
          />
        </div>
      )}
    </div>
  );
}

