"""Tests for admin endpoints."""
import pytest


SAMPLE_REQUEST = {
    "topic": "World War II",
    "subject": "History",
    "grade_level": "10",
    "difficulty": "medium",
    "question_count": 3,
    "include_multiple_choice": True,
    "include_short_answer": False,
    "include_word_problems": False,
    "include_diagrams": False,
    "points_per_question": 10,
}


# ---------------------------------------------------------------------------
# Access control
# ---------------------------------------------------------------------------

def test_admin_stats_requires_admin(auth_client):
    """Regular users cannot access admin stats."""
    resp = auth_client.get("/api/admin/stats")
    assert resp.status_code == 403


def test_admin_list_users_requires_admin(auth_client):
    """Regular users cannot list all users."""
    resp = auth_client.get("/api/admin/users")
    assert resp.status_code == 403


def test_admin_requires_auth(client):
    """Unauthenticated requests to admin endpoints return 401."""
    resp = client.get("/api/admin/stats")
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

def test_admin_stats_returns_expected_fields(admin_client):
    resp = admin_client.get("/api/admin/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_users" in data
    assert "total_generations" in data
    assert "generations_today" in data
    assert "generations_by_day" in data
    assert "top_subjects" in data
    assert "free_users" in data
    assert "pro_users" in data
    assert isinstance(data["total_users"], int)
    assert data["total_users"] >= 0


def test_admin_stats_counts_increase_after_generation(admin_client):
    """Total generations count should increase after generating a quiz."""
    before = admin_client.get("/api/admin/stats").json()["total_generations"]
    admin_client.post("/api/generations", json=SAMPLE_REQUEST)
    after = admin_client.get("/api/admin/stats").json()["total_generations"]
    assert after == before + 1


# ---------------------------------------------------------------------------
# User listing and management
# ---------------------------------------------------------------------------

def test_admin_list_users(admin_client):
    resp = admin_client.get("/api/admin/users")
    assert resp.status_code == 200
    users = resp.json()
    assert isinstance(users, list)
    assert len(users) >= 1
    # Admin user should be in the list
    emails = [u["email"] for u in users]
    assert "admin_test@school.edu" in emails


def test_admin_export_csv(admin_client):
    resp = admin_client.get("/api/admin/users/export")
    assert resp.status_code == 200
    assert "text/csv" in resp.headers.get("content-type", "")
    content = resp.content.decode()
    assert "email" in content  # CSV header
    assert "admin_test@school.edu" in content


def test_admin_list_generations(admin_client):
    admin_client.post("/api/generations", json=SAMPLE_REQUEST)
    resp = admin_client.get("/api/admin/generations")
    assert resp.status_code == 200
    gens = resp.json()
    assert isinstance(gens, list)
    assert len(gens) >= 1
    # Each generation should have key fields
    assert "id" in gens[0]
    assert "topic" in gens[0]
    assert "status" in gens[0]


# ---------------------------------------------------------------------------
# Promote / disable / enable / delete user
# ---------------------------------------------------------------------------

def test_admin_promote_user(admin_client, client):
    """Admin can promote a free user to Pro."""
    # Register a fresh user to promote
    client.post("/api/auth/register", json={
        "email": "topromote@test.edu",
        "password": "TestPass123!",
        "full_name": "Promote Me",
    })

    # Find the user id via admin list
    users = admin_client.get("/api/admin/users").json()
    target = next((u for u in users if u["email"] == "topromote@test.edu"), None)
    assert target is not None
    user_id = target["id"]

    resp = admin_client.post(f"/api/admin/users/{user_id}/promote")
    assert resp.status_code == 200
    assert "PRO" in resp.json()["message"].upper()


def test_admin_disable_and_enable_user(admin_client, client):
    """Admin can disable then re-enable a user."""
    client.post("/api/auth/register", json={
        "email": "todisable@test.edu",
        "password": "TestPass123!",
        "full_name": "Disable Me",
    })

    users = admin_client.get("/api/admin/users").json()
    target = next((u for u in users if u["email"] == "todisable@test.edu"), None)
    assert target is not None
    user_id = target["id"]

    # Disable
    disable_resp = admin_client.post(f"/api/admin/users/{user_id}/disable")
    assert disable_resp.status_code == 200

    # Enable
    enable_resp = admin_client.post(f"/api/admin/users/{user_id}/enable")
    assert enable_resp.status_code == 200


def test_admin_delete_user(admin_client, client):
    """Admin can delete a non-admin user."""
    client.post("/api/auth/register", json={
        "email": "todelete_admin@test.edu",
        "password": "TestPass123!",
        "full_name": "Delete Me",
    })

    users = admin_client.get("/api/admin/users").json()
    target = next((u for u in users if u["email"] == "todelete_admin@test.edu"), None)
    assert target is not None
    user_id = target["id"]

    resp = admin_client.delete(f"/api/admin/users/{user_id}")
    assert resp.status_code == 200

    # User should no longer appear in list
    users_after = admin_client.get("/api/admin/users").json()
    emails_after = [u["email"] for u in users_after]
    assert "todelete_admin@test.edu" not in emails_after


def test_admin_cannot_delete_self(admin_client):
    """Admin cannot delete their own account via admin endpoint."""
    me = admin_client.get("/api/auth/me").json()
    resp = admin_client.delete(f"/api/admin/users/{me['id']}")
    assert resp.status_code == 400


def test_admin_cannot_disable_admin(admin_client):
    """Admin cannot disable another admin user."""
    me = admin_client.get("/api/auth/me").json()
    resp = admin_client.post(f"/api/admin/users/{me['id']}/disable")
    assert resp.status_code == 403


def test_admin_user_not_found(admin_client):
    resp = admin_client.post("/api/admin/users/999999/promote")
    assert resp.status_code == 404
