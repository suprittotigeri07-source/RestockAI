import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from src.api.main import app
from src.database.connection import get_db_session, init_db
from src.database.models import Store, Item, SalesDaily, Forecast, User
from datetime import date

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_api_test_data():
    init_db()
    with get_db_session() as session:
        session.query(Forecast).delete()
        session.query(SalesDaily).delete()
        session.query(Item).delete()
        session.query(Store).delete()
        
        # Add test store
        session.add(Store(store_id="STR_001", name="Downtown Metro", region="Midwest"))
        
        # Add test items
        session.add(Item(item_id="ITM_0001", name="Organic Green Tea", category="Beverages", unit_cost=3.50))
        session.add(Item(item_id="ITM_0002", name="Artisan Bread", category="Bakery", unit_cost=2.20))
        
        # Add latest sales
        session.add(SalesDaily(
            store_id="STR_001", item_id="ITM_0001", date=date.today(), units_sold=25, stock_on_hand=15, price=5.99
        ))
        session.add(SalesDaily(
            store_id="STR_001", item_id="ITM_0002", date=date.today(), units_sold=10, stock_on_hand=80, price=3.99
        ))
        
        # Add forecasts
        session.add(Forecast(
            forecast_id="FCST_001_7D", store_id="STR_001", item_id="ITM_0001", forecast_date=date.today(),
            horizon_days=7, predicted_demand=180.0, lower_bound=150.0, upper_bound=210.0, model_used="XGBoost"
        ))
        session.add(Forecast(
            forecast_id="FCST_001_30D", store_id="STR_001", item_id="ITM_0001", forecast_date=date.today(),
            horizon_days=30, predicted_demand=750.0, lower_bound=650.0, upper_bound=850.0, model_used="XGBoost"
        ))
    yield

def test_health_check_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database_connected"] is True
    assert data["total_stores"] >= 1
    assert data["total_items"] >= 2

def test_list_stores_endpoint():
    response = client.get("/api/v1/stores")
    assert response.status_code == 200
    stores = response.json()
    assert len(stores) >= 1
    assert stores[0]["store_id"] == "STR_001"

def test_store_recommendations_endpoint():
    response = client.get("/api/v1/recommendations/STR_001")
    assert response.status_code == 200
    data = response.json()
    assert data["store_id"] == "STR_001"
    assert data["store_name"] == "Downtown Metro"
    assert data["total_items"] == 2
    
    # Check item recommendations
    recs = data["recommendations"]
    assert len(recs) == 2
    
    tea_rec = next(r for r in recs if r["item_id"] == "ITM_0001")
    assert tea_rec["stock_on_hand"] == 15
    assert tea_rec["predicted_demand_7d"] == 180.0
    assert tea_rec["recommended_reorder_qty"] > 0
    assert tea_rec["urgency"] == "CRITICAL"
    assert len(tea_rec["explanation"]) > 10

def test_item_detail_endpoint():
    response = client.get("/api/v1/recommendations/STR_001/ITM_0001")
    assert response.status_code == 200
    data = response.json()
    assert data["item_id"] == "ITM_0001"
    assert data["name"] == "Organic Green Tea"
    assert data["predicted_demand_7d"] == 180.0

def test_sheets_export_endpoint():
    response = client.post("/api/v1/export/sheets/STR_001")
    assert response.status_code == 200
    data = response.json()
    assert "SUCCESS" in data["status"]
    assert data["store_id"] == "STR_001"
    assert data["rows_exported"] == 2

def test_user_register_login_round_trip():
    # Clean up test user if it exists from a previous run
    with get_db_session() as session:
        session.query(User).filter(User.email == "freshuser@example.com").delete()
        session.commit()

    # 1. Register a fresh user
    reg_payload = {
        "name": "Fresh User",
        "email": "freshuser@example.com",
        "password": "FreshPassword123!",
        "confirm_password": "FreshPassword123!"
    }
    reg_response = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_response.status_code == 201
    reg_data = reg_response.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == "freshuser@example.com"

    # 2. Immediately log in successfully
    login_payload = {
        "email": "freshuser@example.com",
        "password": "FreshPassword123!"
    }
    login_response = client.post("/api/v1/auth/login", json=login_payload)
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert "access_token" in login_data
    assert login_data["user"]["email"] == "freshuser@example.com"

    # Clean up test user after test
    with get_db_session() as session:
        session.query(User).filter(User.email == "freshuser@example.com").delete()
        session.commit()
