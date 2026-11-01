"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type {
  EventItem,
  EventCreateInput,
  EventUpdateInput,
  BudgetSummary,
  BudgetCategory,
  BudgetCategoryCreateInput,
  ExpenseCreateInput,
  ExpenseUpdateInput,
  TaskItem,
  TaskCreateInput,
  TaskUpdateInput,
  VendorItem,
  VendorCreateInput,
  QuotationCreateInput,
  ApprovalItem,
  ActivityLogItem,
  User,
} from "../api/types";

// --- QUERY KEYS FACTORY ---
export const queryKeys = {
  currentUser: ["auth", "me"] as const,
  events: ["events"] as const,
  event: (id: string) => ["events", id] as const,
  budgetSummary: (eventId: string) =>
    ["events", eventId, "budget", "summary"] as const,
  budgetCategories: (eventId: string) =>
    ["events", eventId, "budget", "categories"] as const,
  tasks: (eventId: string) => ["events", eventId, "tasks"] as const,
  vendors: (eventId: string) => ["events", eventId, "vendors"] as const,
  approvals: (eventId: string) => ["events", eventId, "approvals"] as const,
  activityLogs: (eventId: string) =>
    ["events", eventId, "activity-logs"] as const,
  ideas: (eventId: string) => ["events", eventId, "ideas"] as const,
  plan: (eventId: string) => ["events", eventId, "plan"] as const,
};

// --- AUTH HOOKS ---
export function useCurrentUser() {
  return useQuery<User>({
    queryKey: queryKeys.currentUser,
    queryFn: () => api.getMe(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

// --- EVENT HOOKS ---
export function useEvents() {
  return useQuery<EventItem[]>({
    queryKey: queryKeys.events,
    queryFn: () => api.getEvents(),
  });
}

export function useEvent(eventId: string | null | undefined) {
  return useQuery<EventItem>({
    queryKey: queryKeys.event(eventId ?? ""),
    queryFn: () => api.getEvent(eventId!),
    enabled: Boolean(eventId),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EventCreateInput) => api.createEvent(data),
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
      queryClient.setQueryData(queryKeys.event(newEvent.id), newEvent);
    },
  });
}

export function useUpdateEvent(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EventUpdateInput) => api.updateEvent(eventId, data),
    onSuccess: (updatedEvent) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
      queryClient.setQueryData(queryKeys.event(eventId), updatedEvent);
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => api.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
    },
  });
}

// --- BUDGET HOOKS ---
export function useBudgetSummary(eventId: string | null | undefined) {
  return useQuery<BudgetSummary>({
    queryKey: queryKeys.budgetSummary(eventId ?? ""),
    queryFn: () => api.getBudgetSummary(eventId!),
    enabled: Boolean(eventId),
  });
}

export function useBudgetCategories(eventId: string | null | undefined) {
  return useQuery<BudgetCategory[]>({
    queryKey: queryKeys.budgetCategories(eventId ?? ""),
    queryFn: () => api.getCategories(eventId!),
    enabled: Boolean(eventId),
  });
}

export function useAddCategory(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BudgetCategoryCreateInput) =>
      api.addCategory(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.budgetSummary(eventId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.budgetCategories(eventId),
      });
    },
  });
}

export function useAddExpense(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      data,
    }: {
      categoryId: string;
      data: ExpenseCreateInput;
    }) => api.addExpense(eventId, categoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.budgetSummary(eventId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.budgetCategories(eventId),
      });
    },
  });
}

export function useUpdateExpense(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      expenseId,
      data,
    }: {
      expenseId: string;
      data: ExpenseUpdateInput;
    }) => api.updateExpense(eventId, expenseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.budgetSummary(eventId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.budgetCategories(eventId),
      });
    },
  });
}

export function useDeleteExpense(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) => api.deleteExpense(eventId, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.budgetSummary(eventId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.budgetCategories(eventId),
      });
    },
  });
}

// --- TASK & CPM HOOKS ---
export function useTasks(eventId: string | null | undefined) {
  return useQuery<TaskItem[]>({
    queryKey: queryKeys.tasks(eventId ?? ""),
    queryFn: () => api.getTasks(eventId!),
    enabled: Boolean(eventId),
  });
}

export function useCreateTask(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TaskCreateInput) => api.createTask(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(eventId) });
    },
  });
}

export function useUpdateTask(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: TaskUpdateInput }) =>
      api.updateTask(eventId, taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(eventId) });
    },
  });
}

export function useDeleteTask(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => api.deleteTask(eventId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(eventId) });
    },
  });
}

export function useRecalculateCPM(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.recalculateCPM(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(eventId) });
    },
  });
}

// --- VENDOR HOOKS ---
export function useVendors(eventId: string | null | undefined) {
  return useQuery<VendorItem[]>({
    queryKey: queryKeys.vendors(eventId ?? ""),
    queryFn: () => api.getVendors(eventId!),
    enabled: Boolean(eventId),
  });
}

export function useCreateVendor(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VendorCreateInput) => api.createVendor(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors(eventId) });
    },
  });
}

export function useAddQuotation(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      vendorId,
      data,
    }: {
      vendorId: string;
      data: QuotationCreateInput;
    }) => api.addQuotation(eventId, vendorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors(eventId) });
    },
  });
}

// --- APPROVALS HOOKS ---
export function useApprovals(eventId: string | null | undefined) {
  return useQuery<ApprovalItem[]>({
    queryKey: queryKeys.approvals(eventId ?? ""),
    queryFn: () => api.getApprovals(eventId!),
    enabled: Boolean(eventId),
  });
}

export function useExecuteApproval(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      proposalId,
      action,
      comment,
    }: {
      proposalId: string;
      action: string;
      comment?: string;
    }) => api.executeApproval(eventId, proposalId, action, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals(eventId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.budgetSummary(eventId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.budgetCategories(eventId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(eventId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.activityLogs(eventId),
      });
    },
  });
}

export function useActivityLogs(eventId: string | null | undefined) {
  return useQuery<ActivityLogItem[]>({
    queryKey: queryKeys.activityLogs(eventId ?? ""),
    queryFn: () => api.getActivityLogs(eventId!),
    enabled: Boolean(eventId),
  });
}
