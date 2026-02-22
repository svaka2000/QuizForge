import json
import logging
import random
from typing import List
from anthropic import Anthropic
from .base import QuestionGenerator, QuizParameters, Question, GeneratedQuiz

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """You are an expert educator and curriculum designer specializing in K-12 assessment creation.
You create standards-aligned, pedagogically sound quizzes and worksheets.

Your quizzes must:
1. Align precisely to the specified educational standards
2. Match the cognitive level appropriate for the grade
3. Include clear, unambiguous questions with definitive correct answers
4. Feature grade-appropriate vocabulary and reading level
5. Cover the topic comprehensively across question types

Always respond with valid JSON only. No markdown, no explanation outside the JSON."""


def _build_prompt(params: QuizParameters, version: str) -> str:
    type_list = []
    if params.include_multiple_choice:
        type_list.append("multiple_choice")
    if params.include_short_answer:
        type_list.append("short_answer")
    if params.include_word_problems:
        type_list.append("word_problem")
    if not type_list:
        type_list = ["multiple_choice"]

    standards_line = f"Standards: {params.standards}" if params.standards else "Use grade-appropriate standards."

    return f"""Generate a Version {version} worksheet for:
- Topic: {params.topic}
- Subject: {params.subject}
- Grade Level: {params.grade_level}
- {standards_line}
- Difficulty: {params.difficulty}
- Question Count: {params.question_count}
- Question Types: {', '.join(type_list)}
- Points per question: {params.points_per_question}
- Include diagram placeholders: {params.include_diagrams}

{"Version B requirements: Use different numbers, values, and phrasing than Version A. Assess the SAME skills and standards. Shuffle the question order." if version == "B" else ""}

Return a JSON array of question objects. Each object must have:
{{
  "id": <integer>,
  "type": "<multiple_choice|short_answer|word_problem>",
  "question": "<question text>",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."] or null for non-MC,
  "correct_answer": "<exact answer>",
  "explanation": "<brief explanation of why this is correct>",
  "points": <integer>,
  "version": "{version}",
  "has_diagram": <boolean>
}}

For multiple choice: options must be exactly 4 items labeled A) B) C) D).
For short_answer: options is null. correct_answer is a model answer or rubric.
For word_problems: include a realistic scenario. options is null.
Ensure all answers are factually correct and grade-appropriate."""


class ClaudeGenerator(QuestionGenerator):
    """Question generator using Claude API."""

    def __init__(self, api_key: str):
        self.client = Anthropic(api_key=api_key)

    @property
    def name(self) -> str:
        return "claude"

    def generate(self, params: QuizParameters) -> GeneratedQuiz:
        logger.info(f"Generating quiz with Claude: topic={params.topic}, grade={params.grade_level}")

        questions_a = self._generate_version(params, "A")
        questions_b = self._generate_version(params, "B")

        # Shuffle Version B order
        shuffled_b = questions_b.copy()
        random.shuffle(shuffled_b)
        for idx, q in enumerate(shuffled_b):
            q.id = idx + 1

        answer_key = {
            "version_a": [
                {
                    "id": q.id,
                    "answer": q.correct_answer,
                    "type": q.type,
                    "explanation": q.explanation,
                }
                for q in questions_a
            ],
            "version_b": [
                {
                    "id": q.id,
                    "answer": q.correct_answer,
                    "type": q.type,
                    "explanation": q.explanation,
                }
                for q in shuffled_b
            ],
            "total_points_a": sum(q.points for q in questions_a),
            "total_points_b": sum(q.points for q in shuffled_b),
        }

        return GeneratedQuiz(
            questions_a=questions_a,
            questions_b=shuffled_b,
            answer_key=answer_key,
            generator=self.name,
        )

    def _generate_version(self, params: QuizParameters, version: str) -> List[Question]:
        prompt = _build_prompt(params, version)

        with self.client.messages.stream(
            model="claude-opus-4-6",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            response = stream.get_final_message()

        raw = response.content[0].text.strip()

        # Strip any accidental markdown fences
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        if raw.endswith("```"):
            raw = raw[:-3]

        data = json.loads(raw.strip())

        questions = []
        for item in data:
            q = Question(
                id=item["id"],
                type=item["type"],
                question=item["question"],
                options=item.get("options"),
                correct_answer=item["correct_answer"],
                explanation=item.get("explanation", ""),
                points=item.get("points", params.points_per_question),
                version=version,
                has_diagram=item.get("has_diagram", False),
            )
            questions.append(q)

        return questions
