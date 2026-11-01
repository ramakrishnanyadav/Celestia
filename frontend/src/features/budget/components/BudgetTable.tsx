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
        <Layers className="w-8 h-8 mx-auto text-[var(--ink-muted)] mb-2" />
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
                <td className="px-5 py-4 font-semibold flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] flex items-center justify-center shrink-0">
                    <IndianRupee className="w-3.5 h-3.5" />
                  </div>
                  <span>{cat.name}</span>
                </td>
                <td className="px-5 py-4 text-[var(--ink-secondary)]">
                  {cat.allocation_percent}%
                </td>
                <td className="px-5 py-4 font-medium">
                  {formatMoney(cat.allocated_amount_minor)}
                </td>
                <td className="px-5 py-4 text-[var(--ink-secondary)] text-xs">
                  {expenseCount} items ({formatMoney(totalSpent)} spent)
                </td>
                <td className="px-5 py-4 text-right">
                  {onAddExpenseClick && (
                    <button
                      type="button"
                      onClick={() => onAddExpenseClick(cat.id)}
                      className="text-xs font-semibold text-[var(--brand-teal)] hover:underline"
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
