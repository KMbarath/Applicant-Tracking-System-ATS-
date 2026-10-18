# Alembic migrations

Generate a revision after model changes with `alembic revision --autogenerate -m "describe change"`, then apply it with `alembic upgrade head`. The local development bootstrap in `app.main` creates the initial SQLite tables so the assignment runs without a migration step.
