/**
 * CELESTIA Typed API Layer
 * Replaces un-typed fetchJson with schema-driven, cookie-authenticated endpoints.
 */

import { apiClient } from "./api/client";
import type {
  User,
  TokenResponse,
  EventItem,
  EventOverview,
  EventCreateInput,
  EventUpdateInput,
  EventPreference,
  BudgetSummary,
  BudgetCategory,
  BudgetCategoryCreateInput,
  ExpenseItem,
  ExpenseCreateInput,
  ExpenseUpdateInput,
  WhatIfResponse,
  TaskItem,
  TaskCreateInput,
  TaskUpdateInput,
  VendorItem,
  VendorCreateInput,
  QuotationItem,
  QuotationCreateInput,
  VendorComparison,
  ApprovalItem,
  ActivityLogItem,
  IdeasResponse,
  PlanResponse,
  ExtractedRequirement,
} from "./api/types";

export * from "./api/types";
export { apiClient, ApiError } from "./api/client";

export const api = {
  // Authentication
  login: (email: string, password: string) =>
    apiClient<TokenResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  register: (name: string, email: string, password: string) =>
    apiClient<TokenResponse>("/auth/register", {
      method: "POST",
      body: { name, email, password },
    }),

  demoLogin: () =>
    apiClient<TokenResponse>("/auth/demo-login", {
      method: "POST",
    }),

  getMe: () => apiClient<User>("/auth/me"),

  logout: () =>
    apiClient<{ message: string }>("/auth/logout", {
      method: "POST",
    }),

  // Events
  getEvents: () => apiClient<EventItem[]>("/events"),

  getEvent: (id: string) => apiClient<EventItem>(`/events/${id}`),

  getEventOverview: (id: string) =>
    apiClient<EventOverview>(`/v1/events/${id}/overview`),

  createEvent: (data: EventCreateInput) =>
    apiClient<EventItem>("/events", {
      method: "POST",
      body: data,
    }),

  updateEvent: (id: string, data: EventUpdateInput) =>
    apiClient<EventItem>(`/events/${id}`, {
      method: "PATCH",
      body: data,
    }),

  deleteEvent: (id: string) =>
    apiClient<{ message: string }>(`/events/${id}`, {
      method: "DELETE",
    }),

  getPreferences: (id: string) =>
    apiClient<EventPreference>(`/events/${id}/preferences`),

  updatePreferences: (id: string, data: Partial<EventPreference>) =>
    apiClient<EventPreference>(`/events/${id}/preferences`, {
      method: "PUT",
      body: data,
    }),

  getPlan: (id: string) => apiClient<PlanResponse>(`/events/${id}/plans`),

  // Budget
  getBudgetSummary: (id: string) =>
    apiClient<BudgetSummary>(`/events/${id}/budget/summary`),

  getCategories: (id: string) =>
    apiClient<BudgetCategory[]>(`/events/${id}/budget/categories`),

  addCategory: (id: string, data: BudgetCategoryCreateInput) =>
    apiClient<BudgetCategory>(`/events/${id}/budget/categories`, {
      method: "POST",
      body: data,
    }),

  addExpense: (id: string, categoryId: string, data: ExpenseCreateInput) =>
    apiClient<ExpenseItem>(
      `/events/${id}/budget/categories/${categoryId}/expenses`,
      {
        method: "POST",
        body: data,
      }
    ),

  updateExpense: (id: string, expenseId: string, data: ExpenseUpdateInput) =>
    apiClient<ExpenseItem>(`/events/${id}/budget/expenses/${expenseId}`, {
      method: "PATCH",
      body: data,
    }),

  deleteExpense: (id: string, expenseId: string) =>
    apiClient<{ message: string }>(
      `/events/${id}/budget/expenses/${expenseId}`,
      {
        method: "DELETE",
      }
    ),

  simulateWhatIf: (
    id: string,
    data: { simulated_guest_count: number; simulated_budget_minor?: number }
  ) =>
    apiClient<WhatIfResponse>(`/events/${id}/budget/what-if`, {
      method: "POST",
      body: data,
    }),

  // Tasks & CPM
  getTasks: (id: string) => apiClient<TaskItem[]>(`/events/${id}/tasks`),

  createTask: (id: string, data: TaskCreateInput) =>
    apiClient<TaskItem>(`/events/${id}/tasks`, {
      method: "POST",
      body: data,
    }),

  updateTask: (id: string, taskId: string, data: TaskUpdateInput) =>
    apiClient<TaskItem>(`/events/${id}/tasks/${taskId}`, {
      method: "PATCH",
      body: data,
    }),

  deleteTask: (id: string, taskId: string) =>
    apiClient<{ message: string }>(`/events/${id}/tasks/${taskId}`, {
      method: "DELETE",
    }),

  recalculateCPM: (id: string) =>
    apiClient<{ message: string; critical_path_length_days: number }>(
      `/events/${id}/tasks/cpm`,
      {
        method: "POST",
      }
    ),

  // Vendors & Quotations
  getVendors: (id: string) => apiClient<VendorItem[]>(`/events/${id}/vendors`),

  createVendor: (id: string, data: VendorCreateInput) =>
    apiClient<VendorItem>(`/events/${id}/vendors`, {
      method: "POST",
      body: data,
    }),

  addQuotation: (id: string, vendorId: string, data: QuotationCreateInput) =>
    apiClient<QuotationItem>(`/events/${id}/vendors/${vendorId}/quotations`, {
      method: "POST",
      body: data,
    }),

  compareVendors: (id: string, category: string = "Catering") =>
    apiClient<VendorComparison>(
      `/events/${id}/vendors/compare?category=${encodeURIComponent(category)}`
    ),

  // Approvals & Audit Log
  getApprovals: (id: string) =>
    apiClient<ApprovalItem[]>(`/events/${id}/approvals`),

  executeApproval: (
    id: string,
    proposalId: string,
    action: string,
    comment?: string
  ) =>
    apiClient<ApprovalItem>(`/events/${id}/approvals/${proposalId}/action`, {
      method: "POST",
      body: { action, comment },
    }),

  getActivityLogs: (id: string) =>
    apiClient<ActivityLogItem[]>(`/events/${id}/activity-logs`),

  // AI & Ideas
  extractRequirements: (naturalLanguagePrompt: string) =>
    apiClient<ExtractedRequirement>("/ai/extract-requirements", {
      method: "POST",
      body: { prompt: naturalLanguagePrompt },
    }),

  getIdeas: (id: string) => apiClient<IdeasResponse>(`/events/${id}/ai/ideas`),

  generatePlan: (id: string) =>
    apiClient<PlanResponse>(`/events/${id}/ai/generate-plan`, {
      method: "POST",
    }),

  sendAIChatCommand: (id: string, command: string) =>
    apiClient<{ response: string; proposal_created?: boolean }>(
      `/events/${id}/ai/command`,
      {
        method: "POST",
        body: { command },
      }
    ),
};
