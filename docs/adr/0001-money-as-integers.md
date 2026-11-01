# ADR 0001: Money Stored and Calculated as Exact Integer Paise

## Status
Accepted

## Context
In financial ledgers and event planning budgets, floating-point arithmetic introduces IEEE-754 binary rounding errors (e.g. `0.1 + 0.2 = 0.30000000000000004`). In celebrations with thousands of line items, multi-tier taxations, per-guest variable scaling, and category allocations, float drift causes discrepancy between total budget ceilings, category allocations, contingency buffers, and actual expense sums.

## Decision
1. **Integer Minor Currency Units**:
   - All currency values across the database, backend business logic, validation schemas, and frontend state are represented strictly as **integer paise** (`budget_minor`, `allocated_amount_minor`, `actual_amount_minor`, `quoted_amount_minor`).
   - 1 INR = 100 paise.
2. **Allocation Basis Points**:
   - Category budget percentages are stored and calculated as integer basis points (bps) where 100.00% = 10,000 bps.
3. **Strict Formatting at Presentation Boundary**:
   - Integers are converted to human-readable strings only at the presentation boundary via `lib/money.ts` (`formatMoney`, `formatMoneyCompact`) using the `Intl.NumberFormat('en-IN')` standard with Indian Lakh/Crore grouping (e.g., `₹15,00,000.00` or `₹15.0L`).
   - Zero `toFixed` or float multiplication exists in business calculations.
4. **Reconciliation Guarantee**:
   - The reconciliation invariant `total_budget_minor == allocated_minor + contingency_reserve_minor + unallocated_minor` is mathematically verified down to exactly 1 paisa.

## Consequences
- **Positive**: 100% deterministic accounting, exact zero-drift reconciliation, audited financial integrity, no penny loss across what-if simulations.
- **Negative**: API consumers and UI forms must convert entered rupee values to paise via standard conversion utilities (`rupeesToPaise` / `paiseToRupees`).
