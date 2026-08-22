import pandas as pd
import numpy as np
from typing import Tuple, List, Dict, Any
from datetime import datetime
from src.utils.logger import logger

class DataValidationError(Exception):
    """Raised when critical dataset validation fails."""
    pass

class SchemaValidator:
    """
    Validates CSV tables for schema, required columns, data types, and value constraints.
    Rejects bad or malformed rows cleanly without crashing the pipeline.
    """
    
    STORE_COLUMNS = {"store_id", "name", "region"}
    ITEM_COLUMNS = {"item_id", "name", "category", "unit_cost"}
    SALES_COLUMNS = {"store_id", "item_id", "date", "units_sold", "stock_on_hand", "price"}
    
    @staticmethod
    def validate_stores(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Validates stores dataframe."""
        if df.empty:
            return pd.DataFrame(), pd.DataFrame()
            
        missing_cols = SchemaValidator.STORE_COLUMNS - set(df.columns)
        if missing_cols:
            raise DataValidationError(f"Stores file missing required columns: {missing_cols}")
            
        clean_mask = (
            df["store_id"].notna() & 
            (df["store_id"].astype(str).str.strip() != "") &
            df["name"].notna() & 
            df["region"].notna()
        )
        
        valid_df = df[clean_mask].copy()
        valid_df["store_id"] = valid_df["store_id"].astype(str).str.strip()
        valid_df["name"] = valid_df["name"].astype(str).str.strip()
        valid_df["region"] = valid_df["region"].astype(str).str.strip()
        
        invalid_df = df[~clean_mask].copy()
        if not invalid_df.empty:
            invalid_df["rejection_reason"] = "Missing store_id, name, or region"
            
        return valid_df, invalid_df

    @staticmethod
    def validate_items(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Validates items dataframe."""
        if df.empty:
            return pd.DataFrame(), pd.DataFrame()
            
        missing_cols = SchemaValidator.ITEM_COLUMNS - set(df.columns)
        if missing_cols:
            raise DataValidationError(f"Items file missing required columns: {missing_cols}")
            
        # Coerce unit_cost to numeric
        cost_numeric = pd.to_numeric(df["unit_cost"], errors="coerce")
        
        clean_mask = (
            df["item_id"].notna() & 
            (df["item_id"].astype(str).str.strip() != "") &
            df["name"].notna() & 
            df["category"].notna() &
            cost_numeric.notna() & 
            (cost_numeric > 0)
        )
        
        valid_df = df[clean_mask].copy()
        valid_df["item_id"] = valid_df["item_id"].astype(str).str.strip()
        valid_df["name"] = valid_df["name"].astype(str).str.strip()
        valid_df["category"] = valid_df["category"].astype(str).str.strip()
        valid_df["unit_cost"] = cost_numeric[clean_mask].round(2)
        
        invalid_df = df[~clean_mask].copy()
        if not invalid_df.empty:
            invalid_df["rejection_reason"] = "Missing item attributes or invalid unit_cost <= 0"
            
        return valid_df, invalid_df

    @staticmethod
    def validate_sales_daily(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Validates daily sales records:
        - Store and Item IDs must be non-empty strings
        - Date must parse to valid YYYY-MM-DD
        - units_sold >= 0
        - stock_on_hand >= 0
        - price > 0
        """
        if df.empty:
            return pd.DataFrame(), pd.DataFrame()
            
        missing_cols = SchemaValidator.SALES_COLUMNS - set(df.columns)
        if missing_cols:
            raise DataValidationError(f"Sales file missing required columns: {missing_cols}")
            
        parsed_dates = pd.to_datetime(df["date"], errors="coerce", format="%Y-%m-%d")
        units_sold = pd.to_numeric(df["units_sold"], errors="coerce")
        stock = pd.to_numeric(df["stock_on_hand"], errors="coerce")
        price = pd.to_numeric(df["price"], errors="coerce")
        
        clean_mask = (
            df["store_id"].notna() & (df["store_id"].astype(str).str.strip() != "") &
            df["item_id"].notna() & (df["item_id"].astype(str).str.strip() != "") &
            parsed_dates.notna() &
            units_sold.notna() & (units_sold >= 0) &
            stock.notna() & (stock >= 0) &
            price.notna() & (price > 0)
        )
        
        valid_df = df[clean_mask].copy()
        valid_df["store_id"] = valid_df["store_id"].astype(str).str.strip()
        valid_df["item_id"] = valid_df["item_id"].astype(str).str.strip()
        valid_df["date"] = parsed_dates[clean_mask].dt.date
        valid_df["units_sold"] = units_sold[clean_mask].astype(int)
        valid_df["stock_on_hand"] = stock[clean_mask].astype(int)
        valid_df["price"] = price[clean_mask].round(2)
        
        # Deduplicate composite primary key (store_id, item_id, date)
        valid_df = valid_df.drop_duplicates(subset=["store_id", "item_id", "date"], keep="last")
        
        invalid_df = df[~clean_mask].copy()
        if not invalid_df.empty:
            invalid_df["rejection_reason"] = "Malformed values in date, units_sold, stock, or price"
            
        return valid_df, invalid_df
