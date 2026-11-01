from typing import Dict, List, Any, Set, Tuple
from sqlalchemy.orm import Session
from ..models import Event, Task, TaskDependency

WEDDING_TASK_TEMPLATES = [
    # 6 Months Out (Day 180 -> 150)
    {"title": "Lock Banquet Venue in Suburban Mumbai", "category": "Venue", "milestone": "6 Months Out", "days": 180, "duration": 14, "priority": "critical", "assigned": "Rahul & Family", "dep_indices": []},
    {"title": "Finalize Muhurtham & Consult Family Pandit", "category": "Ceremony", "milestone": "6 Months Out", "days": 175, "duration": 5, "priority": "critical", "assigned": "Family Elders", "dep_indices": []},
    {"title": "Appoint Pure Vegetarian Caterer & Conduct Tasting", "category": "Catering", "milestone": "6 Months Out", "days": 165, "duration": 10, "priority": "critical", "assigned": "Anjali & Parents", "dep_indices": [0]},
    {"title": "Book Candid Photographer & Cinematic Film Crew", "category": "Photography", "milestone": "6 Months Out", "days": 160, "duration": 7, "priority": "high", "assigned": "Anjali & Rahul", "dep_indices": [0]},
    
    # 4 Months Out (Day 120 -> 90)
    {"title": "Mandap & Decor Concept Sign-off (Marigold Theme)", "category": "Decor", "milestone": "4 Months Out", "days": 120, "duration": 10, "priority": "high", "assigned": "Anjali", "dep_indices": [0]},
    {"title": "Select Bridal Paithani/Kanjeevaram & Groom Sherwani", "category": "Attire", "milestone": "4 Months Out", "days": 115, "duration": 14, "priority": "high", "assigned": "Anjali & Rahul", "dep_indices": []},
    {"title": "Book Live Shehnai, Dhol-Tasha & Sangeet DJ", "category": "Entertainment", "milestone": "4 Months Out", "days": 110, "duration": 7, "priority": "medium", "assigned": "Rahul", "dep_indices": [0]},
    
    # 3 Months Out (Day 90 -> 60)
    {"title": "Design Eco-Friendly Seed Paper Invitations", "category": "Invitations", "milestone": "3 Months Out", "days": 90, "duration": 10, "priority": "medium", "assigned": "Anjali", "dep_indices": [0, 1]},
    {"title": "Source Traditional Handcrafted Brass Return Gifts", "category": "Favors", "milestone": "3 Months Out", "days": 85, "duration": 14, "priority": "medium", "assigned": "Parents", "dep_indices": []},
    {"title": "Lock Pooja Samagri & Ritual Inventory with Pandit", "category": "Ceremony", "milestone": "3 Months Out", "days": 75, "duration": 5, "priority": "high", "assigned": "Family Elders", "dep_indices": [1]},
    
    # 2 Months Out (Day 60 -> 30)
    {"title": "Dispatch Digital & Physical Wedding Invites", "category": "Invitations", "milestone": "2 Months Out", "days": 60, "duration": 14, "priority": "high", "assigned": "Both Families", "dep_indices": [7]},
    {"title": "Acquire Sound & BMC Local Permits for Dhol-Tasha", "category": "Logistics", "milestone": "2 Months Out", "days": 55, "duration": 10, "priority": "critical", "assigned": "Wedding Planner", "dep_indices": [6]},
    {"title": "Finalize Mehendi Artist & Haldi Traditional Setup", "category": "Ceremony", "milestone": "2 Months Out", "days": 45, "duration": 7, "priority": "medium", "assigned": "Anjali", "dep_indices": [4]},
    
    # 1 Month Out (Day 30 -> 14)
    {"title": "Lock Final 300-Guest RSVP Tally with Caterer", "category": "Catering", "milestone": "1 Month Out", "days": 30, "duration": 5, "priority": "critical", "assigned": "Rahul", "dep_indices": [2, 10]},
    {"title": "Conduct Bridal Hair & Makeup Trial Session", "category": "Attire", "milestone": "1 Month Out", "days": 25, "duration": 3, "priority": "medium", "assigned": "Anjali", "dep_indices": [5]},
    {"title": "Banquet Seating & Stage Floorplan Verification", "category": "Venue", "milestone": "1 Month Out", "days": 20, "duration": 4, "priority": "high", "assigned": "Wedding Planner", "dep_indices": [0, 4, 13]},
    
    # 1-2 Weeks Out (Day 14 -> 1)
    {"title": "Final Venue Walkthrough & Electrical Load Inspection", "category": "Venue", "milestone": "2 Weeks Out", "days": 14, "duration": 2, "priority": "critical", "assigned": "Planner & Decorator", "dep_indices": [0, 4, 11]},
    {"title": "Assemble Return Gift Boxes & Welcome Kits", "category": "Favors", "milestone": "1 Week Out", "days": 7, "duration": 3, "priority": "medium", "assigned": "Family Volunteers", "dep_indices": [8, 13]},
    {"title": "Prepare Vendor Milestone Payment Envelopes", "category": "Logistics", "milestone": "3 Days Out", "days": 3, "duration": 1, "priority": "critical", "assigned": "Rahul & Parents", "dep_indices": [13, 16]},
    
    # Event Day (Day 0)
    {"title": "Morning Muhurtham Ceremony & Saat Phere Coordination", "category": "Ceremony", "milestone": "Wedding Day", "days": 0, "duration": 1, "priority": "critical", "assigned": "Pandit & Family", "dep_indices": [9, 16, 18]},
    {"title": "Supervise Pure Vegetarian Feast Service", "category": "Catering", "milestone": "Wedding Day", "days": 0, "duration": 1, "priority": "critical", "assigned": "Catering Manager", "dep_indices": [13, 16]}
]

