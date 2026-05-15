from sqlalchemy import text
from sqlalchemy.engine import Engine


def ensure_user_profile_columns(engine: Engine) -> None:
    """Add profile columns for existing databases without Alembic."""
    statements = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR",
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_phone_number ON users (phone_number)",
    ]

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))
