import os
os.environ["TESTING"] = "true"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db

TEST_DATABASE_URL = "sqlite:///./test_quizforge.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    from app.models import user, generation, subscription  # noqa
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_client(client):
    """Returns a client with a registered, logged-in PRO user.

    The user is upgraded to PRO so that generation tests don't hit the free-tier
    daily limit when tests share the session-scoped DB.  Free-tier limit behaviour
    is tested separately in test_limits.py using dedicated email addresses.
    """
    from app.models.user import User, UserTier

    client.post("/api/auth/register", json={
        "email": "test@school.edu",
        "password": "TestPass123!",
        "full_name": "Test Teacher",
    })

    # Ensure the user is PRO so multiple generation tests don't hit the daily cap.
    db = TestingSessionLocal()
    try:
        user = db.query(User).filter(User.email == "test@school.edu").first()
        if user:
            user.tier = UserTier.PRO
            db.commit()
    finally:
        db.close()

    resp = client.post("/api/auth/login", data={
        "username": "test@school.edu",
        "password": "TestPass123!",
    })
    token = resp.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client


@pytest.fixture
def admin_client(client):
    """Returns a client logged in as an admin user."""
    from app.models.user import User, UserTier
    from app.core.security import hash_password

    # Register admin user (may already exist from previous test)
    client.post("/api/auth/register", json={
        "email": "admin_test@school.edu",
        "password": "AdminPass123!",
        "full_name": "Admin User",
    })

    # Directly set is_admin=True via the test DB
    db = TestingSessionLocal()
    try:
        user = db.query(User).filter(User.email == "admin_test@school.edu").first()
        if user:
            user.is_admin = True
            user.tier = UserTier.PRO
            db.commit()
    finally:
        db.close()

    resp = client.post("/api/auth/login", data={
        "username": "admin_test@school.edu",
        "password": "AdminPass123!",
    })
    token = resp.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client
