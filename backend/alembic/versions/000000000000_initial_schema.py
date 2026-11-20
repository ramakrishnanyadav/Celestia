"""initial_schema

Revision ID: 000000000000
Revises: 
Create Date: 2026-10-30 00:00:00.000000

"""
from collections.abc import Sequence

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '000000000000'
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create all initial application tables idempotently."""
    from app.models import Base
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    """Drop all initial application tables."""
    from app.models import Base
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
