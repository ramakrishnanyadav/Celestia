"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CalendarDays,
  IndianRupee,
} from "lucide-react";

export default function MarketingLandingPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState(
    "Traditional Maharashtrian wedding in Mumbai for 300 guests, ₹15 Lakhs budget, pure vegetarian catering, 6 months preparation."
  );
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink-primary)] flex flex-col">
      {/* Skip to Main Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2.5 bg-[var(--brand-teal)] text-white font-semibold rounded-xl shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Top Header Landmark */}
      <header className="h-16 border-b border-[var(--border-subtle)] px-6 flex items-center justify-between sticky top-0 z-30 bg-[var(--glass-bg)] backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl bg-[var(--brand-teal)] text-white flex items-center justify-center font-bold"
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
            href="/login"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-sm font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] px-3.5 py-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="min-h-[44px] inline-flex items-center justify-center text-sm font-semibold px-4 py-2.5 rounded-xl bg-[var(--brand-teal)] text-white hover:opacity-90 transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Main Content Landmark */}
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {/* Hero Section */}
        <section className="px-6 py-20 max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] text-xs font-semibold">
            <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Next-Generation Celebration & Event Planning Engine</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[var(--ink-primary)] leading-tight">
            Where Cultural Grandeur Meets <br />
            <span className="text-[var(--brand-teal)]">
              Deterministic Precision
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-[var(--ink-secondary)] leading-relaxed">
            Transform natural-language visions into executable blueprints with
            zero-rounding integer ledgers, Critical Path (CPM) schedules, and
            human-in-the-loop approvals.
          </p>

          {/* Accessible Command Form */}
          <form onSubmit={handleLaunch} className="max-w-3xl mx-auto pt-4 space-y-3">
            <label htmlFor="celebration-prompt" className="sr-only">
              Describe your celebration details
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl glass-card border border-[var(--border-subtle)] shadow-xl">
              <input
                id="celebration-prompt"
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your celebration (type, city, budget, dietary, guests)..."
                className="flex-1 px-4 py-3 text-sm sm:text-base bg-transparent text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:outline-none w-full"
              />
              <button
                type="submit"
                className="min-h-[44px] w-full sm:w-auto px-6 py-3 rounded-xl bg-[var(--brand-teal)] text-white text-sm sm:text-base font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 shrink-0 shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] focus-visible:ring-offset-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleDemoClick}
                disabled={loading}
                className="min-h-[44px] inline-flex items-center text-sm font-semibold text-[var(--brand-teal)] hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] rounded p-1"
              >
                {loading ? "Loading Demo..." : "Explore Read-Only Demo Workspace (Anjali & Rahul Wedding)"}
              </button>
            </div>
          </form>
        </section>

        {/* Bento Grid */}
        <section aria-labelledby="capabilities-heading" className="px-6 py-12 max-w-6xl mx-auto w-full">
          <h2 id="capabilities-heading" className="sr-only">
            Core Architecture Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl glass-card space-y-3">
              <div
                className="w-10 h-10 rounded-xl bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] flex items-center justify-center"
                aria-hidden="true"
              >
                <IndianRupee className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--ink-primary)]">
                Zero-Rounding Financials
              </h3>
              <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
                Strict integer paise accounting end-to-end with automated 10%
                contingency reserves and what-if simulation.
              </p>
            </div>
            <div className="p-6 rounded-2xl glass-card space-y-3">
              <div
                className="w-10 h-10 rounded-xl bg-[var(--brand-marigold-subtle)] text-[var(--brand-marigold)] flex items-center justify-center"
                aria-hidden="true"
              >
                <CalendarDays className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--ink-primary)]">
                Critical Path (CPM) Engine
              </h3>
              <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
                Topologically sorted dependency graphs calculate early/late start
                dates and highlight bottleneck tasks.
              </p>
            </div>
            <div className="p-6 rounded-2xl glass-card space-y-3">
              <div
                className="w-10 h-10 rounded-xl bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] flex items-center justify-center"
                aria-hidden="true"
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--ink-primary)]">
                3-Tier Autonomy
              </h3>
              <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
                AI is strictly advisory. All proposals require human sign-off with
                complete audit trails and instant rollback.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Accessible Footer Landmark */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--canvas-subtle)] px-6 py-8 mt-12">
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
