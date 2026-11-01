"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  IndianRupee,
  Sliders,
  CalendarDays,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
} from "lucide-react";

interface DemoTourOverlayProps {
  eventId: string;
}

interface TourStep {
  title: string;
  badge: string;
  why: string;
  route: string;
  routeName: string;
  icon: React.ElementType;
  iconColor: string;
  highlightText: string;
}

export function DemoTourOverlay({ eventId }: DemoTourOverlayProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const tourParam = searchParams.get("tour");

  useEffect(() => {
    if (tourParam === "1" && !dismissed) {
      setIsOpen(true);
    }
  }, [tourParam, dismissed]);

  const steps: TourStep[] = [
    {
      title: "Deterministic Integer Budget & 10% Contingency Reserve",
      badge: "Magic Moment 1: Financial Precision",
      why: "Celebration budgets in India involve millions of rupees; floating-point arithmetic causes cumulative drift and rounding errors. CELESTIA stores all amounts strictly as 64-bit integers in paise with an inviolable 10% unallocated liquidity buffer.",
      route: `/app/events/${eventId}/budget`,
      routeName: "View Budget Ledger",
      icon: IndianRupee,
      iconColor: "var(--brand-teal)",
      highlightText: "Zero-Float Paise Arithmetic • Guaranteed 10% Safety Cushion",
    },
    {
      title: "Real-Time What-If Sensitivity Simulator",
      badge: "Magic Moment 2: Interactive Scenario Modeling",
      why: "Hosts need to explore guest headcount and budget variations instantly. The what-if simulator provides debounced, real-time recalculation of per-guest costs and buffer margins with sequence guards, never altering persistent database state until confirmed.",
      route: `/app/events/${eventId}/budget`,
      routeName: "Open What-If Simulator",
      icon: Sliders,
      iconColor: "var(--brand-teal)",
      highlightText: "Debounced Dynamic Sliders • Zero Unapproved State Mutation",
    },
    {
      title: "Cycle-Free CPM Solver & Cultural Ritual Milestones",
      badge: "Magic Moment 3: Temporal & Ritual Sequencing",
      why: "Traditional celebrations require strict ritual order (e.g., Sakhar Puda before Haldi and Muhurtham). CELESTIA's directed acyclic graph (DAG) solver runs topological sorting to expose the critical path and reject cyclic dependencies before they delay ceremonies.",
      route: `/app/events/${eventId}/timeline`,
      routeName: "Inspect CPM Critical Path",
      icon: CalendarDays,
      iconColor: "var(--brand-marigold)",
      highlightText: "Topological Sort • Automatic Bottleneck Identification",
    },
    {
      title: "3-Tier Autonomy with Immutable Audit Logging",
      badge: "Magic Moment 4: Human-in-the-Loop Governance",
      why: "AI should never execute irrevocable financial contracts autonomously. CELESTIA categorizes actions into Suggest, Draft, and Approve tiers, requiring human sign-off on sensitive mutations while recording an immutable activity audit log.",
      route: `/app/events/${eventId}/approvals`,
      routeName: "Review AI Proposals",
      icon: ShieldCheck,
      iconColor: "var(--brand-indigo)",
      highlightText: "Suggest → Draft → Approve • Complete Human Sovereignty",
    },
  ];

  const handleClose = () => {
    setIsOpen(false);
    setDismissed(true);
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("tour");
        router.replace(url.pathname);
      } catch {}
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Keyboard accessibility: Escape to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const step = steps[currentStep];
  if (!step) return null;
  const StepIcon = step.icon;

  return (
    <>
      {/* Floating Tour Launch Pill for Quick Access */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setCurrentStep(0);
            setIsOpen(true);
          }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full glass-card border border-[var(--brand-teal)]/40 shadow-lg hover:shadow-xl text-xs sm:text-sm font-bold text-[var(--ink-primary)] bg-[var(--canvas-sunken)]/90 backdrop-blur-md transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] min-h-[44px]"
          aria-label="Start Guided 3-Minute Demo Tour"
        >
          <Compass className="w-4 h-4 text-[var(--brand-teal)] animate-spin-slow" aria-hidden="true" />
          <span>3-Min Guided Tour</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] font-bold">
            4 Magic Moments
          </span>
        </button>
      )}

      {/* Guided Tour Modal Dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-step-title"
          aria-describedby="tour-step-why"
        >
          <div className="relative w-full max-w-xl rounded-2xl glass-card border border-[var(--brand-teal)]/40 bg-[var(--canvas-elevated)] p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header & Step Counter */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[var(--canvas-sunken)]"
                  style={{ color: step.iconColor }}
                  aria-hidden="true"
                >
                  <StepIcon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-teal)]">
                    {step.badge}
                  </span>
                  <div className="text-xs text-[var(--ink-muted)]">
                    Step {currentStep + 1} of {steps.length}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] min-h-[44px] min-w-[44px]"
                aria-label="Close guided tour"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Step Body */}
            <div className="space-y-3">
              <h2
                id="tour-step-title"
                className="text-lg sm:text-xl font-extrabold text-[var(--ink-primary)] tracking-tight leading-snug"
              >
                {step.title}
              </h2>

              <div className="p-3 rounded-xl bg-[var(--brand-teal-subtle)]/40 border border-[var(--brand-teal)]/20 text-xs sm:text-sm font-medium text-[var(--brand-teal)] flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{step.highlightText}</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                  The Core "Why":
                </span>
                <p
                  id="tour-step-why"
                  className="text-sm text-[var(--ink-secondary)] leading-relaxed"
                >
                  {step.why}
                </p>
              </div>
            </div>

            {/* Action Link to Module */}
            <div className="pt-2">
              <Link
                href={step.route}
                onClick={handleClose}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand-teal)] text-white text-xs sm:text-sm font-semibold hover:opacity-90 transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] min-h-[44px]"
              >
                <span>{step.routeName}</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            {/* Step Progress & Navigation Controls */}
            <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
              {/* Progress Dots */}
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {steps.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentStep(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all min-h-[24px] min-w-[24px] flex items-center justify-center p-0 ${
                      idx === currentStep
                        ? "bg-[var(--brand-teal)] scale-125"
                        : "bg-[var(--border-subtle)] hover:bg-[var(--ink-muted)]"
                    }`}
                    aria-label={`Jump to Step ${idx + 1}`}
                  >
                    <span className="sr-only">Step {idx + 1}</span>
                  </button>
                ))}
              </div>

              {/* Prev / Next Buttons */}
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl border border-[var(--border-subtle)] text-xs sm:text-sm font-semibold text-[var(--ink-secondary)] hover:bg-[var(--canvas-sunken)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] min-h-[44px]"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    <span>Back</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[var(--ink-primary)] text-white dark:text-black text-xs sm:text-sm font-semibold hover:opacity-90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] min-h-[44px]"
                >
                  <span>{currentStep === steps.length - 1 ? "Finish Tour" : "Next Moment"}</span>
                  {currentStep < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
