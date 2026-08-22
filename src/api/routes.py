from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from datetime import date, datetime
import math
import numpy as np

from src.database.connection import get_db
from src.database.models import Store, Item, SalesDaily, Forecast, SystemLog
from src.api.schemas import (
    HealthCheckResponse,
    StoreResponse,
    RecommendationItemResponse,
    RecommendationSummaryResponse,
    SheetsExportRequest,
    SheetsExportResponse
)
from src.api.llm_explainer import llm_explainer
from src.frontend.sheets_exporter import sheets_exporter
from src.ml_engine.forecast_pipeline import ForecastPipeline
from src.utils.logger import logger

router = APIRouter()

@router.get("/health", response_model=HealthCheckResponse)
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint validating database connectivity and counts."""
    try:
        total_stores = db.query(Store).count()
        total_items = db.query(Item).count()
        total_forecasts = db.query(Forecast).count()
        return HealthCheckResponse(
            status="healthy",
            database_connected=True,
            total_stores=total_stores,
            total_items=total_items,
            total_forecasts=total_forecasts
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthCheckResponse(
            status="unhealthy",
            database_connected=False
        )

@router.get("/stores", response_model=List[StoreResponse])
def list_stores(db: Session = Depends(get_db)):
    """Returns list of all available retail stores."""
    stores = db.query(Store).order_by(Store.store_id).all()
    return [
        StoreResponse(store_id=s.store_id, name=s.name, region=s.region)
        for s in stores
    ]

@router.get("/recommendations/{store_id}", response_model=RecommendationSummaryResponse)
def get_store_recommendations(
    store_id: str,
    category: Optional[str] = None,
    urgency_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Computes real-time inventory recommendations for a store:
    - Queries latest stock on hand and 7d / 30d demand forecasts
    - Calculates recommended reorder quantities using safety stock formulas
    - Attaches plain-English Claude LLM rationale per item
    """
    store = db.query(Store).filter_by(store_id=store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail=f"Store '{store_id}' not found.")
        
    # Get all items
    query_items = db.query(Item)
    if category:
        query_items = query_items.filter(Item.category == category)
    items = query_items.order_by(Item.item_id).all()
    
    # Get latest forecasts for store
    latest_fcsts = db.query(Forecast).filter_by(store_id=store_id).all()
    fcst_map = {}
    for f in latest_fcsts:
        fcst_map[(f.item_id, f.horizon_days)] = f
        
    # Get latest stock on hand and latest price from sales_daily
    subq = (
        db.query(SalesDaily.item_id, func.max(SalesDaily.date).label("max_date"))
        .filter(SalesDaily.store_id == store_id)
        .group_by(SalesDaily.item_id)
        .subquery()
    )
    latest_sales = (
        db.query(SalesDaily)
        .join(subq, (SalesDaily.item_id == subq.c.item_id) & (SalesDaily.date == subq.c.max_date))
        .filter(SalesDaily.store_id == store_id)
        .all()
    )
    sales_map = {s.item_id: s for s in latest_sales}
    
    recommendation_items = []
    total_reorder_units = 0
    total_reorder_cost = 0.0
    critical_count = 0
    
    for itm in items:
        sale = sales_map.get(itm.item_id)
        current_stock = sale.stock_on_hand if sale else 50
        current_price = float(sale.price) if sale else round(float(itm.unit_cost) * 1.35, 2)
        
        # 7-day and 30-day forecast
        fcst_7d = fcst_map.get((itm.item_id, 7))
        fcst_30d = fcst_map.get((itm.item_id, 30))
        
        pred_7d = float(fcst_7d.predicted_demand) if fcst_7d else 40.0
        pred_30d = float(fcst_30d.predicted_demand) if fcst_30d else (pred_7d * 4.2)
        model_used = fcst_7d.model_used if fcst_7d else "XGBoost"
        lower_7d = float(fcst_7d.lower_bound) if fcst_7d else round(pred_7d * 0.75, 2)
        upper_7d = float(fcst_7d.upper_bound) if fcst_7d else round(pred_7d * 1.25, 2)
        
        # Stockout days
        daily_run_rate = max(1.0, pred_7d / 7.0)
        stockout_days = round(current_stock / daily_run_rate, 1)
        
        # Recommended Reorder = max(0, ceil(Demand_7d + SafetyStock(2 days) - CurrentStock))
        safety_stock = int(daily_run_rate * 2.5)
        raw_reorder = int(math.ceil(pred_7d + safety_stock - current_stock))
        recommended_reorder = max(0, raw_reorder)
        
        # Urgency classification
        if stockout_days <= 2.0 or current_stock < (daily_run_rate * 1.5):
            urgency = "CRITICAL"
            critical_count += 1
        elif stockout_days <= 4.5 or recommended_reorder > 0:
            urgency = "MODERATE"
        else:
            urgency = "HEALTHY"
            
        if urgency_filter and urgency != urgency_filter.upper():
            continue
            
        # Claude LLM plain-English restock explanation
        explanation = llm_explainer.generate_explanation(
            item_name=itm.name,
            category=itm.category,
            current_stock=current_stock,
            predicted_demand_7d=pred_7d,
            recommended_reorder=recommended_reorder,
            stockout_days=stockout_days,
            model_used=model_used,
            unit_cost=float(itm.unit_cost)
        )
        
        total_reorder_units += recommended_reorder
        total_reorder_cost += recommended_reorder * float(itm.unit_cost)
        
        recommendation_items.append(RecommendationItemResponse(
            item_id=itm.item_id,
            name=itm.name,
            category=itm.category,
            unit_cost=float(itm.unit_cost),
            current_price=current_price,
            stock_on_hand=current_stock,
            predicted_demand_7d=pred_7d,
            predicted_demand_30d=pred_30d,
            recommended_reorder_qty=recommended_reorder,
            stockout_risk_days=stockout_days,
            urgency=urgency,
            model_used=model_used,
            explanation=explanation,
            lower_bound_7d=lower_7d,
            upper_bound_7d=upper_7d
        ))
        
    urgency_order = {"CRITICAL": 0, "MODERATE": 1, "HEALTHY": 2}
    recommendation_items.sort(key=lambda x: (urgency_order.get(x.urgency, 3), -x.recommended_reorder_qty))
    
    return RecommendationSummaryResponse(
        store_id=store.store_id,
        store_name=store.name,
        region=store.region,
        total_items=len(recommendation_items),
        critical_restocks_count=critical_count,
        total_recommended_reorder_units=total_reorder_units,
        estimated_reorder_investment=round(total_reorder_cost, 2),
        recommendations=recommendation_items
    )

