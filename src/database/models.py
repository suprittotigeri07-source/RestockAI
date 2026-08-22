from sqlalchemy import Column, String, Integer, Numeric, Date, DateTime, ForeignKey, Text, PrimaryKeyConstraint
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
