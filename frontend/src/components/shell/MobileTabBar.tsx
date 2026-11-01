"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  IndianRupee,
  CalendarDays,
  Menu,
  Store,
  CheckCheck,
  Settings,
  Printer,
  Sparkles,
  X,
} from "lucide-react";

interface MobileTabBarProps {
  eventId: string;
  pendingApprovalsCount?: number | undefined;
}

export function MobileTabBar({
  eventId,
  pendingApprovalsCount = 0,
}: MobileTabBarProps) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const mainTabs = [
    {
      label: "Overview",
      href: `/app/events/${eventId}`,
      icon: LayoutDashboard,
    },
    {
      label: "Planner",
      href: `/app/events/${eventId}/planner`,
      icon: Bot,
    },
    {
      label: "Budget",
      href: `/app/events/${eventId}/budget`,
      icon: IndianRupee,
    },
    {
      label: "Timeline",
      href: `/app/events/${eventId}/timeline`,
      icon: CalendarDays,
    },
  ];

  const moreItems = [
    {
      label: "Celebration Ideas",
      href: `/app/events/${eventId}/ideas`,
      icon: Sparkles,
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
      label: "Print Blueprint",
      href: `/app/events/${eventId}/blueprint`,
      icon: Printer,
    },
    {
      label: "Settings",
      href: `/app/events/${eventId}/settings`,
      icon: Settings,
    },
    {
      label: "Design System",
      href: "/design",
      icon: Sparkles,
    },
  ];

  return (
    <>
      {/* Fixed Bottom Tab Bar for Mobile */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-[var(--canvas-elevated)]/95 backdrop-blur-md border-t border-[var(--border-subtle)] flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0)] shadow-lg"
        aria-label="Mobile Navigation Bar"
      >
        {mainTabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex-1 flex flex-col items-center justify-center min-h-[44px] py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] ${
                isActive
                  ? "text-[var(--brand-teal)]"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" aria-hidden="true" />
              <span>{tab.label}</span>
            </Link>
          );
        })}

        {/* More Button to trigger Sheet */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex-1 flex flex-col items-center justify-center min-h-[44px] py-1 text-[11px] font-semibold text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] relative"
          aria-label="More navigation options"
        >
          <div className="relative">
            <Menu className="w-5 h-5 mb-0.5" aria-hidden="true" />
            {pendingApprovalsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--brand-marigold)]" />
            )}
          </div>
          <span>More</span>
        </button>
      </nav>

      {/* Mobile Drawer Sheet */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end lg:hidden animate-in fade-in duration-200"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="w-full bg-[var(--canvas-elevated)] rounded-t-3xl border-t border-[var(--border-subtle)] p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Additional Navigation Options"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <span className="font-bold text-base text-[var(--ink-primary)]">
                More Modules
              </span>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ul className="space-y-1 list-none p-0 m-0">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setSheetOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl min-h-[44px] text-sm font-semibold transition-colors ${
                        isActive
                          ? "bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)]"
                          : "text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-[var(--ink-muted)]" aria-hidden="true" />
                        <span>{item.label}</span>
                      </div>
                      {typeof item.badge === "number" && item.badge > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--brand-marigold-subtle)] text-[var(--brand-marigold)]">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

