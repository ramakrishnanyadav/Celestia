"use client";

import React, { use } from "react";
import { AppShell } from "@/components/shell/AppShell";
import {
  useEvent,
  useEvents,
  useCurrentUser,
  useVendors,
  useApprovals,
  useUpdateEvent,
} from "@/lib/hooks/queries";
import { VendorTable } from "@/features/vendors/components/VendorTable";

export default function EventVendorsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { data: event, isLoading } = useEvent(eventId);
  const { data: events } = useEvents();
  const { data: user } = useCurrentUser();
  const { data: vendors = [] } = useVendors(eventId);
  const { data: approvals } = useApprovals(eventId);
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
        Loading vendor quotes...
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
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--ink-primary)]">
            Vendors & Quotations
          </h1>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            Supplier comparison, ratings, and deliverable breakdown
          </p>
        </div>

        {/* Vendor Grid */}
        <VendorTable vendors={vendors} />
      </div>
    </AppShell>
  );
}

