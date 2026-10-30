"use client";

import React, { useState } from "react";
import { ShieldCheck, Pause, Play, Save, Trash2, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

interface SettingsViewProps {
  event: any;
  onRefreshData: () => void;
  onDeleteEvent: () => void;
}

export function SettingsView({
  event,
  onRefreshData,
  onDeleteEvent
}: SettingsViewProps) {
  const [autonomyMode, setAutonomyMode] = useState(event?.autonomy_mode || "Draft");
  const [aiPaused, setAiPaused] = useState(event?.ai_paused || false);
  const [title, setTitle] = useState(event?.title || "");
  const [city, setCity] = useState(event?.city || "Mumbai");
  const [venueType, setVenueType] = useState(event?.venue_type || "Banquet Hall");
  const [preparationMonths, setPreparationMonths] = useState(event?.preparation_months || 6);

  const [dietary, setDietary] = useState(event?.preference?.dietary || "Pure Vegetarian");
  const [theme, setTheme] = useState(event?.preference?.theme || "Royal Marigold & Polished Brass");
  const [regionalCulture, setRegionalCulture] = useState(event?.preference?.regional_culture || "Maharashtrian Traditional");

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setIsSaving(true);
    try {
      await api.updateEvent(event.id, {
        title,
        city,
        venue_type: venueType,
        preparation_months: Number(preparationMonths),
        autonomy_mode: autonomyMode,
        ai_paused: aiPaused
      });

      await api.updatePreferences(event.id, {
        dietary,
        theme,
        regional_culture: regionalCulture,
        cultural_traditions: event.preference?.cultural_traditions || []
      });

      alert("Settings saved successfully!");
      onRefreshData();
    } catch (err: any) {
      alert(`Error saving settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Configuration & Autonomy Permissions</h2>
        <p className="text-xs text-slate-400">
          Configure how CELESTIA interacts with your celebration plan and controls AI agent permissions.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Autonomy Level Card */}
        <div className="p-6 rounded-2xl bg-[#1C2541]/80 border border-white/10 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>AI Autonomy Model Permissions</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                mode: "Suggest",
                title: "1. Suggest (Advisory)",
                desc: "Recommendations and ideas only. AI generates zero persistent database changes."
              },
              {
                mode: "Draft",
                title: "2. Draft (Recommended)",
                desc: "Generates formal proposals with visual diffs. Requires host approval before modifying live plan."
              },
              {
                mode: "Approve",
                title: "3. Direct Staging",
                desc: "Stages changes into the review pipeline for immediate review with audit logs."
              }
            ].map((item) => (
              <div
                key={item.mode}
                onClick={() => setAutonomyMode(item.mode)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  autonomyMode === item.mode
                    ? "bg-teal-950/40 border-teal-500 shadow-md shadow-teal-950/20"
                    : "bg-[#0B132B]/60 border-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white">{item.title}</span>
                  {autonomyMode === item.mode && (
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* AI Automation Pause Switch */}
          <div className="p-4 rounded-xl bg-[#0B132B]/80 border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">AI Automation Circuit Breaker</span>
              <span className="text-[11px] text-slate-400">
                Immediately halts all AI background recommendations and proposals.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAiPaused(!aiPaused)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                aiPaused
                  ? "bg-amber-950 text-amber-300 border border-amber-600/40"
                  : "bg-teal-950 text-teal-300 border border-teal-600/40"
              }`}
            >
              {aiPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{aiPaused ? "AI is Paused" : "AI is Running"}</span>
            </button>
          </div>
        </div>

        {/* Event Details Form */}
        <div className="p-6 rounded-2xl bg-[#1C2541]/80 border border-white/10 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Event Specifications & Location
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 block mb-1">Celebration Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Host City</label>
              <input
                type="text"
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
              <label className="text-xs text-slate-300 block mb-1">Preparation Window (Months)</label>
              <input
                type="number"
                min="1"
                max="24"
                value={preparationMonths}
                onChange={(e) => setPreparationMonths(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Preferences Form */}
        <div className="p-6 rounded-2xl bg-[#1C2541]/80 border border-white/10 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Cultural & Aesthetic Profile
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div>
              <label className="text-xs text-slate-300 block mb-1">Regional Traditions Style</label>
              <input
                type="text"
                value={regionalCulture}
                onChange={(e) => setRegionalCulture(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Submit & Delete Bar */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onDeleteEvent}
            className="px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Event</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-teal-950/40 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save Preferences"}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
