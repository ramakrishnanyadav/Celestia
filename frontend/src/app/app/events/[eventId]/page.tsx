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
import { DemoTourOverlay } from "@/components/demo/DemoTourOverlay";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { BentoCard } from "@/components/ui/BentoCard";
import { ProvenanceBadge } from "@/components/ui/ProvenanceBadge";
import { formatMoney, formatMoneyCompact } from "@/lib/money";
import {
  IndianRupee,
  CalendarDays,
  Store,
  CheckCheck,
  ArrowRight,
  Flame,
  ShieldCheck,
  Sliders,
  Sparkles,
  Printer,
  ChevronRight,
  Clock,
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
  const pendingApprovals = overview?.pending_approvals ?? [];
  const pendingApprovalsCount = pendingApprovals.length;
  const nextTasks = overview?.next_tasks ?? [];
  const criticalTasks = nextTasks.filter((t) => t.is_critical);
  const criticalTasksCount = criticalTasks.length;
  const totalTasksCount = nextTasks.length;

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

  const totalBudgetMinor = budgetSummary?.total_budget_minor ?? event.budget_minor;
  const safetyBufferMinor = budgetSummary?.safety_buffer_minor ?? Math.round(Number(totalBudgetMinor) * 0.1);
  const allocatedMinor = Math.max(Number(totalBudgetMinor) - Number(safetyBufferMinor), 0);
  const allocatedPercent = totalBudgetMinor > 0 ? Math.round((allocatedMinor / totalBudgetMinor) * 100) : 90;
  const contingencyPercent = totalBudgetMinor > 0 ? Math.round((safetyBufferMinor / totalBudgetMinor) * 100) : 10;

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
      <div className="max-w-6xl mx-auto space-y-8">
        <Breadcrumbs items={[{ label: event.title, current: true }]} />

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink-primary)] tracking-tight">
            {event.title} Overview
          </h1>
          <p className="text-sm text-[var(--ink-secondary)] mt-1">
            Real-time deterministic summary of financials, timeline bottlenecks, and pending human approvals.
          </p>
        </div>

        {/* KPI Cards Row */}
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

        {/* Signature Moment 3: 12-Column Responsive Bento Grid */}
        <section aria-labelledby="bento-heading" className="space-y-4">
          <h2 id="bento-heading" className="text-lg font-bold text-[var(--ink-primary)] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--brand-teal)]" aria-hidden="true" />
            <span>Celebration Intelligence Bento</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Bento Col 1 (5 cols): Budget Allocation & 10% Contingency Arc */}
            <BentoCard elevation={1} className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-teal)]">
                    Financial Guardrails
                  </span>
                  <ProvenanceBadge source="Formula" confidence="High" assumption="10% unallocated safety reserve" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--ink-primary)]">
                  Paise Accounting & Buffer
                </h3>
              </div>

              <div className="py-2 flex flex-col sm:flex-row items-center justify-around gap-4">
                <ProgressRing
                  size={150}
                  strokeWidth={12}
                  allocatedPercent={allocatedPercent}
                  contingencyPercent={contingencyPercent}
                  label={formatMoneyCompact(totalBudgetMinor)}
                  sublabel="Budget Cap"
                />

                <div className="space-y-2 text-xs sm:text-sm">
                  <div>
                    <span className="text-[var(--ink-muted)] block">Operational Budget:</span>
                    <span className="font-bold text-[var(--ink-primary)] tabular-nums" lang="en-IN">
                      {formatMoney(allocatedMinor)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--ink-muted)] block">10% Emergency Reserve:</span>
                    <span className="font-bold text-[var(--brand-marigold)] tabular-nums" lang="en-IN">
                      {formatMoney(safetyBufferMinor)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--ink-muted)] block">Per Guest Allocation:</span>
                    <span className="font-bold text-[var(--brand-teal)] tabular-nums" lang="en-IN">
                      ₹{Math.round(Number(totalBudgetMinor) / 100 / Math.max(1, event.guest_count)).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <Link
                  href={`/app/events/${eventId}/budget`}
                  className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[var(--brand-teal)] hover:underline min-h-[44px]"
                >
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-4 h-4" aria-hidden="true" />
                    <span>Run What-If Sensitivity Simulator</span>
                  </span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </BentoCard>

            {/* Bento Col 2 (4 cols): CPM Critical Path Milestones */}
            <BentoCard elevation={1} className="lg:col-span-4 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-marigold)]">
                    CPM DAG Schedule
                  </span>
                  <ProvenanceBadge source="CPM Solver" confidence="High" assumption="Cycle-free topological sort" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--ink-primary)]">
                  Next Critical Path Tasks
                </h3>
              </div>

              <div className="space-y-2.5">
                {criticalTasks.length > 0 ? (
                  criticalTasks.slice(0, 2).map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-[var(--canvas-sunken)] border border-[var(--brand-marigold)]/30 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[var(--ink-primary)] truncate max-w-[180px]">{t.title}</span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--brand-marigold-subtle)] text-[var(--brand-marigold)]">
                          <Flame className="w-3 h-3 text-[var(--brand-marigold)]" aria-hidden="true" />
                          <span>0d Slack</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--ink-muted)]">
                        Starts Day {t.early_start_day} • Duration: {t.duration_days} days
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-[var(--canvas-sunken)] text-xs text-[var(--ink-muted)] text-center">
                    All upcoming tasks possess positive schedule slack.
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <Link
                  href={`/app/events/${eventId}/timeline`}
                  className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[var(--brand-marigold)] hover:underline min-h-[44px]"
                >
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4" aria-hidden="true" />
                    <span>View Gantt Timeline</span>
                  </span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </BentoCard>

            {/* Bento Col 3 (3 cols): 3-Tier Human Governance */}
            <BentoCard elevation={1} className="lg:col-span-3 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-indigo)]">
                    Autonomy Gate
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-indigo-subtle)] text-[var(--brand-indigo)]">
                    {event.autonomy_mode} Tier
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--ink-primary)]">
                  Human Approvals
                </h3>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--canvas-sunken)] text-center space-y-2">
                <div className="text-3xl font-extrabold text-[var(--ink-primary)] tabular-nums">
                  {pendingApprovalsCount}
                </div>
                <p className="text-xs text-[var(--ink-secondary)] leading-tight">
                  {pendingApprovalsCount === 0
                    ? "Zero pending proposals. All mutations executed."
                    : "Proposals queued for owner sign-off before DB commit."}
                </p>
              </div>

              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <Link
                  href={`/app/events/${eventId}/approvals`}
                  className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[var(--brand-indigo)] hover:underline min-h-[44px]"
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCheck className="w-4 h-4" aria-hidden="true" />
                    <span>Review Queue</span>
                  </span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </BentoCard>
          </div>
        </section>

        {/* Guided Tour Modal & Floating Trigger */}
        <DemoTourOverlay eventId={eventId} />

        {/* Quick Nav Modules Bento */}
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
