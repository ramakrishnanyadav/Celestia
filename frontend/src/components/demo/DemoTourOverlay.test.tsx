import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { DemoTourOverlay } from "./DemoTourOverlay";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === "tour" ? "1" : null),
  }),
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

describe("DemoTourOverlay", () => {
  it("renders tour modal when ?tour=1 is present", () => {
    render(<DemoTourOverlay eventId="evt-123" />);
    expect(screen.getByText(/Magic Moment 1: Financial Precision/i)).toBeInTheDocument();
    expect(screen.getByText(/Deterministic Integer Budget & 10% Contingency Reserve/i)).toBeInTheDocument();
  });

  it("navigates forward through tour moments", () => {
    render(<DemoTourOverlay eventId="evt-123" />);
    const nextBtn = screen.getByRole("button", { name: /Next Moment/i });
    fireEvent.click(nextBtn);
    expect(screen.getByText(/Magic Moment 2: Interactive Scenario Modeling/i)).toBeInTheDocument();
  });

  it("closes cleanly when X is clicked", () => {
    render(<DemoTourOverlay eventId="evt-123" />);
    const closeBtn = screen.getByRole("button", { name: /Close guided tour/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/Magic Moment 1: Financial Precision/i)).not.toBeInTheDocument();
    // Pill should now be visible
    expect(screen.getByRole("button", { name: /Start Guided 3-Minute Demo Tour/i })).toBeInTheDocument();
  });
});
