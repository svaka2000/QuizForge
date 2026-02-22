from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.core.security import hash_password, verify_password, create_access_token
from app.repositories.user_repository import UserRepository
from app.schemas.auth import RegisterRequest, TokenResponse
from app.models.user import User


class AuthService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)

    def register(self, request: RegisterRequest) -> User:
        if self.repo.get_by_email(request.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        hashed = hash_password(request.password)
        return self.repo.create(
            email=request.email,
            hashed_password=hashed,
            full_name=request.full_name,
            school_name=request.school_name,
        )

    def login(self, email: str, password: str) -> TokenResponse:
        user = self.repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account disabled")

        token = create_access_token({"sub": str(user.id)})
        return TokenResponse(
            access_token=token,
            user_id=user.id,
            email=user.email,
            tier=user.tier.value,
            is_admin=user.is_admin,
        )
