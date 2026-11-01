"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/AlertDialog";
import { useToast } from "@/components/ui/Toast";
import {
  useEvent,
  useEvents,
  useCurrentUser,
  useApprovals,
  useUpdateEvent,
  useDeleteEvent,
} from "@/lib/hooks/queries";
import {
  ShieldCheck,
  Pause,
  Play,
  Save,
  Trash2,
  CheckCircle2,
} from "lucide-react";

export default function EventSettingsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { data: event, isLoading } = useEvent(eventId);
  const { data: events } = useEvents();
  const { data: user } = useCurrentUser();
  const { data: approvals = [] } = useApprovals(eventId);
  const updateMutation = useUpdateEvent(eventId);
  const deleteMutation = useDeleteEvent();

  const [autonomyMode, setAutonomyMode] = useState<string>("Draft");
  const [aiPaused, setAiPaused] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [venueType, setVenueType] = useState<string>("");
  const [prepMonths, setPrepMonths] = useState<number>(6);
  const [synced, setSynced] = useState<boolean>(false);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);

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

  const pendingApprovalsCount = approvals.filter(
    (a) => a.status === "pending"
  ).length;

  const handleToggleAiPause = () => {
    if (!event) return;
    updateMutation.mutate({ ai_paused: !event.ai_paused });
  };

  if (isLoading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-sm text-[var(--ink-muted)]">
        Loading settings...
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        title,
        city,
        venue_type: venueType,
        preparation_months: prepMonths,
        autonomy_mode: autonomyMode,
        ai_paused: aiPaused,
      });
      toast.success("Configuration Saved", "Event settings and autonomy rules updated successfully.");
    } catch {
      toast.error("Save Failed", "Could not update configuration. Please try again.");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(eventId);
      toast.info("Event Deleted", "Celebration workspace has been removed.");
      router.push("/app/events");
    } catch {
      toast.error("Deletion Failed", "Unable to delete celebration event.");
    }
  };

  return (
    <AppShell
      eventId={eventId}
      event={event}
      events={events}
      currentUser={user}
      pendingApprovalsCount={pendingApprovalsCount}
      onToggleAiPause={handleToggleAiPause}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Breadcrumbs
          items={[
            { label: event.title, href: `/app/events/${eventId}` },
            { label: "Settings", current: true },
          ]}
        />

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink-primary)] tracking-tight">
            Event Configuration
          </h1>
          <p className="text-sm text-[var(--ink-secondary)] mt-1">
            Manage autonomy boundaries, venue specs, and lifecycle parameters.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6" aria-label="Event Configuration Form">
          <div className="p-6 rounded-2xl glass-card space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--ink-primary)] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[var(--brand-marigold)]" aria-hidden="true" />
              <span>AI Autonomy Level</span>
            </h2>

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
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] ${
                    autonomyMode === item.mode
                      ? "bg-[var(--brand-teal-subtle)] border-[var(--brand-teal)] shadow-xs"
                      : "bg-[var(--canvas-sunken)] border-[var(--border-subtle)] hover:border-[var(--brand-teal)]"
                  }`}
                  aria-pressed={autonomyMode === item.mode}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-[var(--ink-primary)]">
                      {item.title}
                    </span>
                    {autonomyMode === item.mode && (
                      <CheckCircle2 className="w-4 h-4 text-[var(--brand-teal)]" aria-hidden="true" />
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--ink-muted)] leading-relaxed">
                    {item.desc}
                  </p>
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-sm font-bold text-[var(--ink-primary)] block">
                  AI Automation Circuit Breaker
                </span>
                <span className="text-xs sm:text-sm text-[var(--ink-muted)]">
                  Halts all background AI recommendations and proposals.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAiPaused(!aiPaused)}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] ${
                  aiPaused
                    ? "bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-100"
                    : "bg-teal-100 text-teal-950 border border-teal-300 dark:bg-teal-950/80 dark:text-teal-100"
                }`}
                aria-label={aiPaused ? "Resume AI recommendations" : "Pause all AI recommendations"}
              >
                {aiPaused ? (
                  <Play className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Pause className="w-4 h-4" aria-hidden="true" />
                )}
                <span>{aiPaused ? "AI is Paused" : "AI is Running"}</span>
              </button>
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-card space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--ink-primary)]">
              Event Specifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="settings-title" className="text-sm font-semibold text-[var(--ink-secondary)] block">
                  Celebration Title
                </label>
                <input
                  id="settings-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] text-sm text-[var(--ink-primary)] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="settings-city" className="text-sm font-semibold text-[var(--ink-secondary)] block">
                  City
                </label>
                <input
                  id="settings-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] text-sm text-[var(--ink-primary)] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="settings-venue" className="text-sm font-semibold text-[var(--ink-secondary)] block">
                  Venue Preference
                </label>
                <input
                  id="settings-venue"
                  type="text"
                  value={venueType}
                  onChange={(e) => setVenueType(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] text-sm text-[var(--ink-primary)] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="settings-prep" className="text-sm font-semibold text-[var(--ink-secondary)] block">
                  Prep Window (Months)
                </label>
                <input
                  id="settings-prep"
                  type="number"
                  min="1"
                  max="24"
                  value={prepMonths}
                  onChange={(e) => setPrepMonths(Number(e.target.value))}
                  className="w-full p-3 rounded-xl bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] text-sm text-[var(--ink-primary)] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 text-[var(--status-danger)] hover:bg-red-100 border border-red-200 dark:border-red-900 text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--status-danger)]"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  <span>Delete Event</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Celebration Event?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. It will permanently remove all financial ledgers, critical path timelines, vendor quotations, and approval audit history for &quot;{event.title}&quot;.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmDelete}>
                    Yes, Delete Celebration
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[var(--brand-teal)] hover:opacity-90 text-white text-sm font-bold inline-flex items-center gap-2 transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] focus-visible:ring-offset-2"
            >
              <Save className="w-4 h-4" aria-hidden="true" />
              <span>
                {updateMutation.isPending ? "Saving..." : "Save Configuration"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
