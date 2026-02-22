from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import date
from app.models.generation import Generation, GenerationStatus


class GenerationRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user_id: int, **kwargs) -> Generation:
        generation = Generation(user_id=user_id, **kwargs)
        self.db.add(generation)
        self.db.commit()
        self.db.refresh(generation)
        return generation

    def get_by_id(self, generation_id: int) -> Optional[Generation]:
        return self.db.query(Generation).filter(Generation.id == generation_id).first()

    def get_by_user(self, user_id: int, skip: int = 0, limit: int = 50) -> List[Generation]:
        return (
            self.db.query(Generation)
            .filter(Generation.user_id == user_id)
            .order_by(Generation.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update(self, generation: Generation, **kwargs) -> Generation:
        for key, value in kwargs.items():
            setattr(generation, key, value)
        self.db.commit()
        self.db.refresh(generation)
        return generation

    def delete(self, generation: Generation):
        self.db.delete(generation)
        self.db.commit()

    def list_all(self, skip: int = 0, limit: int = 100) -> List[Generation]:
        return (
            self.db.query(Generation)
            .order_by(Generation.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_total(self) -> int:
        return self.db.query(Generation).count()

    def get_count_by_day(self, days: int = 30) -> List[dict]:
        """Return generation counts per day for the last N days."""
        day_col = func.date(Generation.created_at).label("day")
        rows = (
            self.db.query(day_col, func.count(Generation.id).label("count"))
            .group_by(func.date(Generation.created_at))
            .order_by(func.date(Generation.created_at))
            .limit(days)
            .all()
        )
        return [{"day": str(r.day), "count": r.count} for r in rows]

    def get_top_subjects(self, limit: int = 10) -> List[dict]:
        """Return top subjects by generation count."""
        rows = (
            self.db.query(
                Generation.subject,
                func.count(Generation.id).label("count"),
            )
            .group_by(Generation.subject)
            .order_by(func.count(Generation.id).desc())
            .limit(limit)
            .all()
        )
        return [{"subject": r.subject, "count": r.count} for r in rows]

    def get_count_by_user(self, user_id: int) -> int:
        return (
            self.db.query(Generation)
            .filter(Generation.user_id == user_id)
            .count()
        )

    def count_today(self) -> int:
        today = str(date.today())
        return (
            self.db.query(Generation)
            .filter(func.date(Generation.created_at) == today)
            .count()
        )
