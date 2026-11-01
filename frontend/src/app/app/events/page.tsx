"use client";

import React from "react";
import Link from "next/link";
import { useEvents, useCurrentUser } from "@/lib/hooks/queries";
import { formatMoneyCompact } from "@/lib/money";
import { Sparkles, Plus, Calendar, Users, ArrowRight } from "lucide-react";

export default function EventsGalleryPage() {
  const { data: events, isLoading, error } = useEvents();
  const { data: user } = useCurrentUser();

  return (
    <div className="min-h-screen bg-[var(--canvas)] p-6 sm:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink-primary)]">
              Your Celebrations
            </h1>
            <p className="text-xs text-[var(--ink-muted)] mt-1">
              Deterministic blueprints, financial ledgers, and cultural
              schedules
            </p>
          </div>
          <Link
            href="/app/events/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand-teal)] text-white text-xs font-semibold hover:opacity-90 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
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
          <div className="p-4 rounded-xl bg-[var(--status-danger)]/10 text-[var(--status-danger)] text-xs">
            {error instanceof Error ? error.message : "Failed to load events"}
          </div>
        )}

        {/* Events Grid */}
        {events && events.length === 0 && (
          <div className="p-12 rounded-3xl glass-card text-center space-y-4">
            <Sparkles className="w-10 h-10 mx-auto text-[var(--brand-teal)]" />
            <h3 className="text-base font-bold text-[var(--ink-primary)]">
              No Celebrations Yet
            </h3>
            <p className="text-xs text-[var(--ink-secondary)] max-w-sm mx-auto">
              Create your first celebration using natural language to generate a
              deterministic schedule and ledger.
            </p>
            <Link
              href="/app/events/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand-teal)] text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Get Started</span>
            </Link>
          </div>
        )}

        {events && events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/app/events/${event.id}`}
                className="p-6 rounded-2xl glass-card flex flex-col justify-between space-y-4 group hover:border-[var(--brand-teal)] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)]">
                      {event.event_type}
                    </span>
                    <span className="text-xs font-semibold text-[var(--ink-muted)]">
                      {event.city}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[var(--ink-primary)] group-hover:text-[var(--brand-teal)] transition-colors">
                    {event.title}
                  </h2>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] text-xs text-[var(--ink-secondary)]">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-[var(--ink-primary)]">
                      {formatMoneyCompact(event.budget_minor)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {event.guest_count}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[var(--brand-teal)] font-semibold group-hover:translate-x-0.5 transition-transform">
                    <span>Open Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
