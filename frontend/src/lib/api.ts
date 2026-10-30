const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function fetchJson(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorDetail = "API request failed";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

export const api = {
  // Events
  getEvents: () => fetchJson("/events"),
  getEvent: (id: string) => fetchJson(`/events/${id}`),
  createEvent: (data: any) => fetchJson("/events", { method: "POST", body: JSON.stringify(data) }),
  updateEvent: (id: string, data: any) => fetchJson(`/events/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteEvent: (id: string) => fetchJson(`/events/${id}`, { method: "DELETE" }),
  getPreferences: (id: string) => fetchJson(`/events/${id}/preferences`),
  updatePreferences: (id: string, data: any) => fetchJson(`/events/${id}/preferences`, { method: "PUT", body: JSON.stringify(data) }),
  getPlan: (id: string) => fetchJson(`/events/${id}/plans`),

  // Budget
  getBudgetSummary: (id: string) => fetchJson(`/events/${id}/budget/summary`),
  addCategory: (id: string, data: any) => fetchJson(`/events/${id}/budget/categories`, { method: "POST", body: JSON.stringify(data) }),
  addExpense: (id: string, categoryId: string, data: any) => 
    fetchJson(`/events/${id}/budget/categories/${categoryId}/expenses`, { method: "POST", body: JSON.stringify(data) }),
  updateExpense: (id: string, expenseId: string, data: any) => 
    fetchJson(`/events/${id}/budget/expenses/${expenseId}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteExpense: (id: string, expenseId: string) => 
    fetchJson(`/events/${id}/budget/expenses/${expenseId}`, { method: "DELETE" }),
  simulateWhatIf: (id: string, data: { simulated_guest_count: number; simulated_budget_minor?: number }) => 
    fetchJson(`/events/${id}/budget/what-if`, { method: "POST", body: JSON.stringify(data) }),

  // Tasks & CPM
  getTasks: (id: string) => fetchJson(`/events/${id}/tasks`),
  createTask: (id: string, data: any) => fetchJson(`/events/${id}/tasks`, { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id: string, taskId: string, data: any) => fetchJson(`/events/${id}/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTask: (id: string, taskId: string) => fetchJson(`/events/${id}/tasks/${taskId}`, { method: "DELETE" }),
  recalculateCPM: (id: string) => fetchJson(`/events/${id}/tasks/cpm`, { method: "POST" }),

  // Vendors & Quotations
  getVendors: (id: string) => fetchJson(`/events/${id}/vendors`),
  createVendor: (id: string, data: any) => fetchJson(`/events/${id}/vendors`, { method: "POST", body: JSON.stringify(data) }),
  addQuotation: (id: string, vendorId: string, data: any) => 
    fetchJson(`/events/${id}/vendors/${vendorId}/quotations`, { method: "POST", body: JSON.stringify(data) }),
  compareVendors: (id: string, category: string = "Catering") => 
    fetchJson(`/events/${id}/vendors/compare?category=${encodeURIComponent(category)}`),

  // Approvals & Audit Log
  getApprovals: (id: string) => fetchJson(`/events/${id}/approvals`),
  executeApproval: (id: string, proposalId: string, action: string, comment?: string) => 
    fetchJson(`/events/${id}/approvals/${proposalId}/action`, { method: "POST", body: JSON.stringify({ action, comment }) }),
  getActivityLogs: (id: string) => fetchJson(`/events/${id}/activity-logs`),

  // AI & Ideas
  extractRequirements: (natural_language_prompt: string) => 
    fetchJson("/ai/extract-requirements", { method: "POST", body: JSON.stringify({ natural_language_prompt }) }),
  getIdeas: (id: string) => fetchJson(`/events/${id}/ai/ideas`),
  generatePlan: (id: string) => fetchJson(`/events/${id}/ai/generate-plan`, { method: "POST" }),
  sendAIChatCommand: (id: string, command: string) => 
    fetchJson(`/events/${id}/ai/command`, { method: "POST", body: JSON.stringify({ command }) }),
};