@router.get("/recommendations/{store_id}/{item_id}", response_model=RecommendationItemResponse)
def get_item_recommendation_detail(
    store_id: str,
    item_id: str,
    db: Session = Depends(get_db)
):
    """Detail view for a specific item at a given store."""
    store = db.query(Store).filter_by(store_id=store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
        
    item = db.query(Item).filter_by(item_id=item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    fcst_7d = db.query(Forecast).filter_by(store_id=store_id, item_id=item_id, horizon_days=7).first()
    fcst_30d = db.query(Forecast).filter_by(store_id=store_id, item_id=item_id, horizon_days=30).first()
    
    latest_sale = (
        db.query(SalesDaily)
        .filter_by(store_id=store_id, item_id=item_id)
        .order_by(desc(SalesDaily.date))
        .first()
    )
    
    current_stock = latest_sale.stock_on_hand if latest_sale else 50
    current_price = float(latest_sale.price) if latest_sale else round(float(item.unit_cost) * 1.35, 2)
    
    pred_7d = float(fcst_7d.predicted_demand) if fcst_7d else 40.0
    pred_30d = float(fcst_30d.predicted_demand) if fcst_30d else (pred_7d * 4.2)
    model_used = fcst_7d.model_used if fcst_7d else "XGBoost"
    lower_7d = float(fcst_7d.lower_bound) if fcst_7d else round(pred_7d * 0.75, 2)
    upper_7d = float(fcst_7d.upper_bound) if fcst_7d else round(pred_7d * 1.25, 2)
    
    daily_run_rate = max(1.0, pred_7d / 7.0)
    stockout_days = round(current_stock / daily_run_rate, 1)
    safety_stock = int(daily_run_rate * 2.5)
    recommended_reorder = max(0, int(math.ceil(pred_7d + safety_stock - current_stock)))
    
    urgency = "CRITICAL" if stockout_days <= 2.0 else ("MODERATE" if stockout_days <= 4.5 else "HEALTHY")
    
    explanation = llm_explainer.generate_explanation(
        item_name=item.name,
        category=item.category,
        current_stock=current_stock,
        predicted_demand_7d=pred_7d,
        recommended_reorder=recommended_reorder,
        stockout_days=stockout_days,
        model_used=model_used,
        unit_cost=float(item.unit_cost)
    )
    
    return RecommendationItemResponse(
        item_id=item.item_id,
        name=item.name,
        category=item.category,
        unit_cost=float(item.unit_cost),
        current_price=current_price,
        stock_on_hand=current_stock,
        predicted_demand_7d=pred_7d,
        predicted_demand_30d=pred_30d,
        recommended_reorder_qty=recommended_reorder,
        stockout_risk_days=stockout_days,
        urgency=urgency,
        model_used=model_used,
        explanation=explanation,
        lower_bound_7d=lower_7d,
        upper_bound_7d=upper_7d
    )

@router.post("/export/sheets/{store_id}", response_model=SheetsExportResponse)
def export_to_google_sheets(
    store_id: str,
    payload: Optional[SheetsExportRequest] = None,
    db: Session = Depends(get_db)
):
    """Exports store recommendations to Google Sheets or local CSV fallback."""
    store = db.query(Store).filter_by(store_id=store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
        
    summary = get_store_recommendations(store_id=store_id, db=db)
    recs_dicts = [r.model_dump() for r in summary.recommendations]
    
    title = payload.spreadsheet_title if payload else None
    result = sheets_exporter.export_recommendations(
        store_id=store_id,
        store_name=store.name,
        recommendations=recs_dicts,
        spreadsheet_title=title
    )
    
    return SheetsExportResponse(
        status=result["status"],
        message=result["message"],
        store_id=store_id,
        rows_exported=result["rows_exported"],
        spreadsheet_url=result.get("spreadsheet_url")
    )

@router.post("/forecast/train")
def trigger_forecast_retraining(max_pairs: int = Query(default=100)):
    """Triggers ML model training and forecast regeneration on-demand."""
    pipeline = ForecastPipeline()
    stats = pipeline.run(max_pairs=max_pairs)
    return {"status": "SUCCESS", "details": stats}
