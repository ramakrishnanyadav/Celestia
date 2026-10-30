import time
import os
import sqlite3
import statistics
import json
from datetime import datetime, timezone, timedelta

DB_FILE = "perf_benchmark.db"

def setup_benchmark_database():
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
        
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    
    # Create tables
    cur.executescript("""
    CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password_hash TEXT,
        name TEXT,
        role TEXT,
        created_at TEXT
    );
    CREATE TABLE events (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT,
        event_type TEXT,
        city TEXT,
        event_date TEXT,
        guest_count INTEGER,
        budget_minor INTEGER,
        currency TEXT,
        timezone TEXT,
        preparation_months INTEGER,
        status TEXT,
        autonomy_mode TEXT,
        ai_paused BOOLEAN,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE budget_categories (
        id TEXT PRIMARY KEY,
        event_id TEXT,
        name TEXT,
        allocation_percent REAL,
        allocated_amount_minor INTEGER,
        icon TEXT,
        is_per_guest BOOLEAN,
        per_guest_minor INTEGER,
        sort_order INTEGER,
        FOREIGN KEY (event_id) REFERENCES events(id)
    );
    CREATE TABLE expenses (
        id TEXT PRIMARY KEY,
        category_id TEXT,
        item_name TEXT,
        planned_amount_minor INTEGER,
        actual_amount_minor INTEGER,
        provenance TEXT,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (category_id) REFERENCES budget_categories(id)
    );
    CREATE TABLE tasks (
        id TEXT PRIMARY KEY,
        event_id TEXT,
        title TEXT,
        description TEXT,
        category TEXT,
        duration_days INTEGER,
        due_date TEXT,
        is_completed BOOLEAN,
        completed_at TEXT,
        is_critical BOOLEAN,
        early_start_day INTEGER,
        early_finish_day INTEGER,
        late_start_day INTEGER,
        late_finish_day INTEGER,
        total_slack INTEGER,
        provenance TEXT,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (event_id) REFERENCES events(id)
    );
    CREATE TABLE task_dependencies (
        id TEXT PRIMARY KEY,
        task_id TEXT,
        depends_on_task_id TEXT,
        dependency_type TEXT,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id)
    );
    CREATE TABLE quotations (
        id TEXT PRIMARY KEY,
        vendor_id TEXT,
        event_id TEXT,
        category TEXT,
        quoted_amount_minor INTEGER,
        inclusions_json TEXT,
        exclusions_json TEXT,
        terms_json TEXT,
        risk_score TEXT,
        created_at TEXT
    );
    """)
    conn.commit()
    
    print("Generating benchmark dataset...")
    t0 = time.perf_counter()
    
    # 1. 50 Users
    user_rows = [(f"user-{i}", f"user{i}@example.com", "hash", f"User {i}", "planner", "2026-10-31T00:00:00Z") for i in range(50)]
    cur.executemany("INSERT INTO users VALUES (?,?,?,?,?,?)", user_rows)
    
    # 2. 200 Events
    event_rows = []
    for i in range(200):
        u_id = f"user-{i % 50}"
        event_rows.append((
            f"event-{i}", u_id, f"Celebration {i}", "wedding" if i % 2 == 0 else "birthday",
            "Mumbai", "2027-02-14T00:00:00Z", 300, 150000000, "INR", "Asia/Kolkata", 6,
            "planning", "Draft", False, "2026-10-31T00:00:00Z", "2026-10-31T00:00:00Z"
        ))
    cur.executemany("INSERT INTO events VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", event_rows)
    
    # 3. Large Stress Event: event-0 has 40 categories, 500 tasks, 500 expenses
    cat_rows = []
    for c in range(40):
        cat_rows.append((
            f"cat-0-{c}", "event-0", f"Category {c}", 2.5, 3750000, "layers", False, 0, c
        ))
    cur.executemany("INSERT INTO budget_categories VALUES (?,?,?,?,?,?,?,?,?)", cat_rows)
    
    # 4. 5,000 Expenses total (500 on event-0, remaining spread across others)
    exp_rows = []
    exp_idx = 0
    for c in range(40):
        for k in range(12):
            exp_rows.append((
                f"exp-{exp_idx}", f"cat-0-{c}", f"Item {exp_idx}", 300000, 250000,
                "USER_PROVIDED", "2026-10-31T00:00:00Z", "2026-10-31T00:00:00Z"
            ))
            exp_idx += 1
            
    while exp_idx < 5000:
        exp_rows.append((
            f"exp-{exp_idx}", f"cat-0-{exp_idx % 40}", f"Item {exp_idx}", 100000, 50000,
            "CALCULATED", "2026-10-31T00:00:00Z", "2026-10-31T00:00:00Z"
        ))
        exp_idx += 1
    cur.executemany("INSERT INTO expenses VALUES (?,?,?,?,?,?,?,?)", exp_rows)
    
    # 5. 10,000 Tasks total (500 on event-0 with chain dependencies)
    task_rows = []
    dep_rows = []
    for t in range(500):
        task_rows.append((
            f"task-0-{t}", "event-0", f"Stress Task {t}", "Desc", "Planning",
            3, "2027-02-14T00:00:00Z", False, None, False, 0, 0, 0, 0, 0,
            "AI_SUGGESTED", "2026-10-31T00:00:00Z", "2026-10-31T00:00:00Z"
        ))
        if t > 0:
            dep_rows.append((f"dep-0-{t}", f"task-0-{t}", f"task-0-{t-1}", "FS"))
            
    # Remaining tasks
    for t in range(500, 10000):
        ev = f"event-{t % 200}"
        task_rows.append((
            f"task-{t}", ev, f"General Task {t}", "Desc", "General",
            2, "2027-02-14T00:00:00Z", False, None, False, 0, 0, 0, 0, 0,
            "USER_PROVIDED", "2026-10-31T00:00:00Z", "2026-10-31T00:00:00Z"
        ))
    cur.executemany("INSERT INTO tasks VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", task_rows)
    cur.executemany("INSERT INTO task_dependencies VALUES (?,?,?,?)", dep_rows)
    
    # 6. 500 Quotations
    quote_rows = []
    for q in range(500):
        quote_rows.append((
            f"quote-{q}", f"vendor-{q % 50}", "event-0", "Catering", 45000000,
            json.dumps(["Food", "Staff"]), json.dumps(["Water bottles"]),
            json.dumps({"advance_percent": 50}), "Medium", "2026-10-31T00:00:00Z"
        ))
    cur.executemany("INSERT INTO quotations VALUES (?,?,?,?,?,?,?,?,?,?)", quote_rows)
    
    conn.commit()
    t_dataset = (time.perf_counter() - t0) * 1000
    print(f"Dataset generated in {t_dataset:.1f}ms (50 users, 200 events, 10,000 tasks, 5,000 expenses, 500 quotes).")
    
    # --- QUERY PROFILING WITH EXPLAIN QUERY PLAN ---
    print("\n--- EXPLAIN QUERY PLAN BENCHMARK ---")
    queries = [
        ("Task List by Event", "SELECT * FROM tasks WHERE event_id = 'event-0'"),
        ("Category List by Event", "SELECT * FROM budget_categories WHERE event_id = 'event-0' ORDER BY sort_order ASC"),
        ("Expenses by Category", "SELECT * FROM expenses WHERE category_id = 'cat-0-1'"),
        ("Task Dependencies by Task", "SELECT * FROM task_dependencies WHERE task_id = 'task-0-50'"),
        ("Quotations by Category", "SELECT * FROM quotations WHERE event_id = 'event-0' AND category = 'Catering'")
    ]
    
    for q_name, q_sql in queries:
        cur.execute(f"EXPLAIN QUERY PLAN {q_sql}")
        plan = cur.fetchall()
        print(f"\nQuery: {q_name}")
        print(f"SQL: {q_sql}")
        for step in plan:
            print(f"  Plan: {step[3]}")
            
    # --- LATENCY PROFILING UNDER REALISTIC DATA ---
    print("\n--- LATENCY BENCHMARK (100 Iterations) ---")
    results = {}
    for q_name, q_sql in queries:
        times = []
        for _ in range(100):
            t1 = time.perf_counter()
            cur.execute(q_sql)
            _ = cur.fetchall()
            times.append((time.perf_counter() - t1) * 1000)
            
        times.sort()
        p50 = statistics.median(times)
        p95 = times[int(len(times) * 0.95)]
        p99 = times[int(len(times) * 0.99)]
        results[q_name] = {"p50": round(p50, 3), "p95": round(p95, 3), "p99": round(p99, 3)}
        print(f"{q_name:28s} -> p50: {p50:.3f}ms | p95: {p95:.3f}ms | p99: {p99:.3f}ms")
        
    conn.close()
    
    # Save benchmark results
    with open("perf_benchmark_results.json", "w", encoding="utf-8") as fp:
        json.dump(results, fp, indent=2)

if __name__ == "__main__":
    setup_benchmark_database()
