// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ApprovalsList } from "./ApprovalsList";
import type { ApprovalItem } from "@/lib/api/types";

const mockApprovals: ApprovalItem[] = [
  {
    id: "appr-1",
    event_id: "evt-1",
    title: "Reallocate Contingency to Floral Stage",
    proposal_type: "budget_reallocation",
    summary: "Shift ₹50,000 from reserve to high-impact entrance florals.",
    status: "pending",
    diff_summary: {},
    proposed_changes_json: { delta_minor: 5000000 },
    created_at: new Date().toISOString(),
  },
  {
    id: "appr-2",
    event_id: "evt-1",
    title: "Vendor Selection: Royal DJ Sound",
    proposal_type: "vendor_lock",
    summary: "Lowest quotation under sound & acoustic category.",
    status: "approved",
    diff_summary: {},
    proposed_changes_json: {},
    created_at: new Date().toISOString(),
  },
];

describe("ApprovalsList", () => {
  it("renders empty state placeholder when no approvals are pending", () => {
    render(<ApprovalsList approvals={[]} />);
    expect(screen.getByText("All proposals reviewed")).toBeInTheDocument();
  });

  it("renders approvals list and triggers onAction approve and reject callbacks", () => {
    const handleAction = vi.fn();
    render(<ApprovalsList approvals={mockApprovals} onAction={handleAction} />);

    expect(screen.getByText("Reallocate Contingency to Floral Stage")).toBeInTheDocument();
    expect(screen.getByText("Vendor Selection: Royal DJ Sound")).toBeInTheDocument();

    const approveBtn = screen.getByRole("button", { name: /Approve/i });
    fireEvent.click(approveBtn);
    expect(handleAction).toHaveBeenCalledWith("appr-1", "approve");

    const rejectBtn = screen.getByRole("button", { name: /Reject/i });
    fireEvent.click(rejectBtn);
    expect(handleAction).toHaveBeenCalledWith("appr-1", "reject");
  });
});
