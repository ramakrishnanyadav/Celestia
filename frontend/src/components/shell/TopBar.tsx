"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatMoneyCompact } from "@/lib/money";
import type { EventItem, User } from "@/lib/api/types";
import { CommandPalette } from "@/components/ui/CommandPalette";
import {
  Users,
  Pause,
  Play,
  LogOut,
  Sparkles,
  Search,
  ChevronDown,
  Bell,
  Sun,
  Moon,
  User as UserIcon,
  CheckCheck,
} from "lucide-react";

interface TopBarProps {
  event?: EventItem | null | undefined;
  events?: EventItem[] | undefined;
  currentUser?: User | null | undefined;
  pendingApprovalsCount?: number | undefined;
  onToggleAiPause?: (() => void) | undefined;
  onLogout?: (() => void) | undefined;
}

export function TopBar({
  event,
  events = [],
  currentUser,
  pendingApprovalsCount = 0,
  onToggleAiPause,
  onLogout,
}: TopBarProps) {
  const isAiPaused = event?.ai_paused ?? false;
  const [commandOpen, setCommandOpen] = useState(false);
  const [eventMenuOpen, setEventMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", nextDark);
    }
  };

  return (
    <>
      <header className="h-16 border-b border-[var(--border-subtle)] bg-[var(--glass-2-bg)] backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        {/* Left: Event Selector / Switcher */}
        <div className="flex items-center gap-3">
          {event ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setEventMenuOpen(!eventMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[var(--canvas-sunken)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] min-h-[44px]"
                aria-expanded={eventMenuOpen}
                aria-haspopup="true"
                aria-label="Switch celebration event"
              >
                <span className="font-bold text-sm sm:text-base text-[var(--ink-primary)] truncate max-w-[160px] sm:max-w-xs text-left">
                  {event.title}
                </span>
                <ChevronDown className="w-4 h-4 text-[var(--ink-muted)] shrink-0" aria-hidden="true" />
              </button>

              {/* Event Switcher Dropdown Menu */}
              {eventMenuOpen && (
                <div
                  className="absolute left-0 top-full mt-1.5 w-72 rounded-2xl glass-3 border border-[var(--border-subtle)] bg-[var(--canvas-elevated)] p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                  role="menu"
                >
                  <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] border-b border-[var(--border-subtle)]/50">
                    Switch Active Celebration
                  </div>
                  <ul className="py-1 list-none p-0 m-0 max-h-56 overflow-y-auto">
                    {events.map((evt) => (
                      <li key={evt.id}>
                        <Link
                          href={`/app/events/${evt.id}`}
                          onClick={() => setEventMenuOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                            evt.id === event.id
                              ? "bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] font-bold"
                              : "text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)]"
                          }`}
                          role="menuitem"
                        >
                          <span className="truncate">{evt.title}</span>
                          <span className="text-xs text-[var(--ink-muted)] capitalize shrink-0 ml-2">
                            {evt.city}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 border-t border-[var(--border-subtle)]/50">
                    <Link
                      href="/app/events/new"
                      onClick={() => setEventMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--brand-teal)] hover:bg-[var(--brand-teal-subtle)] transition-colors"
                      role="menuitem"
                    >
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>+ Create New Celebration</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/app/events"
              className="text-sm font-bold text-[var(--ink-primary)] hover:text-[var(--brand-teal)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] rounded px-2 min-h-[44px] inline-flex items-center"
            >
              CELESTIA Celebrations
            </Link>
          )}

          {/* Quick Metrics Capsule */}
          {event && (
            <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--canvas-sunken)] border border-[var(--border-subtle)]/60 text-xs text-[var(--ink-secondary)] font-medium tabular-nums">
              <span lang="en-IN" className="font-semibold text-[var(--ink-primary)]">
                {formatMoneyCompact(event.budget_minor)}
              </span>
              <span aria-hidden="true" className="text-[var(--ink-muted)]">•</span>
              <span className="flex items-center gap-1" aria-label={`${event.guest_count} guests`}>
                <Users className="w-3.5 h-3.5 text-[var(--ink-muted)]" aria-hidden="true" />
                <span>{event.guest_count} pax</span>
              </span>
            </div>
          )}
        </div>

        {/* Center/Right: ⌘K Command Palette Search Trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--canvas-sunken)]/60 hover:bg-[var(--canvas-sunken)] text-xs text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
            aria-label="Open command palette (Press Command + K)"
          >
            <Search className="w-4 h-4 text-[var(--ink-muted)]" aria-hidden="true" />
            <span className="hidden sm:inline">Search / Actions...</span>
            <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-[var(--canvas)] border border-[var(--border-subtle)] font-mono text-[10px]">
              ⌘K
            </kbd>
          </button>

          {/* AI Autonomy Status Pill */}
          {event && onToggleAiPause && (
            <button
              type="button"
              onClick={onToggleAiPause}
              className={`min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] ${
                isAiPaused
                  ? "bg-[var(--brand-marigold-subtle)] text-[var(--brand-marigold)] border border-[var(--brand-marigold)]/30"
                  : "bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] border border-[var(--brand-teal)]/30"
              }`}
              title={isAiPaused ? "AI is paused (Click to resume)" : "AI is active (Click to pause)"}
              aria-label={isAiPaused ? "Resume AI planning autonomy" : "Pause AI planning autonomy"}
            >
              {isAiPaused ? (
                <Play className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Pause className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              )}
              <span className="hidden md:inline">
                {isAiPaused ? "AI Paused" : "AI Active"}
              </span>
            </button>
          )}

          {/* Pending Approvals Notification Badge */}
          {event && (
            <Link
              href={`/app/events/${event.id}/approvals`}
              className="relative w-11 h-11 rounded-xl flex items-center justify-center text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] min-h-[44px] min-w-[44px]"
              aria-label={`${pendingApprovalsCount} pending approvals`}
            >
              <Bell className="w-4 h-4" aria-hidden="true" />
              {pendingApprovalsCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--brand-marigold)]" />
              )}
            </Link>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] min-h-[44px] min-w-[44px]"
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Menu */}
          {currentUser && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-2 border-l border-[var(--border-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] rounded-xl min-h-[44px]"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                aria-label="User profile and settings"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--brand-indigo-subtle)] text-[var(--brand-indigo)] flex items-center justify-center font-bold text-xs" aria-hidden="true">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="text-xs font-semibold text-[var(--ink-primary)] hidden lg:inline max-w-[100px] truncate">
                  {currentUser.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--ink-muted)] hidden lg:inline" aria-hidden="true" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl glass-3 border border-[var(--border-subtle)] bg-[var(--canvas-elevated)] p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                  role="menu"
                >
                  <div className="px-3 py-2 text-xs border-b border-[var(--border-subtle)]/50">
                    <span className="font-bold text-[var(--ink-primary)] block truncate">{currentUser.name}</span>
                    <span className="text-[var(--ink-muted)] block truncate">{currentUser.email}</span>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/app/account"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)] transition-colors"
                      role="menuitem"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-[var(--ink-muted)]" aria-hidden="true" />
                      <span>Account & Security</span>
                    </Link>
                    <Link
                      href="/design"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)] transition-colors"
                      role="menuitem"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[var(--brand-teal)]" aria-hidden="true" />
                      <span>Design System Tokens</span>
                    </Link>
                  </div>

                  {onLogout && (
                    <div className="pt-1 border-t border-[var(--border-subtle)]/50">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--status-danger)] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                        role="menuitem"
                      >
                        <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        eventId={event?.id}
        events={events}
        onToggleAiPause={onToggleAiPause}
        isAiPaused={isAiPaused}
      />
    </>
  );
}
