import random
from typing import List
from .base import QuestionGenerator, QuizParameters, Question, GeneratedQuiz


# Deterministic seed per topic for reproducibility
def _seed_for(topic: str) -> int:
    return sum(ord(c) for c in topic)


TEMPLATES = {
    "multiple_choice": {
        "math": [
            ("What is {a} + {b}?", ["{ans}", "{w1}", "{w2}", "{w3}"], "{ans}"),
            ("Which expression equals {a} × {b}?", ["{ans}", "{w1}", "{w2}", "{w3}"], "{ans}"),
            ("What is {a} - {b}?", ["{ans}", "{w1}", "{w2}", "{w3}"], "{ans}"),
        ],
        "science": [
            ("Which of the following is a {topic} concept?", ["Concept A", "Concept B", "Concept C", "Concept D"], "Concept A"),
            ("What process describes {topic}?", ["Process X", "Process Y", "Process Z", "Process W"], "Process X"),
        ],
        "default": [
            ("Which best describes {topic}?", ["Option A", "Option B", "Option C", "Option D"], "Option A"),
            ("What is the main idea of {topic}?", ["Idea 1", "Idea 2", "Idea 3", "Idea 4"], "Idea 1"),
        ],
    },
    "short_answer": {
        "default": [
            "Explain in your own words what {topic} means.",
            "Describe one real-world example of {topic}.",
            "What are two key characteristics of {topic}?",
            "Why is {topic} important in {subject}?",
        ]
    },
    "word_problem": {
        "math": [
            "A classroom has {a} students. If {b} more students join, how many students are there in total?",
            "Maria has {a} apples and gives away {b}. How many apples does she have left?",
            "A store sells {a} items per day. How many items are sold in {b} days?",
        ],
        "default": [
            "Read the following scenario about {topic} and answer: A student studying {subject} notices that {topic} affects everyday life. Give one example and explain your reasoning.",
            "Based on what you know about {topic}, solve the following: If a class of {a} students each studies {subject} for {b} minutes, what is the total study time?",
        ]
    }
}


def _nums(rng: random.Random, difficulty: str):
    if difficulty == "easy":
        a, b = rng.randint(1, 10), rng.randint(1, 10)
    elif difficulty == "hard":
        a, b = rng.randint(20, 100), rng.randint(5, 50)
    else:
        a, b = rng.randint(5, 30), rng.randint(2, 20)
    ans = a + b
    wrongs = [ans + rng.choice([-2, -1, 1, 2, 3]), ans + rng.choice([4, 5, -3, -4]), ans * 2]
    return a, b, str(ans), str(wrongs[0]), str(wrongs[1]), str(wrongs[2])


def _fill(template: str, a, b, ans, w1, w2, w3, topic, subject) -> str:
    return (template
            .replace("{a}", str(a))
            .replace("{b}", str(b))
            .replace("{ans}", ans)
            .replace("{w1}", w1)
            .replace("{w2}", w2)
            .replace("{w3}", w3)
            .replace("{topic}", topic)
            .replace("{subject}", subject))


def _variant_b(question: str, answer: str, a, b, w1, w2, w3, rng: random.Random) -> tuple[str, str]:
    """Create a Version B variant with different numbers or phrasing."""
    new_a = a + rng.randint(2, 8)
    new_b = b + rng.randint(1, 5)
    new_ans = new_a + new_b
    new_w1 = str(new_ans + rng.choice([-2, 1]))
    new_w2 = str(new_ans + rng.choice([2, -3]))
    new_w3 = str(new_ans * 2 - 1)
    q_b = question.replace(str(a), str(new_a)).replace(str(b), str(new_b))
    # Rephrase to distinguish Version B
    if "What is" in q_b:
        q_b = q_b.replace("What is", "Calculate")
    elif "Which" in q_b:
        q_b = q_b.replace("Which", "Select the")
    return q_b, str(new_ans)


