# app/api/routers/requests.py
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional

from app.core.db import db
from app.deps.auth_deps import get_current_user, require_role

from app.models.request_models import CreateServiceRequest, UpdatePriority
from app.models.workflow_models import TransitionPayload

from app.repositories.requests_repo import RequestsRepository

router = APIRouter(prefix="/requests", tags=["Requests"])


def get_repo():
    return RequestsRepository(db.service_requests)


# ----------------------------
# Citizen: create + my requests
# ----------------------------

@router.post("/")
def create_request(
    payload: CreateServiceRequest,
    user=Depends(require_role("citizen")),
    repo: RequestsRepository = Depends(get_repo),
):
    return repo.create_request(payload, citizen_id=user["_id"])


@router.get("/me")
def my_requests(
    user=Depends(require_role("citizen")),
    repo: RequestsRepository = Depends(get_repo),
):
    return repo.list_by_citizen(user["_id"])


# ----------------------------
# Public / Shared
# ----------------------------

@router.get("/nearby")
def nearby_requests(
    lng: float,
    lat: float,
    radius_m: int = 1000,
    repo: RequestsRepository = Depends(get_repo),
):
    return repo.nearby(lng=lng, lat=lat, radius_m=radius_m)


# ----------------------------
# Staff: list + workflow + priority
# ----------------------------

@router.get("/")
def list_requests(
    status: str = "",
    category: str = "",
    priority: str = "",
    page: int = 1,
    page_size: int = 10,
    _user=Depends(require_role("staff")),
    repo: RequestsRepository = Depends(get_repo),
):
    return repo.list_requests(status, category, priority, page, page_size)


@router.patch("/{request_id}/transition")
def transition_request(
    request_id: str,
    payload: TransitionPayload,
    _user=Depends(require_role("staff")),
    repo: RequestsRepository = Depends(get_repo),
):
    # payload.next_status is likely an Enum, so use .value
    return repo.transition_request(request_id, payload.next_status.value)


@router.patch("/{request_id}/priority")
def set_priority(
    request_id: str,
    payload: UpdatePriority,
    _user=Depends(require_role("staff")),
    repo: RequestsRepository = Depends(get_repo),
):
    return repo.update_priority(request_id, payload.priority)


# ----------------------------
# Get request by id (citizen can only access own)
# IMPORTANT: keep this LAST so it doesn't capture /me
# ----------------------------

@router.get("/{request_id}")
def get_request(
    request_id: str,
    user=Depends(get_current_user),
    repo: RequestsRepository = Depends(get_repo),
):
    r = repo.get_by_id(request_id)

    if user["role"] == "citizen" and r.get("citizen_id") != user["_id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    return r
