"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import type { EventItem, User } from "@/lib/api/types";

interface AppShellProps {
  eventId: string;
  event?: EventItem | null | undefined;
  events?: EventItem[] | undefined;
  currentUser?: User | null | undefined;
  pendingApprovalsCount?: number | undefined;
  onToggleAiPause?: (() => void) | undefined;
  onLogout?: (() => void) | undefined;
  children: React.ReactNode;
}

export function AppShell({
  eventId,
  event,
  events,
  currentUser,
  pendingApprovalsCount = 0,
  onToggleAiPause,
  onLogout,
  children,
}: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--canvas)]">
      {/* Skip to Content for WCAG keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-[var(--brand-teal)] text-white font-semibold rounded-lg shadow-lg"
      >
        Skip to main content
      </a>

      {/* Fixed Left Sidebar */}
      <Sidebar
        eventId={eventId}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          event={event}
          events={events}
          currentUser={currentUser}
          onToggleAiPause={onToggleAiPause}
          onLogout={onLogout}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 focus:outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
