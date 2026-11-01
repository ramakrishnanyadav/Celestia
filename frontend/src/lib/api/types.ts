import type { components, paths } from "./schema";

export type User = components["schemas"]["UserResponse"];
export type TokenResponse = components["schemas"]["Token"];

export type EventItem = components["schemas"]["EventResponse"];
export type EventOverview = components["schemas"]["EventOverviewResponse"];
export type EventCreateInput = components["schemas"]["EventCreate"];
export type EventUpdateInput = components["schemas"]["EventUpdate"];
export type EventPreference = components["schemas"]["EventPreferenceResponse"];

export type BudgetSummary = components["schemas"]["BudgetSummaryResponse"];
export type BudgetCategory = components["schemas"]["BudgetCategoryResponse"];
export type BudgetCategoryCreateInput =
  components["schemas"]["BudgetCategoryCreate"];
export type ExpenseItem = components["schemas"]["ExpenseResponse"];
export type ExpenseCreateInput = components["schemas"]["ExpenseCreate"];
export type ExpenseUpdateInput = components["schemas"]["ExpenseUpdate"];
export type WhatIfResponse = components["schemas"]["WhatIfSimulationResponse"];

export type TaskItem = components["schemas"]["TaskResponse"];
export type TaskCreateInput = components["schemas"]["TaskCreate"];
export type TaskUpdateInput = components["schemas"]["TaskUpdate"];

export type VendorItem = components["schemas"]["VendorResponse"];
export type VendorCreateInput = components["schemas"]["VendorCreate"];
export type QuotationItem = components["schemas"]["QuotationResponse"];
export type QuotationCreateInput = components["schemas"]["QuotationCreate"];
export type VendorComparison =
  components["schemas"]["VendorComparisonResponse"];

export type ApprovalItem = components["schemas"]["ApprovalResponse"];
export type ActivityLogItem = components["schemas"]["ActivityLogResponse"];
export type IdeasResponse = components["schemas"]["PersonalizedIdeasResponse"];
export type PlanResponse = components["schemas"]["PlanGenerationResponse"];
export type ExtractedRequirement =
  components["schemas"]["ExtractedRequirement"];
