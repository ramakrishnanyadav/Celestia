"use client";

import React, { use } from "react";
import { useEvent, useBudgetSummary, useTasks } from "@/lib/hooks/queries";
import { formatMoney } from "@/lib/money";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/navigation";

export default function EventBlueprintPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: budget, isLoading: budgetLoading } = useBudgetSummary(eventId);
  const { data: tasks, isLoading: tasksLoading } = useTasks(eventId);

  if (eventLoading || budgetLoading || tasksLoading || !event || !budget) {
    return (
      <div className="p-8 text-center text-xs text-[var(--ink-muted)]">
        Generating blueprint preview...
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-xl font-bold text-[var(--ink-primary)]">
            Master Celebration Blueprint
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">
            Official vendor-ready operational and financial blueprint.
          </p>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--brand-teal)] text-white text-xs font-semibold cursor-pointer shadow-xs hover:opacity-90 transition-all"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      <div className="p-8 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-end">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-teal-800">
              CELESTIA Celebration Planning Protocol
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {event.title}
            </h1>
            <p className="text-[11px] text-slate-600">
              Generated Blueprint • {event.city} • {event.guest_count} Guests •{" "}
              {event.preparation_months} Months Prep
            </p>
          </div>
          <div className="text-right text-xs">
            <div className="font-bold text-slate-800">{event.venue_type}</div>
            <div className="text-slate-500">
              Autonomy: {event.autonomy_mode}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
            1. Financial Summary & Allocation Ledger
          </h3>
          <div className="grid grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs mb-3">
            <div>
              <span className="text-slate-500 block text-[10px]">
                Total Budget Ceiling
              </span>
              <strong className="text-xs font-bold text-slate-900">
                {formatMoney(budget.total_budget_minor)}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">
                Planned Total
              </span>
              <strong className="text-xs font-bold text-slate-900">
                {formatMoney(budget.planned_total_minor)}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">
                10% Contingency
              </span>
              <strong className="text-xs font-bold text-amber-700">
                {formatMoney(budget.contingency_reserve_minor)}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">
                Per-Guest Avg
              </span>
              <strong className="text-xs font-bold text-teal-800">
                ₹{budget.per_guest_avg_rupees.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>

          <table className="w-full text-xs text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="p-2 border border-slate-200">Category</th>
                <th className="p-2 border border-slate-200 text-center">
                  Basis Points
                </th>
                <th className="p-2 border border-slate-200 text-right">
                  Allocated
                </th>
                <th className="p-2 border border-slate-200">Cost Structure</th>
              </tr>
            </thead>
            <tbody>
              {budget.categories.map((c) => (
                <tr key={c.id}>
                  <td className="p-2 border border-slate-200 font-medium text-slate-800">
                    {c.name}
                  </td>
                  <td className="p-2 border border-slate-200 text-center">
                    {Math.round(c.allocation_percent * 100)} bps
                  </td>
                  <td className="p-2 border border-slate-200 text-right font-semibold">
                    {formatMoney(c.allocated_amount_minor)}
                  </td>
                  <td className="p-2 border border-slate-200 text-slate-600">
                    {c.is_per_guest
                      ? `Variable (~${formatMoney(c.per_guest_minor ?? 0)}/head)`
                      : "Fixed Commitment"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
            2. Critical Path Timeline Tasks ({tasks?.length ?? 0} Milestones)
          </h3>
          <table className="w-full text-xs text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="p-2 border border-slate-200">Milestone</th>
                <th className="p-2 border border-slate-200">Task Title</th>
                <th className="p-2 border border-slate-200 text-center">
                  Duration
                </th>
                <th className="p-2 border border-slate-200 text-center">
                  Status
                </th>
                <th className="p-2 border border-slate-200 text-center">
                  Critical Path
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks?.map((t) => (
                <tr
                  key={t.id}
                  className={t.is_critical ? "bg-amber-50/50" : ""}
                >
                  <td className="p-2 border border-slate-200 text-slate-600">
                    {t.milestone_name}
                  </td>
                  <td className="p-2 border border-slate-200 font-medium text-slate-800">
                    {t.title}
                  </td>
                  <td className="p-2 border border-slate-200 text-center">
                    {t.duration_days}d
                  </td>
                  <td className="p-2 border border-slate-200 text-center text-slate-600 capitalize">
                    {t.status}
                  </td>
                  <td className="p-2 border border-slate-200 text-center font-bold">
                    {t.is_critical ? "YES (0d Slack)" : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-8 border-t border-slate-300 grid grid-cols-2 text-xs text-slate-500">
          <div>Host Signature: ____________________________</div>
          <div className="text-right">
            Signoff Date: ____________________________
          </div>
        </div>
      </div>
    </div>
  );
}
