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
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


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
