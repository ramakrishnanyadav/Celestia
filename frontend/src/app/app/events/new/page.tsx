"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Users,
  ArrowRight,
  ShieldCheck,
  Calendar,
  IndianRupee,
  MapPin,
  Building,
  Clock,
  Palette,
} from "lucide-react";
import { useCreateEvent } from "@/lib/hooks/queries";
import { rupeesToPaise } from "@/lib/money";
import { api } from "@/lib/api";

export default function NewEventPage() {
  const router = useRouter();
  const createMutation = useCreateEvent();

  const [activeTab, setActiveTab] = useState<"natural" | "guided">("natural");
  const [naturalPrompt, setNaturalPrompt] = useState(
    "Organize a traditional Maharashtrian wedding in Mumbai for 300 guests with maximum budget of ₹15,00,000, 100% vegetarian catering, 6-month preparation, and Royal Marigold decor."
  );
  const [isExtracting, setIsExtracting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("Anjali & Rahul's Royal Mumbai Wedding");
  const [eventType, setEventType] = useState("wedding");
  const [city, setCity] = useState("Mumbai");
  const [venueType, setVenueType] = useState("Grand Banquet Hall");
  const [guestCount, setGuestCount] = useState(300);
  const [budgetRupees, setBudgetRupees] = useState(1500000);
  const [dietary, setDietary] = useState("Pure Vegetarian");
  const [theme, setTheme] = useState("Royal Marigold & Polished Brass");
  const [regionalCulture, setRegionalCulture] = useState(
    "Maharashtrian Traditional"
  );
  const [prepMonths, setPrepMonths] = useState(6);

  const handleExtract = async () => {
    if (!naturalPrompt.trim()) return;
    setIsExtracting(true);
    try {
      const extracted = await api.extractRequirements(naturalPrompt);
      if (extracted.title) setTitle(extracted.title);
      if (extracted.event_type) setEventType(extracted.event_type);
      if (extracted.city) setCity(extracted.city);
      if (extracted.guest_count) setGuestCount(extracted.guest_count);
      if (extracted.budget_rupees) setBudgetRupees(extracted.budget_rupees);
      if (extracted.dietary) setDietary(extracted.dietary);
      if (extracted.theme) setTheme(extracted.theme);
      if (extracted.regional_culture)
        setRegionalCulture(extracted.regional_culture);
      if (extracted.preparation_months)
        setPrepMonths(extracted.preparation_months);
      setActiveTab("guided");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const budgetMinor = Number(rupeesToPaise(budgetRupees));
    const created = await createMutation.mutateAsync({
      title,
      event_type: eventType,
      city,
      venue_type: venueType,
      guest_count: Number(guestCount),
      budget_minor: budgetMinor,
      currency: "INR",
      timezone: "Asia/Kolkata",
      preparation_months: Number(prepMonths),
      autonomy_mode: "Draft",
      preferences: {
        dietary,
        theme,
        regional_culture: regionalCulture,
        cultural_traditions: ["Sakhar Puda", "Muhurtham", "Haldi", "Sangeet"],
        music_entertainment: "Traditional & Modern Fusion",
        special_requirements: null,
      },
    });
    router.push(`/app/events/${created.id}`);
  };

  return (
    <div className="min-h-screen bg-[var(--canvas)] flex flex-col justify-between">
      {/* Skip to Main Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2.5 bg-[var(--brand-teal)] text-white font-semibold rounded-xl shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Header Landmark */}
      <header className="h-16 border-b border-[var(--border-subtle)] px-6 flex items-center justify-between sticky top-0 z-30 bg-[var(--glass-bg)] backdrop-blur-md">
        <Link
          href="/app/events"
          className="flex items-center gap-2 text-sm font-semibold text-[var(--ink-secondary)] hover:text-[var(--brand-teal)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] rounded px-2 py-1 min-h-[44px]"
        >
          <span>← Back to Celebrations</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[var(--brand-teal)] text-white flex items-center justify-center font-bold" aria-hidden="true">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-extrabold tracking-wider text-base text-[var(--ink-primary)]">
            CELESTIA
          </span>
        </div>
      </header>

      {/* Main Content Landmark */}
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-3xl w-full mx-auto p-6 sm:p-10 space-y-6 focus:outline-none">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink-primary)] tracking-tight">
            Initialize New Celebration
          </h1>
          <p className="text-sm text-[var(--ink-secondary)] mt-1">
            Configure a deterministic celebration plan with milestone critical paths and zero-rounding budget allocations.
          </p>
        </div>

        {/* Accessible Mode Tabs */}
        <div
          role="tablist"
          aria-label="Creation Mode"
          className="flex border-b border-[var(--border-subtle)] gap-4"
        >
          <button
            role="tab"
            id="tab-natural"
            aria-selected={activeTab === "natural"}
            aria-controls="panel-natural"
            type="button"
            onClick={() => setActiveTab("natural")}
            className={`min-h-[44px] pb-3 text-sm font-semibold cursor-pointer border-b-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] ${
              activeTab === "natural"
                ? "border-[var(--brand-teal)] text-[var(--brand-teal)]"
                : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            }`}
          >
            AI Natural Language Extraction
          </button>
          <button
            role="tab"
            id="tab-guided"
            aria-selected={activeTab === "guided"}
            aria-controls="panel-guided"
            type="button"
            onClick={() => setActiveTab("guided")}
            className={`min-h-[44px] pb-3 text-sm font-semibold cursor-pointer border-b-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] ${
              activeTab === "guided"
                ? "border-[var(--brand-teal)] text-[var(--brand-teal)]"
                : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            }`}
          >
            Structured Configuration
          </button>
        </div>

        {activeTab === "natural" ? (
          <div
            role="tabpanel"
            id="panel-natural"
            aria-labelledby="tab-natural"
            className="p-6 rounded-2xl glass-card space-y-4"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--brand-teal)]" aria-hidden="true" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--ink-primary)]">
                Describe in Plain English
              </h2>
            </div>
            <label htmlFor="natural-input" className="sr-only">
              Celebration Prompt Description
            </label>
            <textarea
              id="natural-input"
              rows={4}
              value={naturalPrompt}
              onChange={(e) => setNaturalPrompt(e.target.value)}
              className="w-full p-4 rounded-xl bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] text-sm text-[var(--ink-primary)] leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
            />
            <button
              type="button"
              disabled={isExtracting}
              onClick={handleExtract}
              className="min-h-[44px] px-6 py-3 rounded-xl bg-[var(--brand-teal)] text-white text-sm font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] focus-visible:ring-offset-2"
            >
              <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {isExtracting
                  ? "Extracting Parameters..."
                  : "Extract Parameters & Review"}
              </span>
            </button>
          </div>
        ) : (
          <form
            role="tabpanel"
            id="panel-guided"
            aria-labelledby="tab-guided"
            onSubmit={handleSubmit}
            className="p-6 rounded-2xl glass-card space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="form-title" className="text-sm font-semibold text-[var(--ink-secondary)] block">
                  Celebration Title <span aria-hidden="true" className="text-red-600">*</span><span className="sr-only"> (required)</span>
                </label>
                <input
                  id="form-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] text-sm text-[var(--ink-primary)] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="form-city" className="text-sm font-semibold text-[var(--ink-secondary)] block">
                  City <span aria-hidden="true" className="text-red-600">*</span><span className="sr-only"> (required)</span>
                </label>
                <input
                  id="form-city"
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] text-sm text-[var(--ink-primary)] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="form-venue" className="text-sm font-semibold text-[var(--ink-secondary)] block">
                  Venue Type
                </label>
                <input
                  id="form-venue"
                  type="text"
                  value={venueType}
                  onChange={(e) => setVenueType(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] text-sm text-[var(--ink-primary)] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="form-guests" className="text-sm font-semibold text-[var(--ink-secondary)] block">
                  Guest Count <span aria-hidden="true" className="text-red-600">*</span><span className="sr-only"> (required)</span>
                </label>
                <input
                  id="form-guests"
                  type="number"
                  required
                  min="10"
                  max="5000"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-full p-3 rounded-xl bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] text-sm text-[var(--ink-primary)] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="form-budget" className="text-sm font-semibold text-[var(--ink-secondary)] block">
                  Budget (₹ INR) <span aria-hidden="true" className="text-red-600">*</span><span className="sr-only"> (required)</span>
                </label>
                <input
                  id="form-budget"
                  type="number"
                  required
                  min="10000"
                  value={budgetRupees}
                  onChange={(e) => setBudgetRupees(Number(e.target.value))}
                  className="w-full p-3 rounded-xl bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] text-sm text-[var(--ink-primary)] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="form-prep" className="text-sm font-semibold text-[var(--ink-secondary)] block">
                  Prep Window (Months)
                </label>
                <input
                  id="form-prep"
                  type="number"
                  min="1"
                  max="24"
                  value={prepMonths}
                  onChange={(e) => setPrepMonths(Number(e.target.value))}
                  className="w-full p-3 rounded-xl bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] text-sm text-[var(--ink-primary)] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="form-theme" className="text-sm font-semibold text-[var(--ink-secondary)] block">
                  Theme Aesthetic
                </label>
                <input
                  id="form-theme"
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] text-sm text-[var(--ink-primary)] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="min-h-[44px] px-6 py-3 rounded-xl bg-[var(--brand-teal)] text-white text-sm font-bold inline-flex items-center gap-2 hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] focus-visible:ring-offset-2"
              >
                <span>
                  {createMutation.isPending
                    ? "Generating Deterministic Plan..."
                    : "Initialize Celebration"}
                </span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Footer Landmark */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--canvas-subtle)] px-6 py-6 text-center text-xs text-[var(--ink-muted)]">
        <p>© 2026 CELESTIA Platform. Certified WCAG 2.2 AA / AAA Accessible.</p>
      </footer>
    </div>
  );
}
