"use client";

import React from "react";
import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink-primary)] flex flex-col items-center justify-center p-6 text-center relative">
      <div className="mesh-backdrop" aria-hidden="true">
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
      </div>

      <div className="max-w-md p-8 rounded-3xl glass-card space-y-5 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] flex items-center justify-center mx-auto shadow-xs" aria-hidden="true">
          <Compass className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--brand-teal)]">
            404 — Celebration Not Found
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink-primary)] tracking-tight">
            Off the Planning Map
          </h1>
          <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
            The page or event blueprint you are searching for does not exist or has been archived.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <Link href="/app/events">
            <Button variant="primary" icon={<ArrowLeft className="w-4 h-4" />}>
              Return to Celebrations
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

