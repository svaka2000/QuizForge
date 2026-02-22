import os
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.services.generation_service import GenerationService
from app.schemas.generation import (
    GenerationRequest,
    GenerationResponse,
    GenerationListItem,
    GenerationPreviewResponse,
    PaginatedGenerationsResponse,
)
from app.models.user import User, UserTier
from typing import List

router = APIRouter(prefix="/api/generations", tags=["generations"])

PDF_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "pdfs")


@router.post("", response_model=GenerationResponse, status_code=201)
def create_generation(
    request: GenerationRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    service = GenerationService(db)
    return service.create_generation(current_user, request)


@router.get("", response_model=PaginatedGenerationsResponse)
def list_generations(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    response: Response = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    service = GenerationService(db)
    # Free tier: cap at 10 most recent regardless of requested limit
    history_limited = False
    if current_user.tier == UserTier.FREE and limit > 10:
        limit = 10
        history_limited = True
    result = service.list_generations_paginated(current_user, page=page, limit=limit)
    if history_limited and response is not None:
        response.headers["X-History-Limited"] = "true"
    return result


@router.get("/{generation_id}/preview", response_model=GenerationPreviewResponse)
def get_generation_preview(
    generation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Return questions and answer key for in-browser print preview."""
    service = GenerationService(db)
    return service.get_generation(generation_id, current_user)


@router.get("/{generation_id}", response_model=GenerationResponse)
def get_generation(
    generation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    service = GenerationService(db)
    return service.get_generation(generation_id, current_user)


@router.delete("/{generation_id}", status_code=204)
def delete_generation(
    generation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    service = GenerationService(db)
    service.soft_delete_generation(generation_id, current_user)


@router.get("/{generation_id}/download/{file_type}")
def download_pdf(
    generation_id: int,
    file_type: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    service = GenerationService(db)
    gen = service.get_generation(generation_id, current_user)

    if file_type == "version_a":
        filename = gen.pdf_version_a
        display_name = f"worksheet_version_A_{generation_id}.pdf"
    elif file_type == "version_b":
        filename = gen.pdf_version_b
        display_name = f"worksheet_version_B_{generation_id}.pdf"
    elif file_type == "answer_key":
        filename = gen.pdf_answer_key
        display_name = f"answer_key_{generation_id}.pdf"
    else:
        raise HTTPException(status_code=400, detail="Invalid file type. Use version_a, version_b, or answer_key")

    if not filename:
        raise HTTPException(status_code=404, detail="PDF not yet generated")

    filepath = os.path.join(PDF_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="PDF file not found on disk")

    return FileResponse(
        path=filepath,
        media_type="application/pdf",
        filename=display_name,
        headers={"Content-Disposition": f'attachment; filename="{display_name}"'},
    )
