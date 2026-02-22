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
        "password": "CorrectPass1!",
    })
    resp = client.post("/api/auth/login", data={
        "username": "wrongpw@test.edu",
        "password": "WrongPass1!",
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


# ---------------------------------------------------------------------------
# 10A: Password strength validation
# ---------------------------------------------------------------------------

def test_password_too_weak(client):
    """'password' has no uppercase or number — should return 422."""
    resp = client.post("/api/auth/register", json={
        "email": "weakpw1@test.edu",
        "password": "password",
    })
    assert resp.status_code == 422


def test_password_no_uppercase(client):
    """'password1!' has no uppercase — should return 422."""
    resp = client.post("/api/auth/register", json={
        "email": "weakpw2@test.edu",
        "password": "password1!",
    })
    assert resp.status_code == 422


def test_password_no_number(client):
    """'Password!' has no digit — should return 422."""
    resp = client.post("/api/auth/register", json={
        "email": "weakpw3@test.edu",
        "password": "Password!",
    })
    assert resp.status_code == 422


def test_change_password_in_auth(client):
    """Successfully change password and verify old/new login behaviour."""
    old_pw = "OldPass123!"
    new_pw = "NewPass456!"
    client.post("/api/auth/register", json={
        "email": "chpw_auth1@test.edu",
        "password": old_pw,
        "full_name": "Change PW",
    })
    login_resp = client.post("/api/auth/login", data={
        "username": "chpw_auth1@test.edu",
        "password": old_pw,
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post(
        "/api/auth/change-password",
        json={"current_password": old_pw, "new_password": new_pw},
        headers=headers,
    )
    assert resp.status_code == 200

    bad = client.post("/api/auth/login", data={
        "username": "chpw_auth1@test.edu",
        "password": old_pw,
    })
    assert bad.status_code == 401

    good = client.post("/api/auth/login", data={
        "username": "chpw_auth1@test.edu",
        "password": new_pw,
    })
    assert good.status_code == 200
    assert "access_token" in good.json()


def test_change_password_wrong_current_in_auth(client):
    """Submit wrong current password → 400."""
    client.post("/api/auth/register", json={
        "email": "chpw_auth2@test.edu",
        "password": "TestPass123!",
    })
    login = client.post("/api/auth/login", data={
        "username": "chpw_auth2@test.edu",
        "password": "TestPass123!",
    })
    token = login.json()["access_token"]

    resp = client.post(
        "/api/auth/change-password",
        json={"current_password": "WrongOldPass1!", "new_password": "NewPass456!"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 400


def test_delete_account_in_auth(client):
    """Delete account, verify 401 on subsequent login."""
    client.post("/api/auth/register", json={
        "email": "delacc_auth1@test.edu",
        "password": "TestPass123!",
    })
    login = client.post("/api/auth/login", data={
        "username": "delacc_auth1@test.edu",
        "password": "TestPass123!",
    })
    token = login.json()["access_token"]

    resp = client.post(
        "/api/auth/delete-account",
        json={"password": "TestPass123!"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200

    relogin = client.post("/api/auth/login", data={
        "username": "delacc_auth1@test.edu",
        "password": "TestPass123!",
    })
    assert relogin.status_code == 401


def test_update_profile_in_auth(client):
    """PUT /api/auth/me with new full_name and school_name → 200."""
    client.post("/api/auth/register", json={
        "email": "profile_auth1@test.edu",
        "password": "TestPass123!",
        "full_name": "Original Name",
    })
    login = client.post("/api/auth/login", data={
        "username": "profile_auth1@test.edu",
        "password": "TestPass123!",
    })
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.put(
        "/api/auth/me",
        json={"full_name": "Updated Name", "school_name": "Test High School"},
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["full_name"] == "Updated Name"
    assert data["school_name"] == "Test High School"


def test_update_profile_empty_name(client):
    """Empty full_name should either be rejected (422) or left as empty (200)."""
    client.post("/api/auth/register", json={
        "email": "profile_auth2@test.edu",
        "password": "TestPass123!",
        "full_name": "Keep This Name",
    })
    login = client.post("/api/auth/login", data={
        "username": "profile_auth2@test.edu",
        "password": "TestPass123!",
    })
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.put("/api/auth/me", json={"full_name": ""}, headers=headers)
    assert resp.status_code in (200, 422)


def test_rate_limit_login(client):
    """Rate limiting on login (documenting production behaviour — disabled in tests).

    In production the endpoint is limited to 10/minute. In test mode the limiter
    is completely disabled (TESTING=true), so this test is always skipped in CI.
    """
    import os
    if os.environ.get("TESTING") == "true":
        import pytest
        pytest.skip("Rate limiting disabled in test mode — documents production behaviour only")

    client.post("/api/auth/register", json={
        "email": "ratelimit_test@test.edu",
        "password": "TestPass123!",
    })
    statuses = []
    for _ in range(12):
        resp = client.post("/api/auth/login", data={
            "username": "ratelimit_test@test.edu",
            "password": "WrongPass1!",
        })
        statuses.append(resp.status_code)
    assert 429 in statuses
