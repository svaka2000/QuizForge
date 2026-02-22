from sqlalchemy.orm import Session
from typing import Optional, List
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
