"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ElementType | undefined;
  actionLabel?: string | undefined;
  onAction?: (() => void) | undefined;
  className?: string | undefined;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Sparkles,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`p-8 sm:p-12 text-center rounded-2xl glass-1 border border-[var(--border-subtle)] flex flex-col items-center justify-center space-y-4 max-w-md mx-auto ${className}`}
      role="status"
    >
      <div
        className="w-14 h-14 rounded-2xl bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] flex items-center justify-center shadow-xs"
        aria-hidden="true"
      >
        <Icon className="w-7 h-7" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base sm:text-lg font-bold text-[var(--ink-primary)]">
          {title}
        </h3>
        <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
