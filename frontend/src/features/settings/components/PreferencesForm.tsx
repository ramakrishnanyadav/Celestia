"use client";

import React, { useState } from "react";
import type { EventItem, EventPreference } from "@/lib/api/types";
import { Save, Check } from "lucide-react";

interface PreferencesFormProps {
  event: EventItem;
  preferences?: EventPreference | null;
  onSave?: (data: Partial<EventPreference>) => Promise<void>;
}

export function PreferencesForm({
  preferences,
  onSave,
}: PreferencesFormProps) {
  const [dietary, setDietary] = useState(
    preferences?.dietary ?? "Pure Vegetarian"
  );
  const [theme, setTheme] = useState(
    preferences?.theme ?? "Royal Marigold & Polished Brass"
  );
  const [culture, setCulture] = useState(
    preferences?.regional_culture ?? "Maharashtrian Traditional"
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave({
        dietary,
        theme,
        regional_culture: culture,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 rounded-2xl glass-card space-y-6"
      aria-label="Cultural & Dietary Preferences Form"
    >
      {/* Live Region for Save Status */}
      <div aria-live="polite" className="sr-only">
        {saved ? "Preferences saved successfully" : saving ? "Saving preferences..." : ""}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[var(--ink-primary)]">
            Cultural & Dietary Preferences
          </h3>
          <p id="preferences-help" className="text-xs sm:text-sm text-[var(--ink-muted)]">
            Tailor deterministic suggestions to family traditions
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brand-teal)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] focus-visible:ring-offset-2"
        >
          {saved ? (
            <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
          ) : (
            <Save className="w-4 h-4 shrink-0" aria-hidden="true" />
          )}
          <span>
            {saved ? "Saved" : saving ? "Saving..." : "Save Preferences"}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label
            htmlFor="dietary-input"
            className="block text-sm font-semibold text-[var(--ink-secondary)]"
          >
            Dietary Requirement
          </label>
          <input
            id="dietary-input"
            type="text"
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
            aria-describedby="dietary-help"
            className="w-full px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--canvas-sunken)] text-sm text-[var(--ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] min-h-[44px]"
          />
          <p id="dietary-help" className="text-xs text-[var(--ink-muted)]">
            e.g., Pure Vegetarian, Jain Vegetarian, Halal
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="theme-input"
            className="block text-sm font-semibold text-[var(--ink-secondary)]"
          >
            Celebration Theme
          </label>
          <input
            id="theme-input"
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            aria-describedby="theme-help"
            className="w-full px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--canvas-sunken)] text-sm text-[var(--ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] min-h-[44px]"
          />
          <p id="theme-help" className="text-xs text-[var(--ink-muted)]">
            Visual aesthetic, florals, and color palette
          </p>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label
            htmlFor="culture-input"
            className="block text-sm font-semibold text-[var(--ink-secondary)]"
          >
            Regional Culture & Traditions
          </label>
          <input
            id="culture-input"
            type="text"
            value={culture}
            onChange={(e) => setCulture(e.target.value)}
            aria-describedby="culture-help"
            className="w-full px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--canvas-sunken)] text-sm text-[var(--ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] min-h-[44px]"
          />
          <p id="culture-help" className="text-xs text-[var(--ink-muted)]">
            Regional customs (e.g., Maharashtrian Traditional, Punjabi, South Indian)
          </p>
        </div>
      </div>
    </form>
  );
}
