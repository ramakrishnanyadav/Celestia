"use client";

import React, { use, useState } from "react";
import { useEvent, useUpdateEvent, useDeleteEvent } from "@/lib/hooks/queries";
import {
  ShieldCheck,
  Pause,
  Play,
  Save,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function EventSettingsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const { data: event, isLoading } = useEvent(eventId);
  const updateMutation = useUpdateEvent(eventId);
  const deleteMutation = useDeleteEvent();

  const [autonomyMode, setAutonomyMode] = useState<string>("Draft");
  const [aiPaused, setAiPaused] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [venueType, setVenueType] = useState<string>("");
  const [prepMonths, setPrepMonths] = useState<number>(6);
  const [synced, setSynced] = useState<boolean>(false);

  // Sync state once event loads
  if (event && !synced) {
    setAutonomyMode(event.autonomy_mode ?? "Draft");
    setAiPaused(Boolean(event.ai_paused));
    setTitle(event.title);
    setCity(event.city);
    setVenueType(event.venue_type);
    setPrepMonths(event.preparation_months);
    setSynced(true);
  }

  if (isLoading || !event) {
    return (
      <div className="p-8 text-center text-sm text-[var(--ink-muted)]">
        Loading settings...
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMutation.mutateAsync({
      title,
      city,
      venue_type: venueType,
      preparation_months: prepMonths,
      autonomy_mode: autonomyMode,
      ai_paused: aiPaused,
    });
  };

  const handleDelete = async () => {
    if (
      confirm("Are you sure you want to permanently delete this celebration?")
    ) {
      await deleteMutation.mutateAsync(eventId);
      router.push("/app/events");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--ink-primary)] mb-1">
          Event Configuration
        </h2>
        <p className="text-xs text-[var(--ink-muted)]">
          Manage autonomy boundaries, venue specs, and lifecycle parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="p-6 rounded-2xl glass-card space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--brand-amber)]" />
            <span>AI Autonomy Level</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                mode: "Suggest",
                title: "1. Advisory",
                desc: "Generates zero persistent plan changes.",
              },
              {
                mode: "Draft",
                title: "2. Draft",
                desc: "Proposals with diffs requiring explicit host approval.",
              },
              {
                mode: "Approve",
                title: "3. Direct Staging",
                desc: "Stages changes into review pipeline with audit log.",
              },
            ].map((item) => (
              <button
                key={item.mode}
                type="button"
                onClick={() => setAutonomyMode(item.mode)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  autonomyMode === item.mode
                    ? "bg-[var(--brand-teal-light)] border-[var(--brand-teal)] shadow-xs"
                    : "bg-[var(--canvas-sunken)] border-[var(--border-subtle)] hover:border-[var(--brand-teal)]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[var(--ink-primary)]">
                    {item.title}
                  </span>
                  {autonomyMode === item.mode && (
                    <CheckCircle2 className="w-4 h-4 text-[var(--brand-teal)]" />
                  )}
                </div>
                <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
                  {item.desc}
                </p>
              </button>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[var(--ink-primary)] block">
                AI Automation Circuit Breaker
              </span>
              <span className="text-[11px] text-[var(--ink-muted)]">
                Halts all background AI recommendations and proposals.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAiPaused(!aiPaused)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                aiPaused
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-teal-100 text-teal-900 border border-teal-300"
              }`}
            >
              {aiPaused ? (
                <Play className="w-3.5 h-3.5" />
              ) : (
                <Pause className="w-3.5 h-3.5" />
              )}
              <span>{aiPaused ? "AI is Paused" : "AI is Running"}</span>
            </button>
          </div>
        </div>

        <div className="p-6 rounded-2xl glass-card space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)]">
            Event Specifications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--ink-secondary)] block mb-1">
                Celebration Title
              </label>
              <input
                type="text"
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
                Venue Preference
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
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Event</span>
          </button>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-2.5 rounded-xl bg-[var(--brand-teal)] hover:opacity-90 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>
              {updateMutation.isPending ? "Saving..." : "Save Configuration"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
