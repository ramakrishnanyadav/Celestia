"use client";

import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Bot,
  Lightbulb,
  IndianRupee,
  CalendarDays,
  Store,
  CheckCheck,
  Settings,
  Printer,
  Compass,
  Play,
  Pause,
  PlusCircle,
  X,
} from "lucide-react";
import type { EventItem } from "@/lib/api/types";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId?: string | undefined;
  events?: EventItem[] | undefined;
  onToggleAiPause?: (() => void) | undefined;
  isAiPaused?: boolean | undefined;
}

export function CommandPalette({
  open,
  onOpenChange,
  eventId,
  events = [],
  onToggleAiPause,
  isAiPaused = false,
}: CommandPaletteProps) {
  const router = useRouter();

  // Keyboard shortcut listener: ⌘K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  if (!open) return null;

  const navigateTo = (path: string) => {
    onOpenChange(false);
    router.push(path);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-xl rounded-2xl glass-3 border border-[var(--border-subtle)] bg-[var(--canvas-elevated)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="CELESTIA Command Palette"
      >
        <Command
          className="w-full flex flex-col focus:outline-none"
          loop
        >
          {/* Search Header */}
          <div className="flex items-center px-4 border-b border-[var(--border-subtle)] bg-[var(--canvas-sunken)]/40">
            <Search className="w-5 h-5 text-[var(--ink-muted)] shrink-0 mr-3" aria-hidden="true" />
            <Command.Input
              placeholder="Search commands, modules, or switch celebrations..."
              className="w-full h-14 bg-transparent text-sm sm:text-base text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              aria-label="Close command palette"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results List */}
          <Command.List className="max-h-80 overflow-y-auto p-2 divide-y divide-[var(--border-subtle)]/40 text-sm">
            <Command.Empty className="p-6 text-center text-sm text-[var(--ink-muted)]">
              No matching modules or actions found.
            </Command.Empty>

            {/* Quick Actions */}
            <Command.Group heading="Quick Actions" className="p-2 text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
              {eventId && (
                <Command.Item
                  onSelect={() => {
                    onOpenChange(false);
                    const url = new URL(window.location.href);
                    url.searchParams.set("tour", "1");
                    window.location.href = url.toString();
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-[var(--ink-primary)] hover:bg-[var(--brand-teal-subtle)] hover:text-[var(--brand-teal)] aria-selected:bg-[var(--brand-teal-subtle)] aria-selected:text-[var(--brand-teal)] transition-colors"
                >
                  <Compass className="w-4 h-4 text-[var(--brand-teal)]" aria-hidden="true" />
                  <span className="font-medium text-sm">Start 3-Minute Guided Demo Tour</span>
                </Command.Item>
              )}

              {onToggleAiPause && (
                <Command.Item
                  onSelect={() => {
                    onOpenChange(false);
                    onToggleAiPause();
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)] aria-selected:bg-[var(--canvas-sunken)] transition-colors"
                >
                  {isAiPaused ? (
                    <Play className="w-4 h-4 text-[var(--brand-teal)]" aria-hidden="true" />
                  ) : (
                    <Pause className="w-4 h-4 text-[var(--brand-marigold)]" aria-hidden="true" />
                  )}
                  <span className="font-medium text-sm">
                    {isAiPaused ? "Resume AI Planning Autonomy" : "Pause AI Planning Autonomy"}
                  </span>
                </Command.Item>
              )}

              <Command.Item
                onSelect={() => navigateTo("/app/events/new")}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)] aria-selected:bg-[var(--canvas-sunken)] transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-[var(--brand-teal)]" aria-hidden="true" />
                <span className="font-medium text-sm">Create New Celebration Plan</span>
              </Command.Item>
            </Command.Group>

            {/* Navigation Modules */}
            {eventId && (
              <Command.Group heading="Celebration Modules" className="p-2 text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
                <Command.Item
                  onSelect={() => navigateTo(`/app/events/${eventId}`)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)] aria-selected:bg-[var(--canvas-sunken)] transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-[var(--ink-muted)]" aria-hidden="true" />
                  <span className="font-medium text-sm">Overview Bento</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => navigateTo(`/app/events/${eventId}/budget`)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)] aria-selected:bg-[var(--canvas-sunken)] transition-colors"
                >
                  <IndianRupee className="w-4 h-4 text-[var(--brand-teal)]" aria-hidden="true" />
                  <span className="font-medium text-sm">Budget Ledger & What-If Simulator</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => navigateTo(`/app/events/${eventId}/timeline`)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)] aria-selected:bg-[var(--canvas-sunken)] transition-colors"
                >
                  <CalendarDays className="w-4 h-4 text-[var(--brand-marigold)]" aria-hidden="true" />
                  <span className="font-medium text-sm">Timeline & CPM Critical Path</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => navigateTo(`/app/events/${eventId}/planner`)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)] aria-selected:bg-[var(--canvas-sunken)] transition-colors"
                >
                  <Bot className="w-4 h-4 text-[var(--brand-indigo)]" aria-hidden="true" />
                  <span className="font-medium text-sm">AI Planning Workspace</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => navigateTo(`/app/events/${eventId}/approvals`)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)] aria-selected:bg-[var(--canvas-sunken)] transition-colors"
                >
                  <CheckCheck className="w-4 h-4 text-[var(--status-success)]" aria-hidden="true" />
                  <span className="font-medium text-sm">Pending Human Approvals</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => navigateTo(`/app/events/${eventId}/vendors`)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)] aria-selected:bg-[var(--canvas-sunken)] transition-colors"
                >
                  <Store className="w-4 h-4 text-[var(--brand-teal)]" aria-hidden="true" />
                  <span className="font-medium text-sm">Vendor Quotation Comparison</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => navigateTo(`/app/events/${eventId}/blueprint`)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)] aria-selected:bg-[var(--canvas-sunken)] transition-colors"
                >
                  <Printer className="w-4 h-4 text-[var(--ink-muted)]" aria-hidden="true" />
                  <span className="font-medium text-sm">Printable Master Blueprint</span>
                </Command.Item>
              </Command.Group>
            )}

            {/* Switch Celebration Event */}
            {events.length > 0 && (
              <Command.Group heading="Switch Celebration" className="p-2 text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
                {events.map((evt) => (
                  <Command.Item
                    key={evt.id}
                    onSelect={() => navigateTo(`/app/events/${evt.id}`)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)] aria-selected:bg-[var(--canvas-sunken)] transition-colors"
                  >
                    <span className="font-medium text-sm truncate">{evt.title}</span>
                    <span className="text-xs text-[var(--ink-muted)] capitalize">{evt.city}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer Shortcuts */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border-subtle)] bg-[var(--canvas-sunken)]/30 text-xs text-[var(--ink-muted)]">
            <div className="flex items-center gap-3">
              <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] font-mono">↑↓</kbd> Navigate</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] font-mono">↵</kbd> Select</span>
            </div>
            <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] font-mono">esc</kbd> Dismiss</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
