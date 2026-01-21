from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from app.core.db import db
from app.deps.auth_deps import require_role, get_current_user
from app.models.milestone_models import MilestonePayload
from app.utils.objectid import validate_object_id
from app.repositories.performance_logs_repo import PerformanceLogsRepository

router = APIRouter(prefix="/requests", tags=["Milestones"])


def get_logs_repo():
    return PerformanceLogsRepository(db.performance_logs)


@router.patch("/{request_id}/milestone")
def add_milestone(
    request_id: str,
    payload: MilestonePayload,
    user=Depends(get_current_user),
    logs_repo=Depends(get_logs_repo),
):
    # For now: allow staff OR agent role (you can restrict later)
    if user.get("role") not in ("staff", "agent"):
        raise HTTPException(status_code=403, detail="Forbidden")

    oid = validate_object_id(request_id)
    req = db.service_requests.find_one({"_id": oid})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    ev = {
        "type": f"milestone:{payload.milestone}",
        "by": {"actor_type": user["role"], "actor_id": user["_id"]},
        "meta": {"note": payload.note, "evidence_urls": payload.evidence_urls},
        "at": datetime.utcnow(),
    }
    logs_repo.append_event(oid, ev)

    # Minimal state effects
    if payload.milestone == "arrived":
        db.service_requests.update_one({"_id": oid}, {"$set": {"status": "in_progress", "updated_at": datetime.utcnow()}})
    if payload.milestone in ("complete", "completed"):
        db.service_requests.update_one({"_id": oid}, {"$set": {"status": "resolved", "updated_at": datetime.utcnow()}})

    updated = db.service_requests.find_one({"_id": oid})
    if not updated:
        raise HTTPException(status_code=404, detail="Request not found")
    updated["_id"] = str(updated["_id"])
    return updated
