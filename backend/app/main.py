"""
HR Nexus — Application Factory & Main Entrypoint

Configures FastAPI app with:
- Enterprise Clean Architecture wiring
- Lifespan events (database startup/shutdown)
- CORS middleware
- Custom request timing & correlation ID middleware
- Global exception handlers
- OpenAPI / Swagger documentation customization
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.config import get_settings
from app.core.exception_handlers import register_exception_handlers
from app.core.middleware import register_middleware
from app.db.session import create_tables, dispose_engine

settings = get_settings()

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("hr_nexus")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup (table creation/verification) and shutdown (engine disposal).
    """
    logger.info("Starting up %s (v%s)...", settings.APP_NAME, settings.APP_VERSION)
    
    # In development/hackathon mode, ensure tables exist
    try:
        await create_tables()
        logger.info("Database tables verified/created successfully.")
    except Exception as e:
        logger.error("Error initializing database tables: %s", e, exc_info=True)
        raise

    yield

    logger.info("Shutting down %s...", settings.APP_NAME)
    await dispose_engine()
    logger.info("Database connections closed.")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "Enterprise Human Resource Management System (HRMS) Backend API.\n\n"
            "### Hackathon Competition Features\n"
            "* **Clean Architecture**: Strict separation of API, Service, Repository, and Database layers.\n"
            "* **Business Workflows**: Attendance rules, leave overlap prevention, auto payroll calculation.\n"
            "* **Enterprise Security**: JWT authentication, bcrypt hashing, role-based access control (RBAC).\n"
            "* **Advanced Analytics**: Chart-ready JSON responses for HR metrics and trends.\n"
            "* **Audit & Timelines**: Full change tracking and employee activity history.\n"
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # 1. CORS Middleware (Must be added before custom middleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 2. Custom Middleware (Request logging, correlation IDs, timing)
    register_middleware(app)

    # 3. Global Exception Handlers
    register_exception_handlers(app)

    # 4. Include Central API Router
    app.include_router(api_router, prefix="/api/v1")

    # Root endpoint
    @app.get("/", tags=["System & Health"])
    async def root():
        return JSONResponse(
            content={
                "success": True,
                "message": f"Welcome to {settings.APP_NAME} API v{settings.APP_VERSION}",
                "documentation": "/docs",
                "health_check": "/api/v1/system/health",
            }
        )

    return app


# Create default app instance for Uvicorn
app = create_app()
