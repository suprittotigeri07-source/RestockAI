"""
Authentication Dependencies & Security Middleware for FastAPI
"""
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from src.database.connection import get_db
from src.database.models import User
from src.utils.security import decode_access_token
from src.utils.logger import logger

# HTTP Bearer authentication scheme
security = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Extracts Bearer token, validates it, and returns the authenticated User instance.
    Raises HTTPException(401) if token is invalid, expired, or user does not exist.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or session has expired. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not credentials or not credentials.credentials:
        raise credentials_exception
        
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
        
    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Ensures the authenticated user is active."""
    return current_user
