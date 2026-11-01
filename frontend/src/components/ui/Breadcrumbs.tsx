"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-2 text-sm text-[var(--ink-secondary)]">
        <li>
          <Link
            href="/app/events"
            className="flex items-center text-[var(--ink-muted)] hover:text-[var(--brand-teal)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] rounded"
            aria-label="Events Home"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1 || item.current;
          return (
            <li key={index} className="flex items-center space-x-2">
              <ChevronRight
                className="w-3.5 h-3.5 text-[var(--ink-muted)] shrink-0"
                aria-hidden="true"
              />
              {isLast || !item.href ? (
                <span
                  aria-current="page"
                  className="font-semibold text-[var(--ink-primary)] truncate max-w-[200px]"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-[var(--brand-teal)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] rounded truncate max-w-[150px]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

