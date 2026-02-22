import logging
import time
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.core.config import settings
from app.generators import get_generator, QuizParameters
from app.repositories.generation_repository import GenerationRepository
from app.repositories.user_repository import UserRepository
from app.models.generation import Generation, GenerationStatus, DifficultyLevel
from app.models.user import User, UserTier
from app.schemas.generation import GenerationRequest
from app.services.pdf_service import (
    generate_worksheet_pdf,
    generate_answer_key_pdf,
)

logger = logging.getLogger(__name__)


def _daily_limit(tier: UserTier) -> int:
    if tier == UserTier.FREE:
        return settings.FREE_TIER_DAILY_LIMIT
    return settings.PRO_TIER_DAILY_LIMIT


def _estimated_print_time(question_count: int) -> str:
    """Rough estimate: ~30 sec per question to print, collate, and distribute."""
    minutes = max(1, round(question_count * 0.5))
    return f"~{minutes} min to print and distribute"


class GenerationService:
    def __init__(self, db: Session):
        self.db = db
        self.gen_repo = GenerationRepository(db)
        self.user_repo = UserRepository(db)

    def check_usage_limit(self, user: User):
        today_count = self.user_repo.get_generations_today(user.id)
        limit = _daily_limit(user.tier)
        if today_count >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Daily limit reached ({limit} generations/day on {user.tier.value} plan). Upgrade to Pro for more.",
            )

    def create_generation(self, user: User, request: GenerationRequest) -> Generation:
        self.check_usage_limit(user)

        generation = self.gen_repo.create(
            user_id=user.id,
            topic=request.topic,
            subject=request.subject,
            grade_level=request.grade_level,
            standards=request.standards,
            difficulty=request.difficulty,
            question_count=request.question_count,
            include_multiple_choice=request.include_multiple_choice,
            include_short_answer=request.include_short_answer,
            include_word_problems=request.include_word_problems,
            include_diagrams=request.include_diagrams,
            points_per_question=request.points_per_question,
            status=GenerationStatus.PENDING,
        )

        try:
            self.gen_repo.update(generation, status=GenerationStatus.PROCESSING)

            start = time.time()
            generator = get_generator()
            params = QuizParameters(
                topic=request.topic,
                subject=request.subject,
                grade_level=request.grade_level,
                standards=request.standards,
                difficulty=request.difficulty.value,
                question_count=request.question_count,
                include_multiple_choice=request.include_multiple_choice,
                include_short_answer=request.include_short_answer,
                include_word_problems=request.include_word_problems,
                include_diagrams=request.include_diagrams,
                points_per_question=request.points_per_question,
            )

            result = generator.generate(params)
            elapsed = round(time.time() - start, 2)

            q_a_dicts = generator._serialize_questions(result.questions_a)
            q_b_dicts = generator._serialize_questions(result.questions_b)

            title = f"{request.subject}: {request.topic}"
            pdf_a = generate_worksheet_pdf(
                generation.id, "A", q_a_dicts, title,
                request.subject, request.grade_level, request.topic
            )
            pdf_b = generate_worksheet_pdf(
                generation.id, "B", q_b_dicts, title,
                request.subject, request.grade_level, request.topic
            )
            pdf_key = generate_answer_key_pdf(
                generation.id, q_a_dicts, q_b_dicts, result.answer_key,
                title, request.subject, request.grade_level, request.topic
            )

            actual_count = len(q_a_dicts)
            self.gen_repo.update(
                generation,
                status=GenerationStatus.COMPLETED,
                questions_a=q_a_dicts,
                questions_b=q_b_dicts,
                answer_key=result.answer_key,
                pdf_version_a=pdf_a,
                pdf_version_b=pdf_b,
                pdf_answer_key=pdf_key,
                generator_used=result.generator,
                generation_time_seconds=elapsed,
                question_count=actual_count,
                estimated_print_time=_estimated_print_time(actual_count),
            )

            self.user_repo.log_usage(user.id, "generate", generation.id)
            logger.info(f"Generation {generation.id} completed in {elapsed}s using {result.generator}")

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Generation {generation.id} failed: {e}", exc_info=True)
            self.gen_repo.update(
                generation,
                status=GenerationStatus.FAILED,
                error_message=str(e),
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Generation failed: {str(e)}",
            )

        return self.gen_repo.get_by_id(generation.id)

    def get_generation(self, generation_id: int, user: User) -> Generation:
        gen = self.gen_repo.get_by_id(generation_id)
        if not gen:
            raise HTTPException(status_code=404, detail="Generation not found")
        if gen.user_id != user.id and not user.is_admin:
            raise HTTPException(status_code=403, detail="Access denied")
        return gen

    def list_generations(self, user: User, skip: int = 0, limit: int = 20):
        return self.gen_repo.get_by_user(user.id, skip=skip, limit=limit)

    def list_generations_paginated(self, user: User, page: int = 1, limit: int = 25) -> dict:
        skip = (page - 1) * limit
        items = self.gen_repo.get_by_user(user.id, skip=skip, limit=limit)
        total = self.gen_repo.count_by_user_non_deleted(user.id)
        import math
        pages = math.ceil(total / limit) if limit > 0 else 1
        return {
            "items": items,
            "total": total,
            "page": page,
            "pages": max(1, pages),
            "limit": limit,
        }

    def delete_generation(self, generation_id: int, user: User):
        gen = self.get_generation(generation_id, user)
        self.gen_repo.delete(gen)

    def soft_delete_generation(self, generation_id: int, user: User):
        gen = self.get_generation(generation_id, user)
        self.gen_repo.soft_delete(gen)
