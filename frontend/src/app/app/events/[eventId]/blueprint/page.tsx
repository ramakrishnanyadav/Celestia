"use client";

import React, { use } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useEvent, useEvents, useCurrentUser, useBudgetSummary, useTasks } from "@/lib/hooks/queries";
import { formatMoney } from "@/lib/money";
import { Printer } from "lucide-react";

export default function EventBlueprintPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: events } = useEvents();
  const { data: user } = useCurrentUser();
  const { data: budget, isLoading: budgetLoading } = useBudgetSummary(eventId);
  const { data: tasks, isLoading: tasksLoading } = useTasks(eventId);

  if (eventLoading || budgetLoading || tasksLoading || !event || !budget) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center text-sm text-[var(--ink-muted)]">
        Generating celebration blueprint preview...
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell
      eventId={eventId}
      event={event}
      events={events}
      currentUser={user}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="print:hidden">
          <Breadcrumbs
            items={[
              { label: event.title, href: `/app/events/${eventId}` },
              { label: "Blueprint", current: true },
            ]}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink-primary)] tracking-tight">
              Master Celebration Blueprint
            </h1>
            <p className="text-sm text-[var(--ink-secondary)] mt-1">
              Official vendor-ready operational and financial execution plan for &quot;{event.title}&quot;.
            </p>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brand-teal)] text-white text-sm font-semibold cursor-pointer shadow-xs hover:opacity-90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
          >
            <Printer className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Print / Export PDF</span>
          </button>
        </div>

        <article className="p-8 bg-white text-slate-900 border border-slate-300 rounded-2xl shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
          <header className="border-b-2 border-slate-900 pb-4 flex justify-between items-end">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-teal-800">
                CELESTIA Celebration Planning Protocol
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                {event.title}
              </h2>
              <p className="text-sm text-slate-700 mt-0.5">
                Official Plan • {event.city} • {event.guest_count} Guests •{" "}
                {event.preparation_months} Months Prep Window
              </p>
            </div>
            <div className="text-right text-xs sm:text-sm">
              <div className="font-bold text-slate-800">{event.venue_type}</div>
              <div className="text-slate-600">
                Autonomy: {event.autonomy_mode}
              </div>
            </div>
          </header>

          <section aria-labelledby="blueprint-financials-heading">
            <h3 id="blueprint-financials-heading" className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
              1. Financial Summary & Allocation Ledger
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-300 rounded-xl text-sm mb-4">
              <div>
                <span className="text-slate-600 block text-xs">
                  Total Budget Ceiling
                </span>
                <strong className="text-sm font-bold text-slate-900" lang="en-IN">
                  {formatMoney(budget.total_budget_minor)}
                </strong>
              </div>
              <div>
                <span className="text-slate-600 block text-xs">
                  Planned Total
                </span>
                <strong className="text-sm font-bold text-slate-900" lang="en-IN">
                  {formatMoney(budget.planned_total_minor)}
                </strong>
              </div>
              <div>
                <span className="text-slate-600 block text-xs">
                  10% Contingency
                </span>
                <strong className="text-sm font-bold text-amber-800" lang="en-IN">
                  {formatMoney(budget.contingency_reserve_minor)}
                </strong>
              </div>
              <div>
                <span className="text-slate-600 block text-xs">
                  Per-Guest Avg
                </span>
                <strong className="text-sm font-bold text-teal-900" lang="en-IN">
                  ₹{budget.per_guest_avg_rupees.toLocaleString("en-IN")}
                </strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse border border-slate-300" aria-label="Budget Categories Breakdown">
                <caption className="sr-only">Itemized Budget Category Allocations</caption>
                <thead>
                  <tr className="bg-slate-100 text-slate-800 text-xs uppercase font-semibold">
                    <th scope="col" className="p-3 border border-slate-300">Category</th>
                    <th scope="col" className="p-3 border border-slate-300 text-center">Basis Points</th>
                    <th scope="col" className="p-3 border border-slate-300 text-right">Allocated</th>
                    <th scope="col" className="p-3 border border-slate-300">Cost Structure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {budget.categories.map((c) => (
                    <tr key={c.id}>
                      <th scope="row" className="p-3 border border-slate-300 font-semibold text-slate-900">
                        {c.name}
                      </th>
                      <td className="p-3 border border-slate-300 text-center text-slate-700">
                        {Math.round(c.allocation_percent * 100)} bps
                      </td>
                      <td className="p-3 border border-slate-300 text-right font-bold text-slate-900" lang="en-IN">
                        {formatMoney(c.allocated_amount_minor)}
                      </td>
                      <td className="p-3 border border-slate-300 text-slate-700">
                        {c.is_per_guest
                          ? `Variable (~${formatMoney(c.per_guest_minor ?? 0)}/head)`
                          : "Fixed Commitment"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="blueprint-timeline-heading">
            <h3 id="blueprint-timeline-heading" className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
              2. Critical Path Timeline Tasks ({tasks?.length ?? 0} Milestones)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse border border-slate-300" aria-label="Timeline Milestones and Critical Path">
                <caption className="sr-only">Milestone Tasks and Critical Path Sequencing</caption>
                <thead>
                  <tr className="bg-slate-100 text-slate-800 text-xs uppercase font-semibold">
                    <th scope="col" className="p-3 border border-slate-300">Milestone</th>
                    <th scope="col" className="p-3 border border-slate-300">Task Title</th>
                    <th scope="col" className="p-3 border border-slate-300 text-center">Duration</th>
                    <th scope="col" className="p-3 border border-slate-300 text-center">Status</th>
                    <th scope="col" className="p-3 border border-slate-300 text-center">Critical Path</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {tasks?.map((t) => (
                    <tr
                      key={t.id}
                      className={t.is_critical ? "bg-amber-50" : ""}
                    >
                      <td className="p-3 border border-slate-300 text-slate-700">
                        {t.milestone_name}
                      </td>
                      <th scope="row" className="p-3 border border-slate-300 font-semibold text-slate-900">
                        {t.title}
                      </th>
                      <td className="p-3 border border-slate-300 text-center text-slate-700">
                        {t.duration_days}d
                      </td>
                      <td className="p-3 border border-slate-300 text-center text-slate-700 capitalize">
                        {t.status}
                      </td>
                      <td className="p-3 border border-slate-300 text-center font-bold text-slate-900">
                        {t.is_critical ? "YES (0d Slack)" : "No"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="pt-8 border-t border-slate-300 grid grid-cols-2 text-sm text-slate-700">
            <div>Host Signature: ____________________________</div>
            <div className="text-right">
              Signoff Date: ____________________________
            </div>
          </footer>
        </article>
      </div>
    </AppShell>
  );
}
