"""add indexes and check constraints

Revision ID: 99e6f28148b1
Revises: 380fdeb791f6
Create Date: 2026-10-05 16:35:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '99e6f28148b1'
down_revision: Union[str, Sequence[str], None] = '380fdeb791f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Indexes on foreign keys and frequently queried columns
    op.create_index(op.f('ix_events_organizer_id'), 'events', ['organizer_id'], unique=False)
    op.create_index(op.f('ix_ticket_types_event_id'), 'ticket_types', ['event_id'], unique=False)
    op.create_index(op.f('ix_reservations_user_id'), 'reservations', ['user_id'], unique=False)
    op.create_index(op.f('ix_reservations_ticket_type_id'), 'reservations', ['ticket_type_id'], unique=False)
    op.create_index(op.f('ix_reservations_status'), 'reservations', ['status'], unique=False)
    op.create_index(op.f('ix_reservations_expires_at'), 'reservations', ['expires_at'], unique=False)
    op.create_index('ix_reservations_status_expires_at', 'reservations', ['status', 'expires_at'], unique=False)

    # 2. Check constraints (for engines that support check constraints, e.g., PostgreSQL/SQLite)
    # Using batch / raw constraints
    with op.batch_alter_table('events') as batch_op:
        batch_op.create_check_constraint('chk_event_capacity_positive', 'capacity > 0')

    with op.batch_alter_table('users') as batch_op:
        batch_op.create_check_constraint('chk_user_role_valid', "role IN ('user', 'organizer')")

    with op.batch_alter_table('ticket_types') as batch_op:
        batch_op.create_check_constraint('chk_ticket_type_quantity_positive', 'quantity > 0')
        batch_op.create_check_constraint('chk_ticket_type_price_non_negative', 'price >= 0')

    with op.batch_alter_table('reservations') as batch_op:
        batch_op.create_check_constraint('chk_reservation_quantity_positive', 'quantity > 0')
        batch_op.create_check_constraint(
            'chk_reservation_status_valid',
            "status IN ('active', 'confirmed', 'cancelled', 'expired')"
        )


def downgrade() -> None:
    with op.batch_alter_table('reservations') as batch_op:
        batch_op.drop_constraint('chk_reservation_status_valid', type_='check')
        batch_op.drop_constraint('chk_reservation_quantity_positive', type_='check')

    with op.batch_alter_table('ticket_types') as batch_op:
        batch_op.drop_constraint('chk_ticket_type_price_non_negative', type_='check')
        batch_op.drop_constraint('chk_ticket_type_quantity_positive', type_='check')

    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_constraint('chk_user_role_valid', type_='check')

    with op.batch_alter_table('events') as batch_op:
        batch_op.drop_constraint('chk_event_capacity_positive', type_='check')

    op.drop_index('ix_reservations_status_expires_at', table_name='reservations')
    op.drop_index(op.f('ix_reservations_expires_at'), table_name='reservations')
    op.drop_index(op.f('ix_reservations_status'), table_name='reservations')
    op.drop_index(op.f('ix_reservations_ticket_type_id'), table_name='reservations')
    op.drop_index(op.f('ix_reservations_user_id'), table_name='reservations')
    op.drop_index(op.f('ix_ticket_types_event_id'), table_name='ticket_types')
    op.drop_index(op.f('ix_events_organizer_id'), table_name='events')
