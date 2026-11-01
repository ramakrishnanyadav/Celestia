import json
from pathlib import Path
from typing import Dict, List, Any, Set, Tuple
from sqlalchemy.orm import Session
from ..models import Event, Task, TaskDependency
from .cpm_solver import CPMNode, solve_cpm_pure, check_cycle_on_add_edge

TASKS_DATA_PATH = Path(__file__).parent.parent / "data" / "wedding_tasks_v1.json"

def _load_wedding_tasks() -> List[Dict[str, Any]]:
    try:
        with open(TASKS_DATA_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("tasks", [])
    except Exception:
        return [
            {"title": "Lock Banquet Venue in Suburban Mumbai", "category": "Venue", "milestone": "6 Months Out", "days": 180, "duration": 14, "priority": "critical", "assigned": "Rahul & Family", "dep_indices": []},
            {"title": "Finalize Muhurtham & Consult Family Pandit", "category": "Ceremony", "milestone": "6 Months Out", "days": 175, "duration": 5, "priority": "critical", "assigned": "Family Elders", "dep_indices": []},
            {"title": "Appoint Pure Vegetarian Caterer & Conduct Tasting", "category": "Catering", "milestone": "6 Months Out", "days": 165, "duration": 10, "priority": "critical", "assigned": "Anjali & Parents", "dep_indices": [0]},
            {"title": "Book Candid Photographer & Cinematic Film Crew", "category": "Photography", "milestone": "6 Months Out", "days": 160, "duration": 7, "priority": "high", "assigned": "Anjali & Rahul", "dep_indices": [0]},
            {"title": "Mandap & Decor Concept Sign-off (Marigold Theme)", "category": "Decor", "milestone": "4 Months Out", "days": 120, "duration": 10, "priority": "high", "assigned": "Anjali", "dep_indices": [0]},
            {"title": "Select Bridal Paithani/Kanjeevaram & Groom Sherwani", "category": "Attire", "milestone": "4 Months Out", "days": 115, "duration": 14, "priority": "high", "assigned": "Anjali & Rahul", "dep_indices": []},
            {"title": "Book Live Shehnai, Dhol-Tasha & Sangeet DJ", "category": "Entertainment", "milestone": "4 Months Out", "days": 110, "duration": 7, "priority": "medium", "assigned": "Rahul", "dep_indices": [0]},
            {"title": "Design Eco-Friendly Seed Paper Invitations", "category": "Invitations", "milestone": "3 Months Out", "days": 90, "duration": 10, "priority": "medium", "assigned": "Anjali", "dep_indices": [0, 1]},
            {"title": "Source Traditional Handcrafted Brass Return Gifts", "category": "Favors", "milestone": "3 Months Out", "days": 85, "duration": 14, "priority": "medium", "assigned": "Parents", "dep_indices": []},
            {"title": "Lock Pooja Samagri & Ritual Inventory with Pandit", "category": "Ceremony", "milestone": "3 Months Out", "days": 75, "duration": 5, "priority": "high", "assigned": "Family Elders", "dep_indices": [1]},
            {"title": "Dispatch Digital & Physical Wedding Invites", "category": "Invitations", "milestone": "2 Months Out", "days": 60, "duration": 14, "priority": "high", "assigned": "Both Families", "dep_indices": [7]},
            {"title": "Acquire Sound & BMC Local Permits for Dhol-Tasha", "category": "Logistics", "milestone": "2 Months Out", "days": 55, "duration": 10, "priority": "critical", "assigned": "Wedding Planner", "dep_indices": [6]},
            {"title": "Finalize Mehendi Artist & Haldi Traditional Setup", "category": "Ceremony", "milestone": "2 Months Out", "days": 45, "duration": 7, "priority": "medium", "assigned": "Anjali", "dep_indices": [4]},
            {"title": "Lock Final 300-Guest RSVP Tally with Caterer", "category": "Catering", "milestone": "1 Month Out", "days": 30, "duration": 5, "priority": "critical", "assigned": "Rahul", "dep_indices": [2, 10]},
            {"title": "Conduct Bridal Hair & Makeup Trial Session", "category": "Attire", "milestone": "1 Month Out", "days": 25, "duration": 3, "priority": "medium", "assigned": "Anjali", "dep_indices": [5]},
            {"title": "Banquet Seating & Stage Floorplan Verification", "category": "Venue", "milestone": "1 Month Out", "days": 20, "duration": 4, "priority": "high", "assigned": "Wedding Planner", "dep_indices": [0, 4, 13]},
            {"title": "Final Venue Walkthrough & Electrical Load Inspection", "category": "Venue", "milestone": "2 Weeks Out", "days": 14, "duration": 2, "priority": "critical", "assigned": "Planner & Decorator", "dep_indices": [0, 4, 11]},
            {"title": "Assemble Return Gift Boxes & Welcome Kits", "category": "Favors", "milestone": "1 Week Out", "days": 7, "duration": 3, "priority": "medium", "assigned": "Family Volunteers", "dep_indices": [8, 13]},
            {"title": "Prepare Vendor Milestone Payment Envelopes", "category": "Logistics", "milestone": "3 Days Out", "days": 3, "duration": 1, "priority": "critical", "assigned": "Rahul & Parents", "dep_indices": [13, 16]},
            {"title": "Morning Muhurtham Ceremony & Saat Phere Coordination", "category": "Ceremony", "milestone": "Wedding Day", "days": 0, "duration": 1, "priority": "critical", "assigned": "Pandit & Family", "dep_indices": [9, 16, 18]},
            {"title": "Supervise Pure Vegetarian Feast Service", "category": "Catering", "milestone": "Wedding Day", "days": 0, "duration": 1, "priority": "critical", "assigned": "Catering Manager", "dep_indices": [13, 16]}
        ]

WEDDING_TASK_TEMPLATES = _load_wedding_tasks()

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
    Delegates to the pure cpm_solver check_cycle_on_add_edge.
    """
    if task_id == depends_on_id:
        return True

    deps = db.query(TaskDependency).join(Task, Task.id == TaskDependency.task_id).filter(
        Task.event_id == event_id
    ).all()

    existing_edges = [(d.depends_on_task_id, d.task_id) for d in deps]
    return check_cycle_on_add_edge(existing_edges, new_edge=(depends_on_id, task_id))

def run_cpm_calculation(db: Session, event_id: str, auto_commit: bool = True) -> Dict[str, Any]:
    """
    Computes Early Start (ES), Early Finish (EF), Late Start (LS), Late Finish (LF),
    Total Slack (Float), and flags the Critical Path for all tasks.
    Delegates the graph algorithm entirely to the pure cpm_solver.
    """
    tasks = db.query(Task).filter(Task.event_id == event_id).all()
    if not tasks:
        return {"total_duration_days": 0, "critical_path_task_ids": [], "tasks": []}
        
    task_map = {t.id: t for t in tasks}
    
    deps = db.query(TaskDependency).filter(
        TaskDependency.task_id.in_(task_map.keys())
    ).all()
    
    predecessors: Dict[str, List[str]] = {t.id: [] for t in tasks}
    for d in deps:
        if d.task_id in task_map and d.depends_on_task_id in task_map:
            predecessors[d.task_id].append(d.depends_on_task_id)

    # Build pure CPMNode objects
    cpm_nodes = [
        CPMNode(
            id=t.id,
            duration_days=t.duration_days,
            depends_on_ids=predecessors[t.id]
        )
        for t in tasks
    ]

    # Execute pure CPM solver
    cpm_res = solve_cpm_pure(cpm_nodes)
    if cpm_res.has_cycle:
        raise ValueError("Circular dependency detected in task graph")

    # Update task models from pure schedule result
    for t_id, sched in cpm_res.schedule.items():
        t = task_map[t_id]
        t.early_start_day = sched.early_start
        t.early_finish_day = sched.early_finish
        t.late_start_day = sched.late_start
        t.late_finish_day = sched.late_finish
        t.total_slack = sched.slack
        t.is_critical = sched.is_critical
            
    if auto_commit:
        db.commit()
    else:
        db.flush()
    
    return {
        "total_duration_days": cpm_res.total_duration_days,
        "critical_path_task_ids": cpm_res.critical_path_ids,
        "tasks": tasks
    }
