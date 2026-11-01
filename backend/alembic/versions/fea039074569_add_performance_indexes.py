"""add_performance_indexes

Revision ID: fea039074569
Revises: 
Create Date: 2026-10-31 02:15:25.604755

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fea039074569'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema with performance and foreign key indexes."""
    # Composite index for filtering tasks by event and sorting by days_before_event
    op.create_index('ix_tasks_event_days', 'tasks', ['event_id', 'days_before_event'], if_not_exists=True)
    # Foreign key index for tasks
    op.create_index('ix_tasks_event_id', 'tasks', ['event_id'], if_not_exists=True)
    # Composite index for budget categories by event and sort_order (eliminates temp B-tree)
    op.create_index('ix_budget_categories_event_sort', 'budget_categories', ['event_id', 'sort_order'], if_not_exists=True)
    # Foreign key index for expenses by category
    op.create_index('ix_expenses_category_id', 'expenses', ['category_id'], if_not_exists=True)
    # Composite index for task dependencies
    op.create_index('ix_task_dependencies_pair', 'task_dependencies', ['task_id', 'depends_on_task_id'], if_not_exists=True)
    # Foreign key index for quotations by vendor
    op.create_index('ix_quotations_vendor_id', 'quotations', ['vendor_id'], if_not_exists=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_quotations_vendor_id', table_name='quotations')
    op.drop_index('ix_task_dependencies_pair', table_name='task_dependencies')
    op.drop_index('ix_expenses_category_id', table_name='expenses')
    op.drop_index('ix_budget_categories_event_sort', table_name='budget_categories')
    op.drop_index('ix_tasks_event_id', table_name='tasks')
    op.drop_index('ix_tasks_event_days', table_name='tasks')
