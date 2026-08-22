import pytest
import pandas as pd
import numpy as np
from datetime import datetime, date, timedelta
from src.ml_engine.features import FeatureEngineer
from src.ml_engine.prophet_model import ProphetForecaster
from src.ml_engine.xgboost_model import XGBoostForecaster
from src.ml_engine.evaluator import ModelEvaluator
from src.ml_engine.forecast_pipeline import ForecastPipeline
from src.database.connection import get_db_session, init_db
from src.database.models import Store, Item, SalesDaily, Forecast

@pytest.fixture
def sample_sales_df():
    # 90 days of synthetic sales for 1 store-item
    dates = [date.today() - timedelta(days=i) for i in range(90, 0, -1)]
    records = []
    for d in dates:
        dow = d.weekday()
        base = 30 + (10 if dow in [4, 5, 6] else 0)
        units = int(np.random.poisson(base))
        records.append({
            "store_id": "STR_001",
            "item_id": "ITM_0001",
            "date": d,
            "units_sold": units,
            "stock_on_hand": 80,
            "price": 4.99
        })
    return pd.DataFrame(records)

def test_feature_engineering(sample_sales_df):
    feats_df = FeatureEngineer.create_features(sample_sales_df)
    cols = FeatureEngineer.get_feature_columns()
    for c in cols:
        assert c in feats_df.columns
    assert len(feats_df) == len(sample_sales_df)
    assert not feats_df["rolling_mean_7"].isna().any()

def test_xgboost_forecaster(sample_sales_df):
    model = XGBoostForecaster()
    model.fit(sample_sales_df)
    preds = model.predict(periods=7)
    
    assert len(preds) == 7
    assert set(preds.columns) == {"forecast_date", "predicted_demand", "lower_bound", "upper_bound"}
    assert (preds["predicted_demand"] >= 0).all()
    assert (preds["lower_bound"] <= preds["predicted_demand"]).all()
    assert (preds["upper_bound"] >= preds["predicted_demand"]).all()

def test_prophet_forecaster(sample_sales_df):
    model = ProphetForecaster()
    model.fit(sample_sales_df)
    preds = model.predict(periods=7)
    
    assert len(preds) == 7
    assert (preds["predicted_demand"] >= 0).all()
    assert (preds["lower_bound"] <= preds["predicted_demand"]).all()
    assert (preds["upper_bound"] >= preds["predicted_demand"]).all()

def test_model_evaluator(sample_sales_df):
    best_name, fitted_model, metrics = ModelEvaluator.evaluate_and_select_best(sample_sales_df, test_days=14)
    assert best_name in ["Prophet", "XGBoost", "Holt-Winters"]
    assert "mape" in metrics
    assert "rmse" in metrics
    assert metrics["mape"] >= 0
    assert metrics["rmse"] >= 0

def test_forecast_pipeline_db_write(sample_sales_df):
    init_db()
    with get_db_session() as session:
        session.query(Forecast).delete()
        session.query(SalesDaily).delete()
        session.query(Item).delete()
        session.query(Store).delete()
        
        session.add(Store(store_id="STR_001", name="Test Store", region="East"))
        session.add(Item(item_id="ITM_0001", name="Test Item", category="Beverages", unit_cost=2.00))
        
        for _, row in sample_sales_df.iterrows():
            session.add(SalesDaily(
                store_id=row["store_id"],
                item_id=row["item_id"],
                date=row["date"],
                units_sold=row["units_sold"],
                stock_on_hand=row["stock_on_hand"],
                price=row["price"]
            ))
            
    pipeline = ForecastPipeline(store_ids=["STR_001"], item_ids=["ITM_0001"])
    stats = pipeline.run()
    
    assert stats["status"] == "SUCCESS"
    assert stats["forecasts_generated"] == 2 # 7D and 30D
    
    with get_db_session() as session:
        fcsts = session.query(Forecast).filter_by(store_id="STR_001", item_id="ITM_0001").all()
        assert len(fcsts) == 2
        horizons = {f.horizon_days for f in fcsts}
        assert horizons == {7, 30}
        for f in fcsts:
            assert float(f.predicted_demand) >= 0
            assert float(f.lower_bound) <= float(f.predicted_demand)
            assert float(f.upper_bound) >= float(f.predicted_demand)
