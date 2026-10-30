"use client";

import React, { useState } from "react";
import { 
  DollarSign, TrendingUp, ShieldCheck, AlertCircle, Plus, Trash2, 
  ChevronDown, ChevronRight, CheckCircle2, ArrowRight, Sparkles, Sliders
} from "lucide-react";
import { api } from "@/lib/api";

interface BudgetManagerViewProps {
  event: any;
  budgetSummary: any;
  onRefreshData: () => void;
  onNavigateToApprovals: () => void;
}

export function BudgetManagerView({
  event,
  budgetSummary,
  onRefreshData,
  onNavigateToApprovals
}: BudgetManagerViewProps) {
  // What-if simulator state
  const [simGuestCount, setSimGuestCount] = useState<number>(event?.guest_count || 300);
  const [simBudgetLakhs, setSimBudgetLakhs] = useState<number>(
    Number(((event?.budget_minor || 150000000) / 10000000).toFixed(1))
  );
  const [simResult, setSimResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);

  // Expanded categories state
  const [expandedCatIds, setExpandedCatIds] = useState<Record<string, boolean>>({});

  // Add Expense Modal state
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmountRupees, setExpenseAmountRupees] = useState("");
  const [expenseProvenance, setExpenseProvenance] = useState("estimated");
  const [expenseNotes, setExpenseNotes] = useState("");

  const toggleExpand = (catId: string) => {
    setExpandedCatIds(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const runSimulation = async (guests: number, lakhs: number) => {
    if (!event) return;
    setIsSimulating(true);
    try {
      const budgetMinor = Math.round(lakhs * 100000 * 100);
      const res = await api.simulateWhatIf(event.id, {
        simulated_guest_count: guests,
        simulated_budget_minor: budgetMinor
      });
      setSimResult(res);
    } catch (err: any) {
      console.error("Simulation error", err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSimGuestCount(val);
    runSimulation(val, simBudgetLakhs);
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSimBudgetLakhs(val);
    runSimulation(simGuestCount, val);
  };

  const handleCreateProposalFromSim = async () => {
    if (!event || !simResult) return;
    setIsCreatingProposal(true);
    try {
      await api.sendAIChatCommand(
        event.id, 
        `Scale guest count to ${simGuestCount} and adjust budget to ${simBudgetLakhs} Lakhs`
      );
      onRefreshData();
      onNavigateToApprovals();
    } catch (err: any) {
      alert(`Error creating proposal: ${err.message}`);
    } finally {
      setIsCreatingProposal(false);
    }
  };

  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId || !expenseName || !expenseAmountRupees) return;
    try {
      const amountPaise = Math.round(Number(expenseAmountRupees) * 100);
      await api.addExpense(event.id, selectedCatId, {
        name: expenseName,
        planned_amount_minor: amountPaise,
        provenance: expenseProvenance,
        notes: expenseNotes
      });
      setShowAddExpenseModal(false);
      setExpenseName("");
      setExpenseAmountRupees("");
      setExpenseNotes("");
      onRefreshData();
    } catch (err: any) {
      alert(`Error adding expense: ${err.message}`);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense item?")) return;
    try {
      await api.deleteExpense(event.id, expenseId);
      onRefreshData();
    } catch (err: any) {
      alert(`Error deleting expense: ${err.message}`);
    }
  };

  if (!budgetSummary) {
    return <div className="text-center py-12 text-slate-400">Loading budget records...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Top Financial Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-[#1C2541]/80 border border-white/10 shadow-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Budget Ceiling
          </span>
          <div className="text-2xl font-bold text-white mb-1">
            ₹{budgetSummary.total_budget_rupees.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-teal-400">Fixed Minor Unit Base</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#1C2541]/80 border border-white/10 shadow-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Planned Total
          </span>
          <div className="text-2xl font-bold text-white mb-1">
            ₹{budgetSummary.planned_total_rupees.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-slate-400">
            {((budgetSummary.planned_total_rupees / budgetSummary.total_budget_rupees) * 100).toFixed(1)}% of total allocated
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#1C2541]/80 border border-white/10 shadow-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            10% Contingency Reserve
          </span>
          <div className="text-2xl font-bold text-amber-400 mb-1">
            ₹{budgetSummary.contingency_reserve_rupees.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-emerald-400">Protected Emergency Cushion</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#1C2541]/80 border border-white/10 shadow-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Remaining Uncommitted
          </span>
          <div className={`text-2xl font-bold mb-1 ${budgetSummary.remaining_balance_rupees >= 0 ? 'text-teal-300' : 'text-rose-400'}`}>
            ₹{budgetSummary.remaining_balance_rupees.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-slate-400">
            Avg Per Guest: ₹{budgetSummary.per_guest_avg_rupees.toLocaleString('en-IN')}
          </span>
        </div>

      </div>

      {/* Interactive What-If Simulation Laboratory */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#1C2541] via-[#243054] to-[#1C2541] border border-teal-500/30 shadow-2xl space-y-6">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Deterministic What-If Simulation Engine
              </h3>
              <p className="text-xs text-slate-300">
                Dynamically model guest count and budget adjustments. Automatically scales per-guest catering & favors while protecting fixed venue and decor commitments.
              </p>
            </div>
          </div>
          {simResult && (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              simResult.feasibility_status === 'feasible' 
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' 
                : simResult.feasibility_status === 'tight'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
            }`}>
              Status: {simResult.feasibility_status.toUpperCase()}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          
          {/* Slider 1: Guest Count */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Simulated Guest Count:</span>
              <span className="text-teal-300 font-bold text-sm">{simGuestCount} Pax</span>
            </div>
            <input
              type="range"
              min="100"
              max="600"
              step="10"
              value={simGuestCount}
              onChange={handleSliderChange}
              className="w-full h-2 bg-[#0B132B] rounded-lg appearance-none cursor-pointer accent-teal-400"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>100 Pax (Intimate)</span>
              <span>300 Pax (Baseline)</span>
              <span>600 Pax (Grand)</span>
            </div>
          </div>

          {/* Slider 2: Budget Ceiling */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Simulated Budget Ceiling (Lakhs INR):</span>
              <span className="text-amber-400 font-bold text-sm">₹{simBudgetLakhs} Lakhs</span>
            </div>
            <input
              type="range"
              min="8"
              max="35"
              step="0.5"
              value={simBudgetLakhs}
              onChange={handleBudgetChange}
              className="w-full h-2 bg-[#0B132B] rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>₹8L (Tight)</span>
              <span>₹15L (Approved)</span>
              <span>₹35L (Luxury)</span>
            </div>
          </div>

        </div>

        {/* Live Simulation Output Box */}
        {simResult && (
          <div className="p-4 rounded-xl bg-[#0B132B]/80 border border-white/10 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#1C2541]/50 border border-white/5">
                <span className="text-slate-400 block mb-0.5">Guest Delta:</span>
                <span className="text-white font-bold">
                  {simResult.guest_count_change >= 0 ? `+${simResult.guest_count_change}` : simResult.guest_count_change} Pax
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#1C2541]/50 border border-white/5">
                <span className="text-slate-400 block mb-0.5">Variable Cost Impact:</span>
                <span className={`font-bold ${simResult.variable_cost_impact_rupees >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  ₹{simResult.variable_cost_impact_rupees.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#1C2541]/50 border border-white/5">
                <span className="text-slate-400 block mb-0.5">New Projected Contingency:</span>
                <span className={`font-bold ${simResult.new_contingency_rupees >= 0 ? 'text-teal-300' : 'text-rose-400'}`}>
                  ₹{simResult.new_contingency_rupees.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed border-t border-white/5 pt-3">
              <strong className="text-amber-400">Algorithmic Advice:</strong> {simResult.recommendation}
            </p>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleCreateProposalFromSim}
                disabled={isCreatingProposal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-950/40 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isCreatingProposal ? "Drafting Proposal..." : "Draft AI Proposal from Simulation"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Categories & Expense Line Items Table */}
      <div className="p-6 rounded-2xl bg-[#1C2541]/80 border border-white/10 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">Itemized Budget Ledger & Provenance</h3>
            <p className="text-xs text-slate-400">
              Each expense tracks its origin: user-provided, verified quote, calculated formula, or estimated market benchmark.
            </p>
          </div>
          <button
            onClick={() => {
              if (budgetSummary.categories.length > 0) {
                setSelectedCatId(budgetSummary.categories[0].id);
              }
              setShowAddExpenseModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense Item</span>
          </button>
        </div>

        {/* Category Accordion Rows */}
        <div className="space-y-3">
          {budgetSummary.categories.map((cat: any) => {
            const isExpanded = !!expandedCatIds[cat.id];
            const expenseSumRupees = (cat.expenses || []).reduce(
              (acc: number, curr: any) => acc + (curr.planned_rupees || 0), 0
            );

            return (
              <div 
                key={cat.id} 
                className="rounded-xl border border-white/10 bg-[#0B132B]/60 overflow-hidden transition-all"
              >
                {/* Category Header Bar */}
                <div 
                  onClick={() => toggleExpand(cat.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-slate-400">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{cat.name}</span>
                        {cat.is_per_guest && (
                          <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 text-[10px] font-semibold">
                            Per Guest Rate: ₹{cat.per_guest_rupees}/head
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        Allocation: {cat.allocation_percent}% (Cap: ₹{cat.allocated_rupees.toLocaleString('en-IN')})
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-white">
                      ₹{expenseSumRupees.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {cat.expenses?.length || 0} Line Items
                    </span>
                  </div>
                </div>

                {/* Sub-table: Expenses */}
                {isExpanded && (
                  <div className="border-t border-white/5 bg-[#0B132B]/90 p-4 space-y-2">
                    {cat.expenses && cat.expenses.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-white/10 text-slate-400 text-[11px]">
                              <th className="pb-2">Expense Item</th>
                              <th className="pb-2">Provenance</th>
                              <th className="pb-2 text-right">Planned Amount</th>
                              <th className="pb-2 text-right">Actual Spent</th>
                              <th className="pb-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {cat.expenses.map((exp: any) => (
                              <tr key={exp.id} className="hover:bg-white/5">
                                <td className="py-2.5 text-white font-medium">
                                  {exp.name}
                                  {exp.notes && (
                                    <span className="block text-[10px] text-slate-400">{exp.notes}</span>
                                  )}
                                </td>
                                <td className="py-2.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                                    exp.provenance === 'user_provided' 
                                      ? 'bg-blue-950 text-blue-300 border border-blue-500/30'
                                      : exp.provenance === 'verified'
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                      : exp.provenance === 'calculated'
                                      ? 'bg-teal-950 text-teal-300 border border-teal-500/30'
                                      : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                                  }`}>
                                    {exp.provenance.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="py-2.5 text-right text-slate-200 font-semibold">
                                  ₹{exp.planned_rupees.toLocaleString('en-IN')}
                                </td>
                                <td className="py-2.5 text-right text-slate-400">
                                  ₹{exp.actual_rupees.toLocaleString('en-IN')}
                                </td>
                                <td className="py-2.5 text-right">
                                  <button
                                    onClick={() => handleDeleteExpense(exp.id)}
                                    title="Delete expense"
                                    className="p-1 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No line items added yet.</p>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>

      </div>

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1C2541] border border-white/10 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Add Expense Line Item</h3>
            <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
              
              <div>
                <label className="text-xs text-slate-300 block mb-1">Target Category</label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                >
                  {budgetSummary.categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Item Description</label>
                <input
                  type="text"
                  required
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  placeholder="e.g. Traditional Dhol-Tasha Troupe (4 Hours)"
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Planned Amount (₹ INR)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={expenseAmountRupees}
                  onChange={(e) => setExpenseAmountRupees(e.target.value)}
                  placeholder="e.g. 35000"
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Provenance Label</label>
                <select
                  value={expenseProvenance}
                  onChange={(e) => setExpenseProvenance(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                >
                  <option value="user_provided">User Provided</option>
                  <option value="verified">Verified Quotation</option>
                  <option value="calculated">Calculated Formula</option>
                  <option value="estimated">Estimated Benchmark</option>
                  <option value="ai_suggested">AI Suggested</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Notes / Vendor References</label>
                <input
                  type="text"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  placeholder="e.g. Sourced from local market quote"
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0B132B] hover:bg-[#243054] text-xs text-slate-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs text-white font-semibold transition-colors"
                >
                  Save Item
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
