"""add event organizer

Revision ID: 2b08d2004a24
Revises: f5298da47704
Create Date: 2026-09-27 19:43:08.311507

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2b08d2004a24'
down_revision: Union[str, Sequence[str], None] = 'f5298da47704'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # 1. Add the column temporarily as nullable
    op.add_column(
        'events',
        sa.Column('organizer_id', sa.Integer(), nullable=True)
    )

    # 2. Assign existing events to user ID 1
    op.execute(
        "UPDATE events SET organizer_id = 1 WHERE organizer_id IS NULL"
    )

    # 3. Create the foreign key relationship
    op.create_foreign_key(
        'fk_events_organizer_id_users',
        'events',
        'users',
        ['organizer_id'],
        ['id']
    )

    # 4. Make organizer_id required
    op.alter_column(
        'events',
        'organizer_id',
        existing_type=sa.Integer(),
        nullable=False
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_constraint(
        'fk_events_organizer_id_users',
        'events',
        type_='foreignkey'
    )

    op.drop_column(
        'events',
        'organizer_id'
    )