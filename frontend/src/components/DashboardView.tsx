"use client";

import React from "react";
import { 
  Users, DollarSign, CheckCircle2, AlertTriangle, ShieldCheck, 
  ArrowRight, Compass, Sparkles, TrendingUp, Calendar, Clock
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface DashboardViewProps {
  event: any;
  budgetSummary: any;
  tasks: any[];
  approvals: any[];
  onNavigate: (tab: string) => void;
  onOpenQuickSim: () => void;
}

const CATEGORY_COLORS = [
  "#0D9488", "#14B8A6", "#D97706", "#F59E0B", 
  "#3B82F6", "#8B5CF6", "#EC4899", "#10B981"
];

export function DashboardView({
  event,
  budgetSummary,
  tasks,
  approvals,
  onNavigate,
  onOpenQuickSim
}: DashboardViewProps) {
  if (!event || !budgetSummary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-400">
          <span className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></span>
          <span>Loading CELESTIA Mission Control...</span>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const criticalTasks = tasks.filter(t => t.is_critical && t.status !== "completed").length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const pendingApprovals = approvals.filter(a => a.status === "pending");

  // Chart data
  const pieData = (budgetSummary.categories || []).map((cat: any) => ({
    name: cat.name,
    value: cat.allocated_rupees || 0
  }));

  return (
    <div className="space-y-6">
      
      {/* Pending Approvals Notification Banner */}
      {pendingApprovals.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/70 via-[#1C2541] to-teal-950/70 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                {pendingApprovals.length} AI Draft Proposal{pendingApprovals.length > 1 ? "s" : ""} Awaiting Host Approval
              </h4>
              <p className="text-xs text-slate-300">
                Latest: {pendingApprovals[0].title}. Changes will not modify the plan until you confirm.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate("approvals")}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-md cursor-pointer"
          >
            <span>Review Diff & Impact</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Budget Card */}
        <div className="p-5 rounded-2xl bg-[#1C2541]/80 border border-white/10 hover:border-teal-500/30 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Budget</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            ₹{budgetSummary.total_budget_rupees.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Planned: ₹{budgetSummary.planned_total_rupees.toLocaleString('en-IN')}</span>
            <span className="text-teal-400 font-medium">100% Locked</span>
          </div>
        </div>

        {/* Contingency Reserve Card */}
        <div className="p-5 rounded-2xl bg-[#1C2541]/80 border border-white/10 hover:border-amber-500/30 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contingency Reserve</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 mb-1">
            ₹{budgetSummary.contingency_reserve_rupees.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Buffer: {budgetSummary.contingency_percent}% of total</span>
            <span className="text-emerald-400 font-medium">Safe Margin</span>
          </div>
        </div>

        {/* Guest Count & Per Head Card */}
        <div className="p-5 rounded-2xl bg-[#1C2541]/80 border border-white/10 hover:border-teal-500/30 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirmed Guests</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {event.guest_count} Pax
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Avg Per Guest:</span>
            <span className="text-teal-300 font-medium">₹{budgetSummary.per_guest_avg_rupees.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Critical Path Tasks Card */}
        <div className="p-5 rounded-2xl bg-[#1C2541]/80 border border-white/10 hover:border-teal-500/30 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">CPM Progress</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {progressPercent}% Complete
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{completedTasks} of {totalTasks} Tasks</span>
            <span className="text-amber-400 font-medium">{criticalTasks} on Critical Path</span>
          </div>
        </div>

      </div>

      {/* Main Visuals & Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Budget Allocation Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#1C2541]/80 border border-white/10 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Deterministic Category Allocations</h3>
              <p className="text-xs text-slate-400">
                Benchmarks calibrated for {event.city} market standards ({event.event_type.toUpperCase()})
              </p>
            </div>
            <button
              onClick={() => onNavigate("budget")}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Detailed Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Donut Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Allocation']}
                    contentStyle={{ backgroundColor: "#0B132B", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px", color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend List */}
            <div className="space-y-2">
              {budgetSummary.categories.slice(0, 6).map((cat: any, i: number) => (
                <div key={cat.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                    ></span>
                    <span className="text-slate-300 truncate max-w-[140px]">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{cat.allocation_percent}%</span>
                    <span className="font-semibold text-white">₹{cat.allocated_rupees.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Quick What-If Simulator & Next Actions */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#1C2541]/90 to-[#0B132B] border border-white/10 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Adaptive Intelligence</span>
            </div>
            <h3 className="text-base font-bold text-white mb-2">What-If Guest & Budget Simulator</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Test how changes to guest count from {event.guest_count} to 350+ pax affect per-head catering, 
              favors, and venue capacity without modifying your live database.
            </p>

            <div className="space-y-3 mb-6">
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Current Setup:</span>
                <span className="text-white font-medium">{event.guest_count} Guests • ₹{(event.budget_minor / 10000000).toFixed(1)}L</span>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Autonomy Level:</span>
                <span className="text-amber-400 font-medium">{event.autonomy_mode} (Host Approval Required)</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => onNavigate("budget")}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-teal-950/40 cursor-pointer"
            >
              <span>Launch What-If Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate("workspace")}
              className="w-full py-2.5 px-4 rounded-xl bg-[#243054] hover:bg-[#2b3a65] text-slate-300 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Ask CELESTIA Assistant</span>
            </button>
          </div>
        </div>

      </div>

      {/* Critical Path Tasks & Milestone Timeline Summary */}
      <div className="p-6 rounded-2xl bg-[#1C2541]/80 border border-white/10 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Upcoming Critical Path Milestones (CPM)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Tasks with zero slack that directly dictate the wedding completion date
            </p>
          </div>
          <button
            onClick={() => onNavigate("timeline")}
            className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
          >
            <span>Full CPM Timeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {tasks.filter(t => t.is_critical).slice(0, 3).map((t: any) => (
            <div 
              key={t.id}
              className="p-3.5 rounded-xl bg-[#0B132B]/60 border border-white/5 hover:border-amber-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-semibold uppercase tracking-wider text-[10px]">
                    Critical Path
                  </span>
                  <span className="text-slate-400">{t.milestone_name}</span>
                </div>
                <h4 className="text-xs font-semibold text-white mb-1 line-clamp-2">{t.title}</h4>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-white/5">
                <span>Duration: {t.duration_days} days</span>
                <span className="text-teal-300 font-medium">{t.assigned_to}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
