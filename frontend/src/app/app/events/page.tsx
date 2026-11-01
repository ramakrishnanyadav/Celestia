"use client";

import React from "react";
import Link from "next/link";
import { useEvents, useCurrentUser } from "@/lib/hooks/queries";
import { formatMoneyCompact } from "@/lib/money";
import { Sparkles, Plus, Users, ArrowRight } from "lucide-react";

export default function EventsGalleryPage() {
  const { data: events, isLoading, error } = useEvents();
  const { data: user } = useCurrentUser();

  return (
    <div className="min-h-screen bg-[var(--canvas)] flex flex-col justify-between">
      {/* Skip to Main Content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2.5 bg-[var(--brand-teal)] text-white font-semibold rounded-xl shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="h-16 border-b border-[var(--border-subtle)] px-6 flex items-center justify-between sticky top-0 z-30 bg-[var(--glass-bg)] backdrop-blur-md">
        <Link
          href="/"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] rounded-xl p-1 min-h-[44px]"
          aria-label="CELESTIA Home"
        >
          <div className="w-8 h-8 rounded-xl bg-[var(--brand-teal)] text-white flex items-center justify-center font-bold" aria-hidden="true">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-extrabold tracking-wider text-base text-[var(--ink-primary)]">
            CELESTIA
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm font-medium text-[var(--ink-secondary)] hidden sm:inline">
              Signed in as <strong className="text-[var(--ink-primary)]">{user.name}</strong>
            </span>
          )}
          <Link
            href="/accessibility"
            className="text-xs font-semibold text-[var(--ink-secondary)] hover:text-[var(--brand-teal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] rounded p-1"
          >
            Accessibility
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" tabIndex={-1} className="flex-1 p-6 sm:p-10 max-w-5xl w-full mx-auto space-y-8 focus:outline-none">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink-primary)] tracking-tight">
              Your Celebrations
            </h1>
            <p className="text-sm text-[var(--ink-secondary)] mt-1">
              Deterministic blueprints, zero-rounding integer ledgers, and critical path schedules.
            </p>
          </div>
          <Link
            href="/app/events/new"
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brand-teal)] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Create Celebration</span>
          </Link>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="p-12 text-center text-sm text-[var(--ink-muted)]">
            Loading your celebrations...
          </div>
        )}

        {error && (
          <div role="alert" className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-[var(--status-danger)] text-sm">
            {error instanceof Error ? error.message : "Failed to load events"}
          </div>
        )}

        {/* Empty State */}
        {events && events.length === 0 && (
          <div className="p-12 rounded-3xl glass-card text-center space-y-4">
            <Sparkles className="w-10 h-10 mx-auto text-[var(--brand-teal)]" aria-hidden="true" />
            <h2 className="text-lg font-bold text-[var(--ink-primary)]">
              No Celebrations Yet
            </h2>
            <p className="text-sm text-[var(--ink-secondary)] max-w-sm mx-auto">
              Create your first celebration using natural language to generate a
              deterministic schedule and ledger.
            </p>
            <Link
              href="/app/events/new"
              className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brand-teal)] text-white text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
            >
              <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Get Started</span>
            </Link>
          </div>
        )}

        {/* Events Grid */}
        {events && events.length > 0 && (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-5 list-none p-0 m-0" aria-label="Celebrations List">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/app/events/${event.id}`}
                  className="p-6 rounded-2xl glass-card flex flex-col justify-between space-y-4 group hover:border-[var(--brand-teal)] transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] border border-[var(--brand-teal)]/30">
                        {event.event_type}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-[var(--ink-muted)]">
                        {event.city}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-[var(--ink-primary)] group-hover:text-[var(--brand-teal)] transition-colors">
                      {event.title}
                    </h2>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] text-sm text-[var(--ink-secondary)]">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-[var(--ink-primary)]" lang="en-IN">
                        {formatMoneyCompact(event.budget_minor)}
                      </span>
                      <span className="flex items-center gap-1" aria-label={`${event.guest_count} guests`}>
                        <Users className="w-4 h-4" aria-hidden="true" />
                        <span>{event.guest_count}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--brand-teal)] font-semibold group-hover:translate-x-0.5 transition-transform" aria-hidden="true">
                      <span>Open Plan</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--canvas-subtle)] px-6 py-6 text-center text-xs text-[var(--ink-muted)]">
        <p>© 2026 CELESTIA Platform. Certified WCAG 2.2 AA / AAA Accessible.</p>
      </footer>
    </div>
  );
}
