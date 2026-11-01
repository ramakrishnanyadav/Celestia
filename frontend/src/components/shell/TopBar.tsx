"use client";

import React from "react";
import Link from "next/link";
import { formatMoneyCompact } from "@/lib/money";
import type { EventItem, User } from "@/lib/api/types";
import {
  Users,
  Pause,
  Play,
  LogOut,
  Sparkles,
} from "lucide-react";

interface TopBarProps {
  event?: EventItem | null | undefined;
  events?: EventItem[] | undefined;
  currentUser?: User | null | undefined;
  onToggleAiPause?: (() => void) | undefined;
  onLogout?: (() => void) | undefined;
}

export function TopBar({
  event,
  events = [],
  currentUser,
  onToggleAiPause,
  onLogout,
}: TopBarProps) {
  const isAiPaused = event?.ai_paused ?? false;

  return (
    <header className="h-16 border-b border-[var(--border-subtle)] bg-[var(--glass-bg)] backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Event Selector & Info */}
      <div className="flex items-center gap-3">
        {event ? (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm sm:text-base text-[var(--ink-primary)] truncate max-w-[200px] sm:max-w-xs">
              {event.title}
            </span>
            <div className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[var(--canvas-sunken)] text-xs text-[var(--ink-secondary)] font-medium">
              <span lang="en-IN">{formatMoneyCompact(event.budget_minor)}</span>
              <span aria-hidden="true">•</span>
              <span className="flex items-center gap-1" aria-label={`${event.guest_count} guests`}>
                <Users className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{event.guest_count}</span>
              </span>
            </div>
          </div>
        ) : (
          <Link
            href="/app/events"
            className="text-sm font-semibold text-[var(--ink-primary)] hover:text-[var(--brand-teal)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] rounded min-h-[44px] inline-flex items-center"
          >
            CELESTIA Celebrations
          </Link>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* AI Autonomy Status Pill */}
        {event && onToggleAiPause && (
          <button
            type="button"
            onClick={onToggleAiPause}
            className={`min-h-[44px] px-3.5 py-2 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] ${
              isAiPaused
                ? "bg-[var(--brand-marigold-subtle)] text-[var(--brand-marigold)] border border-[var(--brand-marigold)]/30"
                : "bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] border border-[var(--brand-teal)]/30"
            }`}
            title={
              isAiPaused
                ? "AI is paused (Click to resume)"
                : "AI is active (Click to pause)"
            }
            aria-label={
              isAiPaused ? "Resume AI assistance" : "Pause AI assistance"
            }
          >
            {isAiPaused ? (
              <Play className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <Pause className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">
              {isAiPaused ? "AI Paused" : "AI Active"}
            </span>
          </button>
        )}

        {/* User Menu */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-[var(--border-subtle)]">
            <span className="text-sm font-medium text-[var(--ink-secondary)] hidden md:inline">
              {currentUser.name}
            </span>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-[var(--ink-muted)] hover:text-[var(--status-danger)] hover:bg-[var(--canvas-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--status-danger)]"
                aria-label="Log out of CELESTIA"
                title="Log out"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
