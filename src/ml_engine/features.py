import pandas as pd
import numpy as np
from typing import Tuple, List

class FeatureEngineer:
    """
    Constructs time-series lag, rolling statistics, calendar, and price features
    for demand forecasting models.
    """
    
    @staticmethod
    def create_features(df: pd.DataFrame) -> pd.DataFrame:
        """
        Input df must contain: ['store_id', 'item_id', 'date', 'units_sold', 'price']
        """
        df = df.copy()
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values(by=["store_id", "item_id", "date"]).reset_index(drop=True)
        
        # Calendar features
        df["day_of_week"] = df["date"].dt.dayofweek
        df["day_of_month"] = df["date"].dt.day
        df["month"] = df["date"].dt.month
        df["day_of_year"] = df["date"].dt.dayofyear
        df["is_weekend"] = df["day_of_week"].isin([4, 5, 6]).astype(int)
        
        # Fourier terms for smooth seasonality
        df["sin_doy"] = np.sin(2 * np.pi * df["day_of_year"] / 365.25)
        df["cos_doy"] = np.cos(2 * np.pi * df["day_of_year"] / 365.25)
        
        # Grouped lag features per store-item
        grouped = df.groupby(["store_id", "item_id"])
        
        for lag in [1, 2, 7, 14, 21, 28]:
            df[f"lag_{lag}"] = grouped["units_sold"].shift(lag)
            
        # Grouped rolling features (shift by 1 to prevent data leakage)
        shifted_units = grouped["units_sold"].shift(1)
        
        # Rolling means & standard deviations
        df["rolling_mean_7"] = shifted_units.rolling(window=7, min_periods=1).mean()
        df["rolling_std_7"] = shifted_units.rolling(window=7, min_periods=1).std().fillna(0)
        df["rolling_mean_14"] = shifted_units.rolling(window=14, min_periods=1).mean()
        df["rolling_mean_30"] = shifted_units.rolling(window=30, min_periods=1).mean()
        
        # Fill NA created by early lags with forward/backward fill or mean
        df = df.bfill().ffill()
        
        return df

    @staticmethod
    def get_feature_columns() -> List[str]:
        return [
            "day_of_week", "day_of_month", "month", "is_weekend",
            "sin_doy", "cos_doy", "price",
            "lag_1", "lag_2", "lag_7", "lag_14", "lag_21", "lag_28",
            "rolling_mean_7", "rolling_std_7", "rolling_mean_14", "rolling_mean_30"
        ]
