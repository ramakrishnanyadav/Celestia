"use client";

import React, { useState } from "react";
import type { EventItem, EventPreference } from "@/lib/api/types";
import { Sliders, Save, Check } from "lucide-react";

interface PreferencesFormProps {
  event: EventItem;
  preferences?: EventPreference | null;
  onSave?: (data: Partial<EventPreference>) => Promise<void>;
}

export function PreferencesForm({
  event,
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
      className="p-6 rounded-2xl glass-card space-y-5"
    >
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--ink-primary)]">
            Cultural & Dietary Preferences
          </h3>
          <p className="text-xs text-[var(--ink-muted)]">
            Tailor deterministic suggestions to family traditions
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--brand-teal)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-xs"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>
            {saved ? "Saved" : saving ? "Saving..." : "Save Preferences"}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--ink-secondary)]">
            Dietary Requirement
          </label>
          <input
            type="text"
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--canvas-sunken)] text-sm text-[var(--ink-primary)] focus:outline-none focus:border-[var(--brand-teal)]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--ink-secondary)]">
            Celebration Theme
          </label>
          <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--canvas-sunken)] text-sm text-[var(--ink-primary)] focus:outline-none focus:border-[var(--brand-teal)]"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-semibold text-[var(--ink-secondary)]">
            Regional Culture & Traditions
          </label>
          <input
            type="text"
            value={culture}
            onChange={(e) => setCulture(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--canvas-sunken)] text-sm text-[var(--ink-primary)] focus:outline-none focus:border-[var(--brand-teal)]"
          />
        </div>
      </div>
    </form>
  );
}
