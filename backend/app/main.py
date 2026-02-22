import os
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging

from app.core.config import settings
from app.core.database import init_db
from app.core.logging import configure_logging
from app.routers import auth_router, generations_router, admin_router, billing_router

# Configure logging before anything else
configure_logging(environment=settings.ENVIRONMENT, debug=settings.DEBUG)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    init_db()
    try:
        _seed_admin()
    except Exception as e:
        logger.warning(f"Admin seed skipped: {e}")
    yield
    logger.info("Shutting down")


def _seed_admin():
    """Create default admin user if none exists."""
    from app.core.database import SessionLocal
    from app.repositories.user_repository import UserRepository
    from app.core.security import hash_password
    from app.models.user import UserTier

    db = SessionLocal()
    try:
        repo = UserRepository(db)
        if not repo.get_by_email(settings.ADMIN_EMAIL):
            user = repo.create(
                email=settings.ADMIN_EMAIL,
                hashed_password=hash_password("AdminPass123!"),
                full_name="QuizForge Admin",
            )
            repo.update(user, is_admin=True, tier=UserTier.PRO)
            logger.info(f"Created admin user: {settings.ADMIN_EMAIL}")
    finally:
        db.close()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered quiz and worksheet generator for teachers",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request ID middleware — attaches X-Request-ID to every request/response
# ---------------------------------------------------------------------------
@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# ---------------------------------------------------------------------------
# Request logging middleware — structured log per request
# ---------------------------------------------------------------------------
@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    import time
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start) * 1000, 1)
    request_id = getattr(request.state, "request_id", "-")
    logger.info(
        "%s %s %s %.1fms rid=%s",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
        request_id,
    )
    return response


# Routers
app.include_router(auth_router)
app.include_router(generations_router)
app.include_router(admin_router)
app.include_router(billing_router)

# Serve PDFs
pdf_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "pdfs")
os.makedirs(pdf_dir, exist_ok=True)
app.mount("/pdfs", StaticFiles(directory=pdf_dir), name="pdfs")


@app.get("/api/health")
def health_check():
    from app.generators import get_generator
    generator = get_generator()
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "generator": generator.name,
        "ai_enabled": settings.ANTHROPIC_API_KEY is not None,
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "-")
    logger.error(
        "Unhandled exception rid=%s: %s", request_id, exc, exc_info=True
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal error occurred"},
    )
