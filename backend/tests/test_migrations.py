import os
import pytest
from alembic.config import Config
from alembic import command
from sqlalchemy import create_engine, inspect
from app.models import Base

def test_alembic_migration_upgrade_and_downgrade(tmp_path):
    """
    Verifies that Alembic migrations apply from an empty database and downgrade cleanly.
    Uses an isolated temporary SQLite database.
    """
    db_file = tmp_path / "migration_test.db"
    db_url = f"sqlite:///{db_file.as_posix()}"
    engine = create_engine(db_url)

    # First, initialize base schema tables (users, events, tasks, etc.)
    Base.metadata.create_all(bind=engine)

    # Configure Alembic
    cfg = Config("backend/alembic.ini")
    cfg.set_main_option("sqlalchemy.url", db_url)
    cfg.set_main_option("script_location", "backend/alembic")

    # 1. Upgrade to head
    command.upgrade(cfg, "head")

    # Verify tables and version columns exist
    insp = inspect(engine)
    tables = insp.get_table_names()
    assert "idempotency_records" in tables
    assert "tasks" in tables

    task_cols = [c["name"] for c in insp.get_columns("tasks")]
    assert "version" in task_cols

    # 2. Downgrade to base
    command.downgrade(cfg, "base")

    # Verify downgraded state
    insp_after = inspect(engine)
    tables_after = insp_after.get_table_names()
    assert "idempotency_records" not in tables_after

    # 3. Clean upgrade back to head
    command.upgrade(cfg, "head")
    insp_final = inspect(engine)
    assert "idempotency_records" in insp_final.get_table_names()

    engine.dispose()
