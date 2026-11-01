# ADR 0003: Critical Path Method (CPM) Planning Engine with Topological Sort

## Status
Accepted

## Context
Event planning involves complex task dependency networks (e.g. Venue Booking -> Caterer Tasting -> Menu Selection -> Mandap Decor Setup -> Haldi Ceremony). Linear task lists fail to capture the true project duration, bottleneck milestones, or schedule slack. When milestones are delayed, organizers need to immediately understand which delays impact the final celebration date (critical path) and which have buffer time (float/slack).

## Decision
1. **Deterministic CPM Algorithm**:
   - The scheduling engine computes the Critical Path via a classic two-pass algorithm on a Directed Acyclic Graph (DAG):
     - **Forward Pass**: Computes Early Start ($ES$) and Early Finish ($EF$) using topological sorting:
       $$EF_i = ES_i + D_i$$
       $$ES_i = \max_{p \in \text{predecessors}(i)} (EF_p)$$
     - **Backward Pass**: Computes Late Start ($LS$) and Late Finish ($LF$) from the project finish date:
       $$LS_i = LF_i - D_i$$
       $$LF_i = \min_{s \in \text{successors}(i)} (LS_s)$$
     - **Total Float (Slack)**:
       $$\text{Slack}_i = LS_i - ES_i = LF_i - EF_i$$
2. **Critical Milestone Identification**:
   - Tasks with $\text{Slack} == 0$ form the Critical Path. Any slip on these tasks directly delays the event date.
3. **Graph Validation & Cycle Detection**:
   - The graph topology is checked for cycles (Kahn's algorithm) and disconnected components, guaranteeing termination with an informative error rather than infinite recursion.

## Consequences
- **Positive**: Exact mathematical schedule calculation, immediate visual highlighting of true bottleneck milestones, zero AI hallucination in execution timelines.
- **Negative**: Dynamic additions to task graphs require topological recalculation and persist-safe dependency IDs.
