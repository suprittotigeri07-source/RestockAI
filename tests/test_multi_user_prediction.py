import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.api.main import app
from src.database.connection import get_db
from src.database.models import Base, User, UserData, Prediction
from src.utils.security import hash_password, verify_password, create_access_token, decode_access_token

from sqlalchemy.pool import StaticPool

# Test SQLite in-memory engine
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

def test_password_hashing_and_jwt():
    raw_pwd = "SecurePassword123!"
    hashed = hash_password(raw_pwd)
    assert hashed != raw_pwd
    assert verify_password(raw_pwd, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

    token = create_access_token({"sub": "usr_test123", "email": "test@example.com"})
    assert isinstance(token, str)
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "usr_test123"
    assert payload["email"] == "test@example.com"

def test_user_registration_and_login(client):
    # 1. Register User A
    reg_res = client.post("/api/v1/auth/register", json={
        "name": "Alice Developer",
        "email": "alice@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    assert reg_res.status_code == 201
    data = reg_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "alice@example.com"
    assert data["user"]["name"] == "Alice Developer"

    # 2. Duplicate Registration Rejection
    dup_res = client.post("/api/v1/auth/register", json={
        "name": "Alice Clone",
        "email": "alice@example.com",
        "password": "Password123!"
    })
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]

    # 3. Login User A
    login_res = client.post("/api/v1/auth/login", json={
        "email": "alice@example.com",
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    token = login_data["access_token"]

    # 4. Auth Me
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "alice@example.com"

    # 5. Invalid Login Rejection
    bad_login = client.post("/api/v1/auth/login", json={
        "email": "alice@example.com",
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401

def test_model_feature_schema(client):
    res = client.get("/api/v1/model/schema")
    assert res.status_code == 200
    schema = res.json()
    assert "features" in schema
    assert len(schema["features"]) >= 5
    feature_names = [f["name"] for f in schema["features"]]
    assert "price" in feature_names
    assert "category" in feature_names
    assert "stock_on_hand" in feature_names

def test_multi_user_prediction_isolation(client):
    # Register User A
    res_a = client.post("/api/v1/auth/register", json={
        "name": "User A",
        "email": "usera@example.com",
        "password": "Password123!"
    })
    token_a = res_a.json()["access_token"]

    # Register User B
    res_b = client.post("/api/v1/auth/register", json={
        "name": "User B",
        "email": "userb@example.com",
        "password": "Password123!"
    })
    token_b = res_b.json()["access_token"]

    # User A creates a prediction
    pred_data_a = {
        "store_id": "STR_001",
        "category": "Electronics",
        "item_name": "Pro Wireless Headphones",
        "price": 149.99,
        "unit_cost": 85.00,
        "stock_on_hand": 20,
        "daily_sales_avg": 5.5,
        "lead_time_days": 4,
        "discount_pct": 10,
        "season": "Weekend_Peak",
        "horizon_days": 7
    }
    pred_a_res = client.post(
        "/api/v1/predictions",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"input_data": pred_data_a}
    )
    assert pred_a_res.status_code == 201
    pred_a_id = pred_a_res.json()["id"]
    pred_a_val = pred_a_res.json()["prediction"]
    assert pred_a_val > 0
    assert pred_a_res.json()["confidence"] > 50

    # User B creates a different prediction
    pred_data_b = {
        "store_id": "STR_003",
        "category": "Groceries",
        "item_name": "Organic Almond Milk",
        "price": 3.99,
        "unit_cost": 2.10,
        "stock_on_hand": 120,
        "daily_sales_avg": 28.0,
        "lead_time_days": 2,
        "discount_pct": 0,
        "season": "Regular",
        "horizon_days": 7
    }
    pred_b_res = client.post(
        "/api/v1/predictions",
        headers={"Authorization": f"Bearer {token_b}"},
        json={"input_data": pred_data_b}
    )
    assert pred_b_res.status_code == 201
    pred_b_id = pred_b_res.json()["id"]

    # Check User A history contains ONLY User A prediction
    list_a = client.get("/api/v1/predictions", headers={"Authorization": f"Bearer {token_a}"})
    assert list_a.status_code == 200
    preds_a = list_a.json()["predictions"]
    assert len(preds_a) == 1
    assert preds_a[0]["id"] == pred_a_id

    # Check User B history contains ONLY User B prediction
    list_b = client.get("/api/v1/predictions", headers={"Authorization": f"Bearer {token_b}"})
    assert list_b.status_code == 200
    preds_b = list_b.json()["predictions"]
    assert len(preds_b) == 1
    assert preds_b[0]["id"] == pred_b_id

    # User B cannot access User A's prediction by ID
    forbidden_get = client.get(f"/api/v1/predictions/{pred_a_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert forbidden_get.status_code == 404

    # User B cannot delete User A's prediction
    forbidden_del = client.delete(f"/api/v1/predictions/{pred_a_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert forbidden_del.status_code == 404

    # User A can access own prediction
    allowed_get = client.get(f"/api/v1/predictions/{pred_a_id}", headers={"Authorization": f"Bearer {token_a}"})
    assert allowed_get.status_code == 200
    assert allowed_get.json()["id"] == pred_a_id

def test_batch_prediction_from_device_data(client):
    """Verifies batch inference processing for multiple items loaded from device."""
    reg = client.post("/api/v1/auth/register", json={
        "name": "Device Batch User",
        "email": "batch_device@test.io",
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    assert reg.status_code == 201
    token = reg.json()["access_token"]

    items = [
        {
            "category": "Electronics",
            "item_name": "Device Wireless Earbuds",
            "price": 79.99,
            "unit_cost": 35.00,
            "stock_on_hand": 20,
            "daily_sales_avg": 5.0,
            "lead_time_days": 3,
            "discount_pct": 10,
            "season": "Regular",
            "horizon_days": 7
        },
        {
            "category": "Groceries",
            "item_name": "Device Organic Juice 1L",
            "price": 5.49,
            "unit_cost": 2.80,
            "stock_on_hand": 45,
            "daily_sales_avg": 14.0,
            "lead_time_days": 2,
            "discount_pct": 0,
            "season": "Weekend_Peak",
            "horizon_days": 7
        }
    ]

    res = client.post(
        "/api/v1/predictions/batch",
        headers={"Authorization": f"Bearer {token}"},
        json={"items": items}
    )
    assert res.status_code == 201
    data = res.json()
    assert data["total_processed"] == 2
    assert len(data["predictions"]) == 2
    for pred in data["predictions"]:
        assert pred["prediction"] > 0
        user_id = reg.json()["user"]["id"]
        assert pred["user_id"] == user_id

def test_unauthorized_access(client):
    """Verifies that accessing protected prediction endpoints without a token returns 401."""
    res = client.get("/api/v1/predictions")
    assert res.status_code == 401

    res = client.post("/api/v1/predictions", json={"input_data": {}})
    assert res.status_code == 401

    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401
