"use client";

import React from "react";
import type { ApprovalItem } from "@/lib/api/types";
import { CheckCheck, CheckCircle2, XCircle, Clock } from "lucide-react";

interface ApprovalsListProps {
  approvals: ApprovalItem[];
  onAction?: (proposalId: string, action: "approve" | "reject") => void;
  loadingId?: string | null;
}

export function ApprovalsList({
  approvals,
  onAction,
  loadingId,
}: ApprovalsListProps) {
  if (approvals.length === 0) {
    return (
      <div className="p-8 text-center glass-card rounded-2xl">
        <CheckCheck className="w-8 h-8 mx-auto text-[var(--status-success)] mb-2" aria-hidden="true" />
        <p className="text-base font-semibold text-[var(--ink-primary)]">
          All proposals reviewed
        </p>
        <p className="text-sm text-[var(--ink-muted)] mt-1">
          No pending AI suggestions waiting for human approval.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-4 list-none p-0 m-0" aria-label="Proposals for Human Approval">
      {approvals.map((item) => {
        const isPending = item.status === "pending";
        const isActionLoading = loadingId === item.id;

        return (
          <li key={item.id} className="p-5 rounded-2xl glass-card space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base sm:text-lg font-bold text-[var(--ink-primary)]">
                    {item.title}
                  </h4>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                      item.status === "approved"
                        ? "bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] border border-[var(--brand-teal)]/30"
                        : item.status === "rejected"
                          ? "bg-red-50 dark:bg-red-950/60 text-[var(--status-danger)] border border-[var(--status-danger)]/30"
                          : "bg-[var(--brand-marigold-subtle)] text-[var(--brand-marigold)] border border-[var(--brand-marigold)]/30"
                    }`}
                  >
                    {item.status === "approved" && (
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    {item.status === "rejected" && (
                      <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    {item.status === "pending" && (
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>{item.status}</span>
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--ink-muted)] mt-1">
                  Type: {item.proposal_type} <span aria-hidden="true">•</span> Created{" "}
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>

              {isPending && onAction && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={() => onAction(item.id, "approve")}
                    className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--brand-teal)] text-white text-xs sm:text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] focus-visible:ring-offset-2"
                  >
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={() => onAction(item.id, "reject")}
                    className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-[var(--ink-secondary)] text-xs sm:text-sm font-semibold hover:bg-[var(--canvas-sunken)] disabled:opacity-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--status-danger)] focus-visible:ring-offset-2"
                  >
                    <XCircle className="w-4 h-4" aria-hidden="true" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>

            <p className="text-sm sm:text-base text-[var(--ink-secondary)] leading-relaxed">
              {item.summary}
            </p>

            {item.proposed_changes_json &&
              Object.keys(item.proposed_changes_json).length > 0 && (
                <div className="p-3.5 rounded-xl bg-[var(--canvas-sunken)] text-xs sm:text-sm font-mono text-[var(--ink-primary)] overflow-x-auto border border-[var(--border-subtle)]">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(item.proposed_changes_json, null, 2)}
                  </pre>
                </div>
              )}
          </li>
        );
      })}
    </ul>
  );
}
