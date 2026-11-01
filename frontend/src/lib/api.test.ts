// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "./api";
import * as clientModule from "./api/client";

describe("Typed API Layer (api.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls auth endpoints", async () => {
    const spy = vi.spyOn(clientModule, "apiClient").mockResolvedValue({ ok: true } as never);

    await api.login("user@celestia.ai", "secret123");
    expect(spy).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: { email: "user@celestia.ai", password: "secret123" },
    });

    await api.register("Jane Doe", "jane@celestia.ai", "secret123");
    expect(spy).toHaveBeenCalledWith("/auth/register", {
      method: "POST",
      body: { name: "Jane Doe", email: "jane@celestia.ai", password: "secret123" },
    });

    await api.demoLogin();
    expect(spy).toHaveBeenCalledWith("/auth/demo-login", { method: "POST" });

    await api.getMe();
    expect(spy).toHaveBeenCalledWith("/auth/me");

    await api.logout();
    expect(spy).toHaveBeenCalledWith("/auth/logout", { method: "POST" });
  });

  it("calls event lifecycle, overview, preferences, and plans", async () => {
    const spy = vi.spyOn(clientModule, "apiClient").mockResolvedValue({ id: "evt-1" } as never);

    await api.getEvents();
    expect(spy).toHaveBeenCalledWith("/events");

    await api.getEvent("evt-1");
    expect(spy).toHaveBeenCalledWith("/events/evt-1");

    await api.getEventOverview("evt-1");
    expect(spy).toHaveBeenCalledWith("/v1/events/evt-1/overview");

    await api.createEvent({
      title: "Wedding",
      event_type: "wedding",
      city: "Udaipur",
      venue_type: "Palace",
      guest_count: 200,
      budget_minor: 50_000_000,
    });
    expect(spy).toHaveBeenCalledWith("/events", expect.objectContaining({ method: "POST" }));

    await api.updateEvent("evt-1", { guest_count: 250 });
    expect(spy).toHaveBeenCalledWith("/events/evt-1", expect.objectContaining({ method: "PATCH" }));

    await api.deleteEvent("evt-1");
    expect(spy).toHaveBeenCalledWith("/events/evt-1", { method: "DELETE" });

    await api.getPreferences("evt-1");
    expect(spy).toHaveBeenCalledWith("/events/evt-1/preferences");

    await api.updatePreferences("evt-1", { dietary: "Vegan" });
    expect(spy).toHaveBeenCalledWith("/events/evt-1/preferences", expect.objectContaining({ method: "PUT" }));

    await api.getPlan("evt-1");
    expect(spy).toHaveBeenCalledWith("/events/evt-1/plans");
  });

  it("calls budget, what-if, tasks, CPM, vendors, approvals, and AI endpoints", async () => {
    const spy = vi.spyOn(clientModule, "apiClient").mockResolvedValue({ ok: true } as never);

    await api.getBudgetSummary("evt-1");
    expect(spy).toHaveBeenCalledWith("/events/evt-1/budget/summary");

    await api.getCategories("evt-1");
    expect(spy).toHaveBeenCalledWith("/events/evt-1/budget/categories");

    await api.addCategory("evt-1", {
      name: "Decor",
      allocated_amount_minor: 100000,
    });
    expect(spy).toHaveBeenCalledWith("/events/evt-1/budget/categories", expect.objectContaining({ method: "POST" }));

    await api.addExpense("evt-1", "cat-1", {
      name: "Flowers",
      planned_amount_minor: 50000,
    });
    expect(spy).toHaveBeenCalledWith(
      "/events/evt-1/budget/categories/cat-1/expenses",
      expect.objectContaining({ method: "POST" })
    );

    await api.updateExpense("evt-1", "exp-1", { actual_amount_minor: 48000 });
    expect(spy).toHaveBeenCalledWith(
      "/events/evt-1/budget/expenses/exp-1",
      expect.objectContaining({ method: "PATCH" })
    );

    await api.deleteExpense("evt-1", "exp-1");
    expect(spy).toHaveBeenCalledWith("/events/evt-1/budget/expenses/exp-1", { method: "DELETE" });

    await api.simulateWhatIf("evt-1", { simulated_guest_count: 300 });
    expect(spy).toHaveBeenCalledWith("/events/evt-1/budget/what-if", expect.objectContaining({ method: "POST" }));

    await api.getTasks("evt-1");
    expect(spy).toHaveBeenCalledWith("/events/evt-1/tasks");

    await api.createTask("evt-1", {
      title: "Book pandit",
      category: "Ceremony",
      days_before_event: 30,
      duration_days: 1,
      priority: "high",
    });
    expect(spy).toHaveBeenCalledWith("/events/evt-1/tasks", expect.objectContaining({ method: "POST" }));

    await api.updateTask("evt-1", "task-1", { status: "completed" });
    expect(spy).toHaveBeenCalledWith("/events/evt-1/tasks/task-1", expect.objectContaining({ method: "PATCH" }));

    await api.deleteTask("evt-1", "task-1");
    expect(spy).toHaveBeenCalledWith("/events/evt-1/tasks/task-1", { method: "DELETE" });

    await api.recalculateCPM("evt-1");
    expect(spy).toHaveBeenCalledWith("/events/evt-1/tasks/cpm", expect.objectContaining({ method: "POST" }));

    await api.getVendors("evt-1");
    expect(spy).toHaveBeenCalledWith("/events/evt-1/vendors");

    await api.createVendor("evt-1", {
      name: "Sharma Caterers",
      category: "Catering",
    });
    expect(spy).toHaveBeenCalledWith("/events/evt-1/vendors", expect.objectContaining({ method: "POST" }));

    await api.addQuotation("evt-1", "vend-1", {
      quoted_amount_minor: 250000,
    });
    expect(spy).toHaveBeenCalledWith(
      "/events/evt-1/vendors/vend-1/quotations",
      expect.objectContaining({ method: "POST" })
    );

    await api.compareVendors("evt-1", "Catering");
    expect(spy).toHaveBeenCalledWith("/events/evt-1/vendors/compare?category=Catering");

    await api.getApprovals("evt-1");
    expect(spy).toHaveBeenCalledWith("/events/evt-1/approvals");

    await api.executeApproval("evt-1", "prop-1", "approve", "Approved");
    expect(spy).toHaveBeenCalledWith(
      "/events/evt-1/approvals/prop-1/action",
      expect.objectContaining({ method: "POST" })
    );

    await api.getActivityLogs("evt-1");
    expect(spy).toHaveBeenCalledWith("/events/evt-1/activity-logs");

    await api.extractRequirements("Beach wedding for 150 guests in Goa");
    expect(spy).toHaveBeenCalledWith("/ai/extract-requirements", expect.objectContaining({ method: "POST" }));

    await api.getIdeas("evt-1");
    expect(spy).toHaveBeenCalledWith("/events/evt-1/ai/ideas");

    await api.generatePlan("evt-1");
    expect(spy).toHaveBeenCalledWith("/events/evt-1/ai/generate-plan", expect.objectContaining({ method: "POST" }));

    await api.sendAIChatCommand("evt-1", "Optimize catering budget");
    expect(spy).toHaveBeenCalledWith("/events/evt-1/ai/command", expect.objectContaining({ method: "POST" }));
  });
});
