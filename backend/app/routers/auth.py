from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.dependencies import get_current_user, require_user, require_admin
from app.models.user import User, UserRole, UserStatus
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token, MessageResponse
from app.services.email import (
    send_registration_confirmation, 
    send_admin_notification,
    send_approval_notification
)

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user already exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create user
    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        user_type=user_data.user_type,
        institution_type=user_data.institution_type,
        status=UserStatus.PENDING,
        role=UserRole.USER
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Send confirmation emails
    send_registration_confirmation(user.email, user.full_name or user.username)
    
    # Notify admin about new registration
    send_admin_notification(
        user.email, 
        user.full_name or user.username,
        user_type=user_data.user_type,
        institution_type=user_data.institution_type
    )
    
    return MessageResponse(message="Registration successful. Your account is pending administrator approval.")

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Log in a user."""
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if user.status == UserStatus.PENDING:
        raise HTTPException(status_code=403, detail="Account pending approval")
    if user.status == UserStatus.REJECTED:
        raise HTTPException(status_code=403, detail="Account has been rejected")
        
    # Generate token
    token_data = {"sub": str(user.id), "email": user.email, "role": user.role.value}
    access_token = create_access_token(data=token_data)
    
    return Token(access_token=access_token)

# ... (otras rutas sin cambios)