class MockGenerator(QuestionGenerator):
    """Offline deterministic generator for development and fallback."""

    @property
    def name(self) -> str:
        return "mock"

    def generate(self, params: QuizParameters) -> GeneratedQuiz:
        rng = random.Random(_seed_for(params.topic))
        subject_key = params.subject.lower() if params.subject.lower() in TEMPLATES["multiple_choice"] else "default"

        questions_a: List[Question] = []
        questions_b: List[Question] = []
        q_id = 1

        question_types = []
        if params.include_multiple_choice:
            question_types.extend(["multiple_choice"] * 3)
        if params.include_short_answer:
            question_types.extend(["short_answer"] * 2)
        if params.include_word_problems:
            question_types.extend(["word_problem"] * 2)

        if not question_types:
            question_types = ["multiple_choice"]

        for i in range(params.question_count):
            q_type = question_types[i % len(question_types)]
            a, b, ans, w1, w2, w3 = _nums(rng, params.difficulty)

            if q_type == "multiple_choice":
                tmpl_list = TEMPLATES["multiple_choice"].get(subject_key, TEMPLATES["multiple_choice"]["default"])
                q_tmpl, opts_tmpl, correct_tmpl = tmpl_list[i % len(tmpl_list)]
                q_text = _fill(q_tmpl, a, b, ans, w1, w2, w3, params.topic, params.subject)
                opts = [_fill(o, a, b, ans, w1, w2, w3, params.topic, params.subject) for o in opts_tmpl]
                rng.shuffle(opts)
                correct = _fill(correct_tmpl, a, b, ans, w1, w2, w3, params.topic, params.subject)

                q_a = Question(
                    id=q_id, type="multiple_choice", question=q_text,
                    options=opts, correct_answer=correct,
                    explanation=f"The correct answer is {correct} because of the fundamental principles of {params.topic}.",
                    points=params.points_per_question, version="A", has_diagram=False
                )

                # Version B: same skill, different numbers
                q_b_text, b_ans = _variant_b(q_text, correct, a, b, w1, w2, w3, rng)
                opts_b = [b_ans, str(int(b_ans) + 1), str(int(b_ans) - 1), str(int(b_ans) + 3)]
                rng.shuffle(opts_b)
                q_b_obj = Question(
                    id=q_id, type="multiple_choice", question=q_b_text,
                    options=opts_b, correct_answer=b_ans,
                    explanation=f"The correct answer is {b_ans}.",
                    points=params.points_per_question, version="B", has_diagram=False
                )

            elif q_type == "short_answer":
                templates = TEMPLATES["short_answer"]["default"]
                q_text = templates[i % len(templates)].replace("{topic}", params.topic).replace("{subject}", params.subject)
                q_b_text = q_text + " Use complete sentences and cite at least one specific detail."

                q_a = Question(
                    id=q_id, type="short_answer", question=q_text,
                    options=None, correct_answer=f"Answers will vary. Should demonstrate understanding of {params.topic}.",
                    explanation=f"Students should show understanding of key {params.topic} concepts.",
                    points=params.points_per_question, version="A"
                )
                q_b_obj = Question(
                    id=q_id, type="short_answer", question=q_b_text,
                    options=None, correct_answer=f"Answers will vary. Must include specific detail about {params.topic}.",
                    explanation=f"Version B requires more detail and specificity.",
                    points=params.points_per_question, version="B"
                )

            else:  # word_problem
                math_templates = TEMPLATES["word_problem"].get("math" if "math" in params.subject.lower() else "default",
                                                                TEMPLATES["word_problem"]["default"])
                q_text = math_templates[i % len(math_templates)].replace("{topic}", params.topic).replace("{subject}", params.subject).replace("{a}", str(a)).replace("{b}", str(b))
                b_a, b_b = a + rng.randint(3, 10), b + rng.randint(2, 7)
                q_b_text = math_templates[i % len(math_templates)].replace("{topic}", params.topic).replace("{subject}", params.subject).replace("{a}", str(b_a)).replace("{b}", str(b_b))

                q_a = Question(
                    id=q_id, type="word_problem", question=q_text,
                    options=None, correct_answer=str(a + b),
                    explanation=f"Work through step by step: start with {a}, then apply the operation with {b}.",
                    points=params.points_per_question * 2, version="A"
                )
                q_b_obj = Question(
                    id=q_id, type="word_problem", question=q_b_text,
                    options=None, correct_answer=str(b_a + b_b),
                    explanation=f"Work through step by step: start with {b_a}, then apply the operation with {b_b}.",
                    points=params.points_per_question * 2, version="B"
                )

            if params.include_diagrams and i % 4 == 3:
                q_a.has_diagram = True
                q_b_obj.has_diagram = True

            questions_a.append(q_a)
            questions_b.append(q_b_obj)
            q_id += 1

        # Shuffle Version B question order (same skills, different presentation)
        b_shuffled = questions_b.copy()
        rng.shuffle(b_shuffled)
        for idx, q in enumerate(b_shuffled):
            q.id = idx + 1

        answer_key = {
            "version_a": [{"id": q.id, "answer": q.correct_answer, "type": q.type, "explanation": q.explanation} for q in questions_a],
            "version_b": [{"id": q.id, "answer": q.correct_answer, "type": q.type, "explanation": q.explanation} for q in b_shuffled],
            "total_points_a": sum(q.points for q in questions_a),
            "total_points_b": sum(q.points for q in b_shuffled),
        }

        return GeneratedQuiz(
            questions_a=questions_a,
            questions_b=b_shuffled,
            answer_key=answer_key,
            generator=self.name,
        )
