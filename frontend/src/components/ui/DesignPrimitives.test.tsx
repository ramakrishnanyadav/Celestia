import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { KPICard } from "./KPICard";
import { BentoCard } from "./BentoCard";
import { ProgressRing } from "./ProgressRing";
import { EmptyState } from "./EmptyState";
import { Sparkles } from "lucide-react";

describe("Design System Component Primitives", () => {
  it("Button renders text, handles click, and shows loading spinner", () => {
    const handleClick = vi.fn();
    const { rerender } = render(
      <Button onClick={handleClick} variant="primary">
        Submit Plan
      </Button>
    );

    const btn = screen.getByRole("button", { name: "Submit Plan" });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Rerender with loading state
    rerender(
      <Button onClick={handleClick} isLoading>
        Submit Plan
      </Button>
    );
    expect(btn).toHaveAttribute("aria-busy", "true");
    expect(btn).toBeDisabled();
  });

  it("IconButton renders accessible label and handles click", () => {
    const handleClick = vi.fn();
    render(
      <IconButton label="Open calendar" onClick={handleClick}>
        <Sparkles className="w-5 h-5" />
      </IconButton>
    );

    const iconBtn = screen.getByRole("button", { name: "Open calendar" });
    expect(iconBtn).toBeInTheDocument();
    fireEvent.click(iconBtn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("KPICard renders value, delta, subtext, and provenance", () => {
    render(
      <KPICard
        title="Total Budget"
        value="₹15 Lakhs"
        subtext="Committed celebration funds"
        delta={{ value: "+₹2.5L", isPositive: true }}
        icon={Sparkles}
        source="Formula"
        confidence="High"
      />
    );

    expect(screen.getByText("Total Budget")).toBeInTheDocument();
    expect(screen.getByText("₹15 Lakhs")).toBeInTheDocument();
    expect(screen.getByText("+₹2.5L")).toBeInTheDocument();
    expect(screen.getByText("Committed celebration funds")).toBeInTheDocument();
    expect(screen.getByText("Formula")).toBeInTheDocument();
  });

  it("BentoCard renders children with elevation class", () => {
    const { container } = render(
      <BentoCard elevation={2}>
        <p>Bento Card Content</p>
      </BentoCard>
    );

    expect(screen.getByText("Bento Card Content")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("glass-2");
  });

  it("ProgressRing renders meter with correct aria attributes", () => {
    render(
      <ProgressRing
        allocatedPercent={90}
        contingencyPercent={10}
        label="₹15.0L"
        sublabel="Cap"
      />
    );

    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("aria-valuenow", "90");
    expect(screen.getByText("₹15.0L")).toBeInTheDocument();
  });

  it("EmptyState renders title, description, and triggers action", () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="No Milestones"
        description="Get started by creating your first milestone"
        actionLabel="Create Milestone"
        onAction={handleAction}
      />
    );

    expect(screen.getByText("No Milestones")).toBeInTheDocument();
    expect(screen.getByText("Get started by creating your first milestone")).toBeInTheDocument();

    const actionBtn = screen.getByRole("button", { name: "Create Milestone" });
    fireEvent.click(actionBtn);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });
});
