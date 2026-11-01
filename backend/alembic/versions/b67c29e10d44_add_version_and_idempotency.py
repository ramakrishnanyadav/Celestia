"""add_version_and_idempotency

Revision ID: b67c29e10d44
Revises: fea039074569
Create Date: 2026-10-31 02:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'b67c29e10d44'
down_revision: Union[str, Sequence[str], None] = 'fea039074569'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    insp = sa.inspect(conn)
    
    # tasks
    task_cols = [c['name'] for c in insp.get_columns('tasks')]
    if 'version' not in task_cols:
        with op.batch_alter_table('tasks') as batch_op:
            batch_op.add_column(sa.Column('version', sa.Integer(), nullable=False, server_default='1'))
            
    # expenses
    exp_cols = [c['name'] for c in insp.get_columns('expenses')]
    if 'version' not in exp_cols:
        with op.batch_alter_table('expenses') as batch_op:
            batch_op.add_column(sa.Column('version', sa.Integer(), nullable=False, server_default='1'))
            
    # budget_categories
    cat_cols = [c['name'] for c in insp.get_columns('budget_categories')]
    if 'version' not in cat_cols:
        with op.batch_alter_table('budget_categories') as batch_op:
            batch_op.add_column(sa.Column('version', sa.Integer(), nullable=False, server_default='1'))
            
    # idempotency_records
    tables = insp.get_table_names()
    if 'idempotency_records' not in tables:
        op.create_table(
            'idempotency_records',
            sa.Column('id', sa.String(36), primary_key=True),
            sa.Column('key', sa.String(128), nullable=False, index=True),
            sa.Column('user_id', sa.String(36), nullable=False, index=True),
            sa.Column('endpoint', sa.String(255), nullable=False),
            sa.Column('request_hash', sa.String(64), nullable=False),
            sa.Column('response_code', sa.Integer(), nullable=False),
            sa.Column('response_body', sa.JSON(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.UniqueConstraint('key', 'user_id', name='uq_idempotency_key_user')
        )


def downgrade() -> None:
    conn = op.get_bind()
    insp = sa.inspect(conn)
    tables = insp.get_table_names()
    if 'idempotency_records' in tables:
        op.drop_table('idempotency_records')
        
    cat_cols = [c['name'] for c in insp.get_columns('budget_categories')]
    if 'version' in cat_cols:
        with op.batch_alter_table('budget_categories') as batch_op:
            batch_op.drop_column('version')
            
    exp_cols = [c['name'] for c in insp.get_columns('expenses')]
    if 'version' in exp_cols:
        with op.batch_alter_table('expenses') as batch_op:
            batch_op.drop_column('version')
            
    task_cols = [c['name'] for c in insp.get_columns('tasks')]
    if 'version' in task_cols:
        with op.batch_alter_table('tasks') as batch_op:
            batch_op.drop_column('version')
