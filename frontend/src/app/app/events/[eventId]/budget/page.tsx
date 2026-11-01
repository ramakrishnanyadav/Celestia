"use client";

import React, { use } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import {
  useEvent,
  useEvents,
  useCurrentUser,
  useBudgetCategories,
  useApprovals,
  useUpdateEvent,
} from "@/lib/hooks/queries";
import { WhatIfSimulator } from "@/features/budget/components/WhatIfSimulator";
import { BudgetTable } from "@/features/budget/components/BudgetTable";

export default function EventBudgetPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { data: event, isLoading } = useEvent(eventId);
  const { data: events } = useEvents();
  const { data: user } = useCurrentUser();
  const { data: categories = [] } = useBudgetCategories(eventId);
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
        Loading budget ledger...
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
            { label: "Budget & What-If", current: true },
          ]}
        />

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink-primary)] tracking-tight">
            Budget & Financial Ledger
          </h1>
          <p className="text-sm text-[var(--ink-secondary)] mt-1">
            Zero-rounding integer paise accounting with real-time what-if simulation and automated contingency allocation.
          </p>
        </div>

        {/* What-If Simulator */}
        <section aria-labelledby="simulator-section">
          <h2 id="simulator-section" className="sr-only">
            Scenario Simulator
          </h2>
          <WhatIfSimulator event={event} />
        </section>

        {/* Categories Table */}
        <section aria-labelledby="ledger-section">
          <h2 id="ledger-section" className="sr-only">
            Itemized Category Allocations
          </h2>
          <BudgetTable categories={categories} />
        </section>
      </div>
    </AppShell>
  );
}
