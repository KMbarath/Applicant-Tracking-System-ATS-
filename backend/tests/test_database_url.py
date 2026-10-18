from app.db.session import normalize_database_url


def test_render_postgres_urls_use_the_psycopg_driver():
    assert normalize_database_url(
        "postgres://user:password@host:5432/miniats"
    ) == "postgresql+psycopg://user:password@host:5432/miniats"
    assert normalize_database_url(
        "postgresql://user:password@host:5432/miniats"
    ) == "postgresql+psycopg://user:password@host:5432/miniats"


def test_sqlite_url_is_unchanged():
    assert normalize_database_url("sqlite:///./ats.db") == "sqlite:///./ats.db"
