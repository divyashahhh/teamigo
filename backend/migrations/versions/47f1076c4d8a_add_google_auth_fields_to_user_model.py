"""Add Google auth fields to User model

Revision ID: 47f1076c4d8a
Revises: 
Create Date: 2024-05-31 13:45:14.123456

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision = '47f1076c4d8a'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create a temporary table with the new schema
    op.create_table('_user_new',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=120), nullable=False),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('password', sa.String(length=120), nullable=True),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('profile_picture', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    # Copy data from the old table to the new table
    op.execute('''
        INSERT INTO _user_new (id, email, name, password, role)
        SELECT id, email, name, password, role FROM user;
    ''')

    # Drop the old table
    op.drop_table('user')

    # Rename the new table to the original name
    op.rename_table('_user_new', 'user')


def downgrade():
    # Create a temporary table with the old schema
    op.create_table('_user_old',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=120), nullable=False),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('password', sa.String(length=128), nullable=False),
        sa.Column('role', sa.String(length=10), nullable=False),
        sa.Column('avatar', sa.String(length=200), nullable=True),
        sa.Column('last_seen', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    # Copy data back to the old schema
    op.execute('''
        INSERT INTO _user_old (id, email, name, password, role)
        SELECT id, email, name, password, role FROM user;
    ''')

    # Drop the new table
    op.drop_table('user')

    # Rename the old table back to the original name
    op.rename_table('_user_old', 'user')
