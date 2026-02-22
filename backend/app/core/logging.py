"""
Structured JSON logging for production.

Usage:
    from app.core.logging import configure_logging
    configure_logging()

The logger outputs JSON lines in production (ENVIRONMENT=production)
and human-readable format in development.
"""
import json
import logging
import sys
import traceback
from datetime import datetime, timezone
from typing import Any


class JSONFormatter(logging.Formatter):
    """Format log records as single-line JSON for structured log ingestion."""

    LEVEL_MAP = {
        logging.DEBUG: "debug",
        logging.INFO: "info",
        logging.WARNING: "warning",
        logging.ERROR: "error",
        logging.CRITICAL: "critical",
    }

    def format(self, record: logging.LogRecord) -> str:  # type: ignore[override]
        log: dict[str, Any] = {
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            "level": self.LEVEL_MAP.get(record.levelno, "unknown"),
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Attach request_id if set on the record (via middleware)
        request_id = getattr(record, "request_id", None)
        if request_id:
            log["request_id"] = request_id

        # Attach exception info
        if record.exc_info:
            log["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]),
                "traceback": traceback.format_exception(*record.exc_info),
            }

        return json.dumps(log, ensure_ascii=False)


def configure_logging(environment: str = "development", debug: bool = False) -> None:
    """
    Set up root logging.

    - production: JSON formatter to stdout
    - development/test: human-readable formatter with colours (via uvicorn default)
    """
    level = logging.DEBUG if debug else logging.INFO

    if environment == "production":
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logging.root.handlers = [handler]
        logging.root.setLevel(level)
    else:
        logging.basicConfig(
            level=level,
            format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
            stream=sys.stderr,
        )

    # Silence noisy third-party loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("stripe").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
