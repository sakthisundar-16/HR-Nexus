"""
HR Nexus — Database Session Management

Provides:
- Async SQLAlchemy engine
- Async session factory
- get_db dependency for FastAPI
- create_tables utility for initial setup
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings

settings = get_settings()

# Engine configuration
# - echo=True in debug mode for SQL query logging
# - SQLite needs check_same_thread=False
# - PostgreSQL on Render needs SSL
_connect_args: dict = {}
if settings.DATABASE_URL.startswith("sqlite"):
    _connect_args = {"check_same_thread": False}
elif settings.DATABASE_URL.startswith("postgresql"):
    # asyncpg uses ssl keyword directly in connect_args
    import ssl as _ssl
    _ssl_ctx = _ssl.create_default_context()
    _ssl_ctx.check_hostname = False
    _ssl_ctx.verify_mode = _ssl.CERT_NONE
    _connect_args = {"ssl": _ssl_ctx}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    connect_args=_connect_args,
    pool_pre_ping=True,   # Verify connections before use
    pool_size=5,          # Render free tier connection limit
    max_overflow=10,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Critical for async — prevents lazy-load errors
    autocommit=False,
    autoflush=False,
)


async def get_db():
    """
    FastAPI dependency that provides a database session per request.
    Automatically commits on success, rolls back on exception.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables():
    """Create all tables — used for initial setup (non-Alembic path)."""
    from app.db.base import Base  # noqa: F811

    # Import all models so they register with Base.metadata
    import app.models  # noqa: F401

    async with engine.begin() as conn:
        # Temporarily drop all tables to clear out the incorrect timezone schema
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)


async def dispose_engine():
    """Dispose the engine — used during shutdown."""
    await engine.dispose()
