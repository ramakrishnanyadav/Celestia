"use client";

import React, { useState } from "react";
import { Table, BarChart2 } from "lucide-react";

interface DataTableToggleProps {
  title: string;
  summaryText: string;
  headers: string[];
  rows: (string | number)[][];
  children: React.ReactNode;
}

export function DataTableToggle({
  title,
  summaryText,
  headers,
  rows,
  children,
}: DataTableToggleProps) {
  const [showTable, setShowTable] = useState(false);
  const summaryId = `chart-summary-${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <p id={summaryId} className="text-sm text-[var(--ink-secondary)]">
          {summaryText}
        </p>
        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          aria-expanded={showTable}
          aria-controls={`${summaryId}-table`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--canvas-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--canvas-sunken)] border border-[var(--border-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
        >
          {showTable ? (
            <>
              <BarChart2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>View as Chart</span>
            </>
          ) : (
            <>
              <Table className="w-3.5 h-3.5" aria-hidden="true" />
              <span>View as Table</span>
            </>
          )}
        </button>
      </div>

      {showTable ? (
        <div
          id={`${summaryId}-table`}
          className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--canvas)]"
        >
          <table className="w-full text-left text-sm" aria-label={`${title} Data Table`}>
            <caption className="sr-only">{`${title} tabular representation`}</caption>
            <thead className="bg-[var(--canvas-subtle)] border-b border-[var(--border-subtle)] text-[var(--ink-secondary)] text-xs uppercase font-semibold">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} scope="col" className="px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-[var(--canvas-subtle)] transition-colors">
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className={`px-4 py-3 ${
                        cIdx === 0
                          ? "font-medium text-[var(--ink-primary)]"
                          : "text-[var(--ink-secondary)]"
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div aria-describedby={summaryId}>{children}</div>
      )}
    </div>
  );
}

