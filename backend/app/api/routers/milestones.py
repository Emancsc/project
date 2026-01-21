from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from typing import Dict, Any

from app.core.db import db
from app.deps.auth_deps import get_current_user
from app.models.milestone_models import MilestonePayload
from app.utils.objectid import validate_object_id
from app.repositories.performance_logs_repo import PerformanceLogsRepository
from app.models.request_models import STATUS_IN_PROGRESS, STATUS_RESOLVED

router = APIRouter(prefix="/requests", tags=["Milestones"])


def get_logs_repo() -> PerformanceLogsRepository:
    return PerformanceLogsRepository(db.performance_logs)


@router.patch("/{request_id}/milestone")
def add_milestone(
    request_id: str,
    payload: MilestonePayload,
    user=Depends(get_current_user),
    logs_repo: PerformanceLogsRepository = Depends(get_logs_repo),
):
    # allow staff OR agent
    if user.get("role") not in ("staff", "agent"):
        raise HTTPException(status_code=403, detail="Forbidden")

    oid = validate_object_id(request_id)
    req = db.service_requests.find_one({"_id": oid})
    if req is None:
        raise HTTPException(status_code=404, detail="Request not found")

    # log milestone event (correct signature)
    logs_repo.append_event(
        request_id=request_id,  # request_id is string (same as _id string)
        event_type=f"milestone:{payload.milestone}",
        actor_type=user["role"],
        actor_id=str(user["_id"]),
        meta={
            "note": payload.note,
            "evidence_urls": payload.evidence_urls,
        },
    )

    # Minimal state effects + timestamps (important for SLA)
    now = datetime.utcnow()
    set_fields: Dict[str, Any] = {
        "updated_at": now,
        "timestamps.updated_at": now,
    }

    if payload.milestone == "arrived":
        set_fields["status"] = STATUS_IN_PROGRESS
        set_fields["timestamps.work_started_at"] = now

    if payload.milestone in ("complete", "completed"):
        set_fields["status"] = STATUS_RESOLVED
        set_fields["timestamps.resolved_at"] = now

    if "status" in set_fields:
        # keep workflow state aligned if stored
        set_fields["workflow.current_state"] = set_fields["status"]

    db.service_requests.update_one({"_id": oid}, {"$set": set_fields})

    updated = db.service_requests.find_one({"_id": oid})
    if updated is None:
        raise HTTPException(status_code=500, detail="Failed to fetch updated request")

    updated["_id"] = str(updated["_id"])
    return updated
