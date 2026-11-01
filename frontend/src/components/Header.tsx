"use client";

import React from "react";
import { Sparkles, Calendar, Users, DollarSign, ShieldAlert, Pause, Play, Printer, Menu, Plus, User as UserIcon, LogOut } from "lucide-react";

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  event: any;
  onNewEvent: () => void;
  onToggleAiPause: () => void;
  pendingApprovalsCount: number;
  currentUser?: any;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

export function Header({
  currentTab,
  setCurrentTab,
  event,
  onNewEvent,
  onToggleAiPause,
  pendingApprovalsCount,
  currentUser,
  onOpenAuth,
  onLogout
}: HeaderProps) {
  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "workspace", label: "AI Planning" },
    { id: "ideas", label: "Celebration Ideas" },
    { id: "budget", label: "Budget & What-If" },
    { id: "timeline", label: "Timeline & CPM" },
    { id: "vendors", label: "Vendors & Quotes" },
    { id: "approvals", label: `Approvals (${pendingApprovalsCount})` },
    { id: "settings", label: "Settings" }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0B132B]/95 backdrop-blur-md border-b border-white/10 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Event Selector */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div 
            onClick={() => setCurrentTab("dashboard")}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0D9488] to-[#D97706] p-0.5 shadow-lg shadow-teal-900/30">
              <div className="w-full h-full bg-[#0B132B] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#FAF7F2] group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-teal-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                CELESTIA
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-[#94A3B8] font-semibold">
                AI Celebration Assistant
              </span>
            </div>
          </div>

          {/* Active Event Quick Badge */}
          {event && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1C2541] border border-white/10 text-xs">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              <span className="font-medium text-white max-w-[160px] truncate">{event.title}</span>
              <span className="text-slate-400">|</span>
              <span className="text-amber-400 font-semibold">₹{(event.budget_minor / 10000000).toFixed(1)}L</span>
              <span className="text-slate-400">|</span>
              <span className="text-teal-300">{event.guest_count} Guests</span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          {tabs.map((t) => {
            const isActive = currentTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setCurrentTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md shadow-teal-900/40"
                    : "text-slate-300 hover:text-white hover:bg-[#1C2541]/80"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          {event && (
            <button
              onClick={onToggleAiPause}
              title={event.ai_paused ? "Resume AI Assistance" : "Pause AI Assistance"}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                event.ai_paused
                  ? "bg-amber-950/60 border-amber-600/40 text-amber-300 hover:bg-amber-900/60"
                  : "bg-[#1C2541] border-white/10 text-teal-300 hover:bg-[#243054]"
              }`}
            >
              {event.ai_paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span className="hidden lg:inline">{event.ai_paused ? "AI Paused" : "AI Active"}</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            title="Export Event Blueprint (PDF / Print)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#1C2541] hover:bg-[#243054] text-slate-300 hover:text-white border border-white/10 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Blueprint</span>
          </button>

          <button
            onClick={onNewEvent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-semibold shadow-md shadow-amber-950/30 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Event</span>
          </button>

          {/* User Profile / Auth Control */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1C2541] border border-white/10 text-xs text-slate-200">
                <UserIcon className="w-3 h-3 text-teal-400" />
                <span className="max-w-[100px] truncate hidden xl:inline">{currentUser.name || currentUser.email}</span>
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 rounded-lg bg-[#1C2541] hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 border border-white/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-950/30 transition-all cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
