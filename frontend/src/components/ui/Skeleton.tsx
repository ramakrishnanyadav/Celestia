"use client";

import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly className?: string | undefined;
}

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-[var(--canvas-sunken)]/80 backdrop-blur-xs ${className}`}
      {...props}
    />
  );
}

