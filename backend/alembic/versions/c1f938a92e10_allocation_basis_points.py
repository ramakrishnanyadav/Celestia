"""allocation_basis_points

Revision ID: c1f938a92e10
Revises: b67c29e10d44
Create Date: 2026-11-01 19:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'c1f938a92e10'
down_revision: Union[str, Sequence[str], None] = 'b67c29e10d44'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    insp = sa.inspect(conn)
    cat_cols = [c['name'] for c in insp.get_columns('budget_categories')]
    
    if 'allocation_basis_points' not in cat_cols:
        with op.batch_alter_table('budget_categories') as batch_op:
            batch_op.add_column(sa.Column('allocation_basis_points', sa.Integer(), nullable=False, server_default='0'))
            
        # Backfill from allocation_percent if present
        if 'allocation_percent' in cat_cols:
            conn.execute(sa.text(
                "UPDATE budget_categories SET allocation_basis_points = CAST(ROUND(allocation_percent * 100) AS INTEGER)"
            ))


def downgrade() -> None:
    conn = op.get_bind()
    insp = sa.inspect(conn)
    cat_cols = [c['name'] for c in insp.get_columns('budget_categories')]
    if 'allocation_basis_points' in cat_cols:
        with op.batch_alter_table('budget_categories', recreate='always') as batch_op:
            try:
                batch_op.drop_constraint('check_cat_allocation_basis_points', type_='check')
            except Exception:
                pass
            batch_op.drop_column('allocation_basis_points')
