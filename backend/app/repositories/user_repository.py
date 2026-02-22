from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import date, datetime, timezone
from typing import Optional
from app.models.user import User, UserTier
from app.models.generation import Generation, UsageLog


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def create(self, email: str, hashed_password: str, full_name: str = None, school_name: str = None) -> User:
        user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            school_name=school_name,
            tier=UserTier.FREE,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: User, **kwargs) -> User:
        for key, value in kwargs.items():
            setattr(user, key, value)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_generations_today(self, user_id: int) -> int:
        today = date.today()
        return (
            self.db.query(Generation)
            .filter(
                Generation.user_id == user_id,
                cast(Generation.created_at, Date) == today,
            )
            .count()
        )

    def get_total_generations(self, user_id: int) -> int:
        return self.db.query(Generation).filter(Generation.user_id == user_id).count()

    def log_usage(self, user_id: int, action: str, generation_id: int = None):
        log = UsageLog(user_id=user_id, action=action, generation_id=generation_id)
        self.db.add(log)
        self.db.commit()

    def list_all(self, skip: int = 0, limit: int = 100):
        return self.db.query(User).offset(skip).limit(limit).all()

    def count_total(self) -> int:
        return self.db.query(User).count()
