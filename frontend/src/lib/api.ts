const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

const TOKEN_KEY = "celestia_auth_token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function fetchJson(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
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

    if (response.status === 401 && typeof window !== "undefined") {
      // Token expired or invalid
      setAuthToken(null);
      window.dispatchEvent(new CustomEvent("celestia_auth_required"));
    }

    throw new Error(errorDetail);
  }
  return response.json();
}

export const api = {
  // Authentication
  login: async (email: string, password: string) => {
    const res = await fetchJson("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    if (res.access_token) setAuthToken(res.access_token);
    return res;
  },
  register: async (name: string, email: string, password: string) => {
    const res = await fetchJson("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
    if (res.access_token) setAuthToken(res.access_token);
    return res;
  },
  demoLogin: async () => {
    const res = await fetchJson("/auth/demo-login", {
      method: "POST"
    });
    if (res.access_token) setAuthToken(res.access_token);
    return res;
  },
  getMe: () => fetchJson("/auth/me"),
  logout: () => {
    setAuthToken(null);
  },

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
