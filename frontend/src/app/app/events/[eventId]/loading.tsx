import React from "react";

export default function EventDashboardLoading() {
  return (
    <div
      className="space-y-8 animate-pulse"
      aria-label="Loading celebration workspace"
      role="status"
    >
      {/* Event Header Banner Skeleton - fixed dimensions */}
      <div className="h-28 rounded-2xl bg-[var(--canvas-elevated)] border border-[var(--border-subtle)] p-6 flex flex-col justify-center space-y-3">
        <div className="w-1/3 h-6 rounded bg-[var(--canvas-sunken)]" />
        <div className="w-1/4 h-4 rounded bg-[var(--canvas-sunken)]" />
      </div>

      {/* KPI Metric Cards Grid - 4 columns with fixed h-28 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-[var(--canvas-elevated)] border border-[var(--border-subtle)] p-4 flex flex-col justify-between"
          >
            <div className="w-20 h-3 rounded bg-[var(--canvas-sunken)]" />
            <div className="w-28 h-6 rounded bg-[var(--canvas-sunken)]" />
          </div>
        ))}
      </div>

      {/* Two-Column Feature Grid - fixed h-96 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-96 rounded-2xl bg-[var(--canvas-elevated)] border border-[var(--border-subtle)] p-6 space-y-4">
          <div className="w-40 h-5 rounded bg-[var(--canvas-sunken)]" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-[var(--canvas-sunken)]" />
            ))}
          </div>
        </div>
        <div className="h-96 rounded-2xl bg-[var(--canvas-elevated)] border border-[var(--border-subtle)] p-6 space-y-4">
          <div className="w-40 h-5 rounded bg-[var(--canvas-sunken)]" />
          <div className="h-64 rounded-xl bg-[var(--canvas-sunken)]" />
        </div>
      </div>
    </div>
  );
}
