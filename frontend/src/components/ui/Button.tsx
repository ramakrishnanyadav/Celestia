"use client";

import React, { useRef, useState } from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "celebration" | "outline" | "ghost" | "danger" | undefined;
  size?: "sm" | "md" | "lg" | undefined;
  isLoading?: boolean | undefined;
  magnetic?: boolean | undefined;
  icon?: React.ReactNode | undefined;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      magnetic = false,
      disabled = false,
      icon,
      ...props
    },
    ref
  ) => {
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!magnetic || disabled || isLoading) return;
      const el = btnRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - (rect.left + rect.width / 2)) * 0.2;
      const y = (e.clientY - (rect.top + rect.height / 2)) * 0.2;
      setOffset({ x, y });
    };

    const handleMouseLeave = () => {
      if (!magnetic) return;
      setOffset({ x: 0, y: 0 });
    };

    const variantStyles = {
      primary:
        "bg-[var(--brand-teal)] text-white hover:opacity-95 active:scale-[0.98] shadow-sm shadow-[var(--brand-teal)]/20",
      celebration:
        "bg-[var(--brand-marigold)] text-white hover:opacity-95 active:scale-[0.98] shadow-sm shadow-[var(--brand-marigold)]/20",
      outline:
        "border border-[var(--border-subtle)] bg-[var(--canvas-sunken)]/60 text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)] active:scale-[0.98]",
      ghost:
        "bg-transparent text-[var(--ink-secondary)] hover:bg-[var(--canvas-sunken)] hover:text-[var(--ink-primary)] active:scale-[0.98]",
      danger:
        "bg-[var(--status-danger)] text-white hover:opacity-95 active:scale-[0.98]",
    };

    const sizeStyles = {
      sm: "min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-xl gap-1.5",
      md: "min-h-[44px] px-5 py-2.5 text-sm font-semibold rounded-xl gap-2",
      lg: "min-h-[48px] px-6 py-3 text-base font-bold rounded-2xl gap-2.5",
    };

    return (
      <button
        ref={(node) => {
          btnRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={
          magnetic && (offset.x !== 0 || offset.y !== 0)
            ? { transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }
            : undefined
        }
        className={`inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
        )}
        {!isLoading && icon && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";
