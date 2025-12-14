"""
Authentication router.

Handles user registration, login, profile, and admin operations.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, decode_token
from app.models.user import User, UserRole, UserStatus
from app.schemas.auth import (
    UserCreate, UserLogin, UserResponse, UserUpdate,
    Token, MessageResponse
)
from app.services.email import send_admin_notification, send_approval_notification

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer(auto_error=False)


# ==================
# Dependencies
# ==================

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get current authenticated user from JWT token.
    Returns None if no token or invalid token.
    """
    if not credentials:
        return None
    
    payload = decode_token(credentials.credentials)
    if not payload:
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        return None
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    return user


def require_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    db: Session = Depends(get_db)
) -> User:
    """
    Require authenticated active user.
    Raises 401 if not authenticated or 403 if not active.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account not active"
        )
    
    return user


def require_admin(user: User = Depends(require_user)) -> User:
    """Require admin role."""
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user


# ==================
# Endpoints
# ==================

@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.
    
    The account will be pending until approved by an admin.
    """
    # Check if email exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create user
    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        status=UserStatus.PENDING,
        role=UserRole.USER
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Notify admin
    send_admin_notification(user.email, user.full_name or user.username)
    
    return MessageResponse(
        message="Registration successful. Please wait for admin approval.",
        success=True
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and return JWT token.
    """
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if user.status == UserStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account pending approval"
        )
    
    if user.status == UserStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been rejected"
        )
    
    # Create token
    token = create_access_token(data={
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value
    })
    
    return Token(access_token=token)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(user: User = Depends(require_user)):
    """
    Get current authenticated user's information.
    """
    return user


# ==================
# Admin Endpoints
# ==================

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    status_filter: Optional[UserStatus] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    List all users (admin only).
    """
    query = db.query(User).order_by(User.created_at.desc())
    
    if status_filter:
        query = query.filter(User.status == status_filter)
    
    return query.all()


@router.get("/users/pending", response_model=List[UserResponse])
async def list_pending_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    List users pending approval (admin only).
    """
    return db.query(User).filter(User.status == UserStatus.PENDING).all()


@router.post("/users/{user_id}/approve", response_model=MessageResponse)
async def approve_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Approve a pending user (admin only).
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.status != UserStatus.PENDING:
        raise HTTPException(status_code=400, detail="User is not pending")
    
    user.status = UserStatus.ACTIVE
    db.commit()
    
    # Notify user
    send_approval_notification(user.email, approved=True)
    
    return MessageResponse(message=f"User {user.email} approved")


@router.post("/users/{user_id}/reject", response_model=MessageResponse)
async def reject_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Reject a pending user (admin only).
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.status = UserStatus.REJECTED
    db.commit()
    
    # Notify user
    send_approval_notification(user.email, approved=False)
    
    return MessageResponse(message=f"User {user.email} rejected")


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    updates: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Update user details (admin only).
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if updates.status is not None:
        user.status = updates.status
    if updates.role is not None:
        user.role = updates.role
    if updates.full_name is not None:
        user.full_name = updates.full_name
    
    db.commit()
    db.refresh(user)
    
    return user
