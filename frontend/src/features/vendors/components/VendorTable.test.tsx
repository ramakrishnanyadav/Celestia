// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VendorTable } from "./VendorTable";
import type { VendorItem } from "@/lib/api/types";

const mockVendors: VendorItem[] = [
  {
    id: "vend-1",
    event_id: "evt-1",
    name: "Maharaja Royal Catering",
    category: "Catering",
    status: "preferred",
    rating: 4.9,
    contact_email: "maharaja@catering.in",
    contact_phone: "+91 98765 43210",
    quotations: [
      {
        id: "quote-1",
        vendor_id: "vend-1",
        quoted_amount_minor: 12_500_000,
        quoted_amount_rupees: 125000,
        currency: "INR",
        inclusions: ["Live Chaat Counters", "Multi-course Mughlai Dinner"],
        status: "accepted",
        created_at: new Date().toISOString(),
      },
    ],
  },
];

describe("VendorTable", () => {
  it("renders empty state placeholder when no vendors exist", () => {
    render(<VendorTable vendors={[]} />);
    expect(screen.getByText("No vendors compared yet.")).toBeInTheDocument();
  });

  it("renders vendor card with rating, preferred badge, quote and handles add quotation click", () => {
    const handleAddQuote = vi.fn();
    render(<VendorTable vendors={mockVendors} onAddQuoteClick={handleAddQuote} />);

    expect(screen.getByText("Maharaja Royal Catering")).toBeInTheDocument();
    expect(screen.getByText("Preferred")).toBeInTheDocument();
    expect(screen.getByText("4.9")).toBeInTheDocument();
    expect(screen.getByText("₹1,25,000")).toBeInTheDocument();
    expect(screen.getByText(/Live Chaat Counters, Multi-course Mughlai Dinner/)).toBeInTheDocument();

    const addQuoteBtn = screen.getByRole("button", { name: "+ Add Quotation" });
    fireEvent.click(addQuoteBtn);
    expect(handleAddQuote).toHaveBeenCalledWith("vend-1");
  });
});
