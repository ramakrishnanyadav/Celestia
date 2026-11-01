"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/queries";
import { api } from "@/lib/api";
import {
  Sparkles,
  LayoutDashboard,
  Bot,
  Lightbulb,
  IndianRupee,
  CalendarDays,
  Store,
  CheckCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  eventId: string;
  pendingApprovalsCount?: number;
}

export function Sidebar({ eventId, pendingApprovalsCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const queryClient = useQueryClient();

  const handlePrefetch = useCallback(
    (href: string) => {
      if (!eventId) return;
      if (href.endsWith("/budget")) {
        queryClient.prefetchQuery({
          queryKey: queryKeys.budgetSummary(eventId),
          queryFn: () => api.getBudgetSummary(eventId),
          staleTime: 60 * 1000,
        });
        queryClient.prefetchQuery({
          queryKey: queryKeys.budgetCategories(eventId),
          queryFn: () => api.getCategories(eventId),
          staleTime: 60 * 1000,
        });
      } else if (href.endsWith("/timeline")) {
        queryClient.prefetchQuery({
          queryKey: queryKeys.tasks(eventId),
          queryFn: () => api.getTasks(eventId),
          staleTime: 60 * 1000,
        });
      } else if (href.endsWith("/vendors")) {
        queryClient.prefetchQuery({
          queryKey: queryKeys.vendors(eventId),
          queryFn: () => api.getVendors(eventId),
          staleTime: 60 * 1000,
        });
      } else if (href.endsWith("/approvals")) {
        queryClient.prefetchQuery({
          queryKey: queryKeys.approvals(eventId),
          queryFn: () => api.getApprovals(eventId),
          staleTime: 60 * 1000,
        });
      }
    },
    [eventId, queryClient]
  );

  const navItems = [
    {
      label: "Overview",
      href: `/app/events/${eventId}`,
      icon: LayoutDashboard,
    },
    { label: "AI Planner", href: `/app/events/${eventId}/planner`, icon: Bot },
    {
      label: "Celebration Ideas",
      href: `/app/events/${eventId}/ideas`,
      icon: Lightbulb,
    },
    {
      label: "Budget & What-If",
      href: `/app/events/${eventId}/budget`,
      icon: IndianRupee,
    },
    {
      label: "Timeline & CPM",
      href: `/app/events/${eventId}/timeline`,
      icon: CalendarDays,
    },
    {
      label: "Vendors & Quotes",
      href: `/app/events/${eventId}/vendors`,
      icon: Store,
    },
    {
      label: "Approvals",
      href: `/app/events/${eventId}/approvals`,
      icon: CheckCheck,
      badge: pendingApprovalsCount,
    },
    {
      label: "Settings",
      href: `/app/events/${eventId}/settings`,
      icon: Settings,
    },
  ];

  return (
    <aside
      className={`relative hidden lg:flex flex-col border-r border-[var(--border-subtle)] bg-[var(--canvas-subtle)] transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
      aria-label="Event Navigation"
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--border-subtle)]">
        <Link
          href={`/app/events/${eventId}`}
          className="flex items-center gap-2.5 overflow-hidden"
        >
          <div className="w-9 h-9 rounded-xl bg-[var(--brand-teal)] flex items-center justify-center shrink-0 shadow-sm text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <span className="font-bold tracking-wider text-[var(--ink-primary)] text-base">
                CELESTIA
              </span>
              <span className="block text-[10px] tracking-widest text-[var(--ink-muted)] uppercase font-medium">
                AI Celebration
              </span>
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--canvas)] transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <nav
        className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto"
        aria-label="Main Navigation"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => handlePrefetch(item.href)}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] font-semibold shadow-xs"
                  : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--canvas)]"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed &&
                typeof item.badge === "number" &&
                item.badge > 0 && (
                  <span
                    className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--brand-marigold-subtle)] text-[var(--brand-marigold)]"
                    aria-label={`${item.badge} pending approvals`}
                  >
                    {item.badge}
                  </span>
                )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
