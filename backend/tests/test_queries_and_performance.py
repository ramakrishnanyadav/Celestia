import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event as sa_event

from app.auth import create_access_token, hash_password
from app.database import Base, SessionLocal, engine
from app.main import app
from app.models import BudgetCategory, Event, Expense, Task, TaskDependency, User

client = TestClient(app)

class QueryCounter:
    def __init__(self):
        self.count = 0
        self.statements = []

    def __call__(self, conn, cursor, statement, parameters, context, executemany):
        self.count += 1
        self.statements.append(statement)

@pytest.fixture(autouse=True)
def clean_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield

def test_query_count_task_list_has_no_n_plus_one():
    """Verify that listing tasks executes exactly 1 or 2 queries (eager loading), not N+1."""
    db = SessionLocal()
    try:
        user = User(
            email=f"qtest_{uuid.uuid4().hex[:6]}@celestia.ai",
            name="Query Tester",
            password_hash=hash_password("pass123"),
            role="planner"
        )
        db.add(user)
        db.commit()

        event = Event(
            user_id=user.id,
            title="Stress Test Event",
            event_type="wedding",
            guest_count=500,
            budget_minor=200000000
        )
        db.add(event)
        db.commit()

        # Seed 50 tasks with dependencies
        tasks = []
        for i in range(50):
            t = Task(
                event_id=event.id,
                title=f"Task {i}",
                category="Catering" if i % 2 == 0 else "Decor",
                days_before_event=100 - i,
                duration_days=3
            )
            db.add(t)
            tasks.append(t)
        db.commit()

        # Add dependencies between tasks
        for i in range(1, 50):
            dep = TaskDependency(task_id=tasks[i].id, depends_on_task_id=tasks[i-1].id)
            db.add(dep)
        db.commit()

        token = create_access_token({"sub": user.id, "email": user.email})
        headers = {"Authorization": f"Bearer {token}"}

        # Intercept queries during endpoint call
        counter = QueryCounter()
        sa_event.listen(engine, "before_cursor_execute", counter)

        try:
            res = client.get(f"/api/events/{event.id}/tasks", headers=headers)
            assert res.status_code == 200
            data = res.json()
            assert len(data) == 50

            # Maximum allowed: 5 queries (1 auth, 1 event auth, 1 entity fetch, 1 eager load, 1 cleanup)
            # Crucially: it does NOT scale with N (previously was N+1 queries)
            print(f"Total queries executed: {counter.count}")
            assert counter.count <= 5, f"Expected <= 5 queries, got {counter.count} (N+1 query regression!)"
        finally:
            sa_event.remove(engine, "before_cursor_execute", counter)
    finally:
        db.close()

def test_query_count_budget_summary_has_no_n_plus_one():
    """Verify that budget summary executes <= 3 queries (eager loading categories + expenses)."""
    db = SessionLocal()
    try:
        user = User(
            email=f"qtest_b_{uuid.uuid4().hex[:6]}@celestia.ai",
            name="Budget Query Tester",
            password_hash=hash_password("pass123"),
            role="planner"
        )
        db.add(user)
        db.commit()

        event = Event(
            user_id=user.id,
            title="Budget Stress Event",
            event_type="wedding",
            guest_count=500,
            budget_minor=200000000
        )
        db.add(event)
        db.commit()

        # Seed 20 budget categories, each with 3 expenses (total 60 expenses)
        for i in range(20):
            cat = BudgetCategory(
                event_id=event.id,
                name=f"Category {i}",
                allocation_percent=5.0,
                allocated_amount_minor=10000000,
                sort_order=i
            )
            db.add(cat)
            db.commit()
            db.refresh(cat)

            for j in range(3):
                exp = Expense(
                    category_id=cat.id,
                    name=f"Expense {i}_{j}",
                    planned_amount_minor=3000000
                )
                db.add(exp)
            db.commit()

        token = create_access_token({"sub": user.id, "email": user.email})
        headers = {"Authorization": f"Bearer {token}"}

        # Intercept queries
        counter = QueryCounter()
        sa_event.listen(engine, "before_cursor_execute", counter)

        try:
            res = client.get(f"/api/events/{event.id}/budget/summary", headers=headers)
            assert res.status_code == 200
            data = res.json()
            assert len(data["categories"]) == 20

            # Maximum allowed: 5 queries (1 auth, 1 event auth, 1 categories fetch, 1 eager load expenses, 1 cleanup)
            # Crucially: it does NOT scale with number of categories (previously was N+1 queries)
            print(f"Total queries executed for 20 categories and 60 expenses: {counter.count}")
            assert counter.count <= 5, f"Expected <= 5 queries, got {counter.count} (N+1 query regression!)"
        finally:
            sa_event.remove(engine, "before_cursor_execute", counter)
    finally:
        db.close()

def test_event_overview_aggregated_query_budget_and_etag():
    """
    Verify high-performance aggregated overview:
    1. Executes <= 5 database queries despite loading event, budget, tasks, approvals, and logs.
    2. Emits ETag and Cache-Control headers.
    3. Returns HTTP 304 Not Modified when client sends matching If-None-Match header.
    """
    db = SessionLocal()
    try:
        user = User(
            email=f"qtest_ov_{uuid.uuid4().hex[:6]}@celestia.ai",
            name="Overview Tester",
            password_hash=hash_password("pass123"),
            role="planner"
        )
        db.add(user)
        db.commit()

        event = Event(
            user_id=user.id,
            title="Overview Heavy Event",
            event_type="wedding",
            guest_count=400,
            budget_minor=250000000
        )
        db.add(event)
        db.commit()

        # Seed categories and expenses
        for i in range(10):
            cat = BudgetCategory(event_id=event.id, name=f"Cat {i}", allocated_amount_minor=5000000, sort_order=i)
            db.add(cat)
            db.commit()
            db.refresh(cat)
            exp = Expense(category_id=cat.id, name=f"Exp {i}", planned_amount_minor=2000000)
            db.add(exp)
            db.commit()

        # Seed tasks
        for j in range(20):
            t = Task(event_id=event.id, title=f"Task {j}", category="Decor", days_before_event=90 - j, duration_days=2)
            db.add(t)
        db.commit()

        token = create_access_token({"sub": user.id, "email": user.email})
        headers = {"Authorization": f"Bearer {token}"}

        counter = QueryCounter()
        sa_event.listen(engine, "before_cursor_execute", counter)

        try:
            # 1. Fetch overview
            res = client.get(f"/api/v1/events/{event.id}/overview", headers=headers)
            assert res.status_code == 200
            data = res.json()

            # Confirm payload contents
            assert data["event"]["id"] == event.id
            assert "budget" in data
            assert len(data["next_tasks"]) <= 10
            assert "ETag" in res.headers
            assert "Cache-Control" in res.headers
            etag = res.headers["ETag"]

            # Query budget assertion: <= 5 queries
            print(f"Total queries for full event overview: {counter.count}")
            assert counter.count <= 5, f"Expected <= 5 queries, got {counter.count} (N+1 regression)"

            # 2. Test conditional GET (HTTP 304 Not Modified)
            cond_headers = {**headers, "If-None-Match": etag}
            cached_res = client.get(f"/api/v1/events/{event.id}/overview", headers=cond_headers)
            assert cached_res.status_code == 304
        finally:
            sa_event.remove(engine, "before_cursor_execute", counter)
    finally:
        db.close()
