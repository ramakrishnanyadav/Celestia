from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..dependencies import get_event_for_user
from ..engines.planning_intelligence import check_dependency_cycle, run_cpm_calculation
from ..idempotency import check_idempotency, record_idempotency
from ..models import Event, Task, TaskDependency
from ..schemas import CPMResultResponse, TaskCreate, TaskDependencyCreate, TaskResponse, TaskUpdate

router = APIRouter(prefix="/events/{event_id}/tasks", tags=["Planning & Tasks"])

def enrich_task_response(task: Task) -> TaskResponse:
    res = TaskResponse.model_validate(task)
    res.depends_on_ids = [d.depends_on_task_id for d in task.dependencies]
    return res

@router.get("", response_model=list[TaskResponse])
def list_tasks(
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db)
):
    tasks = db.query(Task).options(selectinload(Task.dependencies)).filter(
        Task.event_id == event.id
    ).order_by(Task.days_before_event.desc()).all()
    return [enrich_task_response(t) for t in tasks]

@router.post("", response_model=TaskResponse)
def create_task(
    task_in: TaskCreate,
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db),
    idempotency_key: str | None = Header(None, alias="Idempotency-Key")
):
    cached = check_idempotency(db, idempotency_key, event.user_id, f"create_task_{event.id}", task_in.model_dump())
    if cached:
        return cached[1]

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
    record_idempotency(db, idempotency_key, event.user_id, f"create_task_{event.id}", task_in.model_dump(), 200, res.model_dump(mode="json"))
    return res

@router.post("/{task_id}/dependencies", response_model=TaskResponse)
def add_task_dependency(
    task_id: str,
    dep_in: TaskDependencyCreate,
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id, Task.event_id == event.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    dep_task = db.query(Task).filter(Task.id == dep_in.depends_on_task_id, Task.event_id == event.id).first()
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
    task_id: str,
    task_in: TaskUpdate,
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id, Task.event_id == event.id).first()
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
        task.completed_at = datetime.now(UTC)
    elif data.get("status") == "pending":
        task.completed_at = None

    for k, v in data.items():
        setattr(task, k, v)

    db.commit()
    db.refresh(task)
    return enrich_task_response(task)

@router.delete("/{task_id}")
def delete_task(
    task_id: str,
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id, Task.event_id == event.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    run_cpm_calculation(db, event.id)
    return {"message": "Task deleted successfully"}

@router.post("/cpm", response_model=CPMResultResponse)
def recalculate_cpm(
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db)
):
    res = run_cpm_calculation(db, event.id)
    res["tasks"] = [enrich_task_response(t) for t in res["tasks"]]
    return res
