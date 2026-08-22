# RestockAI Core Configuration
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    
    # App Settings
    PROJECT_NAME: str = "RestockAI"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    
    # Database Settings
    # Supports PostgreSQL or fallback to local SQLite for standalone offline development/testing
    DATABASE_URL: str = Field(default=f"sqlite:///{BASE_DIR / 'data' / 'restockai.db'}")
    
    # ML & Forecasting
    DEFAULT_FORECAST_HORIZON_SHORT: int = 7
    DEFAULT_FORECAST_HORIZON_LONG: int = 30
    
    # LLM Settings
    ANTHROPIC_API_KEY: str = Field(default="")
    LLM_MODEL: str = "claude-3-5-sonnet-20241022"
    LLM_CACHE_ENABLED: bool = True
    
    # Google Sheets Settings
    GOOGLE_SHEETS_CREDENTIALS_FILE: str = Field(default="credentials.json")

settings = Settings()
