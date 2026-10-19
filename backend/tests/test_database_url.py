from app.db.session import normalize_database_url
from sqlalchemy import DateTime, column
from sqlalchemy.dialects import postgresql, sqlite
from app.api.v1.dashboard import application_period


def test_render_postgres_urls_use_the_psycopg_driver():
    assert normalize_database_url(
        "postgres://user:password@host:5432/miniats"
    ) == "postgresql+psycopg://user:password@host:5432/miniats"
    assert normalize_database_url(
        "postgresql://user:password@host:5432/miniats"
    ) == "postgresql+psycopg://user:password@host:5432/miniats"


def test_sqlite_url_is_unchanged():
    assert normalize_database_url("sqlite:///./ats.db") == "sqlite:///./ats.db"


def test_application_trend_month_expression_supports_postgresql():
    applied_at = column("applied_at", DateTime)
    postgres_expression = application_period(applied_at, "postgresql")
    sqlite_expression = application_period(applied_at, "sqlite")

    assert "to_char" in str(postgres_expression.compile(dialect=postgresql.dialect()))
    assert "strftime" in str(sqlite_expression.compile(dialect=sqlite.dialect()))
