import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, Optional
from datetime import timedelta
from src.utils.logger import logger

class ProphetForecaster:
    """
    Forecasting model utilizing Facebook Prophet (with Seasonal Holt-Winters / Exponential Smoothing fallback).
    """
    
    def __init__(self):
        self.model = None
        self.model_type = "Prophet"
        
    def fit(self, df_history: pd.DataFrame) -> "ProphetForecaster":
        """
        Fits model on historical series.
        df_history must contain: ['date', 'units_sold']
        """
        df = df_history[["date", "units_sold"]].rename(columns={"date": "ds", "units_sold": "y"}).copy()
        df["ds"] = pd.to_datetime(df["ds"])
        df = df.sort_values(by="ds").reset_index(drop=True)
        
        try:
            from prophet import Prophet
            # Suppress prophet logs
            import logging
            logging.getLogger("prophet").setLevel(logging.ERROR)
            logging.getLogger("cmdstanpy").setLevel(logging.ERROR)
            
            m = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                interval_width=0.90,
                growth="linear"
            )
            m.fit(df)
            self.model = m
            self.model_type = "Prophet"
        except Exception as e:
            logger.warning(f"Prophet fit error ({e}), falling back to Statsmodels Holt-Winters Exponential Smoothing")
            try:
                from statsmodels.tsa.holtwinters import ExponentialSmoothing
                # Simple exponential smoothing with 7-day seasonal period
                hw = ExponentialSmoothing(
                    df["y"].values,
                    seasonal_periods=7,
                    trend="add",
                    seasonal="add",
                    initialization_method="estimated"
                ).fit()
                self.model = hw
                self.model_type = "Holt-Winters"
            except Exception as hw_err:
                logger.warning(f"Holt-Winters fallback error: {hw_err}, using rolling baseline")
                self.model = df["y"].tail(14).mean()
                self.model_type = "RollingMean"
                
        return self

    def predict(self, periods: int = 7) -> pd.DataFrame:
        """
        Generates forecast for `periods` days ahead.
        Returns DataFrame with ['forecast_date', 'predicted_demand', 'lower_bound', 'upper_bound']
        """
        if self.model_type == "Prophet":
            future = self.model.make_future_dataframe(periods=periods, freq="D", include_history=False)
            forecast = self.model.predict(future)
            
            res = pd.DataFrame({
                "forecast_date": forecast["ds"].dt.date,
                "predicted_demand": np.maximum(0, forecast["yhat"].values).round(2),
                "lower_bound": np.maximum(0, forecast["yhat_lower"].values).round(2),
                "upper_bound": np.maximum(0, forecast["yhat_upper"].values).round(2)
            })
            return res
        elif self.model_type == "Holt-Winters":
            preds = self.model.forecast(periods)
            preds = np.maximum(0, preds)
            # Estimate bounds via std of residuals
            std_err = float(np.std(self.model.resid)) if hasattr(self.model, "resid") else 5.0
            
            start_date = pd.Timestamp.now().date() + timedelta(days=1)
            dates = [start_date + timedelta(days=i) for i in range(periods)]
            
            return pd.DataFrame({
                "forecast_date": dates,
                "predicted_demand": np.round(preds, 2),
                "lower_bound": np.maximum(0, np.round(preds - 1.64 * std_err, 2)),
                "upper_bound": np.round(preds + 1.64 * std_err, 2)
            })
        else:
            # Baseline mean
            mean_val = float(self.model) if isinstance(self.model, (int, float)) else 20.0
            start_date = pd.Timestamp.now().date() + timedelta(days=1)
            dates = [start_date + timedelta(days=i) for i in range(periods)]
            return pd.DataFrame({
                "forecast_date": dates,
                "predicted_demand": [round(mean_val, 2)] * periods,
                "lower_bound": [round(max(0, mean_val * 0.7), 2)] * periods,
                "upper_bound": [round(mean_val * 1.3, 2)] * periods
            })
