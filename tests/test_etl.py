import pytest
import pandas as pd
import numpy as np
from datetime import datetime, date
from pathlib import Path

from src.data_pipeline.schema_validator import SchemaValidator, DataValidationError
from src.data_pipeline.generate_synthetic_data import generate_synthetic_data
from src.data_pipeline.etl import ETLPipeline
from src.database.connection import get_db_session, init_db
from src.database.models import Store, Item, SalesDaily, SystemLog

@pytest.fixture(autouse=True)
def setup_test_db():
    """Initializes the database schema before each test."""
    init_db()
    with get_db_session() as session:
        session.query(SalesDaily).delete()
        session.query(Item).delete()
        session.query(Store).delete()
        session.query(SystemLog).delete()
    yield

def test_store_validation():
    raw_stores = pd.DataFrame([
        {"store_id": "STR_001", "name": "Downtown Store", "region": "Midwest"},
        {"store_id": "", "name": "Invalid Empty ID", "region": "West"},
        {"store_id": "STR_003", "name": None, "region": "East"},
        {"store_id": "STR_004", "name": "Valid Store 4", "region": "South"}
    ])
    
    valid_df, bad_df = SchemaValidator.validate_stores(raw_stores)
    assert len(valid_df) == 2
    assert len(bad_df) == 2
    assert set(valid_df["store_id"]) == {"STR_001", "STR_004"}
    assert "rejection_reason" in bad_df.columns

def test_item_validation():
    raw_items = pd.DataFrame([
        {"item_id": "ITM_001", "name": "Almond Milk", "category": "Dairy", "unit_cost": 2.50},
        {"item_id": "ITM_002", "name": "Negative Cost Item", "category": "Dairy", "unit_cost": -1.00},
        {"item_id": "ITM_003", "name": "Zero Cost Item", "category": "Bakery", "unit_cost": 0.00},
        {"item_id": "ITM_004", "name": "Invalid Cost Type", "category": "Snacks", "unit_cost": "free"},
        {"item_id": "ITM_005", "name": "Valid Bread", "category": "Bakery", "unit_cost": "3.25"}
    ])
    
    valid_df, bad_df = SchemaValidator.validate_items(raw_items)
    assert len(valid_df) == 2
    assert len(bad_df) == 3
    assert set(valid_df["item_id"]) == {"ITM_001", "ITM_005"}
    assert valid_df.loc[valid_df["item_id"] == "ITM_005", "unit_cost"].values[0] == 3.25

def test_sales_daily_validation():
    raw_sales = pd.DataFrame([
        {"store_id": "STR_001", "item_id": "ITM_001", "date": "2026-01-01", "units_sold": 15, "stock_on_hand": 80, "price": 3.99},
        {"store_id": "STR_001", "item_id": "ITM_002", "date": "2026-02-30", "units_sold": 10, "stock_on_hand": 50, "price": 4.99}, # Bad date
        {"store_id": "STR_001", "item_id": "ITM_003", "date": "2026-01-01", "units_sold": -5, "stock_on_hand": 20, "price": 2.50}, # Negative sales
        {"store_id": "STR_002", "item_id": "ITM_001", "date": "2026-01-01", "units_sold": 8, "stock_on_hand": -10, "price": 3.99}, # Negative stock
        {"store_id": "STR_002", "item_id": "ITM_002", "date": "2026-01-01", "units_sold": 5, "stock_on_hand": 30, "price": 0.00}, # Zero price
        {"store_id": "STR_002", "item_id": "ITM_003", "date": "2026-01-01", "units_sold": 12, "stock_on_hand": 45, "price": 5.49}, # Valid
    ])
    
    valid_df, bad_df = SchemaValidator.validate_sales_daily(raw_sales)
    assert len(valid_df) == 2
    assert len(bad_df) == 4
    assert valid_df["units_sold"].min() >= 0
    assert valid_df["stock_on_hand"].min() >= 0
    assert valid_df["price"].min() > 0

def test_synthetic_data_generation_and_etl(tmp_path):
    # 1. Generate small synthetic dataset into temp dir
    raw_dir = tmp_path / "raw"
    quarantine_dir = tmp_path / "quarantine"
    
    df_stores, df_items, _ = generate_synthetic_data(
        num_stores=3,
        num_items=5,
        days=36,
        output_dir=str(raw_dir),
        seed=101
    )
    
    assert (raw_dir / "stores.csv").exists()
    assert (raw_dir / "items.csv").exists()
    assert (raw_dir / "sales_daily.csv").exists()
    assert len(df_stores) == 3
    assert len(df_items) == 5
    
    # 2. Run ETL pipeline
    etl = ETLPipeline(raw_dir=str(raw_dir), quarantine_dir=str(quarantine_dir))
    stats = etl.run()
    
    assert stats["status"] == "SUCCESS"
    assert stats["stores"]["loaded"] == 3
    assert stats["items"]["loaded"] == 5
    assert stats["sales"]["loaded"] == (3 * 5 * 36)
    
    # 3. Verify in Database
    with get_db_session() as session:
        stores_count = session.query(Store).count()
        items_count = session.query(Item).count()
        sales_count = session.query(SalesDaily).count()
        logs_count = session.query(SystemLog).count()
        
        assert stores_count == 3
        assert items_count == 5
        assert sales_count == (3 * 5 * 36)
        assert logs_count >= 1
