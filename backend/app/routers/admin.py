import csv
import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
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
        "generations_today": gen_repo.count_today(),
        "generations_by_day": gen_repo.get_count_by_day(30),
        "top_subjects": gen_repo.get_top_subjects(10),
        "free_users": user_repo.count_by_tier(UserTier.FREE),
        "pro_users": user_repo.count_by_tier(UserTier.PRO),
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


@router.get("/users/export")
def export_users_csv(
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    repo = UserRepository(db)
    users = repo.list_all(skip=0, limit=10000)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "email", "full_name", "school_name", "tier", "is_active", "is_admin", "created_at"])
    for u in users:
        writer.writerow([u.id, u.email, u.full_name, u.school_name, u.tier, u.is_active, u.is_admin, u.created_at])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=users.csv"},
    )


@router.get("/generations")
def list_all_generations(
    skip: int = 0,
    limit: int = 100,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    gen_repo = GenerationRepository(db)
    generations = gen_repo.list_all(skip=skip, limit=limit)
    return [
        {
            "id": g.id,
            "user_id": g.user_id,
            "topic": g.topic,
            "subject": g.subject,
            "grade_level": g.grade_level,
            "difficulty": g.difficulty,
            "question_count": g.question_count,
            "status": g.status,
            "generator_used": g.generator_used,
            "is_deleted": g.is_deleted,
            "created_at": g.created_at,
        }
        for g in generations
    ]


@router.post("/users/{user_id}/promote")
def promote_user(
    user_id: int,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    if not user:
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
        raise HTTPException(status_code=404, detail="User not found")
    repo.update(user, is_admin=True, tier=UserTier.PRO)
    return {"message": f"User {user_id} granted admin access"}


@router.post("/users/{user_id}/disable")
def disable_user(
    user_id: int,
    current_admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_admin:
        raise HTTPException(status_code=403, detail="Cannot disable admin users")
    repo.update(user, is_active=False)
    return {"message": f"User {user_id} disabled"}


@router.post("/users/{user_id}/enable")
def enable_user(
    user_id: int,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    repo.update(user, is_active=True)
    return {"message": f"User {user_id} enabled"}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": f"User {user_id} deleted"}
