from abc import ABC, abstractmethod
from typing import List, Dict, Any
from dataclasses import dataclass


@dataclass
class QuizParameters:
    topic: str
    subject: str
    grade_level: str
    standards: str | None
    difficulty: str
    question_count: int
    include_multiple_choice: bool
    include_short_answer: bool
    include_word_problems: bool
    include_diagrams: bool
    points_per_question: int


@dataclass
class Question:
    id: int
    type: str  # "multiple_choice" | "short_answer" | "word_problem"
    question: str
    options: List[str] | None
    correct_answer: str
    explanation: str
    points: int
    version: str  # "A" or "B"
    has_diagram: bool = False


@dataclass
class GeneratedQuiz:
    questions_a: List[Question]
    questions_b: List[Question]
    answer_key: Dict[str, Any]
    generator: str


class QuestionGenerator(ABC):
    """Abstract base class for question generators."""

    @abstractmethod
    def generate(self, params: QuizParameters) -> GeneratedQuiz:
        """Generate a quiz with two versions (A and B) and an answer key."""
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """Return the generator name."""
        pass

    def _serialize_questions(self, questions: List[Question]) -> List[Dict]:
        return [
            {
                "id": q.id,
                "type": q.type,
                "question": q.question,
                "options": q.options,
                "correct_answer": q.correct_answer,
                "explanation": q.explanation,
                "points": q.points,
                "version": q.version,
                "has_diagram": q.has_diagram,
            }
            for q in questions
        ]
