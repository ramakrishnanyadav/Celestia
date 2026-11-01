"use client";

import React from "react";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: "ghost" | "outline" | "solid" | undefined;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      children,
      label,
      className = "",
      variant = "ghost",
      disabled = false,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      ghost:
        "bg-transparent text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)]",
      outline:
        "border border-[var(--border-subtle)] bg-[var(--canvas-sunken)]/60 text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)]",
      solid:
        "bg-[var(--brand-teal)] text-white hover:opacity-90",
    };

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-label={label}
        title={label}
        className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] active:scale-95 ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
        <span className="sr-only">{label}</span>
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
