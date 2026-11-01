"use client";

import React from "react";
import { formatMoney, formatMoneyCompact } from "@/lib/money";
import type { EventItem, BudgetSummary } from "@/lib/api/types";
import { IndianRupee, Users, ShieldCheck, Clock } from "lucide-react";

interface OverviewKpiCardsProps {
  event: EventItem;
  budgetSummary?: BudgetSummary | null | undefined;
  taskCount?: number | undefined;
  criticalTaskCount?: number | undefined;
}

export function OverviewKpiCards({
  event,
  budgetSummary,
  taskCount = 0,
  criticalTaskCount = 0,
}: OverviewKpiCardsProps) {
  const totalBudget = budgetSummary?.total_budget_minor ?? event.budget_minor;
  const safetyBuffer = budgetSummary?.safety_buffer_minor ?? 0;
  const contingencyPercent =
    totalBudget > 0 ? Math.round((safetyBuffer / totalBudget) * 100) : 10;

  const kpis = [
    {
      title: "Total Budget",
      value: formatMoneyCompact(totalBudget),
      subtext: `${formatMoney(totalBudget)} allocated`,
      icon: IndianRupee,
      color: "var(--brand-teal)",
      isMoney: true,
    },
    {
      title: "Guest Count",
      value: `${event.guest_count}`,
      subtext: `₹${Math.round(Number(totalBudget) / 100 / Math.max(1, event.guest_count)).toLocaleString("en-IN")} per guest avg`,
      icon: Users,
      color: "var(--brand-indigo)",
      isMoney: false,
    },
    {
      title: "Contingency Buffer",
      value: formatMoneyCompact(safetyBuffer),
      subtext: `${contingencyPercent}% safety reserve`,
      icon: ShieldCheck,
      color: "var(--brand-marigold)",
      isMoney: true,
    },
    {
      title: "Timeline Tasks",
      value: `${taskCount}`,
      subtext: `${criticalTaskCount} on critical path`,
      icon: Clock,
      color: "var(--ink-secondary)",
      isMoney: false,
    },
  ];

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 list-none p-0 m-0" aria-label="Event Summary KPIs">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <li
            key={kpi.title}
            className="p-5 rounded-2xl glass-card flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                {kpi.title}
              </span>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[var(--canvas-sunken)]"
                style={{ color: kpi.color }}
                aria-hidden="true"
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div
                className="text-2xl font-extrabold text-[var(--ink-primary)] tracking-tight"
                lang={kpi.isMoney ? "en-IN" : undefined}
              >
                {kpi.value}
              </div>
              <p
                className="text-xs sm:text-sm text-[var(--ink-muted)] mt-1 truncate"
                lang={kpi.isMoney ? "en-IN" : undefined}
              >
                {kpi.subtext}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
