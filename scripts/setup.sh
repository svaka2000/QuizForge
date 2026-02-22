#!/usr/bin/env bash
set -e

echo "=== QuizForge Setup ==="

# Backend
echo ""
echo "--- Setting up backend ---"
cd backend

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "✓ Created backend/.env from .env.example"
fi

python -m venv venv 2>/dev/null || true
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null

pip install -r requirements.txt -q
echo "✓ Backend dependencies installed"

cd ..

# Frontend
echo ""
echo "--- Setting up frontend ---"
cd frontend

if [ ! -f ".env.local" ]; then
  echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
  echo "✓ Created frontend/.env.local"
fi

npm install --silent
echo "✓ Frontend dependencies installed"

cd ..

echo ""
echo "=== Setup complete! Run: bash scripts/start.sh ==="
