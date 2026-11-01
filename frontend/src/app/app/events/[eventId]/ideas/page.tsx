"use client";

import React, { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useEvent, queryKeys } from "@/lib/hooks/queries";
import { api } from "@/lib/api";
import {
  Sparkles,
  HeartHandshake,
  Utensils,
  Music,
  Gift,
  Lightbulb,
} from "lucide-react";

export default function IdeasPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { data: event } = useEvent(eventId);
  const [activeCategory, setActiveCategory] = useState<
    "themes" | "food" | "entertainment" | "savings"
  >("themes");

  const { data: ideas, isLoading } = useQuery({
    queryKey: queryKeys.ideas(eventId),
    queryFn: () => api.getIdeas(eventId),
    enabled: Boolean(eventId),
  });

  if (isLoading || !ideas) {
    return (
      <div className="p-8 text-center text-xs text-[var(--ink-muted)]">
        Synthesizing personalized concepts...
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--ink-primary)]">
          Personalized Celebration Concepts
        </h2>
        <p className="text-xs text-[var(--ink-muted)]">
          Culturally curated ideas aligned with {event?.city ?? "your"}{" "}
          traditions and budget.
        </p>
      </div>

      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
        {[
          { id: "themes", label: "Aesthetic Themes", icon: Sparkles },
          { id: "food", label: "Catering & Feast", icon: Utensils },
          { id: "entertainment", label: "Entertainment", icon: Music },
          { id: "savings", label: "Budget Savings", icon: Lightbulb },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id as typeof activeCategory)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                isActive
                  ? "bg-[var(--brand-teal)] text-white shadow-xs"
                  : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeCategory === "themes" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {themes.map((t, i) => (
            <div key={i} className="p-5 rounded-2xl glass-card space-y-2">
              <h4 className="text-sm font-bold text-[var(--ink-primary)]">
                {t.name ?? "Theme Concept"}
              </h4>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                {t.description}
              </p>
              {t.color_palette && (
                <div className="flex gap-2 pt-2">
                  {t.color_palette.map((c, ci) => (
                    <span
                      key={ci}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] text-[var(--ink-secondary)]"
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
            <div key={i} className="p-5 rounded-2xl glass-card space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-teal)]">
                {f.category ?? "Menu Item"}
              </span>
              <h4 className="text-sm font-bold text-[var(--ink-primary)]">
                {f.dish_name}
              </h4>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                {f.cultural_significance}
              </p>
            </div>
          ))}
        </div>
      )}

      {activeCategory === "entertainment" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entertainment.map((e, i) => (
            <div key={i} className="p-5 rounded-2xl glass-card space-y-1.5">
              <h4 className="text-sm font-bold text-[var(--ink-primary)]">
                {e.act}
              </h4>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                {e.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {activeCategory === "savings" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savings.map((s, i) => (
            <div key={i} className="p-5 rounded-2xl glass-card space-y-1.5">
              <h4 className="text-sm font-bold text-[var(--ink-primary)]">
                {s.strategy}
              </h4>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                {s.trade_off}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
