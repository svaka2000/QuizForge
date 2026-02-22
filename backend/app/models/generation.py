from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Enum, Float, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class DifficultyLevel(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    MIXED = "mixed"


class GenerationStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Generation(Base):
    __tablename__ = "generations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Input parameters
    topic = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    grade_level = Column(String, nullable=False)
    standards = Column(String, nullable=True)
    difficulty = Column(Enum(DifficultyLevel), default=DifficultyLevel.MEDIUM)
    question_count = Column(Integer, default=10)
    include_multiple_choice = Column(Boolean, default=True)
    include_short_answer = Column(Boolean, default=True)
    include_word_problems = Column(Boolean, default=True)
    include_diagrams = Column(Boolean, default=False)
    points_per_question = Column(Integer, default=10)

    # Generated content (JSON)
    questions_a = Column(JSON, nullable=True)
    questions_b = Column(JSON, nullable=True)
    answer_key = Column(JSON, nullable=True)

    # PDF paths
    pdf_version_a = Column(String, nullable=True)
    pdf_version_b = Column(String, nullable=True)
    pdf_answer_key = Column(String, nullable=True)

    # Metadata
    status = Column(Enum(GenerationStatus), default=GenerationStatus.PENDING)
    generator_used = Column(String, nullable=True)  # "mock" or "claude"
    error_message = Column(Text, nullable=True)
    generation_time_seconds = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="generations")


class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    generation_id = Column(Integer, ForeignKey("generations.id"), nullable=True)
    action = Column(String, nullable=False)  # "generate", "download", etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="usage_logs")
