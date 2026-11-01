"use client";

import React from "react";
import { formatMoney } from "@/lib/money";
import type { BudgetCategory, ExpenseItem } from "@/lib/api/types";
import { IndianRupee, Layers } from "lucide-react";

interface BudgetTableProps {
  categories: BudgetCategory[];
  onAddExpenseClick?: (categoryId: string) => void;
}

export function BudgetTable({
  categories,
  onAddExpenseClick,
}: BudgetTableProps) {
  if (categories.length === 0) {
    return (
      <div className="p-8 text-center glass-card rounded-2xl">
        <Layers className="w-8 h-8 mx-auto text-[var(--ink-muted)] mb-2" aria-hidden="true" />
        <p className="text-sm text-[var(--ink-secondary)]">
          No budget categories allocated yet.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl glass-card border border-[var(--border-subtle)]">
      <table
        className="w-full text-left text-sm"
        aria-label="Budget Categories and Ledger"
      >
        <caption className="sr-only">Budget Category Allocations and Tracked Expenses</caption>
        <thead className="bg-[var(--canvas-sunken)] text-xs uppercase font-semibold text-[var(--ink-muted)] border-b border-[var(--border-subtle)]">
          <tr>
            <th scope="col" className="px-5 py-3.5">
              Category
            </th>
            <th scope="col" className="px-5 py-3.5">
              Allocation
            </th>
            <th scope="col" className="px-5 py-3.5">
              Allocated (INR)
            </th>
            <th scope="col" className="px-5 py-3.5">
              Expenses Tracked
            </th>
            <th scope="col" className="px-5 py-3.5 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--ink-primary)]">
          {categories.map((cat) => {
            const expenseCount = cat.expenses ? cat.expenses.length : 0;
            const totalSpent = cat.expenses
              ? (cat.expenses as ExpenseItem[]).reduce(
                  (sum: number, exp: ExpenseItem) =>
                    sum + exp.actual_amount_minor,
                  0
                )
              : 0;

            return (
              <tr
                key={cat.id}
                className="hover:bg-[var(--canvas-subtle)] transition-colors"
              >
                <th
                  scope="row"
                  className="px-5 py-4 font-semibold text-[var(--ink-primary)] flex items-center gap-2.5 font-normal"
                >
                  <div
                    className="w-8 h-8 rounded-lg bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <span className="font-semibold">{cat.name}</span>
                </th>
                <td className="px-5 py-4 text-[var(--ink-secondary)]">
                  {cat.allocation_percent}%
                </td>
                <td className="px-5 py-4 font-medium" lang="en-IN">
                  {formatMoney(cat.allocated_amount_minor)}
                </td>
                <td className="px-5 py-4 text-[var(--ink-secondary)] text-sm" lang="en-IN">
                  {expenseCount} items ({formatMoney(totalSpent)} spent)
                </td>
                <td className="px-5 py-4 text-right">
                  {onAddExpenseClick && (
                    <button
                      type="button"
                      onClick={() => onAddExpenseClick(cat.id)}
                      className="min-h-[44px] px-3 py-1.5 inline-flex items-center text-sm font-semibold text-[var(--brand-teal)] hover:underline rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
                    >
                      + Add Item
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
