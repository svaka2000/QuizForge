import pytest


SAMPLE_REQUEST = {
    "topic": "Photosynthesis",
    "subject": "Science",
    "grade_level": "7",
    "difficulty": "medium",
    "question_count": 5,
    "include_multiple_choice": True,
    "include_short_answer": True,
    "include_word_problems": False,
    "include_diagrams": False,
    "points_per_question": 10,
}


def test_create_generation(auth_client):
    resp = auth_client.post("/api/generations", json=SAMPLE_REQUEST)
    assert resp.status_code == 201
    data = resp.json()
    assert data["topic"] == "Photosynthesis"
    assert data["status"] == "completed"
    assert data["questions_a"] is not None
    assert len(data["questions_a"]) == 5
    assert data["pdf_version_a"] is not None
    assert data["pdf_version_b"] is not None
    assert data["pdf_answer_key"] is not None
    assert data["generator_used"] in ("mock", "claude")


def test_list_generations(auth_client):
    auth_client.post("/api/generations", json=SAMPLE_REQUEST)
    resp = auth_client.get("/api/generations")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "pages" in data
    assert isinstance(data["items"], list)
    assert len(data["items"]) >= 1


def test_get_generation_detail(auth_client):
    create_resp = auth_client.post("/api/generations", json=SAMPLE_REQUEST)
    gen_id = create_resp.json()["id"]

    resp = auth_client.get(f"/api/generations/{gen_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == gen_id
    assert "questions_a" in data
    assert "questions_b" in data
    assert data["questions_a"] is not None
    assert data["status"] == "completed"


def test_delete_generation(auth_client):
    create_resp = auth_client.post("/api/generations", json=SAMPLE_REQUEST)
    gen_id = create_resp.json()["id"]

    resp = auth_client.delete(f"/api/generations/{gen_id}")
    assert resp.status_code == 204

    resp2 = auth_client.get(f"/api/generations/{gen_id}")
    assert resp2.status_code == 404


def test_generation_requires_auth(client):
    resp = client.post("/api/generations", json=SAMPLE_REQUEST)
    assert resp.status_code == 401


def test_generation_validation(auth_client):
    resp = auth_client.post("/api/generations", json={
        "topic": "x",  # too short
        "subject": "",
        "grade_level": "",
    })
    assert resp.status_code == 422


def test_mock_generator_versions_differ(auth_client):
    """Verify Version A and B have different question orderings."""
    resp = auth_client.post("/api/generations", json={**SAMPLE_REQUEST, "question_count": 8})
    assert resp.status_code == 201
    data = resp.json()
    q_a = data["questions_a"]
    q_b = data["questions_b"]
    assert len(q_a) == 8
    assert len(q_b) == 8
    # Questions should be in different order or have different content
    a_texts = [q["question"] for q in q_a]
    b_texts = [q["question"] for q in q_b]
    assert a_texts != b_texts or q_a[0]["correct_answer"] != q_b[0]["correct_answer"]


# ---------------------------------------------------------------------------
# 10B: Additional generation tests
# ---------------------------------------------------------------------------

def test_generation_creates_three_pdfs(auth_client):
    """After successful generation all three download endpoints return 200 with PDF content."""
    resp = auth_client.post("/api/generations", json=SAMPLE_REQUEST)
    assert resp.status_code == 201
    gen_id = resp.json()["id"]

    for file_type in ("version_a", "version_b", "answer_key"):
        dl = auth_client.get(f"/api/generations/{gen_id}/download/{file_type}")
        assert dl.status_code == 200, f"{file_type} download failed: {dl.status_code}"
        assert dl.headers.get("content-type", "").startswith("application/pdf")


def test_unauthorized_access_other_generation(client):
    """User B cannot download or view User A's generation."""
    # User A
    client.post("/api/auth/register", json={"email": "userA_gen@test.edu", "password": "TestPass123!"})
    resp_a = client.post("/api/auth/login", data={"username": "userA_gen@test.edu", "password": "TestPass123!"})
    headers_a = {"Authorization": f"Bearer {resp_a.json()['access_token']}"}

    gen_resp = client.post("/api/generations", json=SAMPLE_REQUEST, headers=headers_a)
    gen_id = gen_resp.json()["id"]

    # User B
    client.post("/api/auth/register", json={"email": "userB_gen@test.edu", "password": "TestPass123!"})
    resp_b = client.post("/api/auth/login", data={"username": "userB_gen@test.edu", "password": "TestPass123!"})
    headers_b = {"Authorization": f"Bearer {resp_b.json()['access_token']}"}

    # User B tries to download User A's generation
    dl = client.get(f"/api/generations/{gen_id}/download/version_a", headers=headers_b)
    assert dl.status_code == 403


def test_generation_free_tier_limit_detail(client):
    """4th generation on free tier returns 429 with upgrade suggestion."""
    client.post("/api/auth/register", json={"email": "freelimit_gen@test.edu", "password": "TestPass123!"})
    resp = client.post("/api/auth/login", data={"username": "freelimit_gen@test.edu", "password": "TestPass123!"})
    headers = {"Authorization": f"Bearer {resp.json()['access_token']}"}

    req = {**SAMPLE_REQUEST, "question_count": 3, "include_short_answer": False, "include_word_problems": False}
    for _ in range(3):
        client.post("/api/generations", json=req, headers=headers)

    resp4 = client.post("/api/generations", json=req, headers=headers)
    assert resp4.status_code == 429
    detail = resp4.json().get("detail", "")
    assert "detail" in resp4.json()
    assert len(detail) > 0


def test_delete_generation_hides_from_list(auth_client):
    """Soft-deleted generation no longer appears in list and returns 404 on get."""
    create = auth_client.post("/api/generations", json=SAMPLE_REQUEST)
    gen_id = create.json()["id"]

    auth_client.delete(f"/api/generations/{gen_id}")

    list_resp = auth_client.get("/api/generations")
    ids = [g["id"] for g in list_resp.json()["items"]]
    assert gen_id not in ids

    get_resp = auth_client.get(f"/api/generations/{gen_id}")
    assert get_resp.status_code == 404


def test_preview_endpoint(auth_client):
    """GET /api/generations/{id}/preview returns version_a and version_b questions."""
    create = auth_client.post("/api/generations", json=SAMPLE_REQUEST)
    gen_id = create.json()["id"]

    resp = auth_client.get(f"/api/generations/{gen_id}/preview")
    assert resp.status_code == 200
    data = resp.json()
    assert "questions_a" in data
    assert "questions_b" in data
    assert isinstance(data["questions_a"], list)
    assert len(data["questions_a"]) > 0


def test_list_pagination(auth_client):
    """Create multiple generations and verify page 1/page 2 return correct items."""
    # Create 5 generations (auth_client is PRO so no limit)
    for _ in range(5):
        auth_client.post("/api/generations", json={**SAMPLE_REQUEST, "question_count": 3,
                                                    "include_short_answer": False,
                                                    "include_word_problems": False})

    page1 = auth_client.get("/api/generations?page=1&limit=3").json()
    assert page1["page"] == 1
    assert page1["limit"] == 3
    assert len(page1["items"]) == 3
    assert page1["total"] >= 5
    assert page1["pages"] >= 2

    page2 = auth_client.get("/api/generations?page=2&limit=3").json()
    assert page2["page"] == 2
    # IDs should be different from page 1
    ids1 = {g["id"] for g in page1["items"]}
    ids2 = {g["id"] for g in page2["items"]}
    assert ids1.isdisjoint(ids2)
