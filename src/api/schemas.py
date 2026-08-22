from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import date, datetime

class HealthCheckResponse(BaseModel):
    status: str = "ok"
    database_connected: bool = True
    total_stores: int = 0
    total_items: int = 0
    total_forecasts: int = 0
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str = "1.0.0"

class StoreResponse(BaseModel):
    store_id: str
    name: str
    region: str

class RecommendationItemResponse(BaseModel):
    item_id: str
    name: str
    category: str
    unit_cost: float
    current_price: float
    stock_on_hand: int
    predicted_demand_7d: float
    predicted_demand_30d: float
    recommended_reorder_qty: int
    stockout_risk_days: float
    urgency: str # CRITICAL, MODERATE, HEALTHY
    model_used: str
    explanation: str
    lower_bound_7d: float
    upper_bound_7d: float

class RecommendationSummaryResponse(BaseModel):
    store_id: str
    store_name: str
    region: str
    total_items: int
    critical_restocks_count: int
    total_recommended_reorder_units: int
    estimated_reorder_investment: float
    recommendations: List[RecommendationItemResponse]

class SheetsExportRequest(BaseModel):
    spreadsheet_title: Optional[str] = None
    sheet_name: Optional[str] = None

class SheetsExportResponse(BaseModel):
    status: str
    message: str
    store_id: str
    rows_exported: int
    spreadsheet_url: Optional[str] = None
