import os
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from app.core.database import get_db
from app.core.security import get_current_active_user, hash_password, verify_password
from app.services.auth_service import AuthService
from app.schemas.auth import RegisterRequest, TokenResponse
from app.schemas.user import UserResponse, UserUpdate, UserStats
from app.repositories.user_repository import UserRepository
from app.models.user import User, UserTier
from app.core.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

_TESTING = os.environ.get("TESTING") == "true"


def _rate_limit(limit_string: str):
    """Return a rate-limit decorator, or a no-op during testing."""
    if _TESTING:
        def noop(func):
            return func
        return noop
    from slowapi import Limiter
    from slowapi.util import get_remote_address
    limiter = Limiter(key_func=get_remote_address)
    return limiter.limit(limit_string)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class DeleteAccountRequest(BaseModel):
    password: str


@router.post("/register", response_model=UserResponse, status_code=201)
@_rate_limit("5/minute")
def register(request: Request, body: RegisterRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    user = service.register(body)
    return user


@router.post("/login", response_model=TokenResponse)
@_rate_limit("10/minute")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    return service.login(form_data.username, form_data.password)


@router.post("/login/json", response_model=TokenResponse)
@_rate_limit("10/minute")
def login_json(request: Request, body: dict, db: Session = Depends(get_db)):
    from app.schemas.auth import LoginRequest
    req = LoginRequest(**body)
    service = AuthService(db)
    return service.login(req.email, req.password)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(
    update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    repo = UserRepository(db)
    return repo.update(current_user, **update.model_dump(exclude_none=True))


@router.get("/me/stats", response_model=UserStats)
def get_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    repo = UserRepository(db)
    daily_limit = (
        settings.FREE_TIER_DAILY_LIMIT
        if current_user.tier == UserTier.FREE
        else settings.PRO_TIER_DAILY_LIMIT
    )
    return UserStats(
        total_generations=repo.get_total_generations(current_user.id),
        generations_today=repo.get_generations_today(current_user.id),
        daily_limit=daily_limit,
        tier=current_user.tier,
    )


@router.post("/change-password", status_code=200)
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    repo = UserRepository(db)
    repo.update(current_user, hashed_password=hash_password(request.new_password))
    return {"message": "Password updated successfully"}


@router.post("/delete-account", status_code=200)
def delete_account(
    request: DeleteAccountRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if not verify_password(request.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is incorrect",
        )
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted"}
