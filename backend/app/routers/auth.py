from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.services.auth_service import AuthService
from app.schemas.auth import RegisterRequest, TokenResponse
from app.schemas.user import UserResponse, UserUpdate, UserStats
from app.repositories.user_repository import UserRepository
from app.models.user import User, UserTier
from app.core.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    user = service.register(request)
    return user


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.login(form_data.username, form_data.password)


@router.post("/login/json", response_model=TokenResponse)
def login_json(request: dict, db: Session = Depends(get_db)):
    from app.schemas.auth import LoginRequest
    req = LoginRequest(**request)
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
    daily_limit = settings.FREE_TIER_DAILY_LIMIT if current_user.tier == UserTier.FREE else settings.PRO_TIER_DAILY_LIMIT
    return UserStats(
        total_generations=repo.get_total_generations(current_user.id),
        generations_today=repo.get_generations_today(current_user.id),
        daily_limit=daily_limit,
        tier=current_user.tier,
    )
