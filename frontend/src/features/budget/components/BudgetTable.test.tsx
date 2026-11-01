// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BudgetTable } from "./BudgetTable";
import type { BudgetCategory } from "@/lib/api/types";

const mockCategories: BudgetCategory[] = [
  {
    id: "cat-1",
    event_id: "evt-1",
    name: "Catering & Banquet",
    allocation_percent: 30,
    allocation_basis_points: 3000,
    allocated_amount_minor: 30_000_000,
    allocated_amount_rupees: 300000,
    icon: "IndianRupee",
    is_per_guest: false,
    per_guest_minor: 0,
    sort_order: 0,
    version: 1,
    expenses: [
      {
        id: "exp-1",
        category_id: "cat-1",
        name: "Welcome Dinner Buffet",
        planned_amount_minor: 15_000_000,
        actual_amount_minor: 12_000_000,
        provenance: "estimate",
        version: 1,
      },
    ],
  },
];

describe("BudgetTable", () => {
  it("renders empty state placeholder when no categories exist", () => {
    render(<BudgetTable categories={[]} />);
    expect(screen.getByText("No budget categories allocated yet.")).toBeInTheDocument();
  });

  it("renders table with category details and calculated spent total", () => {
    const handleAdd = vi.fn();
    render(<BudgetTable categories={mockCategories} onAddExpenseClick={handleAdd} />);

    expect(screen.getByText("Catering & Banquet")).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
    expect(screen.getByText("₹3,00,000")).toBeInTheDocument();
    expect(screen.getByText(/1 items \(₹1,20,000 spent\)/)).toBeInTheDocument();

    const addBtn = screen.getByRole("button", { name: "+ Add Item" });
    fireEvent.click(addBtn);
    expect(handleAdd).toHaveBeenCalledWith("cat-1");
  });
});
