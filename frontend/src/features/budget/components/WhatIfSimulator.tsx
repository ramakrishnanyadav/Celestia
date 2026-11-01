"use client";

import React, { useState, useEffect, useTransition, useRef } from "react";
import { formatMoney } from "@/lib/money";
import { api } from "@/lib/api";
import type { EventItem, WhatIfResponse } from "@/lib/api/types";
import { Sliders, CheckCircle2, AlertTriangle } from "lucide-react";
import { ProvenanceBadge } from "@/components/ui/ProvenanceBadge";

interface WhatIfSimulatorProps {
  event: EventItem;
  onApplyProposal?: () => void;
}

export function WhatIfSimulator({
  event,
}: WhatIfSimulatorProps) {
  const [guestCount, setGuestCount] = useState(event.guest_count);
  const [budgetLakhs, setBudgetLakhs] = useState(
    Math.round(event.budget_minor / 10_000_000)
  );
  const [simulation, setSimulation] = useState<WhatIfResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const [, startTransition] = useTransition();

  // Latest-wins sequence guard to prevent out-of-order race conditions
  const seqRef = useRef(0);

  // Client-side optimistic calculation for 0ms visual feedback
  const optimisticTotalRupees = budgetLakhs * 100_000;
  const optimisticPerGuestRupees = Math.round(
    optimisticTotalRupees / Math.max(1, guestCount)
  );
  const optimisticContingencyRupees = Math.round(optimisticTotalRupees * 0.1);

  useEffect(() => {
    const controller = new AbortController();
    const currentSeq = ++seqRef.current;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.simulateWhatIf(event.id, {
          simulated_guest_count: guestCount,
          simulated_budget_minor: budgetLakhs * 10_000_000,
        });

        // Sequence guard: only apply if this is still the latest initiated request
        if (currentSeq === seqRef.current) {
          startTransition(() => {
            setSimulation(res);
            setLiveAnnouncement(
              `Simulation updated: ${guestCount} guests, ₹${budgetLakhs} Lakh. Status is ${
                res.feasibility_status === "feasible" ? "feasible" : "tight or over budget"
              }. ${res.recommendation}`
            );
          });
        }
      } catch {
        // Silently caught on abort or transient network debounce
      } finally {
        if (currentSeq === seqRef.current) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [event.id, guestCount, budgetLakhs]);

  const isFeasible = simulation?.feasibility_status === "feasible";

  const handleGuestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Home") {
      setGuestCount(50);
      e.preventDefault();
    } else if (e.key === "End") {
      setGuestCount(1500);
      e.preventDefault();
    }
  };

  const handleBudgetKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Home") {
      setBudgetLakhs(5);
      e.preventDefault();
    } else if (e.key === "End") {
      setBudgetLakhs(100);
      e.preventDefault();
    }
  };

  return (
    <div className="p-6 rounded-2xl glass-card space-y-6">
      {/* Debounced Screen Reader Live Region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="what-if-live-region"
      >
        {liveAnnouncement}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[var(--ink-primary)]">
              What-If Budget Simulator
            </h3>
            <p className="text-xs sm:text-sm text-[var(--ink-muted)]">
              Live deterministic calculation with 250ms debounce & latest-wins guard
            </p>
          </div>
        </div>
        {simulation ? (
          <span
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
              isFeasible
                ? "bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] border border-[var(--brand-teal)]/30"
                : "bg-[var(--brand-marigold-subtle)] text-[var(--brand-marigold)] border border-[var(--brand-marigold)]/30"
            }`}
          >
            {isFeasible ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            <span>{isFeasible ? "Feasible Allocation" : "Tight / Over-Budget"}</span>
          </span>
        ) : (
          <span className="text-xs text-[var(--ink-muted)] italic">
            Computing preview...
          </span>
        )}
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-semibold">
            <label htmlFor="simulated-guest-slider" className="text-[var(--ink-secondary)]">
              Simulated Guest Count
            </label>
            <span className="text-[var(--ink-primary)]">
              {guestCount} Guests
            </span>
          </div>
          <input
            id="simulated-guest-slider"
            type="range"
            min={50}
            max={1500}
            step={25}
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value))}
            onKeyDown={handleGuestKeyDown}
            className="w-full accent-[var(--brand-teal)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] rounded-lg min-h-[44px]"
            aria-label="Simulated Guest Count"
            aria-valuemin={50}
            aria-valuemax={1500}
            aria-valuenow={guestCount}
            aria-valuetext={`${guestCount} guests`}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm font-semibold">
            <label htmlFor="simulated-budget-slider" className="text-[var(--ink-secondary)]">
              Simulated Budget Lakhs
            </label>
            <span className="text-[var(--ink-primary)]">
              ₹{budgetLakhs} Lakh ({formatMoney(budgetLakhs * 10_000_000)})
            </span>
          </div>
          <input
            id="simulated-budget-slider"
            type="range"
            min={5}
            max={100}
            step={1}
            value={budgetLakhs}
            onChange={(e) => setBudgetLakhs(Number(e.target.value))}
            onKeyDown={handleBudgetKeyDown}
            className="w-full accent-[var(--brand-teal)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] rounded-lg min-h-[44px]"
            aria-label="Simulated Budget Lakhs"
            aria-valuemin={5}
            aria-valuemax={100}
            aria-valuenow={budgetLakhs}
            aria-valuetext={`₹${budgetLakhs} Lakh`}
          />
        </div>
      </div>

      {/* Immediate Optimistic Preview + Server Breakdown */}
      <div className="p-4 rounded-xl bg-[var(--canvas-sunken)] text-sm text-[var(--ink-secondary)] space-y-2">
        <p className="font-medium text-[var(--ink-primary)] leading-relaxed">
          {simulation ? simulation.recommendation : `Simulating ${guestCount} guests with ₹${budgetLakhs} Lakh budget...`}
        </p>
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[var(--border-subtle)] text-xs sm:text-sm">
          <span>
            Per Guest:{" "}
            <span lang="en-IN" className="font-semibold text-[var(--ink-primary)]">
              ₹{(simulation
                ? Math.round(
                    simulation.simulated_budget_rupees /
                      (simulation.simulated_guests || 1)
                  )
                : optimisticPerGuestRupees
              ).toLocaleString("en-IN")}
            </span>
          </span>
          <span aria-hidden="true">•</span>
          <span>
            Contingency:{" "}
            <span lang="en-IN" className="font-semibold text-[var(--ink-primary)]">
              ₹{(simulation
                ? Math.round(simulation.new_contingency_rupees)
                : optimisticContingencyRupees
              ).toLocaleString("en-IN")}
            </span>
          </span>
          {loading && (
            <span className="ml-auto text-[var(--brand-teal)] font-medium">
              Syncing...
            </span>
          )}
        </div>
        <div className="pt-2">
          <ProvenanceBadge
            source="What-If Engine"
            confidence="High"
            assumption="100% deterministic arithmetic simulation without database state mutation"
          />
        </div>
      </div>
    </div>
  );
}
