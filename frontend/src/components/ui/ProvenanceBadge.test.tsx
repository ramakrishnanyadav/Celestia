import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ProvenanceBadge } from "./ProvenanceBadge";

describe("ProvenanceBadge", () => {
  it("renders source and confidence correctly", () => {
    render(<ProvenanceBadge source="Formula (10% Buffer)" confidence="High" />);
    expect(screen.getByText("Formula (10% Buffer)")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("renders assumption when provided", () => {
    render(
      <ProvenanceBadge
        source="Benchmark"
        confidence="Medium"
        assumption="Mumbai Tier-1 venue pricing"
      />
    );
    expect(screen.getByText("Benchmark")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText(/Assumption: Mumbai Tier-1 venue pricing/i)).toBeInTheDocument();
  });
});
