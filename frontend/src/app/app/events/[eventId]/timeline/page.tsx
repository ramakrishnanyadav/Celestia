"use client";

import React, { use } from "react";
import { AppShell } from "@/components/shell/AppShell";
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--ink-primary)]">
              Timeline & Critical Path (CPM)
            </h1>
            <p className="text-xs text-[var(--ink-muted)] mt-1">
              Topologically sorted schedule with bottleneck path detection
            </p>
          </div>
          <button
            type="button"
            disabled={cpmMutation.isPending}
            onClick={() => cpmMutation.mutate()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)] transition-all"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${cpmMutation.isPending ? "animate-spin" : ""}`}
            />
            <span>Recalculate CPM</span>
          </button>
        </div>

        {/* Task List */}
        <TaskList tasks={tasks} />
      </div>
    </AppShell>
  );
}
