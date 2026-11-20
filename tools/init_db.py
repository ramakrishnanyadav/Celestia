"""
CELESTIA Database Schema Bootstrap Utility
Idempotently creates all base relational schema tables before Alembic migrations execute.
Safe for PostgreSQL, MySQL, and SQLite.
"""
import sys
import os

# Add backend directory to sys.path so app imports resolve
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import engine, Base
import app.models  # noqa: F401 - registers all ORM models with Base.metadata

def init_db():
    print("[INIT_DB] Initializing all base database tables (CREATE TABLE IF NOT EXISTS)...", flush=True)
    Base.metadata.create_all(bind=engine)
    print("[INIT_DB] All base database tables successfully initialized and verified.", flush=True)

if __name__ == "__main__":
    init_db()