def seed_event_tasks(db: Session, event: Event, auto_commit: bool = False):
    """Generates the full timeline checklist and dependencies for the event"""
    # Clear existing tasks
    db.query(Task).filter(Task.event_id == event.id).delete()
    
    created_tasks = []
    for item in WEDDING_TASK_TEMPLATES:
        t = Task(
            event_id=event.id,
            title=item["title"],
            description=f"Standard milestone task for {event.event_type.capitalize()} in {event.city}.",
            category=item["category"],
            milestone_name=item["milestone"],
            days_before_event=item["days"],
            duration_days=item["duration"],
            priority=item["priority"],
            status="pending",
            assigned_to=item["assigned"],
            is_critical=False
        )
        created_tasks.append(t)
        
    db.add_all(created_tasks)
    db.flush()
        
    # Wire dependencies based on index mapping
    deps = []
    for i, item in enumerate(WEDDING_TASK_TEMPLATES):
        current_task = created_tasks[i]
        for dep_idx in item["dep_indices"]:
            if dep_idx < len(created_tasks):
                deps.append(TaskDependency(
                    task_id=current_task.id,
                    depends_on_task_id=created_tasks[dep_idx].id
                ))
    db.add_all(deps)
    db.flush()
    
    # Run Critical Path Method calculation
    run_cpm_calculation(db, event.id, auto_commit=auto_commit)
    if auto_commit:
        db.commit()

def check_dependency_cycle(db: Session, event_id: str, task_id: str, depends_on_id: str) -> bool:
    """
    Returns True if adding dependency (task_id depends on depends_on_id) would introduce a cycle.
    In our execution graph: depends_on_id -> task_id.
    A cycle occurs if task_id can already reach depends_on_id.
    """
    if task_id == depends_on_id:
        return True

    deps = db.query(TaskDependency).join(Task, Task.id == TaskDependency.task_id).filter(
        Task.event_id == event_id
    ).all()

    adj: Dict[str, List[str]] = {}
    for d in deps:
        adj.setdefault(d.depends_on_task_id, []).append(d.task_id)

    visited = set()
    queue = [task_id]
    while queue:
        curr = queue.pop(0)
        if curr == depends_on_id:
            return True
        if curr not in visited:
            visited.add(curr)
            for neighbor in adj.get(curr, []):
                if neighbor not in visited:
                    queue.append(neighbor)
    return False

