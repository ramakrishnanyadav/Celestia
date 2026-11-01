"use client";

import React from "react";

export interface ProgressRingProps {
  size?: number | undefined;
  strokeWidth?: number | undefined;
  allocatedPercent: number; // e.g. 90%
  contingencyPercent?: number | undefined; // e.g. 10%
  label?: string | undefined;
  sublabel?: string | undefined;
  className?: string | undefined;
}

export function ProgressRing({
  size = 180,
  strokeWidth = 14,
  allocatedPercent,
  contingencyPercent = 10,
  label,
  sublabel,
  className = "",
}: ProgressRingProps) {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  // Clamped percentages
  const safeAllocated = Math.min(Math.max(allocatedPercent, 0), 100);
  const safeContingency = Math.min(Math.max(contingencyPercent, 0), 100);

  const allocatedDash = (safeAllocated / 100) * circumference;
  const contingencyDash = (safeContingency / 100) * circumference;
  const remainingDash = Math.max(circumference - allocatedDash - contingencyDash, 0);

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center ${className}`}
      role="meter"
      aria-label="Budget Allocation Ring with 10% Contingency Safety Reserve"
      aria-valuenow={safeAllocated}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <defs>
          {/* Hatched Pattern for Contingency Reserve Arc */}
          <pattern
            id="contingency-hatch"
            width="6"
            height="6"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="6"
              stroke="var(--brand-marigold)"
              strokeWidth="2.5"
            />
          </pattern>
        </defs>

        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--canvas-sunken)"
          strokeWidth={strokeWidth}
        />

        {/* Contingency Safety Reserve Arc (Hatched Marigold) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--brand-marigold)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${contingencyDash} ${circumference}`}
          strokeDashoffset={-allocatedDash}
          className="transition-all duration-500 ease-out opacity-85"
        />

        {/* Primary Allocated Budget Arc (Brand Teal) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--brand-teal)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${allocatedDash} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {/* Center Labeling */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
        {label && (
          <span className="text-xl sm:text-2xl font-extrabold text-[var(--ink-primary)] tracking-tight tabular-nums">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-xs text-[var(--ink-muted)] font-medium mt-0.5">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
