from collections import deque
from dataclasses import dataclass, field


@dataclass
class CPMNode:
    id: str
    duration_days: int
    depends_on_ids: list[str] = field(default_factory=list)

@dataclass
class CPMSchedule:
    early_start: int
    early_finish: int
    late_start: int
    late_finish: int
    slack: int
    is_critical: bool

@dataclass
class CPMResult:
    total_duration_days: int
    critical_path_ids: list[str]
    schedule: dict[str, CPMSchedule]
    has_cycle: bool
    topological_order: list[str] = field(default_factory=list)

def _build_predecessors_and_successors(
    nodes: list[CPMNode], node_map: dict[str, CPMNode]
) -> tuple[dict[str, list[str]], dict[str, list[str]]]:
    predecessors: dict[str, list[str]] = {n.id: [] for n in nodes}
    successors: dict[str, list[str]] = {n.id: [] for n in nodes}
    for n in nodes:
        for dep_id in n.depends_on_ids:
            if dep_id in node_map:
                predecessors[n.id].append(dep_id)
                successors[dep_id].append(n.id)
    return predecessors, successors

def _compute_topological_order(
    nodes: list[CPMNode],
    predecessors: dict[str, list[str]],
    successors: dict[str, list[str]]
) -> list[str]:
    in_degree = {n.id: len(predecessors[n.id]) for n in nodes}
    queue = deque([n.id for n in nodes if in_degree[n.id] == 0])
    topological_order: list[str] = []
    while queue:
        curr = queue.popleft()
        topological_order.append(curr)
        for succ in successors[curr]:
            in_degree[succ] -= 1
            if in_degree[succ] == 0:
                queue.append(succ)
    return topological_order

def _forward_pass(
    topological_order: list[str],
    node_map: dict[str, CPMNode],
    predecessors: dict[str, list[str]]
) -> tuple[dict[str, int], dict[str, int], int]:
    es: dict[str, int] = {}
    ef: dict[str, int] = {}
    for n_id in topological_order:
        duration = max(1, node_map[n_id].duration_days)
        es[n_id] = 0 if not predecessors[n_id] else max(ef[p_id] for p_id in predecessors[n_id])
        ef[n_id] = es[n_id] + duration
    total_duration = max(ef.values()) if ef else 0
    return es, ef, total_duration

def _backward_pass(
    topological_order: list[str],
    node_map: dict[str, CPMNode],
    successors: dict[str, list[str]],
    total_duration: int
) -> tuple[dict[str, int], dict[str, int]]:
    ls: dict[str, int] = {}
    lf: dict[str, int] = {}
    for n_id in reversed(topological_order):
        duration = max(1, node_map[n_id].duration_days)
        lf[n_id] = total_duration if not successors[n_id] else min(ls[s_id] for s_id in successors[n_id])
        ls[n_id] = lf[n_id] - duration
    return ls, lf

def _build_cpm_schedule(
    nodes: list[CPMNode],
    es: dict[str, int],
    ef: dict[str, int],
    ls: dict[str, int],
    lf: dict[str, int]
) -> tuple[list[str], dict[str, CPMSchedule]]:
    critical_path_ids: list[str] = []
    schedule: dict[str, CPMSchedule] = {}
    for n in nodes:
        n_id = n.id
        slack = ls[n_id] - es[n_id]
        is_crit = (slack <= 0)
        if is_crit:
            critical_path_ids.append(n_id)
        schedule[n_id] = CPMSchedule(
            early_start=es[n_id],
            early_finish=ef[n_id],
            late_start=ls[n_id],
            late_finish=lf[n_id],
            slack=slack,
            is_critical=is_crit
        )
    return critical_path_ids, schedule

def solve_cpm_pure(nodes: list[CPMNode]) -> CPMResult:
    """
    Pure Critical Path Method (CPM) solver.
    Operates solely on pure Python dataclasses without database or ORM dependencies.
    Performs cycle detection (Kahn's Algorithm), Forward Pass (ES/EF),
    and Backward Pass (LF/LS) to compute slack and identify critical path tasks.
    """
    if not nodes:
        return CPMResult(total_duration_days=0, critical_path_ids=[], schedule={}, has_cycle=False, topological_order=[])

    node_map = {n.id: n for n in nodes}
    predecessors, successors = _build_predecessors_and_successors(nodes, node_map)
    topological_order = _compute_topological_order(nodes, predecessors, successors)

    # Cycle Detection check
    if len(topological_order) < len(nodes):
        return CPMResult(total_duration_days=0, critical_path_ids=[], schedule={}, has_cycle=True, topological_order=[])

    es, ef, total_duration = _forward_pass(topological_order, node_map, predecessors)
    ls, lf = _backward_pass(topological_order, node_map, successors, total_duration)
    critical_path_ids, schedule = _build_cpm_schedule(nodes, es, ef, ls, lf)

    return CPMResult(
        total_duration_days=total_duration,
        critical_path_ids=critical_path_ids,
        schedule=schedule,
        has_cycle=False,
        topological_order=topological_order
    )

def check_cycle_on_add_edge(
    existing_edges: list[tuple[str, str]],
    new_edge: tuple[str, str]
) -> bool:
    """
    Checks if adding new_edge (u -> v) creates a cycle in a directed graph.
    In dependency semantics: if task B depends on task A, the execution flow is A -> B.
    A cycle occurs if B can already reach A via existing edges.
    Self-loops (A -> A) are immediate cycles.
    """
    from_node, to_node = new_edge
    if from_node == to_node:
        return True

    # Build adjacency list from existing edges
    adj: dict[str, list[str]] = {}
    for u, v in existing_edges:
        adj.setdefault(u, []).append(v)

    # Check if to_node can reach from_node
    visited: set[str] = set()
    queue = deque([to_node])

    while queue:
        curr = queue.popleft()
        if curr == from_node:
            return True
        if curr not in visited:
            visited.add(curr)
            for neighbor in adj.get(curr, []):
                if neighbor not in visited:
                    queue.append(neighbor)

    return False

