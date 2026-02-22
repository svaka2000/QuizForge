# QuizForge

**AI-powered quiz and worksheet generator for K-12 teachers.**

Generate standards-aligned quizzes with Version A & B worksheets plus an answer key — in seconds.

---

## Features

- **Instant quiz generation** via Claude AI (falls back to offline MockGenerator)
- **Version A & B worksheets** — same skills, different questions, shuffled order
- **Answer key PDFs** with explanations
- **Multiple question types**: multiple choice, short answer, word problems, diagram placeholders
- **Standards alignment**: specify CCSS, NGSS, or any standard
- **JWT authentication** with email/password
- **Usage limits**: free tier (3/day), Pro tier (100/day)
- **Generation history** dashboard
- **Admin panel** for user management

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Setup

```bash
bash scripts/setup.sh
```

### 2. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env — set ANTHROPIC_API_KEY for AI generation (optional)

# Frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > frontend/.env.local
```

### 3. Start

```bash
bash scripts/start.sh
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | Yes | JWT secret (32+ chars) |
| `DATABASE_URL` | No | Defaults to SQLite |
| `ANTHROPIC_API_KEY` | No | Enables Claude AI generation |
| `STRIPE_SECRET_KEY` | No | Enables subscription billing |
| `FREE_TIER_DAILY_LIMIT` | No | Default: 3 |
| `PRO_TIER_DAILY_LIMIT` | No | Default: 100 |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend URL |

---

## API Usage

### Register
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "teacher@school.edu", "password": "SecurePass123!"}'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -F "username=teacher@school.edu" \
  -F "password=SecurePass123!"
```

### Generate a Quiz
```bash
curl -X POST http://localhost:8000/api/generations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Photosynthesis",
    "subject": "Science",
    "grade_level": "7",
    "difficulty": "medium",
    "question_count": 10,
    "include_multiple_choice": true,
    "include_short_answer": true,
    "include_word_problems": false,
    "include_diagrams": false,
    "points_per_question": 10
  }'
```

### Download PDF
```bash
curl http://localhost:8000/api/generations/<id>/download/version_a \
  -H "Authorization: Bearer <token>" \
  -o worksheet_a.pdf
```

---

## Running Tests

```bash
cd backend
source venv/bin/activate   # or venv\Scripts\activate on Windows
pytest ../tests/ -v
```

---

## Docker

```bash
cp .env.example .env
# Edit .env
docker-compose up --build
```

---

## Architecture

```
/backend
  /app
    /core         — config, database, security
    /models       — SQLAlchemy ORM models
    /schemas      — Pydantic schemas
    /routers      — FastAPI route handlers
    /services     — Business logic layer
    /repositories — Data access layer
    /generators   — Question generation (Mock + Claude)
  /pdfs           — Generated PDF files

/frontend
  /app            — Next.js App Router pages
  /components     — Reusable UI components
  /lib            — API client, types, state

/tests            — Pytest test suite
/docker           — Dockerfiles
/scripts          — Setup and start scripts
```

---

## Generator System

The app detects `ANTHROPIC_API_KEY` at startup:

- **With API key** → `ClaudeGenerator` using `claude-opus-4-6` with streaming
- **Without API key** → `MockGenerator` (deterministic, offline, instant)

Both implement the `QuestionGenerator` interface and produce identical output structures.

---

## Default Admin Account

On first startup, an admin account is created:
- Email: `admin@quizforge.io`
- Password: `AdminPass123!`

**Change immediately in production.**

---

## License

MIT
