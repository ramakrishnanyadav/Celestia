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
      {/* Top Navigation */}
      <header className="h-16 border-b border-[var(--border-subtle)] px-6 flex items-center justify-between sticky top-0 z-30 bg-[var(--glass-bg)] backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--brand-teal)] text-white flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-extrabold tracking-wider text-base text-[var(--ink-primary)]">
            CELESTIA
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] px-3 py-1.5 rounded-lg transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-[var(--brand-teal)] text-white hover:opacity-90 transition-all shadow-xs"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-20 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
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

        {/* Command Bar */}
        <form onSubmit={handleLaunch} className="max-w-3xl mx-auto pt-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl glass-card border border-[var(--border-subtle)] shadow-xl">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your celebration (type, city, budget, dietary, guests)..."
              className="flex-1 px-4 py-3 text-sm bg-transparent text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:outline-none w-full"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[var(--brand-teal)] text-white text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 shrink-0 shadow-sm cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleDemoClick}
              disabled={loading}
              className="text-xs font-semibold text-[var(--brand-teal)] hover:underline cursor-pointer"
            >
              {loading ? "Loading Demo..." : "Explore Read-Only Demo Workspace (Anjali & Rahul Wedding)"}
            </button>
          </div>
        </form>
      </section>

      {/* Bento Grid */}
      <section className="px-6 py-12 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl glass-card space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-[var(--ink-primary)]">
            Zero-Rounding Financials
          </h3>
          <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
            Strict integer paise accounting end-to-end with automated 10%
            contingency reserves and what-if simulation.
          </p>
        </div>
        <div className="p-6 rounded-2xl glass-card space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-marigold-subtle)] text-[var(--brand-marigold)] flex items-center justify-center">
            <CalendarDays className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-[var(--ink-primary)]">
            Critical Path (CPM) Engine
          </h3>
          <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
            Topologically sorted dependency graphs calculate early/late start
            dates and highlight bottleneck tasks.
          </p>
        </div>
        <div className="p-6 rounded-2xl glass-card space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-[var(--ink-primary)]">
            3-Tier Autonomy
          </h3>
          <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
            AI is strictly advisory. All proposals require human sign-off with
            complete audit trails and instant rollback.
          </p>
        </div>
      </section>
    </div>
  );
}