def run_cpm_calculation(db: Session, event_id: str, auto_commit: bool = True) -> Dict[str, Any]:
    """
    Computes Early Start (ES), Early Finish (EF), Late Start (LS), Late Finish (LF),
    Total Slack (Float), and flags the Critical Path for all tasks using standard CPM algorithms.
    Includes cycle detection.
    """
    tasks = db.query(Task).filter(Task.event_id == event_id).all()
    if not tasks:
        return {"total_duration_days": 0, "critical_path_task_ids": [], "tasks": []}
        
    task_map = {t.id: t for t in tasks}
    
    # Build adjacency lists
    # dependencies: task -> list of tasks it depends on (predecessors)
    # dependents: task -> list of tasks that depend on it (successors)
    predecessors: Dict[str, List[str]] = {t.id: [] for t in tasks}
    successors: Dict[str, List[str]] = {t.id: [] for t in tasks}
    
    deps = db.query(TaskDependency).filter(
        TaskDependency.task_id.in_(task_map.keys())
    ).all()
    
    for d in deps:
        if d.task_id in task_map and d.depends_on_task_id in task_map:
            predecessors[d.task_id].append(d.depends_on_task_id)
            successors[d.depends_on_task_id].append(d.task_id)
            
    # Topological Sort (Kahn's Algorithm) with cycle detection
    in_degree = {t_id: len(predecessors[t_id]) for t_id in task_map}
    queue = [t_id for t_id, deg in in_degree.items() if deg == 0]
    topological_order = []
    
    while queue:
        curr = queue.pop(0)
        topological_order.append(curr)
        for succ in successors[curr]:
            in_degree[succ] -= 1
            if in_degree[succ] == 0:
                queue.append(succ)
                
    # If cycle detected, raise ValueError
    if len(topological_order) < len(tasks):
        raise ValueError("Circular dependency detected in task graph")
        
    # --- FORWARD PASS: Early Start (ES) and Early Finish (EF) ---
    es: Dict[str, int] = {}
    ef: Dict[str, int] = {}
    
    for t_id in topological_order:
        t = task_map[t_id]
        if not predecessors[t_id]:
            es[t_id] = 0
        else:
            es[t_id] = max(ef[p_id] for p_id in predecessors[t_id])
        ef[t_id] = es[t_id] + max(1, t.duration_days)
        
    project_duration = max(ef.values()) if ef else 0
    
    # --- BACKWARD PASS: Late Finish (LF) and Late Start (LS) ---
    ls: Dict[str, int] = {}
    lf: Dict[str, int] = {}
    
    for t_id in reversed(topological_order):
        t = task_map[t_id]
        if not successors[t_id]:
            lf[t_id] = project_duration
        else:
            lf[t_id] = min(ls[s_id] for s_id in successors[t_id])
        ls[t_id] = lf[t_id] - max(1, t.duration_days)
        
    # --- SLACK & CRITICAL PATH ---
    critical_path_ids = []
    for t_id, t in task_map.items():
        slack = ls[t_id] - es[t_id]
        is_crit = (slack <= 0)
        
        t.early_start_day = es[t_id]
        t.early_finish_day = ef[t_id]
        t.late_start_day = ls[t_id]
        t.late_finish_day = lf[t_id]
        t.total_slack = slack
        t.is_critical = is_crit
        
        if is_crit:
            critical_path_ids.append(t_id)
            
    if auto_commit:
        db.commit()
    else:
        db.flush()
    
    return {
        "total_duration_days": project_duration,
        "critical_path_task_ids": critical_path_ids,
        "tasks": tasks
    }
