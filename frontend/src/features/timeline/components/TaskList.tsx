"use client";

import React from "react";
import type { TaskItem } from "@/lib/api/types";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface TaskListProps {
  tasks: TaskItem[];
  onToggleComplete?: (task: TaskItem) => void;
}

export function TaskList({ tasks, onToggleComplete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="p-8 text-center glass-card rounded-2xl">
        <Clock className="w-8 h-8 mx-auto text-[var(--ink-muted)] mb-2" />
        <p className="text-sm text-[var(--ink-secondary)]">
          No tasks scheduled yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const isCompleted = task.status === "completed";
        return (
          <div
            key={task.id}
            className={`p-4 rounded-xl glass-card flex items-start justify-between gap-3 transition-all ${
              task.is_critical
                ? "border-l-4 border-l-[var(--brand-marigold)]"
                : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => onToggleComplete?.(task)}
                className={`mt-0.5 p-1 rounded-full transition-colors ${
                  isCompleted
                    ? "text-[var(--status-success)]"
                    : "text-[var(--ink-muted)] hover:text-[var(--brand-teal)]"
                }`}
                aria-label={`Mark task '${task.title}' as ${isCompleted ? "pending" : "complete"}`}
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h4
                    className={`text-sm font-semibold ${isCompleted ? "line-through text-[var(--ink-muted)]" : "text-[var(--ink-primary)]"}`}
                  >
                    {task.title}
                  </h4>
                  {task.is_critical && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[var(--brand-marigold-subtle)] text-[var(--brand-marigold)]">
                      Critical Path
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="text-xs text-[var(--ink-secondary)] mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-[var(--ink-muted)]">
                  <span>{task.milestone_name}</span>
                  <span>•</span>
                  <span>{task.duration_days} days</span>
                  <span>•</span>
                  <span>Assigned: {task.assigned_to}</span>
                </div>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                task.priority === "high"
                  ? "bg-[var(--status-danger)]/10 text-[var(--status-danger)]"
                  : "bg-[var(--canvas-sunken)] text-[var(--ink-secondary)]"
              }`}
            >
              {task.priority}
            </span>
          </div>
        );
      })}
    </div>
  );
}
