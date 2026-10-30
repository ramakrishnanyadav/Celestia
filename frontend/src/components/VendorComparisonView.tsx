"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, 
  Sparkles, Plus, DollarSign, FileText, ArrowRight, Star
} from "lucide-react";
import { api } from "@/lib/api";

interface VendorComparisonViewProps {
  event: any;
  onRefreshData: () => void;
}

export function VendorComparisonView({
  event,
  onRefreshData
}: VendorComparisonViewProps) {
  const [selectedCategory, setSelectedCategory] = useState("Catering");
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showAddQuoteModal, setShowAddQuoteModal] = useState(false);

  // New quotation form state
  const [vendorName, setVendorName] = useState("");
  const [quoteAmountRupees, setQuoteAmountRupees] = useState("");
  const [inclusionsText, setInclusionsText] = useState("");
  const [exclusionsText, setExclusionsText] = useState("");
  const [advancePercent, setAdvancePercent] = useState(30);
  const [cancellationTerms, setCancellationTerms] = useState("Standard refund up to 14 days prior");

  const categories = ["Catering", "Decor", "Venue", "Photography"];

  const loadComparison = async (category: string) => {
    if (!event) return;
    setLoading(true);
    try {
      const data = await api.compareVendors(event.id, category);
      setComparisonData(data);
    } catch (err: any) {
      console.error("Comparison load error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComparison(selectedCategory);
  }, [selectedCategory, event]);

  const handleAddQuotationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName || !quoteAmountRupees || !event) return;
    try {
      // 1. Create vendor
      const v = await api.createVendor(event.id, {
        name: vendorName,
        category: selectedCategory,
        rating: 4.5
      });
      // 2. Add quotation
      const inclusions = inclusionsText.split("\n").filter(s => s.trim().length > 0);
      const exclusions = exclusionsText.split("\n").filter(s => s.trim().length > 0);
      const amountMinor = Math.round(Number(quoteAmountRupees) * 100);

      await api.addQuotation(event.id, v.id, {
        vendor_id: v.id,
        quoted_amount_minor: amountMinor,
        inclusions,
        exclusions,
        terms: {
          advance_percent: Number(advancePercent),
          cancellation_policy: cancellationTerms
        },
        is_sample: false
      });

      setShowAddQuoteModal(false);
      setVendorName("");
      setQuoteAmountRupees("");
      setInclusionsText("");
      setExclusionsText("");
      loadComparison(selectedCategory);
      onRefreshData();
    } catch (err: any) {
      alert(`Error adding quotation: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Category Tabs & Add Quote Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-teal-600 text-white shadow-lg shadow-teal-950/40"
                  : "bg-[#1C2541] text-slate-300 hover:text-white hover:bg-[#243054]"
              }`}
            >
              {cat} Quotations
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAddQuoteModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-950/30 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Upload / Add Quotation</span>
        </button>
      </div>

      {/* Missing Inclusions / Risk Checklist Notice */}
      {comparisonData?.missing_inclusions_warning?.length > 0 && (
        <div className="p-4 rounded-xl bg-[#1C2541]/70 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-semibold text-white mb-1">
              Vendor Contract Due Diligence Warnings ({selectedCategory})
            </h4>
            <ul className="list-disc list-inside space-y-0.5 text-slate-300">
              {comparisonData.missing_inclusions_warning.map((w: string, idx: number) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Cards */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Comparing quotations...</div>
      ) : comparisonData?.comparison_items?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {comparisonData.comparison_items.map((quote: any) => {
            const isRec = quote.is_recommended;
            return (
              <div
                key={quote.quotation_id}
                className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                  isRec
                    ? "bg-gradient-to-b from-[#1C2541] to-[#0A1128] border-teal-500/50 shadow-2xl shadow-teal-950/30 ring-1 ring-teal-500/20"
                    : "bg-[#1C2541]/80 border-white/10"
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-slate-300">
                      {quote.category} Proposal
                    </span>

                    <div className="flex items-center gap-2">
                      {isRec && (
                        <span className="px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          AI Recommended
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        quote.risk_score === 'Low'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          : quote.risk_score === 'Medium'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                      }`}>
                        {quote.risk_score} Risk Score
                      </span>
                    </div>
                  </div>

                  {/* Vendor Name & Quoted Total */}
                  <h3 className="text-lg font-bold text-white mb-1">{quote.vendor_name}</h3>
                  <div className="text-2xl font-extrabold text-white mb-4">
                    ₹{quote.quoted_rupees.toLocaleString('en-IN')}
                    {event?.guest_count > 0 && selectedCategory === "Catering" && (
                      <span className="text-xs font-normal text-slate-400 ml-2">
                        (~₹{Math.round(quote.quoted_rupees / event.guest_count)}/guest for {event.guest_count} pax)
                      </span>
                    )}
                  </div>

                  {/* Commercial Terms Summary */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#0B132B]/80 border border-white/5 text-xs mb-4">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Advance Required:</span>
                      <span className={`font-semibold ${quote.advance_payment_percent > 40 ? 'text-amber-400' : 'text-slate-200'}`}>
                        {quote.advance_payment_percent}% upfront
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Cancellation Policy:</span>
                      <span className="text-slate-200 font-semibold truncate block">
                        {quote.cancellation_terms}
                      </span>
                    </div>
                  </div>

                  {/* Detected Contract Risks Alert Box */}
                  {quote.detected_risks?.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs mb-4 space-y-1">
                      <span className="font-semibold text-amber-400 text-[11px] block flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Contract Risk Analysis:
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-amber-200/90 text-[11px]">
                        {quote.detected_risks.map((r: string, idx: number) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Included Services */}
                  <div className="space-y-1.5 mb-4">
                    <span className="text-xs font-semibold text-slate-300 block uppercase tracking-wider text-[10px]">
                      Confirmed Inclusions ({quote.inclusions?.length || 0}):
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {quote.inclusions?.map((inc: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Excluded Services */}
                  {quote.exclusions?.length > 0 && (
                    <div className="space-y-1.5 mb-4">
                      <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider text-[10px]">
                        Crucial Exclusions ({quote.exclusions.length}):
                      </span>
                      <ul className="space-y-1 text-xs text-rose-300/90">
                        {quote.exclusions.map((exc: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                            <span>{exc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Status: <strong className="text-teal-300">Under Review</strong>
                  </span>
                  {isRec ? (
                    <span className="text-teal-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      Lowest Commercial Risk
                    </span>
                  ) : (
                    <span className="text-slate-400">Alternative Option</span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-[#1C2541]/50 border border-white/10 text-center text-slate-400">
          No quotations added yet for {selectedCategory}. Click &apos;Upload / Add Quotation&apos; above.
        </div>
      )}

      {/* Add Quotation Modal */}
      {showAddQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#1C2541] border border-white/10 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Add Vendor Quotation</h3>
            <form onSubmit={handleAddQuotationSubmit} className="space-y-3">
              
              <div>
                <label className="text-xs text-slate-300 block mb-1">Vendor / Firm Name</label>
                <input
                  type="text"
                  required
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. Mahalakshmi Banquet & Caterers"
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Total Quoted Amount (₹ INR)</label>
                  <input
                    type="number"
                    required
                    value={quoteAmountRupees}
                    onChange={(e) => setQuoteAmountRupees(e.target.value)}
                    placeholder="e.g. 520000"
                    className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Advance Required (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={advancePercent}
                    onChange={(e) => setAdvancePercent(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Cancellation Terms</label>
                <input
                  type="text"
                  value={cancellationTerms}
                  onChange={(e) => setCancellationTerms(e.target.value)}
                  placeholder="e.g. 50% refund if cancelled 30 days prior"
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Included Services (1 per line)</label>
                <textarea
                  rows={3}
                  value={inclusionsText}
                  onChange={(e) => setInclusionsText(e.target.value)}
                  placeholder="Pure Veg Lunch Buffet&#10;Welcome Drinks&#10;Crockery & Waiters"
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Exclusions (1 per line)</label>
                <textarea
                  rows={2}
                  value={exclusionsText}
                  onChange={(e) => setExclusionsText(e.target.value)}
                  placeholder="Mineral water bottles&#10;Overtime charges"
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddQuoteModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0B132B] hover:bg-[#243054] text-xs text-slate-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs text-white font-semibold transition-colors"
                >
                  Save & Compare
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
