// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskList } from "./TaskList";
import type { TaskItem } from "@/lib/api/types";

const mockTasks: TaskItem[] = [
  {
    id: "task-1",
    event_id: "evt-1",
    title: "Reserve Sangeet Heritage Hall",
    description: "Finalize deposit and acoustic confirmation",
    category: "Venue",
    milestone_name: "Month 6",
    days_before_event: 180,
    duration_days: 3,
    priority: "high",
    status: "pending",
    assigned_to: "Host Family",
    is_critical: true,
    total_slack: 0,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe("TaskList", () => {
  it("renders empty state placeholder when no tasks exist", () => {
    render(<TaskList tasks={[]} />);
    expect(screen.getByText("No tasks scheduled yet.")).toBeInTheDocument();
  });

  it("renders task item with critical path indicator and triggers completion toggle", () => {
    const handleToggle = vi.fn();
    render(<TaskList tasks={mockTasks} onToggleComplete={handleToggle} />);

    expect(screen.getByText("Reserve Sangeet Heritage Hall")).toBeInTheDocument();
    expect(screen.getByText("Critical Path")).toBeInTheDocument();
    expect(screen.getByText(/Month 6/)).toBeInTheDocument();

    const toggleBtn = screen.getByRole("button", { name: /Mark task 'Reserve Sangeet Heritage Hall'/i });
    fireEvent.click(toggleBtn);
    expect(handleToggle).toHaveBeenCalledWith(mockTasks[0]);
  });
});
