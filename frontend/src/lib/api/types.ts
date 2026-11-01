import type { components, paths } from "./schema";

export type User = components["schemas"]["UserResponse"];
export type TokenResponse = components["schemas"]["Token"];

export type EventItem = components["schemas"]["EventResponse"];
export type EventOverview = components["schemas"]["EventOverviewResponse"];
export type EventCreateInput = Partial<components["schemas"]["EventCreate"]> &
  Pick<components["schemas"]["EventCreate"], "title">;
export type EventUpdateInput = components["schemas"]["EventUpdate"];
export type EventPreference = components["schemas"]["EventPreferenceResponse"];

export type BudgetSummary = components["schemas"]["BudgetSummaryResponse"];
export type BudgetCategory = components["schemas"]["BudgetCategoryResponse"];
export type BudgetCategoryCreateInput =
  Partial<components["schemas"]["BudgetCategoryCreate"]> &
    Pick<components["schemas"]["BudgetCategoryCreate"], "name">;
export type ExpenseItem = components["schemas"]["ExpenseResponse"];
export type ExpenseCreateInput =
  Partial<components["schemas"]["ExpenseCreate"]> &
    Pick<components["schemas"]["ExpenseCreate"], "name">;
export type ExpenseUpdateInput = components["schemas"]["ExpenseUpdate"];
export type WhatIfResponse = components["schemas"]["WhatIfSimulationResponse"];

export type TaskItem = components["schemas"]["TaskResponse"];
export type TaskCreateInput = Partial<components["schemas"]["TaskCreate"]> &
  Pick<components["schemas"]["TaskCreate"], "title">;
export type TaskUpdateInput = components["schemas"]["TaskUpdate"];

export type VendorItem = components["schemas"]["VendorResponse"];
export type VendorCreateInput = Partial<components["schemas"]["VendorCreate"]> &
  Pick<components["schemas"]["VendorCreate"], "name" | "category">;
export type QuotationItem = components["schemas"]["QuotationResponse"];
export type QuotationCreateInput =
  Partial<components["schemas"]["QuotationCreate"]> &
    Pick<components["schemas"]["QuotationCreate"], "quoted_amount_minor">;
export type VendorComparison =
  components["schemas"]["VendorComparisonResponse"];

export type ApprovalItem = components["schemas"]["ApprovalResponse"];
export type ActivityLogItem = components["schemas"]["ActivityLogResponse"];
export type IdeasResponse = components["schemas"]["PersonalizedIdeasResponse"];
export type PlanResponse = components["schemas"]["PlanGenerationResponse"];
export type ExtractedRequirement =
  components["schemas"]["ExtractedRequirement"];
