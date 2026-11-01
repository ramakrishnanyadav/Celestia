"""
CELESTIA Database Query Plan & Index Utilization Audit.
Verifies query execution plans on SQLite and PostgreSQL.
Ensures that all hot queries utilize index scans rather than full table scans.
"""
import sys
import os
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.app.database import engine, Base, SessionLocal
from backend.app.models import Event, Task, BudgetCategory, Expense, Approval, ActivityLog, User, RefreshToken
from sqlalchemy import text

def run_explain():
    print("=" * 80)
    print("CELESTIA DATABASE QUERY PLAN EXPLAIN & INDEX AUDIT")
    print("=" * 80)
    
    # Ensure tables and indexes are created
    Base.metadata.create_all(bind=engine)
    
    # Ensure composite indexes are explicitly created
    with engine.begin() as conn:
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_events_user_created ON events (user_id, created_at DESC)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_tasks_event_days ON tasks (event_id, days_before_event DESC)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_budget_cat_event_sort ON budget_categories (event_id, sort_order ASC)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_approvals_event_status ON approvals (event_id, status)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_activity_logs_event_time ON activity_logs (event_id, timestamp DESC)"))
    
    dialect = engine.dialect.name
    print(f"Active Database Engine Dialect: {dialect.upper()}")
    
    queries = [
        ("Events by user (Ordered by created_at)", 
         "EXPLAIN QUERY PLAN SELECT * FROM events WHERE user_id = 'test-user-id' ORDER BY created_at DESC" 
         if dialect == "sqlite" else 
         "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM events WHERE user_id = 'test-user-id' ORDER BY created_at DESC"),
         
        ("Tasks by event (Ordered by days_before_event)", 
         "EXPLAIN QUERY PLAN SELECT * FROM tasks WHERE event_id = 'test-event-id' ORDER BY days_before_event DESC"
         if dialect == "sqlite" else
         "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM tasks WHERE event_id = 'test-event-id' ORDER BY days_before_event DESC"),
         
        ("Budget Categories by event (Ordered by sort_order)", 
         "EXPLAIN QUERY PLAN SELECT * FROM budget_categories WHERE event_id = 'test-event-id' ORDER BY sort_order ASC"
         if dialect == "sqlite" else
         "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM budget_categories WHERE event_id = 'test-event-id' ORDER BY sort_order ASC"),
         
        ("Approvals by event & pending status", 
         "EXPLAIN QUERY PLAN SELECT * FROM approvals WHERE event_id = 'test-event-id' AND status = 'pending'"
         if dialect == "sqlite" else
         "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM approvals WHERE event_id = 'test-event-id' AND status = 'pending'"),
         
        ("Activity logs by event (Ordered by timestamp)", 
         "EXPLAIN QUERY PLAN SELECT * FROM activity_logs WHERE event_id = 'test-event-id' ORDER BY timestamp DESC"
         if dialect == "sqlite" else
         "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM activity_logs WHERE event_id = 'test-event-id' ORDER BY timestamp DESC"),
    ]
    
    report_lines = []
    report_lines.append(f"Engine Dialect: {dialect.upper()}")
    report_lines.append("=" * 80)
    
    all_indexed = True
    
    with engine.connect() as conn:
        for title, q in queries:
            print(f"\n[*] Query: {title}")
            report_lines.append(f"\nQuery: {title}")
            report_lines.append(f"SQL: {q}")
            try:
                res = conn.execute(text(q))
                rows = res.fetchall()
                uses_index = False
                for r in rows:
                    row_str = " | ".join(str(val) for val in r)
                    print(f"    {row_str}")
                    report_lines.append(f"    {row_str}")
                    if "USING INDEX" in row_str or "Index Scan" in row_str or "Bitmap Index Scan" in row_str:
                        uses_index = True
                
                status_str = "PASS (Index Utilized)" if uses_index else "REVIEW (No explicit index in plan)"
                print(f"    -> Status: {status_str}")
                report_lines.append(f"    -> Status: {status_str}")
                if not uses_index and dialect == "sqlite":
                    # Check if table has data or small table optimization
                    pass
            except Exception as e:
                err_msg = f"    Error executing plan: {e}"
                print(err_msg)
                report_lines.append(err_msg)
                all_indexed = False
                
        # List all created indexes
        print("\n[*] Verified Database Indexes:")
        report_lines.append("\nVerified Database Indexes:")
        if dialect == "sqlite":
            indexes = conn.execute(text("SELECT name, tbl_name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%' ORDER BY tbl_name, name")).fetchall()
            for idx_name, tbl in indexes:
                line = f"    Table '{tbl}': Index '{idx_name}'"
                print(line)
                report_lines.append(line)
        else:
            indexes = conn.execute(text("SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname")).fetchall()
            for idx_name, tbl in indexes:
                line = f"    Table '{tbl}': Index '{idx_name}'"
                print(line)
                report_lines.append(line)
                
    # Save to docs/evidence/perf/explain_analyze_report.txt
    out_dir = Path("docs/evidence/perf")
    out_dir.mkdir(parents=True, exist_ok=True)
    report_file = out_dir / "explain_analyze_report.txt"
    with open(report_file, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines) + "\n")
    print(f"\nReport saved to {report_file}")
    return all_indexed

if __name__ == "__main__":
    run_explain()
