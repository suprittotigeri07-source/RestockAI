import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, List, Optional
from datetime import timedelta
from src.ml_engine.features import FeatureEngineer
from src.utils.logger import logger

class XGBoostForecaster:
    """
    Forecasting model utilizing XGBoost Regressor with time-series feature engineering.
    """
    
    def __init__(self):
        self.model = None
        self.feature_cols = FeatureEngineer.get_feature_columns()
        self.last_known_df = None
        
    def fit(self, df_history: pd.DataFrame) -> "XGBoostForecaster":
        """
        Extracts features and trains XGBoost regressor on historical sales.
        df_history must contain: ['store_id', 'item_id', 'date', 'units_sold', 'price']
        """
        df_feats = FeatureEngineer.create_features(df_history)
        self.last_known_df = df_feats.tail(30).copy()
        
        X = df_feats[self.feature_cols]
        y = df_feats["units_sold"]
        
        try:
            from xgboost import XGBRegressor
            m = XGBRegressor(
                n_estimators=120,
                learning_rate=0.06,
                max_depth=5,
                subsample=0.85,
                colsample_bytree=0.85,
                random_state=42,
                verbosity=0
            )
            m.fit(X, y)
            self.model = m
        except Exception as e:
            logger.warning(f"XGBoost not available ({e}), falling back to sklearn GradientBoostingRegressor")
            from sklearn.ensemble import GradientBoostingRegressor
            m = GradientBoostingRegressor(
                n_estimators=80,
                learning_rate=0.08,
                max_depth=4,
                random_state=42
            )
            m.fit(X, y)
            self.model = m
            
        return self

    def predict(self, periods: int = 7) -> pd.DataFrame:
        """
        Iteratively forecasts future demand for `periods` days ahead using autoregressive rolling features.
        """
        if self.model is None or self.last_known_df is None:
            raise ValueError("Model must be fitted before predict() is called.")
            
        future_records = []
        current_buffer = self.last_known_df.copy()
        
        last_date = pd.to_datetime(current_buffer["date"].max())
        store_id = current_buffer["store_id"].iloc[0]
        item_id = current_buffer["item_id"].iloc[0]
        base_price = current_buffer["price"].iloc[-1]
        
        for i in range(1, periods + 1):
            next_date = last_date + timedelta(days=i)
            
            # Construct row for feature calculation
            new_row = pd.DataFrame([{
                "store_id": store_id,
                "item_id": item_id,
                "date": next_date,
                "units_sold": 0, # placeholder
                "price": base_price
            }])
            
            temp_combined = pd.concat([current_buffer, new_row], ignore_index=True)
            temp_feats = FeatureEngineer.create_features(temp_combined)
            
            feat_row = temp_feats.iloc[[-1]][self.feature_cols]
            pred_val = float(np.maximum(0, self.model.predict(feat_row)[0]))
            
            # Update placeholder with prediction for autoregressive lags
            new_row["units_sold"] = pred_val
            current_buffer = pd.concat([current_buffer, new_row], ignore_index=True)
            
            # Confidence interval heuristic based on historical variance
            hist_std = float(current_buffer["units_sold"].tail(14).std()) if len(current_buffer) > 5 else 4.0
            lower = max(0.0, round(pred_val - 1.64 * hist_std, 2))
            upper = round(pred_val + 1.64 * hist_std, 2)
            
            future_records.append({
                "forecast_date": next_date.date(),
                "predicted_demand": round(pred_val, 2),
                "lower_bound": lower,
                "upper_bound": upper
            })
            
        return pd.DataFrame(future_records)
