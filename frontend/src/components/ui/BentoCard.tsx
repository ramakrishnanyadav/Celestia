"use client";

import React, { useRef } from "react";

export interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: 1 | 2 | 3 | undefined;
  spotlight?: boolean | undefined;
  children: React.ReactNode;
}

export function BentoCard({
  elevation = 1,
  spotlight = true,
  children,
  className = "",
  ...props
}: BentoCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!spotlight || e.pointerType === "touch") return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
  };

  const elevationClass =
    elevation === 3 ? "glass-3" : elevation === 2 ? "glass-2" : "glass-1";

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      className={`rounded-2xl p-6 ${elevationClass} ${
        spotlight ? "spotlight-card" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

