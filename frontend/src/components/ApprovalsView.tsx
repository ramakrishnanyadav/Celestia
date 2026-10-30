"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, CheckCircle2, XCircle, Clock, ArrowRight, AlertTriangle, 
  User, Bot, History, Sparkles
} from "lucide-react";
import { api } from "@/lib/api";

interface ApprovalsViewProps {
  event: any;
  approvals: any[];
  activityLogs: any[];
  onRefreshData: () => void;
}

export function ApprovalsView({
  event,
  approvals,
  activityLogs,
  onRefreshData
}: ApprovalsViewProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "history" | "audit">("pending");
  const [isProcessing, setIsProcessing] = useState(false);

  const pendingApprovals = approvals.filter(a => a.status === "pending");
  const reviewedApprovals = approvals.filter(a => a.status !== "pending");

  const handleAction = async (proposalId: string, action: "approve" | "reject") => {
    setIsProcessing(true);
    try {
      await api.executeApproval(event.id, proposalId, action);
      onRefreshData();
    } catch (err: any) {
      alert(`Error executing approval: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Autonomy Safety Policy Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#1C2541] via-[#0A1128] to-[#1C2541] border border-amber-500/30 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                CELESTIA 3-Tier Autonomy Safety Model
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold">
                Suggest → Draft → Approve
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
              The AI planning assistant operates without unconstrained execution authority. 
              All high-impact changes to guest headcounts, budgets, and contracts remain as drafts until approved by you.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0B132B] border border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "pending"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Pending ({pendingApprovals.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-teal-600 text-white shadow-md"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Resolved ({reviewedApprovals.length})
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "audit"
                ? "bg-teal-600 text-white shadow-md"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Audit Log ({activityLogs.length})
          </button>
        </div>
      </div>

      {/* PENDING PROPOSALS QUEUE */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {pendingApprovals.length > 0 ? (
            pendingApprovals.map((proposal) => {
              const diff = proposal.diff_summary || {};
              return (
                <div
                  key={proposal.id}
                  className="p-6 rounded-2xl bg-[#1C2541]/90 border border-amber-500/40 shadow-2xl space-y-4"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 mb-1 inline-block">
                        {proposal.proposal_type.replace('_', ' ')}
                      </span>
                      <h4 className="text-base font-bold text-white">{proposal.title}</h4>
                      <p className="text-xs text-slate-300">{proposal.summary}</p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      Drafted {new Date(proposal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Visual Diff Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-[#0B132B] border border-white/5">
                    {/* Before State */}
                    <div className="p-3 rounded-lg bg-[#1C2541]/40 border border-white/5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Current Approved State
                      </span>
                      <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap">
                        {JSON.stringify(diff.before || {}, null, 2)}
                      </pre>
                    </div>

                    {/* After State */}
                    <div className="p-3 rounded-lg bg-teal-950/30 border border-teal-500/30">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 block mb-1">
                        Proposed Changes (Draft)
                      </span>
                      <pre className="text-xs font-mono text-teal-200 whitespace-pre-wrap">
                        {JSON.stringify(diff.after || {}, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Impact Summary Note */}
                  {diff.impact && (
                    <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200 flex items-center justify-between">
                      <span><strong>Algorithmic Impact:</strong> {JSON.stringify(diff.impact)}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => handleAction(proposal.id, "reject")}
                      disabled={isProcessing}
                      className="px-4 py-2 rounded-xl bg-[#0B132B] hover:bg-rose-950 hover:text-rose-300 text-xs text-slate-300 font-semibold border border-white/10 transition-colors cursor-pointer"
                    >
                      Reject Proposal
                    </button>
                    <button
                      onClick={() => handleAction(proposal.id, "approve")}
                      disabled={isProcessing}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-lg shadow-teal-950/40 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Persist Changes</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 rounded-2xl bg-[#1C2541]/50 border border-white/10 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-teal-400 mx-auto" />
              <h4 className="text-sm font-semibold text-white">No Pending Proposals</h4>
              <p className="text-xs text-slate-400">
                All event parameters are synchronized with host approvals. You can simulate changes in the Budget & What-If tab.
              </p>
            </div>
          )}
        </div>
      )}

      {/* RESOLVED PROPOSALS HISTORY */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {reviewedApprovals.map((proposal) => (
            <div
              key={proposal.id}
              className="p-4 rounded-xl bg-[#1C2541]/60 border border-white/10 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                    proposal.status === 'approved' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                  }`}>
                    {proposal.status}
                  </span>
                  <h4 className="text-xs font-semibold text-white">{proposal.title}</h4>
                </div>
                <p className="text-xs text-slate-400">{proposal.summary}</p>
              </div>
              <span className="text-[11px] text-slate-400">
                {new Date(proposal.reviewed_at || proposal.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* IMMUTABLE AUDIT LOG */}
      {activeTab === "audit" && (
        <div className="p-6 rounded-2xl bg-[#1C2541]/80 border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
            <History className="w-4 h-4" />
            <span>Immutable System & User Activity Log</span>
          </div>

          <div className="space-y-3">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-[#0B132B]/60 border border-white/5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                    log.actor === 'User' ? 'bg-amber-950 text-amber-300' : 'bg-teal-950 text-teal-300'
                  }`}>
                    {log.actor}
                  </span>
                  <div>
                    <strong className="text-white">{log.action}: </strong>
                    <span className="text-slate-300">{log.details}</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap ml-4">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
