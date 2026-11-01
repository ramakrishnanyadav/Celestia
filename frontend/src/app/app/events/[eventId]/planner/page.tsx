"use client";

import React, { use } from "react";
import { AppShell } from "@/components/shell/AppShell";
import {
  useEvent,
  useEvents,
  useCurrentUser,
  useApprovals,
  useUpdateEvent,
} from "@/lib/hooks/queries";
import { AIChatCanvas } from "@/features/planner/components/AIChatCanvas";
import { api } from "@/lib/api";

export default function EventPlannerPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { data: event, isLoading } = useEvent(eventId);
  const { data: events } = useEvents();
  const { data: user } = useCurrentUser();
  const { data: approvals = [] } = useApprovals(eventId);
  const updateEventMutation = useUpdateEvent(eventId);

  const pendingApprovalsCount = approvals.filter(
    (a) => a.status === "pending"
  ).length;

  const handleToggleAiPause = () => {
    if (!event) return;
    updateEventMutation.mutate({ ai_paused: !event.ai_paused });
  };

  const handleSendCommand = (cmd: string) => {
    return api.sendAIChatCommand(eventId, cmd);
  };

  if (isLoading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-sm text-[var(--ink-muted)]">
        Loading AI planning workspace...
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--ink-primary)]">
            AI Planning Workspace
          </h1>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            Collaborative natural-language planning governed by strict 3-tier
            autonomy
          </p>
        </div>

        {/* AI Chat Canvas */}
        <AIChatCanvas event={event} onSendCommand={handleSendCommand} />
      </div>
    </AppShell>
  );
}
