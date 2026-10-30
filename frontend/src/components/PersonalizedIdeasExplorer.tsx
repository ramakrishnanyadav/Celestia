"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, HeartHandshake, Utensils, Music, Gift, 
  Leaf, DollarSign, CheckCircle2, Circle, ArrowRight
} from "lucide-react";
import { api } from "@/lib/api";

interface PersonalizedIdeasExplorerProps {
  event: any;
  onRefreshData: () => void;
}

export function PersonalizedIdeasExplorer({
  event,
  onRefreshData
}: PersonalizedIdeasExplorerProps) {
  const [ideas, setIdeas] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"themes" | "traditions" | "food" | "entertainment" | "savings">("themes");
  const [selectedTraditions, setSelectedTraditions] = useState<string[]>(
    event?.preference?.cultural_traditions || ["Sakhar Puda", "Muhurtham", "Haldi", "Sangeet", "Satyanarayan Puja"]
  );
  const [isSavingTraditions, setIsSavingTraditions] = useState(false);

  useEffect(() => {
    if (!event) return;
    setLoading(true);
    api.getIdeas(event.id)
      .then(res => setIdeas(res))
      .catch(err => console.error("Error loading ideas", err))
      .finally(() => setLoading(false));
  }, [event]);

  const toggleTradition = (name: string) => {
    setSelectedTraditions(prev => 
      prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
    );
  };

  const handleSaveTraditions = async () => {
    if (!event) return;
    setIsSavingTraditions(true);
    try {
      await api.updatePreferences(event.id, {
        cultural_traditions: selectedTraditions,
        dietary: event.preference?.dietary || "Pure Vegetarian",
        theme: event.preference?.theme || "Royal Marigold & Polished Brass",
        regional_culture: event.preference?.regional_culture || "Maharashtrian Traditional"
      });
      alert("Traditions updated successfully! CELESTIA timeline and catering specs adjusted.");
      onRefreshData();
    } catch (err: any) {
      alert(`Error updating traditions: ${err.message}`);
    } finally {
      setIsSavingTraditions(false);
    }
  };

  if (loading || !ideas) {
    return <div className="text-center py-12 text-slate-400">Synthesizing personalized celebration concepts...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Category Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("themes")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "themes"
              ? "bg-teal-600 text-white shadow-md shadow-teal-950/40"
              : "bg-[#1C2541] text-slate-300 hover:text-white hover:bg-[#243054]"
          }`}
        >
          Aesthetic Themes & Palettes
        </button>

        <button
          onClick={() => setActiveTab("traditions")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "traditions"
              ? "bg-teal-600 text-white shadow-md shadow-teal-950/40"
              : "bg-[#1C2541] text-slate-300 hover:text-white hover:bg-[#243054]"
          }`}
        >
          Customizable Traditions & Rituals
        </button>

        <button
          onClick={() => setActiveTab("food")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "food"
              ? "bg-teal-600 text-white shadow-md shadow-teal-950/40"
              : "bg-[#1C2541] text-slate-300 hover:text-white hover:bg-[#243054]"
          }`}
        >
          Pure Vegetarian Gourmet Feast
        </button>

        <button
          onClick={() => setActiveTab("entertainment")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "entertainment"
              ? "bg-teal-600 text-white shadow-md shadow-teal-950/40"
              : "bg-[#1C2541] text-slate-300 hover:text-white hover:bg-[#243054]"
          }`}
        >
          Entertainment & Return Gifts
        </button>

        <button
          onClick={() => setActiveTab("savings")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "savings"
              ? "bg-amber-600 text-white shadow-md shadow-amber-950/40"
              : "bg-[#1C2541] text-amber-300 hover:text-white hover:bg-[#243054]"
          }`}
        >
          Budget-Conscious Alternatives
        </button>
      </div>

      {/* TAB 1: THEMES & PALETTES */}
      {activeTab === "themes" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ideas.themes?.map((t: any) => (
            <div
              key={t.id}
              className="p-6 rounded-2xl bg-[#1C2541]/80 border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between shadow-xl"
            >
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-2">
                  {t.budget_tier}
                </span>
                <h3 className="text-base font-bold text-white mb-2">{t.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">{t.aesthetic}</p>

                {/* Color Palette Swatches */}
                <div className="space-y-1.5 mb-4">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                    Curated Color Palette
                  </span>
                  <div className="flex items-center gap-2">
                    {t.color_palette.map((color: string, i: number) => (
                      <span
                        key={i}
                        className="w-7 h-7 rounded-lg border border-white/20 shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span>Mood: <strong className="text-teal-300">{t.mood}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: CULTURAL TRADITIONS CHECKLIST */}
      {activeTab === "traditions" && (
        <div className="p-6 rounded-2xl bg-[#1C2541]/80 border border-white/10 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">
                Personalized Cultural Traditions & Rituals
              </h3>
              <p className="text-xs text-slate-300">
                CELESTIA never assumes religious or cultural practices. You can opt-in, customize, or exclude traditions below to tailor your timeline.
              </p>
            </div>
            <button
              onClick={handleSaveTraditions}
              disabled={isSavingTraditions}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-colors shadow-md cursor-pointer shrink-0"
            >
              {isSavingTraditions ? "Updating..." : "Save Selection to Plan"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ideas.cultural_traditions?.map((trad: any, idx: number) => {
              const isSelected = selectedTraditions.includes(trad.name);
              return (
                <div
                  key={idx}
                  onClick={() => toggleTradition(trad.name)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                    isSelected
                      ? "bg-teal-950/40 border-teal-500/50 shadow-md shadow-teal-950/20"
                      : "bg-[#0B132B]/60 border-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-teal-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xs font-bold text-white">{trad.name}</h4>
                      <span className="text-[10px] text-slate-400">({trad.typical_duration})</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{trad.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: PURE VEG GOURMET FEAST */}
      {activeTab === "food" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-teal-950/50 border border-teal-500/30 flex items-center justify-between text-xs">
            <span className="text-teal-300 font-semibold">
              Dietary Specification: 100% Pure Vegetarian Catering (Specialists in Maharashtrian & Regional Fusion)
            </span>
            <span className="text-slate-400">300 Guests Capacity</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ideas.food_and_menu?.map((menu: any, i: number) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-[#1C2541]/80 border border-white/10 shadow-xl space-y-3"
              >
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Utensils className="w-4 h-4" />
                  <span>{menu.session}</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-200">
                  {menu.highlight_dishes.map((dish: string, dIdx: number) => (
                    <li key={dIdx} className="p-2 rounded-lg bg-[#0B132B]/60 border border-white/5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0"></span>
                      <span>{dish}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ENTERTAINMENT & FAVORS */}
      {activeTab === "entertainment" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Entertainment */}
          <div className="p-6 rounded-2xl bg-[#1C2541]/80 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
              <Music className="w-4 h-4" />
              <span>Recommended Entertainment & Music</span>
            </div>
            <div className="space-y-3">
              {ideas.entertainment?.map((ent: any, i: number) => (
                <div key={i} className="p-3.5 rounded-xl bg-[#0B132B]/60 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <strong className="text-white">{ent.element}</strong>
                    <span className="text-amber-400 font-semibold">{ent.approx_cost}</span>
                  </div>
                  <span className="text-[10px] text-teal-300 block">{ent.timing}</span>
                  <p className="text-xs text-slate-300">{ent.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Return Gifts */}
          <div className="p-6 rounded-2xl bg-[#1C2541]/80 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Gift className="w-4 h-4" />
              <span>Traditional Return Gifts & Favors</span>
            </div>
            <div className="space-y-3">
              {ideas.return_gifts?.map((g: any, i: number) => (
                <div key={i} className="p-3.5 rounded-xl bg-[#0B132B]/60 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <strong className="text-white">{g.item}</strong>
                    <span className="text-teal-300 font-semibold">{g.estimated_unit_cost}</span>
                  </div>
                  <p className="text-xs text-slate-300">{g.meaning}</p>
                  <span className="text-[10px] text-slate-400 block">Recommended: {g.recommended_for}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BUDGET-CONSCIOUS ALTERNATIVES */}
      {activeTab === "savings" && (
        <div className="p-6 rounded-2xl bg-[#1C2541]/80 border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <DollarSign className="w-4 h-4" />
            <span>Intelligent Cost-Saving Strategies</span>
          </div>
          <p className="text-xs text-slate-300">
            Realize substantial budget optimization without sacrificing visual splendor or guest experience.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ideas.budget_conscious_alternatives?.map((alt: any, i: number) => (
              <div key={i} className="p-4 rounded-xl bg-[#0B132B]/80 border border-amber-500/30 space-y-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-xs">
                  {alt.savings}
                </span>
                <h4 className="text-xs font-bold text-white">{alt.strategy}</h4>
                <p className="text-xs text-slate-300">{alt.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
