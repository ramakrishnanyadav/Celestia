"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface PrintableEventBlueprintProps {
  event: any;
  budgetSummary: any;
  tasks: any[];
}

export function PrintableEventBlueprint({
  event,
  budgetSummary,
  tasks
}: PrintableEventBlueprintProps) {
  if (!event || !budgetSummary) return null;

  return (
    <div className="hidden print:block p-8 bg-white text-slate-900 font-sans max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-end">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-teal-700">
            CELESTIA AI Event Planning Assistant
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">{event.title}</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Master Celebration Blueprint • Generated on {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
          </p>
        </div>
        <div className="text-right text-xs">
          <div><strong>Host City:</strong> {event.city}</div>
          <div><strong>Guest Count:</strong> {event.guest_count} Pax</div>
          <div><strong>Preparation:</strong> {event.preparation_months} Months</div>
        </div>
      </div>

      {/* Financial Executive Summary */}
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
          1. Deterministic Budget Ledger & Allocation
        </h2>
        <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs mb-4">
          <div>
            <span className="text-slate-500 block">Total Budget Ceiling:</span>
            <strong className="text-sm font-bold text-slate-900">
              ₹{budgetSummary.total_budget_rupees.toLocaleString('en-IN')}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">Planned Total:</span>
            <strong className="text-sm font-bold text-slate-900">
              ₹{budgetSummary.planned_total_rupees.toLocaleString('en-IN')}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">10% Contingency Reserve:</span>
            <strong className="text-sm font-bold text-amber-700">
              ₹{budgetSummary.contingency_reserve_rupees.toLocaleString('en-IN')}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">Avg Cost / Guest:</span>
            <strong className="text-sm font-bold text-teal-800">
              ₹{budgetSummary.per_guest_avg_rupees.toLocaleString('en-IN')}
            </strong>
          </div>
        </div>

        {/* Category breakdown table */}
        <table className="w-full text-xs text-left border-collapse border border-slate-200">
          <thead>
            <tr className="bg-slate-100 text-slate-700">
              <th className="p-2 border border-slate-200">Category</th>
              <th className="p-2 border border-slate-200 text-center">Allocation %</th>
              <th className="p-2 border border-slate-200 text-right">Allocated (₹)</th>
              <th className="p-2 border border-slate-200">Cost Structure</th>
            </tr>
          </thead>
          <tbody>
            {budgetSummary.categories.map((cat: any) => (
              <tr key={cat.id}>
                <td className="p-2 border border-slate-200 font-medium text-slate-800">{cat.name}</td>
                <td className="p-2 border border-slate-200 text-center">{cat.allocation_percent}%</td>
                <td className="p-2 border border-slate-200 text-right font-semibold">
                  ₹{cat.allocated_rupees.toLocaleString('en-IN')}
                </td>
                <td className="p-2 border border-slate-200 text-slate-600">
                  {cat.is_per_guest ? `Variable (~₹${cat.per_guest_rupees}/head)` : "Fixed Commitment"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Critical Path Tasks */}
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
          2. Critical Path Method (CPM) Execution Timeline
        </h2>
        <table className="w-full text-xs text-left border-collapse border border-slate-200">
          <thead>
            <tr className="bg-slate-100 text-slate-700">
              <th className="p-2 border border-slate-200">Milestone</th>
              <th className="p-2 border border-slate-200">Task Title</th>
              <th className="p-2 border border-slate-200 text-center">Duration</th>
              <th className="p-2 border border-slate-200">Assigned</th>
              <th className="p-2 border border-slate-200 text-center">Critical Path</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t: any) => (
              <tr key={t.id} className={t.is_critical ? "bg-amber-50/50" : ""}>
                <td className="p-2 border border-slate-200 text-slate-600">{t.milestone_name}</td>
                <td className="p-2 border border-slate-200 font-medium text-slate-800">{t.title}</td>
                <td className="p-2 border border-slate-200 text-center">{t.duration_days}d</td>
                <td className="p-2 border border-slate-200 text-slate-700">{t.assigned_to}</td>
                <td className="p-2 border border-slate-200 text-center font-bold">
                  {t.is_critical ? "YES (0d Slack)" : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cultural Traditions & Dietary */}
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
          3. Cultural Traditions & Dietary Protocols
        </h2>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
            <strong>Dietary Requirement:</strong> {event.preference?.dietary || "Pure Vegetarian"}
            <span className="block text-slate-600 mt-1">
              Multi-course feast featuring Ukadiche Modak, Puran Poli, Solkadhi shooters, and live chaat counters.
            </span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
            <strong>Confirmed Rituals Checklist:</strong>
            <div className="flex flex-wrap gap-1 mt-1">
              {(event.preference?.cultural_traditions || ["Sakhar Puda", "Muhurtham", "Haldi", "Sangeet", "Satyanarayan Puja"]).map((trad: string, i: number) => (
                <span key={i} className="px-1.5 py-0.5 bg-slate-200 rounded text-[10px]">
                  {trad}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Signoff Footer */}
      <div className="pt-8 border-t border-slate-300 grid grid-cols-2 text-xs text-slate-500">
        <div>
          <span>Host Signature: ____________________________</span>
        </div>
        <div className="text-right">
          <span>Date: ____________________________</span>
        </div>
      </div>

    </div>
  );
}
