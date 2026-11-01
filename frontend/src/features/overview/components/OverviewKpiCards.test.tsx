// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OverviewKpiCards } from "./OverviewKpiCards";
import type { EventItem, BudgetSummary } from "@/lib/api/types";

const mockEvent: EventItem = {
  id: "evt-kpi-1",
  user_id: "user-1",
  title: "Goa Beach Wedding",
  event_type: "wedding",
  city: "Goa",
  venue_type: "Beachfront Resort",
  guest_count: 200,
  budget_minor: 50_000_000, // 5 Lakhs
  budget_rupees: 500000,
  currency: "INR",
  timezone: "Asia/Kolkata",
  preparation_months: 4,
  autonomy_mode: "Suggest",
  ai_paused: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockSummary: BudgetSummary = {
  total_budget_minor: 50_000_000,
  allocated_minor: 40_000_000,
  committed_minor: 25_000_000,
  actual_minor: 10_000_000,
  safety_buffer_minor: 10_000_000,
  currency: "INR",
  variance_minor: 0,
};

describe("OverviewKpiCards", () => {
  it("renders all four KPI metrics correctly with formatted Indian currency", () => {
    render(
      <OverviewKpiCards
        event={mockEvent}
        budgetSummary={mockSummary}
        taskCount={45}
        criticalTaskCount={8}
      />
    );

    expect(screen.getByText("Total Budget")).toBeInTheDocument();
    expect(screen.getByText("₹5.0 L")).toBeInTheDocument();

    expect(screen.getByText("Guest Count")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();

    expect(screen.getByText("Contingency Buffer")).toBeInTheDocument();
    expect(screen.getByText("₹1.0 L")).toBeInTheDocument();
    expect(screen.getByText("20% safety reserve")).toBeInTheDocument();

    expect(screen.getByText("Timeline Tasks")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("8 on critical path")).toBeInTheDocument();
  });

  it("safely falls back to event defaults when budget summary is omitted", () => {
    render(<OverviewKpiCards event={mockEvent} />);

    expect(screen.getByText("Total Budget")).toBeInTheDocument();
    expect(screen.getByText("₹5.0 L")).toBeInTheDocument();
    expect(screen.getByText("0 on critical path")).toBeInTheDocument();
  });
});
