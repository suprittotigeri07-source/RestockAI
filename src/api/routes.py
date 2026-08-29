import uuid
import json
import math
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from src.database.connection import get_db
from src.database.models import Store, Item, SalesDaily, Forecast, SystemLog, User, UserData, Prediction, PasswordResetToken
from src.utils.config import settings
from src.utils.email import send_password_reset_email
from src.api.schemas import (
    HealthCheckResponse,
    StoreResponse,
    RecommendationItemResponse,
    RecommendationSummaryResponse,
    SheetsExportRequest,
    SheetsExportResponse,
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    FeatureSchemaResponse,
    FeatureSchemaField,
    FeatureSchemaOption,
    PredictionCreate,
    BatchPredictionCreate,
    PredictionResponse,
    BatchPredictionResponse,
    PredictionListResponse,
    UserDataCreate,
    UserDataResponse
)
from src.api.auth import get_current_user
from src.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    validate_password_strength
)
from src.ml_engine.prediction_service import PredictionService
from src.api.llm_explainer import llm_explainer
from src.frontend.sheets_exporter import sheets_exporter
from src.ml_engine.forecast_pipeline import ForecastPipeline
from src.utils.logger import logger

router = APIRouter()

# ==========================================================
# 1. Authentication Endpoints
# ==========================================================

@router.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegister, db: Session = Depends(get_db)):
    """Registers a new user account and returns JWT token."""
    # 1. Validate email uniqueness
    existing_user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in."
        )

    # 2. Check password confirmation if provided
    if payload.confirm_password and payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password and confirmation password do not match."
        )

    # 3. Validate password strength
    is_valid, err_msg = validate_password_strength(payload.password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    # 4. Hash password with bcrypt and save user
    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    hashed_pwd = hash_password(payload.password)
    
    new_user = User(
        id=user_id,
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        password_hash=hashed_pwd
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 5. Issue JWT Access Token
    access_token = create_access_token(data={"sub": new_user.id, "email": new_user.email})
    
    logger.info(f"New user registered: {new_user.email} ({new_user.id})")
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=new_user.id,
            name=new_user.name,
            email=new_user.email,
            created_at=new_user.created_at.isoformat() if new_user.created_at else None,
            updated_at=new_user.updated_at.isoformat() if new_user.updated_at else None
        )
    )

@router.post("/auth/login", response_model=TokenResponse)
def login_user(payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticates user credentials and returns JWT bearer token."""
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials."
        )

    access_token = create_access_token(data={"sub": user.id, "email": user.email})
    logger.info(f"User authenticated successfully: {user.email}")
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            created_at=user.created_at.isoformat() if user.created_at else None,
            updated_at=user.updated_at.isoformat() if user.updated_at else None
        )
    )

@router.get("/auth/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Returns profile information for the authenticated user."""
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        created_at=current_user.created_at.isoformat() if current_user.created_at else None,
        updated_at=current_user.updated_at.isoformat() if current_user.updated_at else None
    )

@router.post("/auth/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generates a password reset token for account recovery and emails it."""
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user:
        # Prevent account enumeration
        return ForgotPasswordResponse(
            message="If an account exists for this email, a password reset link has been sent.",
            reset_token=None
        )
    
    # Generate token
    raw_token = f"rst_{uuid.uuid4().hex}"
    hashed_token = hash_password(raw_token)
    
    reset_record = PasswordResetToken(
        id=f"prt_{uuid.uuid4().hex[:12]}",
        user_id=user.id,
        token_hash=hashed_token,
        expires_at=datetime.utcnow() + timedelta(minutes=30)
    )
    db.add(reset_record)
    db.commit()

    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}&email={user.email}"
    send_password_reset_email(user.email, reset_link)

    return ForgotPasswordResponse(
        message="If an account exists for this email, a password reset link has been sent.",
        reset_token=None
    )

