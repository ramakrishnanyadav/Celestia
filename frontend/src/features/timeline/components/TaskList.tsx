"use client";

import React from "react";
import type { TaskItem } from "@/lib/api/types";
import { CheckCircle2, Circle, Clock, AlertTriangle, Flame } from "lucide-react";

interface TaskListProps {
  tasks: TaskItem[];
  onToggleComplete?: (task: TaskItem) => void;
}

export function TaskList({ tasks, onToggleComplete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="p-8 text-center glass-card rounded-2xl">
        <Clock className="w-8 h-8 mx-auto text-[var(--ink-muted)] mb-2" aria-hidden="true" />
        <p className="text-sm text-[var(--ink-secondary)]">
          No tasks scheduled yet.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3 list-none p-0 m-0" aria-label="Scheduled Tasks List">
      {tasks.map((task) => {
        const isCompleted = task.status === "completed";
        return (
          <li
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
                className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] ${
                  isCompleted
                    ? "text-[var(--status-success)]"
                    : "text-[var(--ink-muted)] hover:text-[var(--brand-teal)] hover:bg-[var(--canvas-sunken)]"
                }`}
                aria-label={`Mark task '${task.title}' as ${isCompleted ? "pending" : "complete"}`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                ) : (
                  <Circle className="w-5 h-5 shrink-0" aria-hidden="true" />
                )}
              </button>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4
                    className={`text-sm sm:text-base font-semibold ${
                      isCompleted
                        ? "line-through text-[var(--ink-muted)]"
                        : "text-[var(--ink-primary)]"
                    }`}
                  >
                    {task.title}
                  </h4>
                  {task.is_critical && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-[var(--brand-marigold-subtle)] text-[var(--brand-marigold)] border border-[var(--brand-marigold)]/30">
                      <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Critical Path</span>
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="text-sm text-[var(--ink-secondary)] mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs sm:text-sm text-[var(--ink-muted)]">
                  <span>{task.milestone_name}</span>
                  <span aria-hidden="true">•</span>
                  <span>{task.duration_days} days</span>
                  <span aria-hidden="true">•</span>
                  <span>Assigned: {task.assigned_to}</span>
                </div>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                task.priority === "high"
                  ? "bg-red-50 dark:bg-red-950/60 text-[var(--status-danger)] border border-[var(--status-danger)]/30"
                  : "bg-[var(--canvas-sunken)] text-[var(--ink-secondary)] border border-[var(--border-subtle)]"
              }`}
            >
              {task.priority === "high" && (
                <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span className="capitalize">{task.priority} Priority</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
