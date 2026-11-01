"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Calendar,
  Users,
  ArrowRight,
  ShieldCheck,
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--ink-primary)]">
          Initialize New Celebration
        </h2>
        <p className="text-xs text-[var(--ink-muted)]">
          Configure a deterministic celebration plan with milestone critical
          paths and budget allocations.
        </p>
      </div>

      <div className="flex border-b border-[var(--border-subtle)] gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("natural")}
          className={`pb-3 text-xs font-semibold cursor-pointer border-b-2 transition-all ${
            activeTab === "natural"
              ? "border-[var(--brand-teal)] text-[var(--brand-teal)]"
              : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
          }`}
        >
          AI Requirements Extraction
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("guided")}
          className={`pb-3 text-xs font-semibold cursor-pointer border-b-2 transition-all ${
            activeTab === "guided"
              ? "border-[var(--brand-teal)] text-[var(--brand-teal)]"
              : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
          }`}
        >
          Structured Configuration
        </button>
      </div>

      {activeTab === "natural" ? (
        <div className="p-6 rounded-2xl glass-card space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--brand-teal)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)]">
              Describe in Plain English
            </h3>
          </div>
          <textarea
            rows={4}
            value={naturalPrompt}
            onChange={(e) => setNaturalPrompt(e.target.value)}
            className="w-full p-3 rounded-xl bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--ink-primary)]"
          />
          <button
            type="button"
            disabled={isExtracting}
            onClick={handleExtract}
            className="px-5 py-2.5 rounded-xl bg-[var(--brand-teal)] text-white text-xs font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isExtracting
                ? "Extracting Parameters..."
                : "Extract Parameters & Review"}
            </span>
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-2xl glass-card space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-[var(--ink-secondary)] block mb-1">
                Celebration Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--ink-primary)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--ink-secondary)] block mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--ink-primary)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--ink-secondary)] block mb-1">
                Venue Type
              </label>
              <input
                type="text"
                value={venueType}
                onChange={(e) => setVenueType(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--ink-primary)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--ink-secondary)] block mb-1">
                Guest Count
              </label>
              <input
                type="number"
                min="10"
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--ink-primary)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--ink-secondary)] block mb-1">
                Budget (₹ INR)
              </label>
              <input
                type="number"
                min="10000"
                value={budgetRupees}
                onChange={(e) => setBudgetRupees(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--ink-primary)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--ink-secondary)] block mb-1">
                Prep Window (Months)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={prepMonths}
                onChange={(e) => setPrepMonths(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--ink-primary)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--ink-secondary)] block mb-1">
                Theme Aesthetic
              </label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--ink-primary)]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-[var(--brand-teal)] text-white text-xs font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <span>
                {createMutation.isPending
                  ? "Generating Plan..."
                  : "Initialize Celebration"}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
