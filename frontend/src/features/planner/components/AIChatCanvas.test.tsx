// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AIChatCanvas } from "./AIChatCanvas";
import type { EventItem, EventPreference } from "@/lib/api/types";

const mockEvent: EventItem = {
  id: "evt-chat-1",
  user_id: "user-1",
  title: "Vedic Palace Wedding",
  event_type: "wedding",
  city: "Udaipur",
  venue_type: "Palace",
  guest_count: 400,
  budget_minor: 80_000_000,
  budget_rupees: 800000,
  currency: "INR",
  timezone: "Asia/Kolkata",
  preparation_months: 6,
  autonomy_mode: "Suggest",
  ai_paused: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockPreferences: EventPreference = {
  id: "pref-1",
  event_id: "evt-chat-1",
  dietary: "Strict Vegetarian",
  theme: "Marigold Gold",
  regional_culture: "Rajasthani",
  sound_curfew: "22:00",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("AIChatCanvas", () => {
  it("renders welcome prompt calibrated to event preferences", () => {
    render(<AIChatCanvas event={mockEvent} preferences={mockPreferences} />);

    expect(screen.getByText("AI Planning Workspace")).toBeInTheDocument();
    expect(
      screen.getByText(/I'm calibrated for Rajasthani with Strict Vegetarian/)
    ).toBeInTheDocument();
  });

  it("sends user message and displays AI reply", async () => {
    const handleSendCommand = vi.fn().mockResolvedValue({
      response: "Reviewed catering budget. Buffer is at 15%.",
    });

    render(
      <AIChatCanvas
        event={mockEvent}
        preferences={mockPreferences}
        onSendCommand={handleSendCommand}
      />
    );

    const input = screen.getByPlaceholderText(/Ask AI/i);
    fireEvent.change(input, { target: { value: "Can we increase decor allocation?" } });

    const sendBtn = screen.getByRole("button", { name: "Send message" });
    fireEvent.click(sendBtn);

    expect(screen.getByText("Can we increase decor allocation?")).toBeInTheDocument();

    await waitFor(() => {
      expect(handleSendCommand).toHaveBeenCalledWith(
        "Can we increase decor allocation?"
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText("Reviewed catering budget. Buffer is at 15%.")
      ).toBeInTheDocument();
    });
  });

  it("handles empty input or submission without onSendCommand gracefully", async () => {
    render(<AIChatCanvas event={mockEvent} />);

    const input = screen.getByPlaceholderText(/Ask AI/i);
    fireEvent.change(input, { target: { value: "Fallback test" } });

    const sendBtn = screen.getByRole("button", { name: "Send message" });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Suggestion noted and evaluated against deterministic constraints.")
      ).toBeInTheDocument();
    });
  });
});
