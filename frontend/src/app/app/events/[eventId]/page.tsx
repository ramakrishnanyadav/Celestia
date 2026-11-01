"use client";

import React, { use } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import {
  useEventOverview,
  useEvents,
  useCurrentUser,
  useUpdateEvent,
} from "@/lib/hooks/queries";
import { OverviewKpiCards } from "@/features/overview/components/OverviewKpiCards";
import {
  IndianRupee,
  CalendarDays,
  Store,
  CheckCheck,
  ArrowRight,
} from "lucide-react";

export default function EventOverviewPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { data: overview, isLoading: overviewLoading } = useEventOverview(eventId);
  const { data: events } = useEvents();
  const { data: user } = useCurrentUser();
  const updateEventMutation = useUpdateEvent(eventId);

  const event = overview?.event;
  const budgetSummary = overview?.budget;
  const pendingApprovalsCount = overview?.pending_approvals?.length ?? 0;
  const criticalTasksCount =
    overview?.next_tasks?.filter((t) => t.is_critical).length ?? 0;
  const totalTasksCount = overview?.next_tasks?.length ?? 0;

  const handleToggleAiPause = () => {
    if (!event) return;
    updateEventMutation.mutate({ ai_paused: !event.ai_paused });
  };

  if (overviewLoading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-sm text-[var(--ink-muted)]">
        Synchronizing celebration blueprint...
      </div>
    );
  }

  const quickActions = [
    {
      title: "Budget & What-If",
      description: "Zero-rounding integer ledger & live what-if simulation",
      href: `/app/events/${eventId}/budget`,
      icon: IndianRupee,
      color: "var(--brand-teal)",
    },
    {
      title: "Timeline & CPM",
      description: "Critical path schedule & dependency sequencing",
      href: `/app/events/${eventId}/timeline`,
      icon: CalendarDays,
      color: "var(--brand-marigold)",
    },
    {
      title: "Vendors & Quotes",
      description: "Compare supplier proposals & itemized deliverables",
      href: `/app/events/${eventId}/vendors`,
      icon: Store,
      color: "var(--brand-indigo)",
    },
    {
      title: "Human Approvals",
      description: `${pendingApprovalsCount} pending AI proposals requiring human sign-off`,
      href: `/app/events/${eventId}/approvals`,
      icon: CheckCheck,
      color: "var(--status-success)",
    },
  ];

  return (
    <AppShell
      eventId={eventId}
      event={event}
      events={events}
      currentUser={user}
      pendingApprovalsCount={pendingApprovalsCount}
      onToggleAiPause={handleToggleAiPause}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <Breadcrumbs items={[{ label: event.title, current: true }]} />

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink-primary)] tracking-tight">
            {event.title} Overview
          </h1>
          <p className="text-sm text-[var(--ink-secondary)] mt-1">
            Real-time deterministic summary of financials, timeline bottlenecks, and pending human approvals.
          </p>
        </div>

        {/* KPI Cards */}
        <section aria-labelledby="kpi-heading">
          <h2 id="kpi-heading" className="sr-only">
            Financial & Timeline Key Performance Indicators
          </h2>
          <OverviewKpiCards
            event={event}
            budgetSummary={budgetSummary}
            taskCount={totalTasksCount}
            criticalTaskCount={criticalTasksCount}
          />
        </section>

        {/* Quick Nav Bento */}
        <section aria-labelledby="modules-heading">
          <h2 id="modules-heading" className="text-lg font-bold text-[var(--ink-primary)] mb-3">
            Celebration Management Modules
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 m-0">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <li key={action.title}>
                  <Link
                    href={action.href}
                    className="p-5 rounded-2xl glass-card flex items-start justify-between gap-4 group hover:border-[var(--brand-teal)] transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[var(--canvas-sunken)]"
                        style={{ color: action.color }}
                        aria-hidden="true"
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[var(--ink-primary)] group-hover:text-[var(--brand-teal)] transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-sm text-[var(--ink-secondary)] mt-1 leading-relaxed">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <div
                      className="text-[var(--ink-muted)] group-hover:text-[var(--brand-teal)] group-hover:translate-x-0.5 transition-all mt-1"
                      aria-hidden="true"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
