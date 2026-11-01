// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { WhatIfSimulator } from "./WhatIfSimulator";
import { api } from "@/lib/api";
import type { EventItem, WhatIfResponse } from "@/lib/api/types";

const mockEvent: EventItem = {
  id: "evt-sim-1",
  user_id: "user-1",
  title: "Royal Jaipur Wedding",
  event_type: "wedding",
  city: "Jaipur",
  venue_type: "Palace",
  guest_count: 300,
  budget_minor: 300_000_000, // 30 Lakhs
  budget_rupees: 3000000,
  currency: "INR",
  timezone: "Asia/Kolkata",
  preparation_months: 6,
  autonomy_mode: "Suggest",
  ai_paused: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockFeasibleSimulation: WhatIfResponse = {
  original_guests: 300,
  simulated_guests: 350,
  guest_count_change: 50,
  original_budget_rupees: 3000000,
  simulated_budget_rupees: 3500000,
  variable_cost_impact_rupees: 400000,
  fixed_cost_total_rupees: 2600000,
  new_contingency_rupees: 350000,
  feasibility_status: "feasible",
  recommendation: "Healthy allocation buffer and balanced distribution.",
  category_breakdowns: [],
};

describe("WhatIfSimulator Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(api, "simulateWhatIf").mockResolvedValue(mockFeasibleSimulation);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders initial event values and optimistic instant calculations", () => {
    render(<WhatIfSimulator event={mockEvent} />);

    expect(screen.getByText("What-If Budget Simulator")).toBeInTheDocument();
    expect(screen.getByText(/300\s*Guests/)).toBeInTheDocument();
    expect(screen.getByText(/Per Guest:/)).toBeInTheDocument();
    expect(screen.getByText(/Contingency:/)).toBeInTheDocument();
  });

  it("debounces api.simulateWhatIf by 250ms on slider change", async () => {
    render(<WhatIfSimulator event={mockEvent} />);

    const guestSlider = screen.getByLabelText("Simulated Guest Count");
    fireEvent.change(guestSlider, { target: { value: "350" } });

    // Immediately after change, api should NOT have been called yet
    expect(api.simulateWhatIf).not.toHaveBeenCalled();

    // Fast-forward 100ms: still debounced
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(api.simulateWhatIf).not.toHaveBeenCalled();

    // Fast-forward remaining 150ms (total 250ms)
    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    expect(api.simulateWhatIf).toHaveBeenCalledTimes(1);
    expect(api.simulateWhatIf).toHaveBeenCalledWith("evt-sim-1", {
      simulated_guest_count: 350,
      simulated_budget_minor: 300_000_000,
    });
  });

  it("updates feasibility badge and recommendation when simulation resolves", async () => {
    render(<WhatIfSimulator event={mockEvent} />);

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByText("Feasible Allocation")).toBeInTheDocument();
    expect(
      screen.getByText("Healthy allocation buffer and balanced distribution.")
    ).toBeInTheDocument();
  });
});
