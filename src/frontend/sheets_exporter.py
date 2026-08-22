import os
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
from datetime import datetime
from src.utils.config import settings
from src.utils.logger import logger

class GoogleSheetsExporter:
    """
    Exports store restock recommendations to Google Sheets using gspread.
    Includes mock fallback for offline or unauthenticated environments.
    """
    
    def __init__(self):
        self.creds_file = settings.GOOGLE_SHEETS_CREDENTIALS_FILE
        self.client = None
        self._init_client()
        
    def _init_client(self):
        if os.path.exists(self.creds_file):
            try:
                import gspread
                self.client = gspread.service_account(filename=self.creds_file)
                logger.info(f"Google Sheets API client initialized using {self.creds_file}")
            except Exception as e:
                logger.warning(f"Failed to initialize gspread client: {e}")
                self.client = None
        else:
            logger.info("Google Sheets credentials file not found. Running in simulation export mode.")

    def export_recommendations(
        self,
        store_id: str,
        store_name: str,
        recommendations: List[Dict[str, Any]],
        spreadsheet_title: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Exports recommendations list to Google Sheets (or CSV export fallback).
        """
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        title = spreadsheet_title or f"RestockAI - {store_name} ({store_id}) - {datetime.now().strftime('%Y-%m-%d')}"
        
        # Prepare formatted export rows
        headers = [
            "Item ID", "Item Name", "Category", "Stock on Hand", 
            "7-Day Demand", "30-Day Demand", "Recommended Reorder", 
            "Stockout Days", "Urgency", "AI Restock Rationale", "Unit Cost ($)", "Est. Reorder Cost ($)"
        ]
        
        rows = [headers]
        for r in recommendations:
            unit_cost = float(r.get("unit_cost", 0.0))
            reorder_qty = int(r.get("recommended_reorder_qty", 0))
            rows.append([
                r.get("item_id", ""),
                r.get("name", ""),
                r.get("category", ""),
                r.get("stock_on_hand", 0),
                r.get("predicted_demand_7d", 0.0),
                r.get("predicted_demand_30d", 0.0),
                reorder_qty,
                round(float(r.get("stockout_risk_days", 0.0)), 1),
                r.get("urgency", "HEALTHY"),
                r.get("explanation", ""),
                unit_cost,
                round(unit_cost * reorder_qty, 2)
            ])
            
        if self.client:
            try:
                # Try opening existing or create new
                try:
                    sh = self.client.open(title)
                except Exception:
                    sh = self.client.create(title)
                    
                worksheet = sh.get_worksheet(0)
                worksheet.clear()
                worksheet.update(rows)
                
                # Format header row
                worksheet.format("A1:L1", {
                    "textFormat": {"bold": True, "foregroundColor": {"red": 1.0, "green": 1.0, "blue": 1.0}},
                    "backgroundColor": {"red": 0.15, "green": 0.35, "blue": 0.70}
                })
                
                return {
                    "status": "SUCCESS",
                    "message": f"Successfully exported {len(recommendations)} recommendations to Google Sheets.",
                    "store_id": store_id,
                    "rows_exported": len(recommendations),
                    "spreadsheet_url": sh.url
                }
            except Exception as e:
                logger.warning(f"Google Sheets API upload error: {e}. Generating local export fallback.")
                
        # Local file export fallback
        export_dir = Path("data/exports")
        export_dir.mkdir(parents=True, exist_ok=True)
        filename = f"Restock_Export_{store_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        file_path = export_dir / filename
        
        df_export = pd.DataFrame(rows[1:], columns=rows[0])
        df_export.to_csv(file_path, index=False)
        
        return {
            "status": "SUCCESS_LOCAL_FALLBACK",
            "message": f"Exported {len(recommendations)} recommendations to local file: {filename} (Provide credentials.json for direct Google Sheets sync).",
            "store_id": store_id,
            "rows_exported": len(recommendations),
            "spreadsheet_url": f"/static/exports/{filename}"
        }

sheets_exporter = GoogleSheetsExporter()
