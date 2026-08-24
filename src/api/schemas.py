from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any, Union
from datetime import date, datetime

# ==========================================================
# Authentication & User Schemas
# ==========================================================

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name of user")
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=6, description="Password (min 6 chars)")
    confirm_password: Optional[str] = Field(None, description="Password confirmation")

class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="Account password")

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ForgotPasswordResponse(BaseModel):
    message: str
    reset_token: Optional[str] = None

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_token: str
    new_password: str = Field(..., min_length=6)

# ==========================================================
# Dynamic Schema & Prediction Schemas
# ==========================================================

class FeatureSchemaOption(BaseModel):
    value: Union[str, int, float]
    label: str

class FeatureSchemaField(BaseModel):
    name: str
    label: str
    type: str # text, number, select, slider, radio
    required: bool = True
    default: Optional[Union[str, int, float, bool]] = None
    placeholder: Optional[str] = None
    description: Optional[str] = None
    min: Optional[float] = None
    max: Optional[float] = None
    step: Optional[float] = None
    options: Optional[List[FeatureSchemaOption]] = None

class FeatureSchemaResponse(BaseModel):
    model_name: str
    description: str
    features: List[FeatureSchemaField]

class PredictionCreate(BaseModel):
    input_data: Dict[str, Any] = Field(..., description="Feature key-value pairs")

class BatchPredictionCreate(BaseModel):
    items: List[Dict[str, Any]] = Field(..., description="List of feature objects from uploaded file")

class PredictionResponse(BaseModel):
    id: str
    user_id: str
    input_data: Dict[str, Any]
    prediction: float
    confidence: float
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None
    metrics: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None

class BatchPredictionResponse(BaseModel):
    total_processed: int
    predictions: List[PredictionResponse]

class PredictionListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    predictions: List[PredictionResponse]

class UserDataCreate(BaseModel):
    title: Optional[str] = "Untitled Dataset"
    input_data: Dict[str, Any]

class UserDataResponse(BaseModel):
    id: str
    user_id: str
    title: Optional[str] = None
    input_data: Dict[str, Any]
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# ==========================================================
# Retail Inventory & Existing System Schemas
# ==========================================================

class HealthCheckResponse(BaseModel):
    status: str = "ok"
    database_connected: bool = True
    total_stores: int = 0
    total_items: int = 0
    total_forecasts: int = 0
    total_users: int = 0
    total_predictions: int = 0
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str = "2.0.0"

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
