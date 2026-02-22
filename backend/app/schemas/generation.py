from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Any
from app.models.generation import DifficultyLevel, GenerationStatus


class GenerationRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=200)
    subject: str = Field(..., min_length=2, max_length=100)
    grade_level: str = Field(..., min_length=1, max_length=50)
    standards: Optional[str] = Field(None, max_length=500)
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    question_count: int = Field(default=10, ge=1, le=50)
    include_multiple_choice: bool = True
    include_short_answer: bool = True
    include_word_problems: bool = True
    include_diagrams: bool = False
    points_per_question: int = Field(default=10, ge=1, le=100)


class QuestionSchema(BaseModel):
    id: int
    type: str  # "multiple_choice" | "short_answer" | "word_problem"
    question: str
    options: Optional[List[str]] = None  # For multiple choice
    correct_answer: str
    explanation: Optional[str] = None
    points: int
    version: str  # "A" or "B"
    has_diagram: bool = False


class GenerationResponse(BaseModel):
    id: int
    user_id: int
    topic: str
    subject: str
    grade_level: str
    standards: Optional[str]
    difficulty: DifficultyLevel
    question_count: int
    status: GenerationStatus
    generator_used: Optional[str]
    questions_a: Optional[List[Any]] = None
    questions_b: Optional[List[Any]] = None
    pdf_version_a: Optional[str]
    pdf_version_b: Optional[str]
    pdf_answer_key: Optional[str]
    generation_time_seconds: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class GenerationListItem(BaseModel):
    id: int
    topic: str
    subject: str
    grade_level: str
    difficulty: DifficultyLevel
    question_count: int
    status: GenerationStatus
    generator_used: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
