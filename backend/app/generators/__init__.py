import logging
from .base import QuestionGenerator, QuizParameters, GeneratedQuiz, Question
from .mock_generator import MockGenerator

logger = logging.getLogger(__name__)


def get_generator() -> QuestionGenerator:
    """Factory: returns ClaudeGenerator if API key present, else MockGenerator."""
    from app.core.config import settings

    if settings.ANTHROPIC_API_KEY:
        try:
            from .claude_generator import ClaudeGenerator
            logger.info("Using ClaudeGenerator (ANTHROPIC_API_KEY found)")
            return ClaudeGenerator(api_key=settings.ANTHROPIC_API_KEY)
        except Exception as e:
            logger.warning(f"Failed to init ClaudeGenerator: {e}. Falling back to MockGenerator.")

    logger.info("Using MockGenerator (no ANTHROPIC_API_KEY)")
    return MockGenerator()


__all__ = [
    "QuestionGenerator", "QuizParameters", "GeneratedQuiz", "Question",
    "MockGenerator", "get_generator",
]
