import React from "react";

export default function RootLoading() {
  return (
    <div
      className="min-h-screen flex flex-col bg-[var(--canvas)] animate-pulse"
      aria-label="Loading CELESTIA"
      role="status"
    >
      <header className="h-16 border-b border-[var(--border-subtle)] bg-[var(--canvas-elevated)] px-6 flex items-center justify-between">
        <div className="w-32 h-6 rounded bg-[var(--canvas-sunken)]" />
        <div className="w-24 h-8 rounded-lg bg-[var(--canvas-sunken)]" />
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
        <div className="w-64 h-8 rounded-lg bg-[var(--canvas-sunken)]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 rounded-2xl bg-[var(--canvas-sunken)]" />
          <div className="h-40 rounded-2xl bg-[var(--canvas-sunken)]" />
          <div className="h-40 rounded-2xl bg-[var(--canvas-sunken)]" />
        </div>
      </main>
    </div>
  );
}

