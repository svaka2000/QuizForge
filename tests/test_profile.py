"""Tests for profile endpoints: update profile, change password, delete account."""
import pytest


def _register_and_login(client, email: str, password: str = "TestPass123!") -> str:
    """Helper: register a user and return a Bearer token."""
    client.post("/api/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Test User",
    })
    resp = client.post("/api/auth/login", data={
        "username": email,
        "password": password,
    })
    return resp.json()["access_token"]


# ---------------------------------------------------------------------------
# Update profile
# ---------------------------------------------------------------------------

def test_update_profile_full_name(client):
    token = _register_and_login(client, "profile1@test.edu")
    resp = client.put(
        "/api/auth/me",
        json={"full_name": "Updated Name"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Updated Name"


def test_update_profile_school_name(client):
    token = _register_and_login(client, "profile2@test.edu")
    resp = client.put(
        "/api/auth/me",
        json={"school_name": "Lincoln High School"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["school_name"] == "Lincoln High School"


def test_update_profile_requires_auth(client):
    resp = client.put("/api/auth/me", json={"full_name": "Nobody"})
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Change password
# ---------------------------------------------------------------------------

def test_change_password_success(client):
    email = "changepw1@test.edu"
    old_pw = "OldPass123!"
    new_pw = "NewPass456!"

    token = _register_and_login(client, email, old_pw)
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post(
        "/api/auth/change-password",
        json={"current_password": old_pw, "new_password": new_pw},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["message"] == "Password updated successfully"

    # Old password should no longer work
    bad_login = client.post("/api/auth/login", data={
        "username": email,
        "password": old_pw,
    })
    assert bad_login.status_code == 401

    # New password should work
    good_login = client.post("/api/auth/login", data={
        "username": email,
        "password": new_pw,
    })
    assert good_login.status_code == 200
    assert "access_token" in good_login.json()


def test_change_password_wrong_current(client):
    token = _register_and_login(client, "changepw2@test.edu")
    resp = client.post(
        "/api/auth/change-password",
        json={"current_password": "WrongOldPass!", "new_password": "NewPass456!"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 400
    assert "incorrect" in resp.json()["detail"].lower()


def test_change_password_too_short(client):
    token = _register_and_login(client, "changepw3@test.edu")
    resp = client.post(
        "/api/auth/change-password",
        json={"current_password": "TestPass123!", "new_password": "short"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 422


def test_change_password_requires_auth(client):
    resp = client.post(
        "/api/auth/change-password",
        json={"current_password": "TestPass123!", "new_password": "NewPass456!"},
    )
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Delete account
# ---------------------------------------------------------------------------

def test_delete_account_success(client):
    email = "deleteacc1@test.edu"
    password = "TestPass123!"

    token = _register_and_login(client, email, password)
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post(
        "/api/auth/delete-account",
        json={"password": password},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["message"] == "Account deleted"

    # Should no longer be able to log in
    login_resp = client.post("/api/auth/login", data={
        "username": email,
        "password": password,
    })
    assert login_resp.status_code == 401


def test_delete_account_wrong_password(client):
    token = _register_and_login(client, "deleteacc2@test.edu")
    resp = client.post(
        "/api/auth/delete-account",
        json={"password": "WrongPassword!"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 400
    assert "incorrect" in resp.json()["detail"].lower()


def test_delete_account_requires_auth(client):
    resp = client.post("/api/auth/delete-account", json={"password": "any"})
    assert resp.status_code == 401
