"""Tests for daily generation limits by tier."""
import pytest

SAMPLE_REQUEST = {
    "topic": "Fractions",
    "subject": "Math",
    "grade_level": "5",
    "difficulty": "easy",
    "question_count": 3,
    "include_multiple_choice": True,
    "include_short_answer": False,
    "include_word_problems": False,
    "include_diagrams": False,
    "points_per_question": 10,
}


def _register_and_auth(client, email: str) -> dict:
    """Register a new user and return auth headers."""
    client.post("/api/auth/register", json={
        "email": email,
        "password": "TestPass123!",
        "full_name": "Limit Test",
    })
    resp = client.post("/api/auth/login", data={
        "username": email,
        "password": "TestPass123!",
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_free_tier_allows_three_generations(client):
    """Free users can generate up to 3 quizzes per day."""
    headers = _register_and_auth(client, "limits_free@test.edu")
    for _ in range(3):
        resp = client.post("/api/generations", json=SAMPLE_REQUEST, headers=headers)
        assert resp.status_code == 201, f"Expected 201 but got {resp.status_code}"


def test_free_tier_blocks_fourth_generation(client):
    """Free users are blocked after 3 daily generations."""
    headers = _register_and_auth(client, "limits_block@test.edu")

    # Use up all 3 free generations
    for _ in range(3):
        client.post("/api/generations", json=SAMPLE_REQUEST, headers=headers)

    # The 4th should be rejected
    resp = client.post("/api/generations", json=SAMPLE_REQUEST, headers=headers)
    assert resp.status_code == 429


def test_pro_tier_not_blocked(client):
    """Pro users are not blocked by the free tier limit."""
    from app.models.user import User, UserTier
    from tests.conftest import TestingSessionLocal

    headers = _register_and_auth(client, "limits_pro@test.edu")

    # Upgrade user to PRO directly in the test DB
    db = TestingSessionLocal()
    try:
        user = db.query(User).filter(User.email == "limits_pro@test.edu").first()
        if user:
            user.tier = UserTier.PRO
            db.commit()
    finally:
        db.close()

    # Pro user can generate more than 3
    for _ in range(4):
        resp = client.post("/api/generations", json=SAMPLE_REQUEST, headers=headers)
        assert resp.status_code == 201, f"Pro user blocked on generation, got {resp.status_code}"


def test_stats_reflect_daily_count(client):
    """User stats show accurate generation count after creating quizzes."""
    headers = _register_and_auth(client, "limits_stats@test.edu")

    # Generate 2 quizzes
    client.post("/api/generations", json=SAMPLE_REQUEST, headers=headers)
    client.post("/api/generations", json=SAMPLE_REQUEST, headers=headers)

    resp = client.get("/api/auth/me/stats", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["generations_today"] >= 2
    assert data["daily_limit"] == 3
    assert data["tier"] == "free"


def test_generation_limit_unauthenticated(client):
    """Unauthenticated requests are rejected with 401, not 429."""
    resp = client.post("/api/generations", json=SAMPLE_REQUEST)
    assert resp.status_code == 401
