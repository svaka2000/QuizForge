#!/usr/bin/env bash
set -e

echo "=== Starting QuizForge ==="

# Backend
echo "Starting backend on http://localhost:8000 ..."
cd backend
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

cd ..

# Frontend
echo "Starting frontend on http://localhost:3000 ..."
cd frontend
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "QuizForge is running!"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo Stopped." INT TERM
wait
