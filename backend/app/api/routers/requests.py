# app/api/routers/requests.py

from fastapi import APIRouter, Depends, HTTPException, Header
from datetime import datetime

from app.core.db import db
from app.deps.auth_deps import get_current_user, require_role

from app.models.request_models import CreateServiceRequest, UpdatePriority, MergeDuplicatePayload
from app.models.workflow_models import TransitionPayload

from app.repositories.requests_repo import RequestsRepository
from app.repositories.performance_logs_repo import PerformanceLogsRepository
from app.utils.objectid import validate_object_id

router = APIRouter(prefix="/requests", tags=["Requests"])


def get_repo():
    return RequestsRepository(db.service_requests, db.performance_logs)


def get_logs_repo():
    return PerformanceLogsRepository(db.performance_logs)


# ----------------------------
# Citizen: create + my requests
# ----------------------------

@router.post("/")
def create_request(
    payload: CreateServiceRequest,
    user=Depends(require_role("citizen")),
    repo: RequestsRepository = Depends(get_repo),
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    return repo.create_request(payload, citizen_id=user["_id"], idempotency_key=idempotency_key)


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
# SLA Escalation (stub)
# ----------------------------

@router.post("/{request_id}/escalate")
def escalate_request(
    request_id: str,
    _user=Depends(require_role("staff")),
    logs: PerformanceLogsRepository = Depends(get_logs_repo),
):
    oid = validate_object_id(request_id)
    req = db.service_requests.find_one({"_id": oid})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    now = datetime.utcnow()
    db.service_requests.update_one(
        {"_id": oid},
        {"$inc": {"escalation_count": 1}, "$set": {"updated_at": now, "timestamps.updated_at": now}},
    )

    new_doc = db.service_requests.find_one({"_id": oid}, {"escalation_count": 1, "_id": 1})
    esc_count = int((new_doc or {}).get("escalation_count", 1))
    step = "notify_dispatcher" if esc_count == 1 else "notify_manager"

    logs.append_event(
        request_id=request_id,
        event_type="sla_escalation",
        actor_type="staff",
        actor_id="staff",
        meta={"escalation_count": esc_count, "step": step},
    )

    updated = db.service_requests.find_one({"_id": oid})

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Service request not found"
            )

    updated["_id"] = str(updated["_id"])
    return updated

# ----------------------------
# Duplicates: merge
# ----------------------------

@router.post("/{request_id}/merge")
def merge_duplicate(
    request_id: str,
    payload: MergeDuplicatePayload,
    _user=Depends(require_role("staff")),
    repo: RequestsRepository = Depends(get_repo),
):
    return repo.merge_into_master(
        duplicate_request_id=request_id,
        master_request_id=payload.master_request_id
    )


# ----------------------------
# Timeline (Citizen can view only own)
# ----------------------------

@router.get("/{request_id}/timeline")
def request_timeline(
    request_id: str,
    user=Depends(get_current_user),
    logs: PerformanceLogsRepository = Depends(get_logs_repo),
):
    oid = validate_object_id(request_id)
    req = db.service_requests.find_one({"_id": oid})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if user["role"] == "citizen" and req.get("citizen_id") != user["_id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    return logs.get_timeline(request_id)


# ----------------------------
# Get request by id (citizen can only access own)
# IMPORTANT: keep this LAST
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
