from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_admin_user
from app.repositories.user_repository import UserRepository
from app.repositories.generation_repository import GenerationRepository
from app.schemas.user import UserResponse
from app.models.user import User, UserTier
from typing import List

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats")
def admin_stats(
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    user_repo = UserRepository(db)
    gen_repo = GenerationRepository(db)
    return {
        "total_users": user_repo.count_total(),
        "total_generations": gen_repo.count_total(),
    }


@router.get("/users", response_model=List[UserResponse])
def list_users(
    skip: int = 0,
    limit: int = 100,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    repo = UserRepository(db)
    return repo.list_all(skip=skip, limit=limit)


@router.post("/users/{user_id}/promote")
def promote_user(
    user_id: int,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    repo.update(user, tier=UserTier.PRO)
    return {"message": f"User {user_id} promoted to PRO"}


@router.post("/users/{user_id}/make-admin")
def make_admin(
    user_id: int,
    current_admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    repo.update(user, is_admin=True, tier=UserTier.PRO)
    return {"message": f"User {user_id} granted admin access"}