@router.post("/auth/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Resets user password given a valid reset token."""
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid request.")

    # Find a valid token
    valid_token_record = None
    tokens = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).all()
    
    for record in tokens:
        if verify_password(payload.reset_token, record.token_hash):
            valid_token_record = record
            break
            
    if not valid_token_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    is_valid, err_msg = validate_password_strength(payload.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=err_msg)

    user.password_hash = hash_password(payload.new_password)
    user.updated_at = datetime.utcnow()
    valid_token_record.used = True
    
    db.commit()
    return {"status": "SUCCESS", "message": "Password reset successfully. You can now log in with your new password."}

# ==========================================================
# 2. Dynamic Feature Schema Endpoint
# ==========================================================

@router.get("/model/schema", response_model=FeatureSchemaResponse)
def get_model_feature_schema():
    """
    Returns the complete declarative feature schema for dynamic form rendering.
    Allows frontend input forms to adapt seamlessly without hardcoding.
    """
    raw_schema = PredictionService.get_feature_schema()
    fields = []
    for item in raw_schema:
        options = None
        if "options" in item and item["options"]:
            options = [FeatureSchemaOption(value=opt["value"], label=opt["label"]) for opt in item["options"]]
            
        fields.append(FeatureSchemaField(
            name=item["name"],
            label=item["label"],
            type=item["type"],
            required=item.get("required", True),
            default=item.get("default"),
            placeholder=item.get("placeholder"),
            description=item.get("description"),
            min=item.get("min"),
            max=item.get("max"),
            step=item.get("step"),
            options=options
        ))

    return FeatureSchemaResponse(
        model_name="RestockAI XGBoost & Elasticity Demand Regressor",
        description="Dynamic retail demand and replenishment forecasting model with price elasticity and uncertainty estimation.",
        features=fields
    )

# ==========================================================
# 3. Prediction Endpoints (Strictly User Isolated)
# ==========================================================

