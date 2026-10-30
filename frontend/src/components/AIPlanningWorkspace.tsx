"use client";

import React, { useState } from "react";
import { 
  Sparkles, Send, Bot, User as UserIcon, ShieldAlert, CheckCircle2, 
  ArrowRight, RefreshCw, FileText, Compass, DollarSign, HeartHandshake, Layers
} from "lucide-react";
import { api } from "@/lib/api";

interface AIPlanningWorkspaceProps {
  event: any;
  plan: any;
  onRefreshData: () => void;
  onNavigateToApprovals: () => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  proposalId?: string;
  diffSummary?: any;
  timestamp: string;
}

export function AIPlanningWorkspace({
  event,
  plan,
  onRefreshData,
  onNavigateToApprovals,
}: AIPlanningWorkspaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-0",
      sender: "ai",
      text: `Namaste! I am CELESTIA, your celebration planning assistant for ${event?.title || "your celebration"}. I am operating under '${event?.autonomy_mode || "Draft"}' autonomy mode. Any significant adjustments to guests, budget allocations, or contracts will be drafted for your review before modifying your live event records. How can I assist you today?`,
      timestamp: "Just now"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const quickPrompts = [
    "Scale guests to 350 pax",
    "Adjust budget to 18 Lakhs",
    "What are the contract risks with our caterers?",
    "Recommend pure veg sweets for Muhurtham",
    "Simulate scaling down to 250 guests"
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !event) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText("");
    setIsProcessing(true);

    try {
      const res = await api.sendAIChatCommand(event.id, text);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: res.message,
        proposalId: res.proposal_id,
        diffSummary: res.diff,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      if (res.proposal_created) {
        onRefreshData();
      }
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: "ai",
        text: `Error processing request: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegeneratePlan = async () => {
    if (!event) return;
    setIsProcessing(true);
    try {
      await api.generatePlan(event.id);
      onRefreshData();
      const aiMsg: ChatMessage = {
        id: `ai-regen-${Date.now()}`,
        sender: "ai",
        text: `Successfully re-synthesized the master blueprint, budget allocations, and CPM timeline for ${event.title}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      alert(`Error regenerating plan: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[650px]">
      
      {/* LEFT PANE: Conversational AI Assistant (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col bg-[#1C2541]/80 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        
        {/* Assistant Header */}
        <div className="p-4 bg-[#0B132B]/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">CELESTIA Planning Copilot</h3>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                <span>Mode: <strong className="text-amber-400">{event?.autonomy_mode || "Draft"}</strong></span>
                <span>•</span>
                <span>Provenance: Verified</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleRegeneratePlan}
            title="Re-run planning synthesis"
            className="p-1.5 rounded-lg bg-[#1C2541] hover:bg-[#243054] text-slate-300 hover:text-white border border-white/10 text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Chat Message Scroll Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.sender === "ai" && (
                <div className="w-7 h-7 rounded-lg bg-teal-950 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}

              <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                m.sender === "user"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-950/40"
                  : "bg-[#0B132B]/90 text-slate-200 border border-white/10 shadow-lg"
              }`}>
                <p className="whitespace-pre-wrap">{m.text}</p>

                {/* Proposal Action Card inside chat */}
                {m.proposalId && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 space-y-2">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Draft Proposal Created</span>
                    </div>
                    <p className="text-[11px] text-amber-100/80">
                      This change requires your confirmation before persisting to the live database.
                    </p>
                    <button
                      onClick={onNavigateToApprovals}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Review Diff & Approve</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="mt-1 text-[9px] text-slate-400 text-right">
                  {m.timestamp}
                </div>
              </div>

              {m.sender === "user" && (
                <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-teal-400 bg-[#0B132B]/60 p-3 rounded-xl max-w-fit">
              <span className="w-3 h-3 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></span>
              <span>Reasoning through celebration constraints...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2.5 bg-[#0B132B]/60 border-t border-white/5 flex gap-1.5 overflow-x-auto scrollbar-none">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              className="px-2.5 py-1 rounded-full bg-[#1C2541] hover:bg-[#243054] text-[11px] text-slate-300 hover:text-white border border-white/10 whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-[#0B132B] border-t border-white/10 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask CELESTIA to adjust budget, simulate guests, check vendors..."
            className="flex-1 bg-[#1C2541] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={isProcessing || !inputText.trim()}
            className="p-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>

      {/* RIGHT PANE: Master Event Blueprint View (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col bg-[#1C2541]/80 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        
        {/* Blueprint Header */}
        <div className="p-4 bg-[#0B132B]/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {plan?.title || "Master Event Blueprint"}
              </h3>
              <p className="text-[10px] text-slate-400">
                Deterministic structured schema • {event?.city} • {event?.guest_count} Guests
              </p>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="px-3 py-1 rounded-lg bg-[#1C2541] hover:bg-[#243054] border border-white/10 text-xs text-slate-300 font-medium transition-colors cursor-pointer"
          >
            Export Blueprint (PDF)
          </button>
        </div>

        {/* Blueprint Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          
          {/* Executive Summary Card */}
          <div className="p-4 rounded-xl bg-[#0B132B]/70 border border-teal-500/20">
            <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Executive Synthesis</span>
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed">
              {plan?.summary || (
                `Execution plan calibrated for ${event?.title} in ${event?.city}. Configured for ${event?.guest_count} guests with an approved budget ceiling of ₹${((event?.budget_minor || 0) / 100).toLocaleString('en-IN')}. Incorporating Pure Vegetarian multi-course catering and Royal Marigold theme.`
              )}
            </p>
          </div>

          {/* 4 Pillars of Blueprint */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Pillar 1: Celebration Concept */}
            <div className="p-4 rounded-xl bg-[#0B132B]/60 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                <HeartHandshake className="w-4 h-4" />
                <span>Pillar 1: Cultural Nuance & Theme</span>
              </div>
              <div className="text-xs space-y-1 text-slate-300">
                <div><strong className="text-white">Theme:</strong> {event?.preference?.theme || "Royal Marigold & Polished Brass"}</div>
                <div><strong className="text-white">Regional Culture:</strong> {event?.preference?.regional_culture || "Maharashtrian Traditional"}</div>
                <div><strong className="text-white">Dietary:</strong> {event?.preference?.dietary || "Pure Vegetarian"}</div>
                <div><strong className="text-white">Entertainment:</strong> {event?.preference?.music_entertainment || "Shehnai & Dhol-Tasha + DJ"}</div>
              </div>
            </div>

            {/* Pillar 2: Financial Precision */}
            <div className="p-4 rounded-xl bg-[#0B132B]/60 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs">
                <DollarSign className="w-4 h-4" />
                <span>Pillar 2: Financial Guardrails</span>
              </div>
              <div className="text-xs space-y-1 text-slate-300">
                <div><strong className="text-white">Budget Ceiling:</strong> ₹{((event?.budget_minor || 0) / 100).toLocaleString('en-IN')}</div>
                <div><strong className="text-white">Contingency Reserve:</strong> 10% (₹{((event?.budget_minor || 0) * 0.10 / 100).toLocaleString('en-IN')})</div>
                <div><strong className="text-white">Per-Guest Average:</strong> ₹{Math.round(((event?.budget_minor || 0) / 100) / (event?.guest_count || 1)).toLocaleString('en-IN')}</div>
                <div><strong className="text-white">Ledger Precision:</strong> Integer minor units (Zero float drift)</div>
              </div>
            </div>

            {/* Pillar 3: Logistics & CPM Timeline */}
            <div className="p-4 rounded-xl bg-[#0B132B]/60 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs">
                <Compass className="w-4 h-4" />
                <span>Pillar 3: Execution Timeline & CPM</span>
              </div>
              <div className="text-xs space-y-1 text-slate-300">
                <div><strong className="text-white">Preparation Horizon:</strong> {event?.preparation_months || 6} Months</div>
                <div><strong className="text-white">Venue Style:</strong> {event?.venue_type || "Banquet Hall"} ({event?.city})</div>
                <div><strong className="text-white">Schedule Algorithm:</strong> Critical Path Method (Early/Late Start)</div>
                <div><strong className="text-white">Milestones:</strong> 7 Standard Anchors</div>
              </div>
            </div>

            {/* Pillar 4: Autonomy & Safety */}
            <div className="p-4 rounded-xl bg-[#0B132B]/60 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                <Layers className="w-4 h-4" />
                <span>Pillar 4: Safety & Autonomy</span>
              </div>
              <div className="text-xs space-y-1 text-slate-300">
                <div><strong className="text-white">Autonomy Model:</strong> 3-Tier (Suggest → Draft → Approve)</div>
                <div><strong className="text-white">Database Isolation:</strong> AI changes require host sign-off</div>
                <div><strong className="text-white">Audit History:</strong> Immutable activity logging</div>
                <div><strong className="text-white">Degradation:</strong> Deterministic domain engine fallback</div>
              </div>
            </div>

          </div>

          {/* Cultural Traditions List */}
          <div className="p-4 rounded-xl bg-[#0B132B]/60 border border-white/5 space-y-2">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              Confirmed Ceremonies & Traditions Checklist
            </h4>
            <div className="flex flex-wrap gap-2">
              {(event?.preference?.cultural_traditions || ["Sakhar Puda", "Muhurtham", "Haldi", "Sangeet", "Satyanarayan Puja"]).map((trad: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-lg bg-[#1C2541] border border-teal-500/30 text-teal-300 text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3 h-3 text-teal-400" />
                  <span>{trad}</span>
                </span>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
