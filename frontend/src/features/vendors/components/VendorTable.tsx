"use client";

import React from "react";
import { formatMoney } from "@/lib/money";
import type { VendorItem } from "@/lib/api/types";
import { Store, Star, Award } from "lucide-react";

interface VendorTableProps {
  vendors: VendorItem[];
  onAddQuoteClick?: (vendorId: string) => void;
}

export function VendorTable({ vendors, onAddQuoteClick }: VendorTableProps) {
  if (vendors.length === 0) {
    return (
      <div className="p-8 text-center glass-card rounded-2xl">
        <Store className="w-8 h-8 mx-auto text-[var(--ink-muted)] mb-2" aria-hidden="true" />
        <p className="text-sm text-[var(--ink-secondary)]">
          No vendors compared yet.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 m-0" aria-label="Vendors Comparison List">
      {vendors.map((vendor) => {
        const quoteCount = vendor.quotations ? vendor.quotations.length : 0;
        const bestQuote = vendor.quotations?.[0];

        return (
          <li
            key={vendor.id}
            className="p-5 rounded-2xl glass-card flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base sm:text-lg font-bold text-[var(--ink-primary)]">
                    {vendor.name}
                  </h4>
                  {vendor.status === "preferred" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] border border-[var(--brand-teal)]/30">
                      <Award className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Preferred</span>
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-[var(--ink-muted)] mt-0.5">
                  {vendor.category} <span aria-hidden="true">•</span> Status: {vendor.status}
                </p>
              </div>
              <div
                className="flex items-center gap-1 text-xs sm:text-sm font-bold text-[var(--brand-marigold)] px-2.5 py-1 rounded-lg bg-[var(--brand-marigold-subtle)]"
                aria-label={`Rating: ${vendor.rating.toFixed(1)} out of 5 stars`}
              >
                <Star className="w-4 h-4 fill-current" aria-hidden="true" />
                <span>{vendor.rating.toFixed(1)}</span>
              </div>
            </div>

            {bestQuote && (
              <div className="p-3.5 rounded-xl bg-[var(--canvas-sunken)] text-sm space-y-1">
                <div className="flex justify-between font-semibold text-[var(--ink-primary)]">
                  <span>Quotation #{bestQuote.id.slice(0, 6)}</span>
                  <span className="text-[var(--brand-teal)]" lang="en-IN">
                    {formatMoney(bestQuote.quoted_amount_minor)}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--ink-muted)] line-clamp-1">
                  {bestQuote.inclusions
                    ? bestQuote.inclusions.join(", ")
                    : bestQuote.status}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-xs sm:text-sm">
              <span className="text-[var(--ink-secondary)]">
                {quoteCount} quotes on file
              </span>
              {onAddQuoteClick && (
                <button
                  type="button"
                  onClick={() => onAddQuoteClick(vendor.id)}
                  className="min-h-[44px] px-3 py-1.5 inline-flex items-center font-semibold text-[var(--brand-teal)] hover:underline rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
                >
                  + Add Quotation
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