@router.post("/predictions", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
def create_prediction(
    payload: PredictionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validates input features, executes real ML inference, calculates confidence bounds,
    and stores prediction isolated under the authenticated user's ID.
    """
    try:
        pred_result = PredictionService.preprocess_and_predict(payload.input_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        logger.error(f"Prediction inference failure: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Prediction model processing failed.")

    pred_id = f"pred_{uuid.uuid4().hex[:12]}"
    
    # Store in database
    prediction_record = Prediction(
        id=pred_id,
        user_id=current_user.id,
        input_data=json.dumps(payload.input_data),
        prediction=pred_result["prediction"],
        confidence=pred_result["confidence"],
        lower_bound=pred_result["lower_bound"],
        upper_bound=pred_result["upper_bound"]
    )
    db.add(prediction_record)
    db.commit()
    db.refresh(prediction_record)

    logger.info(f"Created prediction {pred_id} for user {current_user.email}")
    return PredictionResponse(
        id=prediction_record.id,
        user_id=prediction_record.user_id,
        input_data=payload.input_data,
        prediction=float(prediction_record.prediction),
        confidence=float(prediction_record.confidence),
        lower_bound=float(prediction_record.lower_bound) if prediction_record.lower_bound else None,
        upper_bound=float(prediction_record.upper_bound) if prediction_record.upper_bound else None,
        metrics=pred_result.get("metrics"),
        created_at=prediction_record.created_at.isoformat() if prediction_record.created_at else None
    )

@router.post("/predictions/batch", response_model=BatchPredictionResponse, status_code=status.HTTP_201_CREATED)
def create_batch_predictions(
    payload: BatchPredictionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Processes multiple feature rows (e.g. from an uploaded CSV/JSON file on the user's device)
    and saves all predictions associated with the authenticated user.
    """
    created_predictions = []
    
    for item in payload.items:
        try:
            pred_result = PredictionService.preprocess_and_predict(item)
            pred_id = f"pred_{uuid.uuid4().hex[:12]}"
            
            record = Prediction(
                id=pred_id,
                user_id=current_user.id,
                input_data=json.dumps(item),
                prediction=pred_result["prediction"],
                confidence=pred_result["confidence"],
                lower_bound=pred_result["lower_bound"],
                upper_bound=pred_result["upper_bound"]
            )
            db.add(record)
            created_predictions.append((record, item, pred_result))
        except Exception as e:
            logger.warning(f"Skipping malformed batch row: {e}")
            continue

    db.commit()
    
    results = []
    for record, raw_inp, res in created_predictions:
        db.refresh(record)
        results.append(PredictionResponse(
            id=record.id,
            user_id=record.user_id,
            input_data=raw_inp,
            prediction=float(record.prediction),
            confidence=float(record.confidence),
            lower_bound=float(record.lower_bound) if record.lower_bound else None,
            upper_bound=float(record.upper_bound) if record.upper_bound else None,
            metrics=res.get("metrics"),
            created_at=record.created_at.isoformat() if record.created_at else None
        ))

    return BatchPredictionResponse(
        total_processed=len(results),
        predictions=results
    )

@router.get("/predictions", response_model=PredictionListResponse)
def list_user_predictions(
    search: Optional[str] = None,
    category: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns paginated prediction history ONLY for the authenticated user.
    Never exposes another user's records.
    """
    query = db.query(Prediction).filter(Prediction.user_id == current_user.id)
    
    if search:
        query = query.filter(Prediction.input_data.ilike(f"%{search}%"))
        
    total = query.count()
    offset = (page - 1) * page_size
    records = query.order_by(desc(Prediction.created_at)).offset(offset).limit(page_size).all()
    
    results = []
    for r in records:
        try:
            parsed_inputs = json.loads(r.input_data)
        except Exception:
            parsed_inputs = {}
            
        if category and parsed_inputs.get("category") != category:
            continue
            
        results.append(PredictionResponse(
            id=r.id,
            user_id=r.user_id,
            input_data=parsed_inputs,
            prediction=float(r.prediction),
            confidence=float(r.confidence),
            lower_bound=float(r.lower_bound) if r.lower_bound else None,
            upper_bound=float(r.upper_bound) if r.upper_bound else None,
            created_at=r.created_at.isoformat() if r.created_at else None
        ))
        
    return PredictionListResponse(
        total=total,
        page=page,
        page_size=page_size,
        predictions=results
    )

@router.get("/predictions/{prediction_id}", response_model=PredictionResponse)
def get_single_prediction(
    prediction_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves a specific prediction record, ensuring strict user ownership."""
    record = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not record or record.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction record not found.")

    try:
        parsed_inputs = json.loads(record.input_data)
    except Exception:
        parsed_inputs = {}

    # Compute metrics for detailed view
    try:
        pred_res = PredictionService.preprocess_and_predict(parsed_inputs)
        metrics = pred_res.get("metrics")
    except Exception:
        metrics = None

    return PredictionResponse(
        id=record.id,
        user_id=record.user_id,
        input_data=parsed_inputs,
        prediction=float(record.prediction),
        confidence=float(record.confidence),
        lower_bound=float(record.lower_bound) if record.lower_bound else None,
        upper_bound=float(record.upper_bound) if record.upper_bound else None,
        metrics=metrics,
        created_at=record.created_at.isoformat() if record.created_at else None
    )

@router.delete("/predictions/{prediction_id}")
def delete_prediction(
    prediction_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a prediction record owned by the authenticated user."""
    record = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not record or record.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction record not found.")

    db.delete(record)
    db.commit()
    return {"status": "SUCCESS", "message": f"Prediction {prediction_id} deleted successfully."}

# ==========================================================
# 4. User Data Management Endpoints (Strictly User Isolated)
# ==========================================================

@router.post("/user-data", response_model=UserDataResponse, status_code=status.HTTP_201_CREATED)
def save_user_data(
    payload: UserDataCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Saves user input features as a stored dataset for future predictions."""
    ud_id = f"ud_{uuid.uuid4().hex[:12]}"
    new_ud = UserData(
        id=ud_id,
        user_id=current_user.id,
        title=payload.title or "Untitled Input Dataset",
        input_data=json.dumps(payload.input_data)
    )
    db.add(new_ud)
    db.commit()
    db.refresh(new_ud)

    return UserDataResponse(
        id=new_ud.id,
        user_id=new_ud.user_id,
        title=new_ud.title,
        input_data=payload.input_data,
        created_at=new_ud.created_at.isoformat() if new_ud.created_at else None,
        updated_at=new_ud.updated_at.isoformat() if new_ud.updated_at else None
    )

@router.get("/user-data", response_model=List[UserDataResponse])
def list_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all stored datasets for the authenticated user."""
    records = db.query(UserData).filter(UserData.user_id == current_user.id).order_by(desc(UserData.created_at)).all()
    results = []
    for r in records:
        try:
            p_data = json.loads(r.input_data)
        except Exception:
            p_data = {}
        results.append(UserDataResponse(
            id=r.id,
            user_id=r.user_id,
            title=r.title,
            input_data=p_data,
            created_at=r.created_at.isoformat() if r.created_at else None,
            updated_at=r.updated_at.isoformat() if r.updated_at else None
        ))
    return results

@router.delete("/user-data/{user_data_id}")
def delete_user_data(
    user_data_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a saved user dataset."""
    record = db.query(UserData).filter(UserData.id == user_data_id).first()
    if not record or record.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found.")

    db.delete(record)
    db.commit()
    return {"status": "SUCCESS", "message": f"Dataset {user_data_id} deleted."}

# ==========================================================
# 5. Retail Reorder Engine & System Endpoints
# ==========================================================

@router.get("/health", response_model=HealthCheckResponse)
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint validating database connectivity and aggregate counts."""
    try:
        total_stores = db.query(Store).count()
        total_items = db.query(Item).count()
        total_forecasts = db.query(Forecast).count()
        total_users = db.query(User).count()
        total_predictions = db.query(Prediction).count()
        return HealthCheckResponse(
            status="healthy",
            database_connected=True,
            total_stores=total_stores,
            total_items=total_items,
            total_forecasts=total_forecasts,
            total_users=total_users,
            total_predictions=total_predictions
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
        
    query_items = db.query(Item)
    if category and category != 'ALL':
        query_items = query_items.filter(Item.category == category)
    items = query_items.order_by(Item.item_id).all()
    
    latest_fcsts = db.query(Forecast).filter_by(store_id=store_id).all()
    fcst_map = {}
    for f in latest_fcsts:
        fcst_map[(f.item_id, f.horizon_days)] = f
        
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
        
        fcst_7d = fcst_map.get((itm.item_id, 7))
        fcst_30d = fcst_map.get((itm.item_id, 30))
        
        pred_7d = float(fcst_7d.predicted_demand) if fcst_7d else 40.0
        pred_30d = float(fcst_30d.predicted_demand) if fcst_30d else (pred_7d * 4.2)
        model_used = fcst_7d.model_used if fcst_7d else "XGBoost"
        lower_7d = float(fcst_7d.lower_bound) if fcst_7d else round(pred_7d * 0.75, 2)
        upper_7d = float(fcst_7d.upper_bound) if fcst_7d else round(pred_7d * 1.25, 2)
        
        daily_run_rate = max(1.0, pred_7d / 7.0)
        stockout_days = round(current_stock / daily_run_rate, 1)
        
        safety_stock = int(daily_run_rate * 2.5)
        raw_reorder = int(math.ceil(pred_7d + safety_stock - current_stock))
        recommended_reorder = max(0, raw_reorder)
        
        if stockout_days <= 2.0 or current_stock < (daily_run_rate * 1.5):
            urgency = "CRITICAL"
            critical_count += 1
        elif stockout_days <= 4.5 or recommended_reorder > 0:
            urgency = "MODERATE"
        else:
            urgency = "HEALTHY"
            
        if urgency_filter and urgency_filter != 'ALL' and urgency != urgency_filter.upper():
            continue
            
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
