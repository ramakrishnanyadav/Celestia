"use client";

import React, { useState } from "react";
import { Sparkles, Calendar, Users, DollarSign, ArrowRight, ShieldCheck, CheckCircle2, HeartHandshake, Compass, Layers } from "lucide-react";

interface LandingHeroProps {
  onLoadPrimaryScenario: () => void;
  onSelectPreset: (presetKey: string) => void;
  onNaturalLanguageSubmit: (prompt: string) => void;
}

export function LandingHero({
  onLoadPrimaryScenario,
  onSelectPreset,
  onNaturalLanguageSubmit,
}: LandingHeroProps) {
  const [prompt, setPrompt] = useState(
    "Organize a traditional Maharashtrian wedding in Mumbai for 300 guests with maximum budget of ₹15,00,000, 100% pure vegetarian catering, 6 months preparation, and Royal Marigold decor."
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setIsSubmitting(true);
    onNaturalLanguageSubmit(prompt);
  };

  return (
    <div className="relative overflow-hidden py-12 px-4 lg:px-8 bg-gradient-to-b from-[#0A1128] via-[#0B132B] to-[#1C2541]/40 border-b border-white/10">
      
      {/* Decorative ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/3 right-10 w-[400px] h-[250px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10 text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/80 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-6 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Next-Generation Celebration & Event Planning Engine</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
          Where Cultural Grandeur Meets <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-teal-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
            Deterministic Precision
          </span>
        </h1>

        <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-300 mb-8 leading-relaxed">
          CELESTIA transforms natural-language dreams into executable celebration blueprints. 
          Featuring zero-rounding integer financial ledgers, Critical Path (CPM) schedules, 
          authentic Indian cultural personalization, and a strict 3-tier autonomy model.
        </p>

        {/* Natural Language Prompt Input */}
        <div className="max-w-3xl mx-auto mb-10">
          <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row items-center gap-2 bg-[#1C2541]/90 backdrop-blur-md p-2 rounded-2xl border border-white/15 shadow-2xl shadow-navy-950/80">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your event (type, city, guests, budget, cultural preferences, theme)..."
              className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-900/40 whitespace-nowrap cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <span>Generate Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quick Launch Buttons for Pre-configured Scenarios */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 w-full sm:w-auto">
            Or test with verified presets:
          </span>

          <button
            onClick={onLoadPrimaryScenario}
            className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Primary Demo: Mumbai Wedding (300 Pax, ₹15L)</span>
          </button>

          <button
            onClick={() => onSelectPreset("birthday")}
            className="px-4 py-2 rounded-xl bg-[#1C2541] hover:bg-[#243054] border border-white/10 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Starlight Carnival Birthday (80 Pax, ₹3.5L)</span>
          </button>

          <button
            onClick={() => onSelectPreset("community")}
            className="px-4 py-2 rounded-xl bg-[#1C2541] hover:bg-[#243054] border border-white/10 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Heritage Community Utsav (500 Pax, ₹8L)</span>
          </button>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          
          <div className="p-4 rounded-xl bg-[#1C2541]/60 border border-white/10 hover:border-teal-500/40 transition-all">
            <div className="w-8 h-8 rounded-lg bg-teal-950 flex items-center justify-center text-teal-400 mb-3">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Deterministic Budgeting</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Integer minor unit precision in paise with variable per-guest recalculation and explicit 10% contingency reserve.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#1C2541]/60 border border-white/10 hover:border-teal-500/40 transition-all">
            <div className="w-8 h-8 rounded-lg bg-amber-950 flex items-center justify-center text-amber-400 mb-3">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Critical Path Method (CPM)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              DAG task dependency graphs with cycle detection, slack calculations, and automated critical path alerting.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#1C2541]/60 border border-white/10 hover:border-teal-500/40 transition-all">
            <div className="w-8 h-8 rounded-lg bg-teal-950 flex items-center justify-center text-teal-400 mb-3">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Cultural Nuance Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Non-stereotyped Indian wedding rituals (Maharashtrian, Gujarati, South Indian) with user-controlled tradition toggles.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#1C2541]/60 border border-white/10 hover:border-teal-500/40 transition-all">
            <div className="w-8 h-8 rounded-lg bg-amber-950 flex items-center justify-center text-amber-400 mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">3-Tier Autonomy Safety</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Suggest → Draft → Approve. AI proposes changes as reviewable diffs; host retains 100% final approval authority.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
