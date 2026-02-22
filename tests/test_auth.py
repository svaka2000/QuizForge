import pytest


def test_register_success(client):
    resp = client.post("/api/auth/register", json={
        "email": "teacher@test.edu",
        "password": "SecurePass123!",
        "full_name": "Jane Doe",
        "school_name": "Lincoln School",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "teacher@test.edu"
    assert data["full_name"] == "Jane Doe"
    assert data["tier"] == "free"
    assert data["is_admin"] is False


def test_register_duplicate_email(client):
    client.post("/api/auth/register", json={
        "email": "dup@test.edu",
        "password": "Pass123!",
    })
    resp = client.post("/api/auth/register", json={
        "email": "dup@test.edu",
        "password": "Pass123!",
    })
    assert resp.status_code == 409


def test_login_success(client):
    client.post("/api/auth/register", json={
        "email": "logintest@test.edu",
        "password": "Pass123!",
    })
    resp = client.post("/api/auth/login", data={
        "username": "logintest@test.edu",
        "password": "Pass123!",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client):
    client.post("/api/auth/register", json={
        "email": "wrongpw@test.edu",
        "password": "CorrectPass!",
    })
    resp = client.post("/api/auth/login", data={
        "username": "wrongpw@test.edu",
        "password": "WrongPass!",
    })
    assert resp.status_code == 401


def test_get_me(auth_client):
    resp = auth_client.get("/api/auth/me")
    assert resp.status_code == 200
    data = resp.json()
    assert "email" in data
    assert "tier" in data


def test_get_stats(auth_client):
    resp = auth_client.get("/api/auth/me/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_generations" in data
    assert "generations_today" in data
    assert "daily_limit" in data
    assert data["daily_limit"] > 0  # exact value depends on tier; free=3, pro=100


def test_health_check(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "generator" in data
