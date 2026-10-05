import os

import pytest
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, close_all_sessions
from fastapi.testclient import TestClient
from app.limiter import limiter
from app.main import app
import uuid
from app.database import Base, get_db
from app import scheduler as app_scheduler


load_dotenv()

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

engine = create_engine(TEST_DATABASE_URL)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)



@pytest.fixture(autouse=True)
def reset_test_database(monkeypatch):
    monkeypatch.setattr(app_scheduler, "SessionLocal", TestingSessionLocal)
    close_all_sessions()
    engine.dispose()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    yield
    close_all_sessions()
    engine.dispose()


@pytest.fixture
def db():
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client():
    limiter.enabled = False

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    limiter.enabled = True
    

@pytest.fixture
def create_user():
    def _create_user(
        client,
        name,
        email,
        password="testpassword123",
        role="user"
    ):
        response = client.post(
            "/auth/register",
            json={
                "name": name,
                "email": email,
                "password": password
            }
        )

        assert response.status_code == 201

        if role == "organizer":
            db = TestingSessionLocal()

            from app import models

            user = db.query(models.User).filter(
                models.User.email == email
            ).first()

            user.role = "organizer"
            db.commit()

            db.close()

        login_response = client.post(
            "/auth/login",
            json={
                "email": email,
                "password": password
            }
        )

        assert login_response.status_code == 200

        token = login_response.json()["access_token"]

        return {
            "token": token,
            "headers": {
                "Authorization": f"Bearer {token}"
            }
        }

    return _create_user


@pytest.fixture
def create_event(client, create_user):
    def _create_event(
        name="Test Event",
        location="Islamabad",
        capacity=100
    ):
        organizer = create_user(
            client,
            "Test Organizer",
            f"fixture_{uuid.uuid4().hex[:8]}@example.com",
            role="organizer"
        )

        response = client.post(
            "/events",
            headers=organizer["headers"],
            json={
                "name": name,
                "location": location,
                "capacity": capacity
            }
        )

        assert response.status_code == 201

        return {
            "event": response.json(),
            "headers": organizer["headers"]
        }

    return _create_event