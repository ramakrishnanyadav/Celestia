"use client";

import React, { use } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import {
  useEvent,
  useEvents,
  useCurrentUser,
  useBudgetSummary,
  useTasks,
  useApprovals,
  useUpdateEvent,
} from "@/lib/hooks/queries";
import { OverviewKpiCards } from "@/features/overview/components/OverviewKpiCards";
import {
  IndianRupee,
  CalendarDays,
  Store,
  CheckCheck,
  Bot,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default function EventOverviewPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: events } = useEvents();
  const { data: user } = useCurrentUser();
  const { data: budgetSummary } = useBudgetSummary(eventId);
  const { data: tasks } = useTasks(eventId);
  const { data: approvals } = useApprovals(eventId);
  const updateEventMutation = useUpdateEvent(eventId);

  const pendingApprovalsCount = approvals
    ? approvals.filter((a) => a.status === "pending").length
    : 0;
  const criticalTasksCount = tasks
    ? tasks.filter((t) => t.is_critical).length
    : 0;

  const handleToggleAiPause = () => {
    if (!event) return;
    updateEventMutation.mutate({ ai_paused: !event.ai_paused });
  };

  if (eventLoading || !event) {
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
        {/* KPI Cards */}
        <OverviewKpiCards
          event={event}
          budgetSummary={budgetSummary}
          taskCount={tasks ? tasks.length : 0}
          criticalTaskCount={criticalTasksCount}
        />

        {/* Quick Nav Bento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className="p-5 rounded-2xl glass-card flex items-start justify-between gap-4 group hover:border-[var(--brand-teal)] transition-all"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[var(--canvas-sunken)]"
                    style={{ color: action.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--ink-primary)] group-hover:text-[var(--brand-teal)] transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs text-[var(--ink-secondary)] mt-1 leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </div>
                <div className="text-[var(--ink-muted)] group-hover:text-[var(--brand-teal)] group-hover:translate-x-0.5 transition-all mt-1">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

