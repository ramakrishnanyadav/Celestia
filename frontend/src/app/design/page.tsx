"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sliders,
  Store,
  CalendarDays,
  IndianRupee,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export default function DesignSystemPage() {
  const toast = useToast();
  const [sliderVal, setSliderVal] = useState(300);

  const colorTokens = [
    { name: "--canvas", value: "#ffffff", dark: "#0b132b", desc: "Base Canvas Surface" },
    { name: "--canvas-subtle", value: "#f7f8fc", dark: "#1c2541", desc: "Layered Surface" },
    { name: "--ink-primary", value: "#0b1020", dark: "#faf7f2", desc: "Body Text (AAA >= 7:1)" },
    { name: "--ink-secondary", value: "#2d3748", dark: "#e2e8f0", desc: "Secondary Copy (AAA)" },
    { name: "--brand-teal", value: "#0f766e", dark: "#2dd4bf", desc: "Primary Accent (AA >= 4.5:1)" },
    { name: "--brand-marigold", value: "#b45309", dark: "#fbbf24", desc: "Celebration Accent" },
    { name: "--status-success", value: "#15803d", dark: "#4ade80", desc: "Success Indicator" },
    { name: "--status-danger", value: "#b91c1c", dark: "#f87171", desc: "Error & Destructive" },
  ];

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink-primary)] flex flex-col justify-between">
      <header className="h-16 border-b border-[var(--border-subtle)] px-6 flex items-center justify-between sticky top-0 z-30 bg-[var(--glass-bg)] backdrop-blur-md">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-[var(--ink-secondary)] hover:text-[var(--brand-teal)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] rounded px-2 py-1 min-h-[44px]"
        >
          <span>← Back to CELESTIA</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[var(--brand-teal)] text-white flex items-center justify-center font-bold" aria-hidden="true">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-extrabold tracking-wider text-base">CELESTIA Design System</span>
        </div>
      </header>

      <main id="main-content" className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-10 space-y-12">
        <div>
          <Breadcrumbs items={[{ label: "Design System Tokens", current: true }]} />
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--ink-primary)]">
            Design System & Accessibility Foundations
          </h1>
          <p className="text-sm sm:text-base text-[var(--ink-secondary)] mt-2 leading-relaxed">
            Specification and interactive preview of CELESTIA tokenized components, WCAG 2.2 AA / AAA contrast pairs, 44×44px touch targets, and high-performance glass surfaces.
          </p>
        </div>

        {/* Color Palette Tokens */}
        <section aria-labelledby="tokens-heading" className="space-y-4">
          <h2 id="tokens-heading" className="text-xl font-bold text-[var(--ink-primary)]">
            Verified Color Tokens & Contrast Gates
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {colorTokens.map((c) => (
              <div key={c.name} className="p-4 rounded-2xl glass-card space-y-2">
                <div
                  className="w-full h-12 rounded-xl border border-[var(--border-subtle)] shadow-xs"
                  style={{ backgroundColor: c.value }}
                />
                <div>
                  <code className="text-xs font-bold text-[var(--ink-primary)]">{c.name}</code>
                  <p className="text-xs text-[var(--ink-muted)] mt-0.5">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive Components Showcase */}
        <section aria-labelledby="components-heading" className="space-y-6">
          <h2 id="components-heading" className="text-xl font-bold text-[var(--ink-primary)]">
            Interactive Components & States
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Buttons & Touch Targets */}
            <div className="p-6 rounded-2xl glass-card space-y-4">
              <h3 className="text-base font-bold text-[var(--ink-primary)]">
                Buttons & Minimum 44×44px Touch Targets
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[var(--brand-teal)] text-white text-sm font-semibold hover:opacity-90 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
                  onClick={() => toast.success("Primary Action", "Triggered standard primary button.")}
                >
                  Primary CTA
                </button>
                <button
                  type="button"
                  className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-[var(--ink-primary)] text-sm font-semibold hover:bg-[var(--canvas-sunken)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
                  onClick={() => toast.info("Secondary Action", "Triggered secondary button.")}
                >
                  Secondary Action
                </button>
                <button
                  type="button"
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 text-[var(--status-danger)] border border-red-200 dark:border-red-900 text-sm font-semibold hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--status-danger)]"
                  onClick={() => toast.error("Danger Action", "Destructive alert triggered.")}
                >
                  Destructive
                </button>
              </div>
            </div>

            {/* Slider with Live Valuetext */}
            <div className="p-6 rounded-2xl glass-card space-y-4">
              <h3 className="text-base font-bold text-[var(--ink-primary)]">
                Accessible Range Slider
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <label htmlFor="design-slider" className="text-[var(--ink-secondary)]">
                    Guest Count
                  </label>
                  <span className="text-[var(--ink-primary)]">{sliderVal} Guests</span>
                </div>
                <input
                  id="design-slider"
                  type="range"
                  min={50}
                  max={1000}
                  step={25}
                  value={sliderVal}
                  onChange={(e) => setSliderVal(Number(e.target.value))}
                  className="w-full accent-[var(--brand-teal)] min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
                  aria-valuemin={50}
                  aria-valuemax={1000}
                  aria-valuenow={sliderVal}
                  aria-valuetext={`${sliderVal} guests`}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border-subtle)] bg-[var(--canvas-subtle)] px-6 py-6 text-center text-xs text-[var(--ink-muted)]">
        <p>© 2026 CELESTIA Design System. Verified for WCAG 2.2 AA / AAA standards.</p>
      </footer>
    </div>
  );
}

