"use client";

import React, { useState } from "react";
import { Sparkles, Calendar, Users, DollarSign, X, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

interface EventCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: any) => void;
}

export function EventCreationWizard({
  isOpen,
  onClose,
  onEventCreated
}: EventCreationWizardProps) {
  const [activeTab, setActiveTab] = useState<"natural" | "guided">("natural");
  const [naturalPrompt, setNaturalPrompt] = useState(
    "Organize a traditional Maharashtrian wedding in Mumbai for 300 guests with maximum budget of ₹15,00,000, 100% vegetarian catering, 6-month preparation, and Royal Marigold decor."
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("Anjali & Rahul's Royal Mumbai Wedding");
  const [eventType, setEventType] = useState("wedding");
  const [city, setCity] = useState("Mumbai");
  const [venueType, setVenueType] = useState("Grand Banquet Hall");
  const [guestCount, setGuestCount] = useState(300);
  const [budgetRupees, setBudgetRupees] = useState(1500000);
  const [dietary, setDietary] = useState("Pure Vegetarian");
  const [theme, setTheme] = useState("Royal Marigold & Polished Brass");
  const [regionalCulture, setRegionalCulture] = useState("Maharashtrian Traditional");
  const [prepMonths, setPrepMonths] = useState(6);

  if (!isOpen) return null;

  const handleExtractFromNaturalLanguage = async () => {
    if (!naturalPrompt.trim()) return;
    setIsExtracting(true);
    try {
      const extracted = await api.extractRequirements(naturalPrompt);
      setTitle(extracted.title || "Custom Celebration");
      setEventType(extracted.event_type || "wedding");
      setCity(extracted.city || "Mumbai");
      setGuestCount(extracted.guest_count || 300);
      setBudgetRupees(extracted.budget_rupees || 1500000);
      setDietary(extracted.dietary || "Pure Vegetarian");
      setTheme(extracted.theme || "Royal Marigold & Polished Brass");
      setRegionalCulture(extracted.regional_culture || "Maharashtrian Traditional");
      setPrepMonths(extracted.preparation_months || 6);
      setActiveTab("guided"); // Switch to review & confirm
    } catch (err: any) {
      alert(`Extraction failed: ${err.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApplyPreset = (presetKey: string) => {
    if (presetKey === "wedding") {
      setTitle("Anjali & Rahul's Royal Mumbai Wedding");
      setEventType("wedding");
      setCity("Mumbai");
      setGuestCount(300);
      setBudgetRupees(1500000);
      setDietary("Pure Vegetarian");
      setTheme("Royal Marigold & Polished Brass");
      setRegionalCulture("Maharashtrian Traditional");
      setPrepMonths(6);
    } else if (presetKey === "birthday") {
      setTitle("Aarav's Starlight Carnival 1st Birthday");
      setEventType("birthday");
      setCity("Mumbai");
      setGuestCount(80);
      setBudgetRupees(350000);
      setDietary("Vegetarian Buffet");
      setTheme("Enchanted Starlight Carnival");
      setRegionalCulture("Contemporary Festive");
      setPrepMonths(2);
    } else if (presetKey === "community") {
      setTitle("Sanskriti Heritage Community Utsav");
      setEventType("community");
      setCity("Mumbai");
      setGuestCount(500);
      setBudgetRupees(800000);
      setDietary("Community Mahaprasad Pure Veg");
      setTheme("Sanskriti Heritage");
      setRegionalCulture("Traditional Folk");
      setPrepMonths(3);
    }
    setActiveTab("guided");
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const budgetMinor = Math.round(budgetRupees * 100);
      const newEvent = await api.createEvent({
        title,
        event_type: eventType,
        city,
        venue_type: venueType,
        guest_count: Number(guestCount),
        budget_minor: budgetMinor,
        currency: "INR",
        preparation_months: Number(prepMonths),
        autonomy_mode: "Draft",
        preferences: {
          dietary,
          theme,
          regional_culture: regionalCulture,
          cultural_traditions: ["Sakhar Puda", "Muhurtham", "Haldi", "Sangeet", "Satyanarayan Puja"],
          music_entertainment: "Traditional Shehnai & Dhol-Tasha + Modern Sangeet DJ"
        }
      });
      onEventCreated(newEvent);
      onClose();
    } catch (err: any) {
      alert(`Error creating event: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-[#1C2541] border border-white/10 p-6 md:p-8 shadow-2xl space-y-6 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-[#0B132B] hover:bg-[#243054] text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Wizard Header */}
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>CELESTIA Event Creation Engine</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">Create New Celebration Plan</h2>
          <p className="text-xs text-slate-300 mt-1">
            Generate an end-to-end event blueprint with deterministic budget, CPM schedule, and cultural ideas.
          </p>
        </div>

        {/* Creation Mode Tabs */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-[#0B132B] border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("natural")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "natural"
                ? "bg-teal-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Natural-Language AI Extraction
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("guided")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "guided"
                ? "bg-teal-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Structured Parameters & Presets
          </button>
        </div>

        {/* TAB 1: NATURAL LANGUAGE INPUT */}
        {activeTab === "natural" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-300 block mb-1 font-semibold">
                Describe your celebration naturally:
              </label>
              <textarea
                rows={4}
                value={naturalPrompt}
                onChange={(e) => setNaturalPrompt(e.target.value)}
                placeholder="e.g. Plan a traditional South Indian wedding in Bengaluru for 250 guests with budget ₹18L, pure veg catering, 6 months prep..."
                className="w-full p-3.5 rounded-2xl bg-[#0B132B] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-slate-400 items-center">
              <span>Quick Presets:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset("wedding")}
                className="px-2.5 py-1 rounded-lg bg-[#0B132B] hover:bg-[#243054] text-amber-300 border border-white/10 text-[11px] cursor-pointer"
              >
                Mumbai Wedding (300 Pax, ₹15L)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("birthday")}
                className="px-2.5 py-1 rounded-lg bg-[#0B132B] hover:bg-[#243054] text-slate-300 border border-white/10 text-[11px] cursor-pointer"
              >
                Birthday (80 Pax, ₹3.5L)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("community")}
                className="px-2.5 py-1 rounded-lg bg-[#0B132B] hover:bg-[#243054] text-slate-300 border border-white/10 text-[11px] cursor-pointer"
              >
                Community (500 Pax, ₹8L)
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleExtractFromNaturalLanguage}
                disabled={isExtracting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-lg shadow-teal-950/40 cursor-pointer"
              >
                {isExtracting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Extracting Requirements...</span>
                  </>
                ) : (
                  <>
                    <span>Extract & Review Parameters</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: GUIDED STRUCTURED FORM */}
        {activeTab === "guided" && (
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Celebration Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Event Category</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                >
                  <option value="wedding">Wedding Celebration</option>
                  <option value="birthday">Birthday Party</option>
                  <option value="community">Community / Cultural Gathering</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Host City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Venue Preference</label>
                <input
                  type="text"
                  value={venueType}
                  onChange={(e) => setVenueType(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Guest Count (Pax)</label>
                <input
                  type="number"
                  required
                  min="10"
                  max="5000"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Approved Budget Ceiling (₹ INR)</label>
                <input
                  type="number"
                  required
                  min="50000"
                  value={budgetRupees}
                  onChange={(e) => setBudgetRupees(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Dietary Requirement</label>
                <input
                  type="text"
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Theme Aesthetic</label>
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab("natural")}
                className="text-xs text-slate-400 hover:text-white"
              >
                Back to Natural Prompt
              </button>

              <button
                type="submit"
                disabled={isCreating}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-teal-950/40 cursor-pointer"
              >
                {isCreating ? "Generating Blueprint..." : "Generate Master Event Plan"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
