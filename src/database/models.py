from sqlalchemy import Column, String, Integer, Numeric, Date, DateTime, ForeignKey, Text, PrimaryKeyConstraint, Boolean
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class Store(Base):
    __tablename__ = "stores"
    
    store_id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    region = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    sales = relationship("SalesDaily", back_populates="store", cascade="all, delete-orphan")
    forecasts = relationship("Forecast", back_populates="store", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "store_id": self.store_id,
            "name": self.name,
            "region": self.region,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Item(Base):
    __tablename__ = "items"
    
    item_id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    category = Column(String(64), nullable=False)
    unit_cost = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    sales = relationship("SalesDaily", back_populates="item", cascade="all, delete-orphan")
    forecasts = relationship("Forecast", back_populates="item", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "item_id": self.item_id,
            "name": self.name,
            "category": self.category,
            "unit_cost": float(self.unit_cost) if self.unit_cost is not None else 0.0,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class SalesDaily(Base):
    __tablename__ = "sales_daily"
    
    store_id = Column(String(64), ForeignKey("stores.store_id", ondelete="CASCADE"), primary_key=True)
    item_id = Column(String(64), ForeignKey("items.item_id", ondelete="CASCADE"), primary_key=True)
    date = Column(Date, primary_key=True)
    units_sold = Column(Integer, nullable=False)
    stock_on_hand = Column(Integer, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        PrimaryKeyConstraint("store_id", "item_id", "date"),
    )
    
    store = relationship("Store", back_populates="sales")
    item = relationship("Item", back_populates="sales")

    def to_dict(self):
        return {
            "store_id": self.store_id,
            "item_id": self.item_id,
            "date": self.date.isoformat() if self.date else None,
            "units_sold": self.units_sold,
            "stock_on_hand": self.stock_on_hand,
            "price": float(self.price) if self.price is not None else 0.0
        }

class Forecast(Base):
    __tablename__ = "forecasts"
    
    forecast_id = Column(String(64), primary_key=True)
    store_id = Column(String(64), ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False)
    item_id = Column(String(64), ForeignKey("items.item_id", ondelete="CASCADE"), nullable=False)
    forecast_date = Column(Date, nullable=False)
    horizon_days = Column(Integer, nullable=False) # 7 or 30
    predicted_demand = Column(Numeric(10, 2), nullable=False)
    lower_bound = Column(Numeric(10, 2), nullable=False)
    upper_bound = Column(Numeric(10, 2), nullable=False)
    model_used = Column(String(64), nullable=False) # Prophet / XGBoost
    model_mape = Column(Numeric(8, 4), nullable=True)
    model_rmse = Column(Numeric(10, 2), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    store = relationship("Store", back_populates="forecasts")
    item = relationship("Item", back_populates="forecasts")

class SystemLog(Base):
    __tablename__ = "system_logs"
    
    log_id = Column(String(64), primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    event_type = Column(String(64), nullable=False)
    component = Column(String(64), nullable=False)
    status = Column(String(32), nullable=False) # SUCCESS, ERROR, WARNING
    details = Column(Text, nullable=True)
    execution_time_ms = Column(Integer, nullable=True)


class User(Base):
    __tablename__ = "users"
    
    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user_data = relationship("UserData", back_populates="user", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="user", cascade="all, delete-orphan")
    reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class UserData(Base):
    __tablename__ = "user_data"
    
    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=True)
    input_data = Column(Text, nullable=False) # JSON encoded string
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="user_data")

    def to_dict(self):
        import json
        try:
            parsed_data = json.loads(self.input_data)
        except Exception:
            parsed_data = self.input_data
            
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "input_data": parsed_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    input_data = Column(Text, nullable=False) # JSON encoded string
    prediction = Column(Numeric(10, 2), nullable=False)
    confidence = Column(Numeric(5, 2), nullable=False)
    lower_bound = Column(Numeric(10, 2), nullable=True)
    upper_bound = Column(Numeric(10, 2), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="predictions")

    def to_dict(self):
        import json
        try:
            parsed_data = json.loads(self.input_data)
        except Exception:
            parsed_data = self.input_data
            
        return {
            "id": self.id,
            "user_id": self.user_id,
            "input_data": parsed_data,
            "prediction": float(self.prediction) if self.prediction is not None else 0.0,
            "confidence": float(self.confidence) if self.confidence is not None else 0.0,
            "lower_bound": float(self.lower_bound) if self.lower_bound is not None else None,
            "upper_bound": float(self.upper_bound) if self.upper_bound is not None else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    
    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="reset_tokens")
