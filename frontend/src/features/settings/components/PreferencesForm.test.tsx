// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PreferencesForm } from "./PreferencesForm";
import type { EventItem, EventPreference } from "@/lib/api/types";

const mockEvent: EventItem = {
  id: "evt-pref-1",
  user_id: "user-1",
  title: "Punjabi Gala Wedding",
  event_type: "wedding",
  city: "Chandigarh",
  venue_type: "Resort",
  guest_count: 500,
  budget_minor: 100_000_000,
  budget_rupees: 1000000,
  currency: "INR",
  timezone: "Asia/Kolkata",
  preparation_months: 8,
  autonomy_mode: "Suggest",
  ai_paused: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockPreferences: EventPreference = {
  id: "pref-1",
  event_id: "evt-pref-1",
  dietary: "Jain Vegetarian",
  theme: "Rose Gold & Pastel Peach",
  regional_culture: "Punjabi Heritage",
  sound_curfew: "22:00",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("PreferencesForm", () => {
  it("renders with initial preference values", () => {
    render(<PreferencesForm event={mockEvent} preferences={mockPreferences} />);

    expect(screen.getByText("Cultural & Dietary Preferences")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Jain Vegetarian")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Rose Gold & Pastel Peach")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Punjabi Heritage")).toBeInTheDocument();
  });

  it("submits updated preferences and shows saved confirmation", async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    render(
      <PreferencesForm
        event={mockEvent}
        preferences={mockPreferences}
        onSave={handleSave}
      />
    );

    const dietaryInput = screen.getByDisplayValue("Jain Vegetarian");
    fireEvent.change(dietaryInput, { target: { value: "Pure Vegetarian" } });

    const submitBtn = screen.getByRole("button", { name: /Save Preferences/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith({
        dietary: "Pure Vegetarian",
        theme: "Rose Gold & Pastel Peach",
        regional_culture: "Punjabi Heritage",
      });
    });

    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("falls back to default cultural preferences when preferences is null", () => {
    render(<PreferencesForm event={mockEvent} preferences={null} />);

    expect(screen.getByDisplayValue("Pure Vegetarian")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Royal Marigold & Polished Brass")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Maharashtrian Traditional")).toBeInTheDocument();
  });
});
