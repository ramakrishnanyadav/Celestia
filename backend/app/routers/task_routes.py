from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session, selectinload
from ..database import get_db
from ..models import User, Event, Task, TaskDependency
from ..schemas import TaskCreate, TaskUpdate, TaskResponse, CPMResultResponse, TaskDependencyCreate
from ..auth import get_current_user
from ..engines.planning_intelligence import run_cpm_calculation, check_dependency_cycle
from ..idempotency import check_idempotency, record_idempotency

router = APIRouter(prefix="/events/{event_id}/tasks", tags=["Planning & Tasks"])

def enrich_task_response(task: Task) -> TaskResponse:
    res = TaskResponse.model_validate(task)
    res.depends_on_ids = [d.depends_on_task_id for d in task.dependencies]
    return res

@router.get("", response_model=List[TaskResponse])
def list_tasks(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    tasks = db.query(Task).options(selectinload(Task.dependencies)).filter(
        Task.event_id == event_id
    ).order_by(Task.days_before_event.desc()).all()
    return [enrich_task_response(t) for t in tasks]

@router.post("", response_model=TaskResponse)
def create_task(
    event_id: str,
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key")
):
    cached = check_idempotency(db, idempotency_key, current_user.id, f"create_task_{event_id}", task_in.model_dump())
    if cached:
        return cached[1]

    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    task = Task(
        event_id=event.id,
        title=task_in.title,
        description=task_in.description,
        category=task_in.category,
        milestone_name=task_in.milestone_name,
        days_before_event=task_in.days_before_event,
        duration_days=task_in.duration_days,
        priority=task_in.priority,
        status="pending",
        assigned_to=task_in.assigned_to
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    
    for dep_id in task_in.depends_on_ids:
        if dep_id == task.id or check_dependency_cycle(db, event.id, task.id, dep_id):
            db.delete(task)
            db.commit()
            raise HTTPException(status_code=400, detail="Circular dependency detected in task graph")
        dep = TaskDependency(task_id=task.id, depends_on_task_id=dep_id)
        db.add(dep)
        
    db.commit()
    
    # Recalculate CPM
    run_cpm_calculation(db, event.id)
    db.refresh(task)
    res = enrich_task_response(task)
    record_idempotency(db, idempotency_key, current_user.id, f"create_task_{event_id}", task_in.model_dump(), 200, res.model_dump(mode="json"))
    return res

@router.post("/{task_id}/dependencies", response_model=TaskResponse)
def add_task_dependency(
    event_id: str,
    task_id: str,
    dep_in: TaskDependencyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    task = db.query(Task).filter(Task.id == task_id, Task.event_id == event_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    dep_task = db.query(Task).filter(Task.id == dep_in.depends_on_task_id, Task.event_id == event_id).first()
    if not dep_task:
        raise HTTPException(status_code=404, detail="Prerequisite task not found")
        
    if task_id == dep_in.depends_on_task_id or check_dependency_cycle(db, event.id, task_id, dep_in.depends_on_task_id):
        raise HTTPException(status_code=400, detail="Circular dependency detected in task graph")
        
    existing = db.query(TaskDependency).filter(
        TaskDependency.task_id == task_id,
        TaskDependency.depends_on_task_id == dep_in.depends_on_task_id
    ).first()
    if not existing:
        dep = TaskDependency(task_id=task_id, depends_on_task_id=dep_in.depends_on_task_id)
        db.add(dep)
        db.commit()
        run_cpm_calculation(db, event.id)
        
    db.refresh(task)
    return enrich_task_response(task)

@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    event_id: str,
    task_id: str,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    task = db.query(Task).filter(Task.id == task_id, Task.event_id == event_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    data = task_in.model_dump(exclude_unset=True)
    if "expected_version" in data:
        data.pop("expected_version")
        if task.version != task_in.expected_version:
            raise HTTPException(
                status_code=409,
                detail=f"Conflict: Task was modified by another user (expected version {task_in.expected_version}, current version {task.version}). Please refresh and retry."
            )
        task.version += 1

    if data.get("status") == "completed" and task.status != "completed":
        task.completed_at = datetime.now(timezone.utc)
    elif data.get("status") == "pending":
        task.completed_at = None
        
    for k, v in data.items():
        setattr(task, k, v)
        
    db.commit()
    db.refresh(task)
    return enrich_task_response(task)

@router.delete("/{task_id}")
def delete_task(
    event_id: str,
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    task = db.query(Task).filter(Task.id == task_id, Task.event_id == event_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    db.delete(task)
    db.commit()
    run_cpm_calculation(db, event.id)
    return {"message": "Task deleted successfully"}

@router.post("/cpm", response_model=CPMResultResponse)
def recalculate_cpm(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    res = run_cpm_calculation(db, event.id)
    res["tasks"] = [enrich_task_response(t) for t in res["tasks"]]
    return res
