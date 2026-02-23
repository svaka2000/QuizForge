"""Tests for PDF generation and download endpoints (10D)."""
import pytest

SAMPLE_REQUEST = {
    "topic": "Cell Biology",
    "subject": "Science",
    "grade_level": "9",
    "difficulty": "medium",
    "question_count": 4,
    "include_multiple_choice": True,
    "include_short_answer": False,
    "include_word_problems": False,
    "include_diagrams": False,
    "points_per_question": 10,
}

PDF_MAGIC = b"%PDF"


def _make_generation(auth_client) -> int:
    resp = auth_client.post("/api/generations", json=SAMPLE_REQUEST)
    assert resp.status_code == 201
    return resp.json()["id"]


def test_pdf_version_a_is_valid_pdf(auth_client):
    """Downloaded version_a PDF starts with the %PDF magic bytes."""
    gen_id = _make_generation(auth_client)
    resp = auth_client.get(f"/api/generations/{gen_id}/download/version_a")
    assert resp.status_code == 200
    assert resp.content[:4] == PDF_MAGIC


def test_pdf_version_b_is_valid_pdf(auth_client):
    """Downloaded version_b PDF starts with the %PDF magic bytes."""
    gen_id = _make_generation(auth_client)
    resp = auth_client.get(f"/api/generations/{gen_id}/download/version_b")
    assert resp.status_code == 200
    assert resp.content[:4] == PDF_MAGIC


def test_pdf_answer_key_is_valid_pdf(auth_client):
    """Downloaded answer_key PDF starts with the %PDF magic bytes."""
    gen_id = _make_generation(auth_client)
    resp = auth_client.get(f"/api/generations/{gen_id}/download/answer_key")
    assert resp.status_code == 200
    assert resp.content[:4] == PDF_MAGIC


def test_pdf_file_size_reasonable(auth_client):
    """Each PDF should be between 1 KB and 5 MB — catches empty/corrupted files."""
    gen_id = _make_generation(auth_client)
    for file_type in ("version_a", "version_b", "answer_key"):
        resp = auth_client.get(f"/api/generations/{gen_id}/download/{file_type}")
        size = len(resp.content)
        assert size >= 1 * 1024, f"{file_type} PDF too small: {size} bytes"
        assert size <= 5 * 1024 * 1024, f"{file_type} PDF too large: {size} bytes"


def test_pdf_requires_auth(client):
    """Downloading without a token returns 401."""
    # We need a real generation ID; create one using a throwaway auth session
    client.post("/api/auth/register", json={
        "email": "pdf_noauth@test.edu",
        "password": "TestPass123!",
    })
    resp = client.post("/api/auth/login", data={
        "username": "pdf_noauth@test.edu",
        "password": "TestPass123!",
    })
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    gen = client.post("/api/generations", json=SAMPLE_REQUEST, headers=headers)
    gen_id = gen.json()["id"]

    # Now attempt without auth
    resp_unauth = client.get(f"/api/generations/{gen_id}/download/version_a")
    assert resp_unauth.status_code == 401


def test_pdf_wrong_user(client):
    """Downloading another user's PDF returns 403."""
    # User X creates a generation
    client.post("/api/auth/register", json={"email": "pdf_userX@test.edu", "password": "TestPass123!"})
    login_x = client.post("/api/auth/login", data={"username": "pdf_userX@test.edu", "password": "TestPass123!"})
    headers_x = {"Authorization": f"Bearer {login_x.json()['access_token']}"}
    gen = client.post("/api/generations", json=SAMPLE_REQUEST, headers=headers_x)
    gen_id = gen.json()["id"]

    # User Y tries to download it
    client.post("/api/auth/register", json={"email": "pdf_userY@test.edu", "password": "TestPass123!"})
    login_y = client.post("/api/auth/login", data={"username": "pdf_userY@test.edu", "password": "TestPass123!"})
    headers_y = {"Authorization": f"Bearer {login_y.json()['access_token']}"}

    resp = client.get(f"/api/generations/{gen_id}/download/version_a", headers=headers_y)
    assert resp.status_code == 403
