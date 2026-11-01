"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CalendarDays,
  IndianRupee,
  CheckCircle2,
  Sliders,
  Layers,
  Store,
  Compass,
} from "lucide-react";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Button } from "@/components/ui/Button";

export default function MarketingLandingPage() {
  const router = useRouter();

  const examplePrompts = [
    "Traditional Maharashtrian wedding in Mumbai for 300 guests, ₹15 Lakhs budget, pure vegetarian catering, 6 months prep.",
    "Gujarati celebration in Ahmedabad for 400 guests, ₹25 Lakhs, pure vegetarian, 6 months preparation.",
    "Aarav's 1st birthday pastel carnival in Pune for 50 guests, ₹1.5 Lakhs budget, kid-friendly stations.",
    "Shivaji Park Diwali Community Utsav in Mumbai for 1000 attendees, ₹8 Lakhs, pure vegetarian feast.",
  ];

  const [prompt, setPrompt] = useState(examplePrompts[0]);
  const [activeChipIdx, setActiveChipIdx] = useState(0);
  const [loading, setLoading] = useState(false);

  // Cycling placeholder suggestions
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveChipIdx((prev) => (prev + 1) % examplePrompts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [examplePrompts.length]);

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/register");
  };

  const handleDemoClick = async () => {
    setLoading(true);
    try {
      await api.demoLogin();
      router.push("/app/events");
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const selectPrompt = (idx: number) => {
    setActiveChipIdx(idx);
    setPrompt(examplePrompts[idx] || "");
  };

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink-primary)] flex flex-col relative selection:bg-[var(--brand-teal)] selection:text-white">
      {/* Drifting Subtle Mesh Gradient Backdrop */}
      <div className="mesh-backdrop" aria-hidden="true">
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
        <div className="mesh-blob mesh-blob-3" />
      </div>

      {/* Skip to Main Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2.5 bg-[var(--brand-teal)] text-white font-semibold rounded-xl shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Top Header Landmark */}
      <header className="h-16 border-b border-[var(--border-subtle)] px-6 flex items-center justify-between sticky top-0 z-30 bg-[var(--glass-2-bg)] backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl bg-[var(--brand-teal)] text-white flex items-center justify-center font-extrabold shadow-sm"
            aria-hidden="true"
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-extrabold tracking-wider text-base text-[var(--ink-primary)]">
            CELESTIA
          </span>
        </div>
        <nav aria-label="Primary Navigation" className="flex items-center gap-3">
          <Link
            href="/design"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-secondary)] hover:text-[var(--brand-teal)] px-3 py-2 rounded-xl transition-colors min-h-[44px]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--brand-teal)]" aria-hidden="true" />
            <span>Design Tokens</span>
          </Link>
          <Link
            href="/login"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-sm font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] px-3.5 py-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="min-h-[44px] inline-flex items-center justify-center text-sm font-semibold px-4 py-2.5 rounded-xl bg-[var(--brand-teal)] text-white hover:opacity-95 active:scale-98 transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Main Content Landmark */}
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none relative z-10 space-y-24">
        {/* Signature Moment 1: Hero Section with Conic Rotating Border Command Bar */}
        <section className="px-6 pt-16 sm:pt-24 max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--brand-teal-subtle)] border border-[var(--brand-teal)]/20 text-[var(--brand-teal)] text-xs font-bold tracking-wide">
            <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Enterprise Celebration OS • Zero-Rounding Math & CPM Scheduling</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[var(--ink-primary)] leading-[1.1]">
            Where Cultural Grandeur <br />
            Meets <span className="text-[var(--brand-teal)]">Deterministic Precision</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-xl text-[var(--ink-secondary)] leading-relaxed font-normal">
            Transform plain-language celebration dreams into mathematically provable plans with zero-rounding paise ledgers, a mandatory 10% contingency buffer, and cycle-free CPM milestone schedules.
          </p>

          {/* Interactive Conic-Glow Command Bar */}
          <div className="max-w-3xl mx-auto pt-6 space-y-3">
            <form onSubmit={handleLaunch} className="conic-glow-border p-1 bg-[var(--glass-2-bg)] backdrop-blur-md shadow-2xl">
              <label htmlFor="celebration-prompt" className="sr-only">
                Describe your celebration requirements
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl bg-[var(--canvas-elevated)]">
                <input
                  id="celebration-prompt"
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your celebration (guests, city, budget, dietary, rituals)..."
                  className="flex-1 px-4 py-3.5 text-sm sm:text-base bg-transparent text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:outline-none w-full"
                />
                <Button
                  type="submit"
                  size="md"
                  variant="primary"
                  magnetic
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Create Plan
                </Button>
              </div>
            </form>

            {/* Quick Example Prompt Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2" aria-label="Example Prompts">
              <span className="text-xs text-[var(--ink-muted)] font-medium mr-1">Try example:</span>
              {["Mumbai Wedding", "Gujarati Mandap", "Pune Birthday", "Diwali Utsav"].map((label, idx) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => selectPrompt(idx)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer min-h-[32px] ${
                    activeChipIdx === idx
                      ? "bg-[var(--brand-teal)] text-white shadow-xs"
                      : "bg-[var(--canvas-sunken)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-[var(--border-subtle)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Instant Demo Launch Button */}
            <div className="pt-3">
              <button
                type="button"
                onClick={handleDemoClick}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass-card text-sm font-bold text-[var(--brand-teal)] hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] min-h-[44px]"
              >
                <Compass className="w-4 h-4 animate-spin-slow" aria-hidden="true" />
                <span>{loading ? "Loading Demo..." : "Explore Pre-Seeded Celebrations (Wedding, Birthday, Community)"}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Signature Moment 2: Scroll Story "Prompt → Plan" Interactive Preview */}
        <section aria-labelledby="story-heading" className="px-6 py-12 max-w-6xl mx-auto w-full space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--brand-teal)]">
              The Architecture of Determinism
            </span>
            <h2 id="story-heading" className="text-2xl sm:text-4xl font-extrabold text-[var(--ink-primary)] tracking-tight">
              From Plain Words to Flawless Execution
            </h2>
            <p className="text-sm sm:text-base text-[var(--ink-secondary)]">
              How CELESTIA eliminates financial leaks and scheduling deadlocks before they happen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1: Integer Ledger & 10% Contingency Ring */}
            <div className="p-6 rounded-2xl glass-card space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] flex items-center justify-center">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)]">
                    Step 1: Financials
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[var(--ink-primary)]">
                  Zero-Float Paise Ledger
                </h3>
                <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
                  Currency amounts are stored strictly as 64-bit integers in paise (minor units) with a mandatory 10% contingency safety cushion.
                </p>
              </div>

              {/* Progress Ring Visual */}
              <div className="py-2 flex justify-center">
                <ProgressRing
                  size={160}
                  strokeWidth={12}
                  allocatedPercent={90}
                  contingencyPercent={10}
                  label="₹15.0L"
                  sublabel="10% Buffer Intact"
                />
              </div>
            </div>

            {/* Step 2: Critical Path (CPM) Scheduler */}
            <div className="p-6 rounded-2xl glass-card space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[var(--brand-marigold-subtle)] text-[var(--brand-marigold)] flex items-center justify-center">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[var(--brand-marigold-subtle)] text-[var(--brand-marigold)]">
                    Step 2: Timeline
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[var(--ink-primary)]">
                  Cycle-Free CPM Solver
                </h3>
                <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
                  Directed acyclic graph (DAG) topological sorting discovers 0-slack bottleneck tasks and prevents cyclic planning deadlocks.
                </p>
              </div>

              {/* Mini Gantt Milestone Visual */}
              <div className="p-3.5 rounded-xl bg-[var(--canvas-sunken)] space-y-2 text-xs">
                <div className="flex items-center justify-between font-semibold text-[var(--ink-primary)]">
                  <span>Sakhar Puda Ceremony</span>
                  <span className="text-[var(--brand-marigold)] font-bold">Critical (0d slack)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                  <div className="h-full bg-[var(--brand-marigold)] w-3/4 rounded-full" />
                </div>
                <div className="flex items-center justify-between font-semibold text-[var(--ink-primary)] pt-1">
                  <span>Mandap & Floral Setup</span>
                  <span className="text-[var(--brand-teal)]">2d Slack</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                  <div className="h-full bg-[var(--brand-teal)] w-1/2 rounded-full" />
                </div>
              </div>
            </div>

            {/* Step 3: 3-Tier Human Autonomy */}
            <div className="p-6 rounded-2xl glass-card space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[var(--brand-indigo-subtle)] text-[var(--brand-indigo)] flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[var(--brand-indigo-subtle)] text-[var(--brand-indigo)]">
                    Step 3: Governance
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[var(--ink-primary)]">
                  3-Tier Human Sovereignty
                </h3>
                <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
                  AI suggestions are strictly quarantined into Suggest, Draft, or Approve tiers; every database mutation requires explicit human approval.
                </p>
              </div>

              {/* Proposal Preview Visual */}
              <div className="p-3.5 rounded-xl bg-[var(--canvas-sunken)] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--ink-primary)]">Reallocate Catering</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] font-bold uppercase">
                    Draft Tier
                  </span>
                </div>
                <p className="text-[var(--ink-muted)] text-[11px] leading-tight">
                  Reserve ₹50,000 for traditional Maharashtrian Ukadiche Modak counter.
                </p>
                <div className="pt-1 flex gap-2">
                  <span className="text-[10px] font-bold text-[var(--status-success)]">✓ Human Approval Required</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Accessible Footer Landmark */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--canvas-subtle)] px-6 py-8 mt-16 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--ink-secondary)]">
          <p>© 2026 CELESTIA Platform. Engineered for WCAG 2.2 Level AA / AAA standards.</p>
          <div className="flex items-center gap-6">
            <Link
              href="/accessibility"
              className="text-[var(--brand-teal)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] rounded"
            >
              Accessibility Statement
            </Link>
            <Link
              href="/design"
              className="text-[var(--ink-secondary)] hover:text-[var(--brand-teal)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] rounded"
            >
              Design System
            </Link>
            <Link
              href="/login"
              className="text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] rounded"
            >
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
