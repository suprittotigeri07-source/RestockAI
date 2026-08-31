# RestockAI Core Configuration
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, model_validator
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    
    # App Settings
    PROJECT_NAME: str = "RestockAI"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    
    # Database Settings
    DATABASE_URL: str = Field(default="postgresql://postgres:postgres@localhost:5432/restockai")

    @model_validator(mode="after")
    def validate_database_url(self) -> 'Settings':
        db_url = self.DATABASE_URL
        if db_url.startswith("postgres://"):
            self.DATABASE_URL = db_url.replace("postgres://", "postgresql://", 1)
        
        import os
        env = os.environ.get("ENVIRONMENT", self.ENVIRONMENT)
        if env.lower() == "production":
            if "localhost" in self.DATABASE_URL or "127.0.0.1" in self.DATABASE_URL:
                print(
                    "\n[WARNING] [RestockAI Config] ENVIRONMENT is set to 'production', but DATABASE_URL points to localhost/127.0.0.1. "
                    "If you are deploying to the cloud (e.g. Render, Railway, AWS, GCP), please make sure you set the DATABASE_URL environment "
                    "variable to your cloud database connection string. Otherwise, your app might fail to authenticate or connect.\n"
                )
        return self
    
    # ML & Forecasting
    DEFAULT_FORECAST_HORIZON_SHORT: int = 7
    DEFAULT_FORECAST_HORIZON_LONG: int = 30
    
    # Security & Auth Settings
    JWT_SECRET_KEY: str = Field(default="restockai_super_secret_jwt_key_2026_production_safe")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 hours
    CORS_ORIGINS: str = "*"

    # Email / SMTP Settings
    SMTP_HOST: str = Field(default="smtp.example.com")
    SMTP_PORT: int = Field(default=587)
    SMTP_USER: str = Field(default="")
    SMTP_PASSWORD: str = Field(default="")
    EMAIL_FROM: str = Field(default="noreply@restockai.io")
    FRONTEND_URL: str = Field(default="http://localhost:5173")

    # LLM Settings
    ANTHROPIC_API_KEY: str = Field(default="")
    LLM_MODEL: str = "claude-3-5-sonnet-20241022"
    LLM_CACHE_ENABLED: bool = True
    
    # Google Sheets Settings
    GOOGLE_SHEETS_CREDENTIALS_FILE: str = Field(default="credentials.json")

settings = Settings()
