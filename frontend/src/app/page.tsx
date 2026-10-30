"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { LandingHero } from "@/components/LandingHero";
import { DashboardView } from "@/components/DashboardView";
import { AIPlanningWorkspace } from "@/components/AIPlanningWorkspace";
import { BudgetManagerView } from "@/components/BudgetManagerView";
import { TimelineTaskManagerView } from "@/components/TimelineTaskManagerView";
import { VendorComparisonView } from "@/components/VendorComparisonView";
import { PersonalizedIdeasExplorer } from "@/components/PersonalizedIdeasExplorer";
import { ApprovalsView } from "@/components/ApprovalsView";
import { SettingsView } from "@/components/SettingsView";
import { EventCreationWizard } from "@/components/EventCreationWizard";
import { PrintableEventBlueprint } from "@/components/PrintableEventBlueprint";
import { api } from "@/lib/api";

export default function CelestiaMainPage() {
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [plan, setPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCreateWizard, setShowCreateWizard] = useState<boolean>(false);

  // Load initial data
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const events = await api.getEvents();
      setEventsList(events);
      if (events && events.length > 0) {
        const primaryEvent = events[0];
        setActiveEvent(primaryEvent);
        await fetchEventDetails(primaryEvent.id);
      }
    } catch (err) {
      console.error("Error loading events", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEventDetails = async (eventId: string) => {
    try {
      const [bSummary, tList, aList, logs, planData] = await Promise.all([
        api.getBudgetSummary(eventId).catch(() => null),
        api.getTasks(eventId).catch(() => []),
        api.getApprovals(eventId).catch(() => []),
        api.getActivityLogs(eventId).catch(() => []),
        api.getPlan(eventId).catch(() => null),
      ]);
      setBudgetSummary(bSummary);
      setTasks(tList || []);
      setApprovals(aList || []);
      setActivityLogs(logs || []);
      setPlan(planData);
    } catch (err) {
      console.error("Error fetching event details", err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleRefresh = async () => {
    if (activeEvent) {
      const refreshedEvent = await api.getEvent(activeEvent.id);
      setActiveEvent(refreshedEvent);
      await fetchEventDetails(activeEvent.id);
    }
  };

  const handleToggleAiPause = async () => {
    if (!activeEvent) return;
    try {
      const updated = await api.updateEvent(activeEvent.id, {
        ai_paused: !activeEvent.ai_paused
      });
      setActiveEvent(updated);
      handleRefresh();
    } catch (err: any) {
      alert(`Error toggling AI pause: ${err.message}`);
    }
  };

  const handleLoadPrimaryScenario = async () => {
    // Find or create Mumbai Wedding
    const existing = eventsList.find(e => e.title.includes("Anjali") || e.title.includes("Mumbai"));
    if (existing) {
      setActiveEvent(existing);
      await fetchEventDetails(existing.id);
      setCurrentTab("dashboard");
    } else {
      handleSelectPreset("wedding");
    }
  };

  const handleSelectPreset = async (presetKey: string) => {
    setIsLoading(true);
    try {
      let payload: any = {};
      if (presetKey === "wedding") {
        payload = {
          title: "Anjali & Rahul's Royal Mumbai Wedding",
          event_type: "wedding",
          city: "Mumbai",
          guest_count: 300,
          budget_minor: 150000000,
          currency: "INR",
          preferences: {
            dietary: "Pure Vegetarian",
            theme: "Royal Marigold & Polished Brass",
            regional_culture: "Maharashtrian Traditional"
          }
        };
      } else if (presetKey === "birthday") {
        payload = {
          title: "Aarav's Starlight Carnival 1st Birthday",
          event_type: "birthday",
          city: "Mumbai",
          guest_count: 80,
          budget_minor: 35000000,
          currency: "INR",
          preferences: {
            dietary: "Vegetarian Buffet",
            theme: "Enchanted Starlight Carnival",
            regional_culture: "Contemporary Festive"
          }
        };
      } else {
        payload = {
          title: "Sanskriti Heritage Community Utsav",
          event_type: "community",
          city: "Mumbai",
          guest_count: 500,
          budget_minor: 80000000,
          currency: "INR",
          preferences: {
            dietary: "Community Mahaprasad Pure Veg",
            theme: "Sanskriti Heritage",
            regional_culture: "Traditional Folk"
          }
        };
      }

      const created = await api.createEvent(payload);
      setActiveEvent(created);
      await loadInitialData();
      setCurrentTab("dashboard");
    } catch (err: any) {
      alert(`Error creating preset: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNaturalLanguageSubmit = async (prompt: string) => {
    setIsLoading(true);
    try {
      const extracted = await api.extractRequirements(prompt);
      const budgetMinor = Math.round(extracted.budget_rupees * 100);
      const created = await api.createEvent({
        title: extracted.title,
        event_type: extracted.event_type,
        city: extracted.city,
        guest_count: extracted.guest_count,
        budget_minor: budgetMinor,
        currency: "INR",
        preparation_months: extracted.preparation_months,
        preferences: {
          dietary: extracted.dietary,
          theme: extracted.theme,
          regional_culture: extracted.regional_culture,
          cultural_traditions: extracted.cultural_traditions
        }
      });
      setActiveEvent(created);
      await loadInitialData();
      setCurrentTab("dashboard");
    } catch (err: any) {
      alert(`Error processing plan: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!activeEvent || !confirm(`Are you sure you want to delete ${activeEvent.title}?`)) return;
    try {
      await api.deleteEvent(activeEvent.id);
      await loadInitialData();
      setCurrentTab("dashboard");
    } catch (err: any) {
      alert(`Error deleting event: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] text-[#FAF7F2] flex flex-col font-sans">
      
      {/* Header Bar */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        event={activeEvent}
        onNewEvent={() => setShowCreateWizard(true)}
        onToggleAiPause={handleToggleAiPause}
        pendingApprovalsCount={approvals.filter(a => a.status === "pending").length}
      />

      {/* Hero Showcase (Always visible on dashboard tab) */}
      {currentTab === "dashboard" && (
        <LandingHero
          onLoadPrimaryScenario={handleLoadPrimaryScenario}
          onSelectPreset={handleSelectPreset}
          onNaturalLanguageSubmit={handleNaturalLanguageSubmit}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-400">
            <span className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></span>
            <span className="text-sm">Synchronizing CELESTIA Engine...</span>
          </div>
        ) : (
          <>
            {currentTab === "dashboard" && (
              <DashboardView
                event={activeEvent}
                budgetSummary={budgetSummary}
                tasks={tasks}
                approvals={approvals}
                onNavigate={(tab) => setCurrentTab(tab)}
                onOpenQuickSim={() => setCurrentTab("budget")}
              />
            )}

            {currentTab === "workspace" && (
              <AIPlanningWorkspace
                event={activeEvent}
                plan={plan}
                onRefreshData={handleRefresh}
                onNavigateToApprovals={() => setCurrentTab("approvals")}
              />
            )}

            {currentTab === "ideas" && (
              <PersonalizedIdeasExplorer
                event={activeEvent}
                onRefreshData={handleRefresh}
              />
            )}

            {currentTab === "budget" && (
              <BudgetManagerView
                event={activeEvent}
                budgetSummary={budgetSummary}
                onRefreshData={handleRefresh}
                onNavigateToApprovals={() => setCurrentTab("approvals")}
              />
            )}

            {currentTab === "timeline" && (
              <TimelineTaskManagerView
                event={activeEvent}
                tasks={tasks}
                onRefreshData={handleRefresh}
              />
            )}

            {currentTab === "vendors" && (
              <VendorComparisonView
                event={activeEvent}
                onRefreshData={handleRefresh}
              />
            )}

            {currentTab === "approvals" && (
              <ApprovalsView
                event={activeEvent}
                approvals={approvals}
                activityLogs={activityLogs}
                onRefreshData={handleRefresh}
              />
            )}

            {currentTab === "settings" && (
              <SettingsView
                event={activeEvent}
                onRefreshData={handleRefresh}
                onDeleteEvent={handleDeleteEvent}
              />
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="no-print mt-auto py-6 border-t border-white/10 text-center text-xs text-slate-400 bg-[#0A1128]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-semibold text-slate-300">
            CELESTIA AI Event Planning Assistant V2.0
          </span>
          <span className="text-slate-500">
            Deterministic Budgeting • CPM Schedule • Cultural Intelligence • 3-Tier Autonomy
          </span>
          <span className="text-teal-400 font-medium">
            Active Mode: {activeEvent?.autonomy_mode || "Draft"}
          </span>
        </div>
      </footer>

      {/* Print Blueprint View (Only rendered during print) */}
      <PrintableEventBlueprint
        event={activeEvent}
        budgetSummary={budgetSummary}
        tasks={tasks}
      />

      {/* New Event Creation Wizard Modal */}
      <EventCreationWizard
        isOpen={showCreateWizard}
        onClose={() => setShowCreateWizard(false)}
        onEventCreated={(newEvent) => {
          setActiveEvent(newEvent);
          handleRefresh();
          setCurrentTab("dashboard");
        }}
      />

    </div>
  );
}
