"use client";

import React, { use } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import {
  useEvent,
  useEvents,
  useCurrentUser,
  useApprovals,
  useExecuteApproval,
  useUpdateEvent,
} from "@/lib/hooks/queries";
import { ApprovalsList } from "@/features/approvals/components/ApprovalsList";

export default function EventApprovalsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { data: event, isLoading } = useEvent(eventId);
  const { data: events } = useEvents();
  const { data: user } = useCurrentUser();
  const { data: approvals = [] } = useApprovals(eventId);
  const executeApprovalMutation = useExecuteApproval(eventId);
  const updateEventMutation = useUpdateEvent(eventId);

  const pendingApprovalsCount = approvals.filter(
    (a) => a.status === "pending"
  ).length;

  const handleAction = (proposalId: string, action: "approve" | "reject") => {
    executeApprovalMutation.mutate({ proposalId, action });
  };

  const handleToggleAiPause = () => {
    if (!event) return;
    updateEventMutation.mutate({ ai_paused: !event.ai_paused });
  };

  if (isLoading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-sm text-[var(--ink-muted)]">
        Loading approvals queue...
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
            { label: "Approvals", current: true },
          ]}
        />

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink-primary)] tracking-tight">
            Human Approval Queue
          </h1>
          <p className="text-sm text-[var(--ink-secondary)] mt-1">
            Review and sign off on AI suggested modifications before they are committed to deterministic ledgers.
          </p>
        </div>

        {/* Approvals List */}
        <section aria-labelledby="approvals-queue-heading">
          <h2 id="approvals-queue-heading" className="sr-only">
            Active Approval Proposals
          </h2>
          <ApprovalsList
            approvals={approvals}
            onAction={handleAction}
            loadingId={executeApprovalMutation.isPending ? "loading" : null}
          />
        </section>
      </div>
    </AppShell>
  );
}
