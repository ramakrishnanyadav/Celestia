import sqlite3

def run_explain():
    conn = sqlite3.connect("celestia.db")
    cursor = conn.cursor()
    print("=== CELESTIA DATABASE QUERY PLAN EXPLAIN & INDEX AUDIT ===")
    
    queries = [
        ("Events by user", "EXPLAIN QUERY PLAN SELECT * FROM events WHERE user_id = 'test' ORDER BY created_at DESC"),
        ("Tasks by event", "EXPLAIN QUERY PLAN SELECT * FROM tasks WHERE event_id = 'test' ORDER BY days_before_event DESC"),
        ("Budget Categories by event", "EXPLAIN QUERY PLAN SELECT * FROM budget_categories WHERE event_id = 'test' ORDER BY sort_order ASC"),
        ("Expenses by category", "EXPLAIN QUERY PLAN SELECT * FROM expenses WHERE category_id = 'test'"),
        ("Approvals by event", "EXPLAIN QUERY PLAN SELECT * FROM approvals WHERE event_id = 'test' ORDER BY created_at DESC"),
        ("Activity logs by event", "EXPLAIN QUERY PLAN SELECT * FROM activity_logs WHERE event_id = 'test' ORDER BY timestamp DESC"),
    ]
    
    for name, q in queries:
        cursor.execute(q)
        plan = cursor.fetchall()
        print(f"\n[*] {name}:")
        for row in plan:
            print(f"    {row}")
            
    # Check table indexes
    print("\n[*] Existing Indexes in celestia.db:")
    cursor.execute("SELECT name, tbl_name FROM sqlite_master WHERE type = 'index'")
    for row in cursor.fetchall():
        print(f"    Index '{row[0]}' ON '{row[1]}'")
        
    conn.close()

if __name__ == "__main__":
    run_explain()
