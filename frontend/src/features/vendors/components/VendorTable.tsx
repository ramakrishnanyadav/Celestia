"use client";

import React from "react";
import { formatMoney } from "@/lib/money";
import type { VendorItem } from "@/lib/api/types";
import { Store, Star, Award, ShieldCheck } from "lucide-react";

interface VendorTableProps {
  vendors: VendorItem[];
  onAddQuoteClick?: (vendorId: string) => void;
}

export function VendorTable({ vendors, onAddQuoteClick }: VendorTableProps) {
  if (vendors.length === 0) {
    return (
      <div className="p-8 text-center glass-card rounded-2xl">
        <Store className="w-8 h-8 mx-auto text-[var(--ink-muted)] mb-2" />
        <p className="text-sm text-[var(--ink-secondary)]">
          No vendors compared yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {vendors.map((vendor) => {
        const quoteCount = vendor.quotations ? vendor.quotations.length : 0;
        const bestQuote = vendor.quotations?.[0];

        return (
          <div
            key={vendor.id}
            className="p-5 rounded-2xl glass-card flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-[var(--ink-primary)]">
                    {vendor.name}
                  </h4>
                  {vendor.status === "preferred" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)]">
                      <Award className="w-3 h-3" /> Preferred
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                  {vendor.category} • Status: {vendor.status}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-[var(--brand-marigold)] px-2 py-1 rounded-lg bg-[var(--brand-marigold-subtle)]">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{vendor.rating.toFixed(1)}</span>
              </div>
            </div>

            {bestQuote && (
              <div className="p-3 rounded-xl bg-[var(--canvas-sunken)] text-xs space-y-1">
                <div className="flex justify-between font-semibold text-[var(--ink-primary)]">
                  <span>Quotation #{bestQuote.id.slice(0, 6)}</span>
                  <span className="text-[var(--brand-teal)]">
                    {formatMoney(bestQuote.quoted_amount_minor)}
                  </span>
                </div>
                <p className="text-[var(--ink-muted)] line-clamp-1">
                  {bestQuote.inclusions
                    ? bestQuote.inclusions.join(", ")
                    : bestQuote.status}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-xs">
              <span className="text-[var(--ink-secondary)]">
                {quoteCount} quotes on file
              </span>
              {onAddQuoteClick && (
                <button
                  type="button"
                  onClick={() => onAddQuoteClick(vendor.id)}
                  className="font-semibold text-[var(--brand-teal)] hover:underline"
                >
                  + Add Quotation
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
