"use client";

import React, { useState, useEffect, useTransition } from "react";
import { formatMoney, formatMoneyCompact } from "@/lib/money";
import { api } from "@/lib/api";
import type { EventItem, WhatIfResponse } from "@/lib/api/types";
import { Sliders, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";

interface WhatIfSimulatorProps {
  event: EventItem;
  onApplyProposal?: () => void;
}

export function WhatIfSimulator({
  event,
  onApplyProposal,
}: WhatIfSimulatorProps) {
  const [guestCount, setGuestCount] = useState(event.guest_count);
  const [budgetLakhs, setBudgetLakhs] = useState(
    Math.round(event.budget_minor / 10_000_000)
  );
  const [simulation, setSimulation] = useState<WhatIfResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.simulateWhatIf(event.id, {
          simulated_guest_count: guestCount,
          simulated_budget_minor: budgetLakhs * 10_000_000,
        });
        startTransition(() => {
          setSimulation(res);
        });
      } catch {
        // Silently caught on abort or transient network debounce
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [event.id, guestCount, budgetLakhs]);

  const isFeasible = simulation?.feasibility_status === "feasible";

  return (
    <div className="p-6 rounded-2xl glass-card space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--ink-primary)]">
              What-If Budget Simulator
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              Live deterministic recalculation with 250ms debounce
            </p>
          </div>
        </div>
        {simulation && (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isFeasible
                ? "bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)]"
                : "bg-[var(--brand-marigold-subtle)] text-[var(--brand-marigold)]"
            }`}
          >
            {isFeasible ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
            {isFeasible ? "Feasible Allocation" : "Tight / Over-Budget"}
          </span>
        )}
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-[var(--ink-secondary)]">
              Simulated Guests
            </span>
            <span className="text-[var(--ink-primary)]">
              {guestCount} Guests
            </span>
          </div>
          <input
            type="range"
            min={50}
            max={1500}
            step={25}
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value))}
            className="w-full accent-[var(--brand-teal)] cursor-pointer"
            aria-label="Simulated Guest Count"
            aria-valuetext={`${guestCount} guests`}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-[var(--ink-secondary)]">
              Simulated Budget
            </span>
            <span className="text-[var(--ink-primary)]">
              ₹{budgetLakhs} Lakh ({formatMoney(budgetLakhs * 10_000_000)})
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={100}
            step={1}
            value={budgetLakhs}
            onChange={(e) => setBudgetLakhs(Number(e.target.value))}
            className="w-full accent-[var(--brand-teal)] cursor-pointer"
            aria-label="Simulated Budget Lakhs"
            aria-valuetext={`₹${budgetLakhs} Lakh`}
          />
        </div>
      </div>

      {/* Simulation Result Preview */}
      {simulation && (
        <div className="p-4 rounded-xl bg-[var(--canvas-sunken)] text-xs text-[var(--ink-secondary)] space-y-2">
          <p className="font-medium text-[var(--ink-primary)] leading-relaxed">
            {simulation.recommendation}
          </p>
          <div className="flex items-center gap-4 pt-2 border-t border-[var(--border-subtle)]">
            <span>
              Per Guest: ₹
              {Math.round(
                simulation.simulated_budget_rupees /
                  (simulation.simulated_guests || 1)
              ).toLocaleString("en-IN")}
            </span>
            <span>•</span>
            <span>
              Contingency: ₹
              {Math.round(simulation.new_contingency_rupees).toLocaleString(
                "en-IN"
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
