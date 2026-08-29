import os
import time
import sqlite3
import pandas as pd
from pathlib import Path
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from src.database.connection import engine, init_db, get_db_session
from src.database.models import Store, Item, SalesDaily, SystemLog
from src.data_pipeline.schema_validator import SchemaValidator
from src.utils.logger import logger
import uuid

class ETLPipeline:
    """
    Production ETL Pipeline for retail POS data:
    1. Ingests raw CSV exports from `data/raw/`
    2. Validates types and business constraints row-by-row
    3. Quarantines malformed rows to `data/quarantine/` with rejection reasons
    4. Loads clean data into relational database via idempotent bulk upsert
    5. Logs execution metrics to console and `system_logs`
    """
    
    def __init__(self, raw_dir: str = "data/raw", quarantine_dir: str = "data/quarantine"):
        self.raw_dir = Path(raw_dir)
        self.quarantine_dir = Path(quarantine_dir)
        self.quarantine_dir.mkdir(parents=True, exist_ok=True)
        
    def run(self, max_sales_rows: Optional[int] = None) -> Dict[str, Any]:
        start_time = time.time()
        init_db()
        
        logger.info("==========================================")
        logger.info("Starting RestockAI ETL Pipeline Execution")
        logger.info("==========================================")
        
        stats = {
            "stores": {"ingested": 0, "loaded": 0, "quarantined": 0},
            "items": {"ingested": 0, "loaded": 0, "quarantined": 0},
            "sales": {"ingested": 0, "loaded": 0, "quarantined": 0},
            "status": "SUCCESS"
        }
        
        try:
            # 1. Ingest & Load Stores
            stores_file = self.raw_dir / "stores.csv"
            if stores_file.exists():
                df_stores_raw = pd.read_csv(stores_file)
                stats["stores"]["ingested"] = len(df_stores_raw)
                valid_stores, bad_stores = SchemaValidator.validate_stores(df_stores_raw)
                
                if not bad_stores.empty:
                    q_file = self.quarantine_dir / "quarantine_stores.csv"
                    bad_stores.to_csv(q_file, index=False)
                    stats["stores"]["quarantined"] = len(bad_stores)
                    logger.warning(f"Quarantined {len(bad_stores)} store records to {q_file}")
                    
                self._load_stores(valid_stores)
                stats["stores"]["loaded"] = len(valid_stores)
                logger.info(f"Loaded {len(valid_stores)} valid stores into DB")

            # 2. Ingest & Load Items
            items_file = self.raw_dir / "items.csv"
            if items_file.exists():
                df_items_raw = pd.read_csv(items_file)
                stats["items"]["ingested"] = len(df_items_raw)
                valid_items, bad_items = SchemaValidator.validate_items(df_items_raw)
                
                if not bad_items.empty:
                    q_file = self.quarantine_dir / "quarantine_items.csv"
                    bad_items.to_csv(q_file, index=False)
                    stats["items"]["quarantined"] = len(bad_items)
                    logger.warning(f"Quarantined {len(bad_items)} item records to {q_file}")
                    
                self._load_items(valid_items)
                stats["items"]["loaded"] = len(valid_items)
                logger.info(f"Loaded {len(valid_items)} valid items into DB")

            # 3. Ingest & Load Sales with chunking & upsert
            sales_files = list(self.raw_dir.glob("sales*.csv"))
            for s_file in sales_files:
                logger.info(f"Processing sales file: {s_file.name} in streaming chunks...")
                chunk_size = 50000
                total_loaded_from_file = 0
                
                for chunk in pd.read_csv(s_file, chunksize=chunk_size):
                    if max_sales_rows and total_loaded_from_file >= max_sales_rows:
                        break
                        
                    stats["sales"]["ingested"] += len(chunk)
                    valid_sales, bad_sales = SchemaValidator.validate_sales_daily(chunk)
                    
                    if not bad_sales.empty:
                        q_file = self.quarantine_dir / f"quarantine_{s_file.name}"
                        bad_sales.to_csv(q_file, mode="a", header=not q_file.exists(), index=False)
                        stats["sales"]["quarantined"] += len(bad_sales)
                        
                    if not valid_sales.empty:
                        self._load_sales_chunk(valid_sales)
                        stats["sales"]["loaded"] += len(valid_sales)
                        total_loaded_from_file += len(valid_sales)

                logger.info(f"Loaded {total_loaded_from_file} records from {s_file.name}")

            duration_ms = int((time.time() - start_time) * 1000)
            self._log_system_event("ETL_RUN", "ETLPipeline", "SUCCESS", str(stats), duration_ms)
            logger.info(f"ETL completed successfully in {duration_ms} ms. Stats: {stats}")
            return stats
            
        except Exception as e:
            stats["status"] = "ERROR"
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error(f"ETL failed: {e}", exc_info=True)
            self._log_system_event("ETL_RUN", "ETLPipeline", "ERROR", str(e), duration_ms)
            raise

    def _load_stores(self, df: pd.DataFrame):
        if df.empty:
            return
        with get_db_session() as session:
            for _, row in df.iterrows():
                store = session.query(Store).filter_by(store_id=row["store_id"]).first()
                if store:
                    store.name = row["name"]
                    store.region = row["region"]
                else:
                    session.add(Store(
                        store_id=row["store_id"],
                        name=row["name"],
                        region=row["region"]
                    ))

    def _load_items(self, df: pd.DataFrame):
        if df.empty:
            return
        with get_db_session() as session:
            for _, row in df.iterrows():
                item = session.query(Item).filter_by(item_id=row["item_id"]).first()
                if item:
                    item.name = row["name"]
                    item.category = row["category"]
                    item.unit_cost = row["unit_cost"]
                else:
                    session.add(Item(
                        item_id=row["item_id"],
                        name=row["name"],
                        category=row["category"],
                        unit_cost=row["unit_cost"]
                    ))

    def _load_sales_chunk(self, df: pd.DataFrame):
        """High-speed bulk upsert using native SQL parameters."""
        records = [
            (
                row["store_id"],
                row["item_id"],
                str(row["date"]),
                int(row["units_sold"]),
                int(row["stock_on_hand"]),
                float(row["price"])
            )
            for _, row in df.iterrows()
        ]
        
        # Portable UPSERT: Replace in SQLite / On Conflict in Postgres
        with engine.begin() as conn:
            if engine.dialect.name == "sqlite":
                conn.execute(
                    text("INSERT OR REPLACE INTO sales_daily (store_id, item_id, date, units_sold, stock_on_hand, price) VALUES (:1, :2, :3, :4, :5, :6)"),
                    [{"1": r[0], "2": r[1], "3": r[2], "4": r[3], "5": r[4], "6": r[5]} for r in records]
                )
            else:
                conn.execute(
                    text("""
                        INSERT INTO sales_daily (store_id, item_id, date, units_sold, stock_on_hand, price)
                        VALUES (:1, :2, :3, :4, :5, :6)
                        ON CONFLICT (store_id, item_id, date) 
                        DO UPDATE SET units_sold = EXCLUDED.units_sold, stock_on_hand = EXCLUDED.stock_on_hand, price = EXCLUDED.price
                    """),
                    [{"1": r[0], "2": r[1], "3": r[2], "4": r[3], "5": r[4], "6": r[5]} for r in records]
                )

    def _log_system_event(self, event_type: str, component: str, status: str, details: str, duration_ms: int):
        try:
            with get_db_session() as session:
                log_entry = SystemLog(
                    log_id=str(uuid.uuid4()),
                    event_type=event_type,
                    component=component,
                    status=status,
                    details=details,
                    execution_time_ms=duration_ms
                )
                session.add(log_entry)
        except Exception as e:
            logger.warning(f"Could not write to system_logs table: {e}")

if __name__ == "__main__":
    pipeline = ETLPipeline()
    pipeline.run(max_sales_rows=50000)
