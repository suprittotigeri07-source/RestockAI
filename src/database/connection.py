from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
from typing import Generator
import os
from pathlib import Path
from src.utils.config import settings
from src.utils.logger import logger
from src.database.models import Base

# Create engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initializes the database by creating all declared tables and seeding default demo accounts."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info(f"Database initialized successfully at {settings.DATABASE_URL}")

        # Seed default demo users if they don't exist
        from src.database.models import User
        from src.utils.security import hash_password

        db = SessionLocal()
        try:
            demo_users = [
                ("usr_suprit_demo", "Suprit Tigeri", "suprit@restockai.io", "RestockAI2026!"),
                ("usr_analyst_demo", "Lead Analyst", "analyst@company.com", "ForecastPass123!")
            ]
            for uid, name, email, pwd in demo_users:
                existing = db.query(User).filter(User.email == email.lower()).first()
                if not existing:
                    user = User(
                        id=uid,
                        name=name,
                        email=email.lower(),
                        password_hash=hash_password(pwd)
                    )
                    db.add(user)
                    logger.info(f"Seeded default demo user: {email}")
            db.commit()
        except Exception as seed_err:
            db.rollback()
            logger.warning(f"Demo user seeding warning: {seed_err}")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error initializing database: {e}", exc_info=True)
        raise

@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """Context manager for transactional database sessions."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

def get_db():
    """FastAPI dependency for database sessions."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
