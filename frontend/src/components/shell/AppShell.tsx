"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileTabBar } from "./MobileTabBar";
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
    <div className="flex h-screen overflow-hidden bg-[var(--canvas)] relative">
      {/* Drifting Subtle Mesh Gradient Backdrop */}
      <div className="mesh-backdrop" aria-hidden="true">
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
        <div className="mesh-blob mesh-blob-3" />
      </div>

      {/* Skip to Content for WCAG keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-[var(--brand-teal)] text-white font-semibold rounded-lg shadow-lg"
      >
        Skip to main content
      </a>

      {/* Fixed Left Sidebar (>= 1024px) */}
      <Sidebar
        eventId={eventId}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 pb-16 lg:pb-0">
        <TopBar
          event={event}
          events={events}
          currentUser={currentUser}
          pendingApprovalsCount={pendingApprovalsCount}
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

      {/* Bottom Navigation Bar for Mobile (< 1024px) */}
      <MobileTabBar
        eventId={eventId}
        pendingApprovalsCount={pendingApprovalsCount}
      />
    </div>
  );
}
