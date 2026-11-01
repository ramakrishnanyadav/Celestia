"use client";

import React, { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/shell/AppShell";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useEvent, useEvents, useCurrentUser, useApprovals, queryKeys } from "@/lib/hooks/queries";
import { api } from "@/lib/api";
import {
  Sparkles,
  Utensils,
  Music,
  Lightbulb,
} from "lucide-react";

export default function IdeasPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { data: event } = useEvent(eventId);
  const { data: events } = useEvents();
  const { data: user } = useCurrentUser();
  const { data: approvals = [] } = useApprovals(eventId);
  const [activeCategory, setActiveCategory] = useState<
    "themes" | "food" | "entertainment" | "savings"
  >("themes");

  const pendingApprovalsCount = approvals.filter(
    (a) => a.status === "pending"
  ).length;

  const { data: ideas, isLoading } = useQuery({
    queryKey: queryKeys.ideas(eventId),
    queryFn: () => api.getIdeas(eventId),
    enabled: Boolean(eventId),
  });

  if (isLoading || !ideas || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center text-sm text-[var(--ink-muted)]">
        Synthesizing personalized celebration concepts...
      </div>
    );
  }

  const themes =
    (ideas.themes as Array<{
      name?: string;
      description?: string;
      color_palette?: string[];
    }>) || [];
  const food =
    (ideas.food_and_menu as Array<{
      category?: string;
      dish_name?: string;
      cultural_significance?: string;
    }>) || [];
  const entertainment =
    (ideas.entertainment as Array<{ act?: string; description?: string }>) ||
    [];
  const savings =
    (ideas.budget_conscious_alternatives as Array<{
      strategy?: string;
      potential_savings_minor?: number;
      trade_off?: string;
    }>) || [];

  const tabs = [
    { id: "themes", label: "Aesthetic Themes", icon: Sparkles },
    { id: "food", label: "Catering & Feast", icon: Utensils },
    { id: "entertainment", label: "Entertainment", icon: Music },
    { id: "savings", label: "Budget Savings", icon: Lightbulb },
  ];

  return (
    <AppShell
      eventId={eventId}
      event={event}
      events={events}
      currentUser={user}
      pendingApprovalsCount={pendingApprovalsCount}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <Breadcrumbs
          items={[
            { label: event.title, href: `/app/events/${eventId}` },
            { label: "Celebration Ideas", current: true },
          ]}
        />

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink-primary)] tracking-tight">
            Personalized Celebration Concepts
          </h1>
          <p className="text-sm text-[var(--ink-secondary)] mt-1">
            Culturally curated ideas aligned with {event.city} traditions and allocated budget.
          </p>
        </div>

        {/* Accessible Tab List */}
        <div
          role="tablist"
          aria-label="Idea Categories"
          className="flex flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] pb-2"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                type="button"
                onClick={() => setActiveCategory(tab.id as typeof activeCategory)}
                className={`min-h-[44px] flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] ${
                  isActive
                    ? "bg-[var(--brand-teal)] text-white shadow-xs"
                    : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)]"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Panels */}
        <div
          role="tabpanel"
          id={`panel-${activeCategory}`}
          aria-labelledby={`tab-${activeCategory}`}
        >
          {activeCategory === "themes" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {themes.map((t, i) => (
                <div key={i} className="p-5 rounded-2xl glass-card space-y-2">
                  <h2 className="text-base font-bold text-[var(--ink-primary)]">
                    {t.name ?? "Theme Concept"}
                  </h2>
                  <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
                    {t.description}
                  </p>
                  {t.color_palette && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {t.color_palette.map((c, ci) => (
                        <span
                          key={ci}
                          className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] text-[var(--ink-primary)]"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeCategory === "food" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {food.map((f, i) => (
                <div key={i} className="p-5 rounded-2xl glass-card space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-teal)]">
                    {f.category ?? "Menu Item"}
                  </span>
                  <h2 className="text-base font-bold text-[var(--ink-primary)]">
                    {f.dish_name}
                  </h2>
                  <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
                    {f.cultural_significance}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeCategory === "entertainment" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entertainment.map((e, i) => (
                <div key={i} className="p-5 rounded-2xl glass-card space-y-2">
                  <h2 className="text-base font-bold text-[var(--ink-primary)]">
                    {e.act}
                  </h2>
                  <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
                    {e.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeCategory === "savings" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savings.map((s, i) => (
                <div key={i} className="p-5 rounded-2xl glass-card space-y-2">
                  <h2 className="text-base font-bold text-[var(--ink-primary)]">
                    {s.strategy}
                  </h2>
                  <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
                    {s.trade_off}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
