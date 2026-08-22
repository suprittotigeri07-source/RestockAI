import pandas as pd
import numpy as np
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
import uuid
import time
from sqlalchemy import text
from src.database.connection import engine, get_db_session
from src.database.models import Store, Item, SalesDaily, Forecast, SystemLog
from src.ml_engine.evaluator import ModelEvaluator
from src.utils.logger import logger
from src.utils.config import settings

class ForecastPipeline:
    """
    End-to-End Demand Forecast Pipeline:
    - Trains Prophet & XGBoost models on store-item historical sales
    - Compares backtested MAPE/RMSE and selects the winning model
    - Computes 7-day and 30-day future demand predictions with confidence bounds
    - Persists results to the `forecasts` relational database table
    """
    
    def __init__(self, store_ids: Optional[List[str]] = None, item_ids: Optional[List[str]] = None):
        self.store_ids = store_ids
        self.item_ids = item_ids
        
    def run(self, max_pairs: Optional[int] = None) -> Dict[str, Any]:
        start_time = time.time()
        logger.info("==============================================")
        logger.info("Starting RestockAI ML Demand Forecast Pipeline")
        logger.info("==============================================")
        
        # 1. Fetch available store and item pairs
        with get_db_session() as session:
            q_stores = session.query(Store.store_id)
            if self.store_ids:
                q_stores = q_stores.filter(Store.store_id.in_(self.store_ids))
            stores = [r[0] for r in q_stores.all()]
            
            q_items = session.query(Item.item_id)
            if self.item_ids:
                q_items = q_items.filter(Item.item_id.in_(self.item_ids))
            items = [r[0] for r in q_items.all()]

        logger.info(f"Targeting {len(stores)} stores and {len(items)} items for forecasting...")
        
        pairs = []
        for s in stores:
            for itm in items:
                pairs.append((s, itm))
                if max_pairs and len(pairs) >= max_pairs:
                    break
            if max_pairs and len(pairs) >= max_pairs:
                break
                
        logger.info(f"Generating forecasts for {len(pairs)} store-item pairs...")
        
        stats = {
            "total_pairs": len(pairs),
            "forecasts_generated": 0,
            "models_used": {"Prophet": 0, "XGBoost": 0},
            "status": "SUCCESS"
        }
        
        forecast_rows = []
        
        # Load historical sales dataframe
        with engine.connect() as conn:
            df_all_sales = pd.read_sql(
                "SELECT store_id, item_id, date, units_sold, stock_on_hand, price FROM sales_daily",
                con=conn
            )
            
        if df_all_sales.empty:
            logger.warning("No historical sales data found in database. Run ETL pipeline first.")
            stats["status"] = "NO_DATA"
            return stats
            
        df_all_sales["date"] = pd.to_datetime(df_all_sales["date"])
        grouped_sales = df_all_sales.groupby(["store_id", "item_id"])
        
        for store_id, item_id in pairs:
            if (store_id, item_id) not in grouped_sales.groups:
                continue
                
            df_pair = grouped_sales.get_group((store_id, item_id)).sort_values(by="date")
            if len(df_pair) < 7:
                continue
                
            # Evaluate & pick best model
            best_model_name, fitted_model, metrics = ModelEvaluator.evaluate_and_select_best(df_pair, test_days=14)
            stats["models_used"][best_model_name] = stats["models_used"].get(best_model_name, 0) + 1
            
            # Predict 30 days ahead (which covers both 7-day and 30-day horizons)
            preds_df = fitted_model.predict(periods=30)
            
            # 7-day total demand forecast
            preds_7d = preds_df.head(7)
            sum_7d = float(preds_7d["predicted_demand"].sum())
            lower_7d = float(preds_7d["lower_bound"].sum())
            upper_7d = float(preds_7d["upper_bound"].sum())
            
            forecast_rows.append({
                "forecast_id": f"FCST_{store_id}_{item_id}_7D_{date.today().isoformat()}",
                "store_id": store_id,
                "item_id": item_id,
                "forecast_date": date.today(),
                "horizon_days": 7,
                "predicted_demand": round(sum_7d, 2),
                "lower_bound": round(lower_7d, 2),
                "upper_bound": round(upper_7d, 2),
                "model_used": best_model_name,
                "model_mape": metrics["mape"],
                "model_rmse": metrics["rmse"],
                "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            })
            
            # 30-day total demand forecast
            sum_30d = float(preds_df["predicted_demand"].sum())
            lower_30d = float(preds_df["lower_bound"].sum())
            upper_30d = float(preds_df["upper_bound"].sum())
            
            forecast_rows.append({
                "forecast_id": f"FCST_{store_id}_{item_id}_30D_{date.today().isoformat()}",
                "store_id": store_id,
                "item_id": item_id,
                "forecast_date": date.today(),
                "horizon_days": 30,
                "predicted_demand": round(sum_30d, 2),
                "lower_bound": round(lower_30d, 2),
                "upper_bound": round(upper_30d, 2),
                "model_used": best_model_name,
                "model_mape": metrics["mape"],
                "model_rmse": metrics["rmse"],
                "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            })
            
            stats["forecasts_generated"] += 2

        # Persist forecasts into Database
        if forecast_rows:
            self._save_forecasts(forecast_rows)
            
        duration_ms = int((time.time() - start_time) * 1000)
        logger.info(f"ML Forecasting Pipeline completed in {duration_ms} ms. Stats: {stats}")
        self._log_system_event("ML_FORECAST_RUN", "ForecastPipeline", "SUCCESS", str(stats), duration_ms)
        
        return stats

    def _save_forecasts(self, rows: List[Dict[str, Any]]):
        # Portable upsert for forecasts
        with engine.begin() as conn:
            if engine.dialect.name == "sqlite":
                conn.execute(
                    text("""
                        INSERT OR REPLACE INTO forecasts (
                            forecast_id, store_id, item_id, forecast_date, horizon_days,
                            predicted_demand, lower_bound, upper_bound, model_used,
                            model_mape, model_rmse, created_at
                        ) VALUES (:forecast_id, :store_id, :item_id, :forecast_date, :horizon_days,
                                  :predicted_demand, :lower_bound, :upper_bound, :model_used,
                                  :model_mape, :model_rmse, :created_at)
                    """),
                    rows
                )
            else:
                conn.execute(
                    text("""
                        INSERT INTO forecasts (
                            forecast_id, store_id, item_id, forecast_date, horizon_days,
                            predicted_demand, lower_bound, upper_bound, model_used,
                            model_mape, model_rmse, created_at
                        ) VALUES (:forecast_id, :store_id, :item_id, :forecast_date, :horizon_days,
                                  :predicted_demand, :lower_bound, :upper_bound, :model_used,
                                  :model_mape, :model_rmse, :created_at)
                        ON CONFLICT (forecast_id) DO UPDATE SET
                            predicted_demand = EXCLUDED.predicted_demand,
                            lower_bound = EXCLUDED.lower_bound,
                            upper_bound = EXCLUDED.upper_bound,
                            model_used = EXCLUDED.model_used,
                            model_mape = EXCLUDED.model_mape,
                            model_rmse = EXCLUDED.model_rmse
                    """),
                    rows
                )
        logger.info(f"Persisted {len(rows)} forecast records into database.")

    def _log_system_event(self, event_type: str, component: str, status: str, details: str, duration_ms: int):
        try:
            with get_db_session() as session:
                session.add(SystemLog(
                    log_id=str(uuid.uuid4()),
                    event_type=event_type,
                    component=component,
                    status=status,
                    details=details,
                    execution_time_ms=duration_ms
                ))
        except Exception as e:
            logger.warning(f"Failed to write log: {e}")

if __name__ == "__main__":
    pipeline = ForecastPipeline()
    pipeline.run(max_pairs=50)
