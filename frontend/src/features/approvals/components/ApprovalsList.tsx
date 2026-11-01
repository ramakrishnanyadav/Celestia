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
        <CheckCheck className="w-8 h-8 mx-auto text-[var(--status-success)] mb-2" />
        <p className="text-sm font-semibold text-[var(--ink-primary)]">
          All proposals reviewed
        </p>
        <p className="text-xs text-[var(--ink-muted)] mt-1">
          No pending AI suggestions waiting for human approval.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {approvals.map((item) => {
        const isPending = item.status === "pending";
        const isActionLoading = loadingId === item.id;

        return (
          <div key={item.id} className="p-5 rounded-2xl glass-card space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-[var(--ink-primary)]">
                    {item.title}
                  </h4>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                      item.status === "approved"
                        ? "bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)]"
                        : item.status === "rejected"
                          ? "bg-[var(--status-danger)]/10 text-[var(--status-danger)]"
                          : "bg-[var(--brand-marigold-subtle)] text-[var(--brand-marigold)]"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--ink-muted)] mt-1">
                  Type: {item.proposal_type} • Created{" "}
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>

              {isPending && onAction && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={() => onAction(item.id, "approve")}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--brand-teal)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={() => onAction(item.id, "reject")}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-[var(--ink-secondary)] text-xs font-semibold hover:bg-[var(--canvas-sunken)] disabled:opacity-50 transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>

            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
              {item.summary}
            </p>

            {item.proposed_changes_json &&
              Object.keys(item.proposed_changes_json).length > 0 && (
                <div className="p-3.5 rounded-xl bg-[var(--canvas-sunken)] text-xs font-mono text-[var(--ink-primary)] overflow-x-auto">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(item.proposed_changes_json, null, 2)}
                  </pre>
                </div>
              )}
          </div>
        );
      })}
    </div>
  );
}
