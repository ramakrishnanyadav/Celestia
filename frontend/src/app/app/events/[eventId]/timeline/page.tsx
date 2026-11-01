"use client";

import React, { use } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import {
  useEvent,
  useEvents,
  useCurrentUser,
  useTasks,
  useApprovals,
  useRecalculateCPM,
  useUpdateEvent,
} from "@/lib/hooks/queries";
import { TaskList } from "@/features/timeline/components/TaskList";
import { RefreshCw } from "lucide-react";

export default function EventTimelinePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { data: event, isLoading } = useEvent(eventId);
  const { data: events } = useEvents();
  const { data: user } = useCurrentUser();
  const { data: tasks = [] } = useTasks(eventId);
  const { data: approvals } = useApprovals(eventId);
  const cpmMutation = useRecalculateCPM(eventId);
  const updateEventMutation = useUpdateEvent(eventId);

  const pendingApprovalsCount = approvals
    ? approvals.filter((a) => a.status === "pending").length
    : 0;

  const handleToggleAiPause = () => {
    if (!event) return;
    updateEventMutation.mutate({ ai_paused: !event.ai_paused });
  };

  if (isLoading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-sm text-[var(--ink-muted)]">
        Loading timeline schedule...
      </div>
    );
  }

  return (
    <AppShell
      eventId={eventId}
      event={event}
      events={events}
      currentUser={user}
      pendingApprovalsCount={pendingApprovalsCount}
      onToggleAiPause={handleToggleAiPause}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <Breadcrumbs
          items={[
            { label: event.title, href: `/app/events/${eventId}` },
            { label: "Timeline & CPM", current: true },
          ]}
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink-primary)] tracking-tight">
              Timeline & Critical Path (CPM)
            </h1>
            <p className="text-sm text-[var(--ink-secondary)] mt-1">
              Topologically sorted schedule with automated bottleneck detection and early/late start windows.
            </p>
          </div>
          <button
            type="button"
            disabled={cpmMutation.isPending}
            onClick={() => cpmMutation.mutate()}
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] text-sm font-semibold text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
            aria-label="Recalculate critical path method schedule"
          >
            <RefreshCw
              className={`w-4 h-4 shrink-0 ${cpmMutation.isPending ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            <span>{cpmMutation.isPending ? "Calculating DAG..." : "Recalculate CPM"}</span>
          </button>
        </div>

        {/* Task List */}
        <section aria-labelledby="tasks-heading">
          <h2 id="tasks-heading" className="sr-only">
            Sequenced Milestone Tasks
          </h2>
          <TaskList tasks={tasks} />
        </section>
      </div>
    </AppShell>
  );
}
