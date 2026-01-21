from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from app.core.db import db
from app.deps.auth_deps import get_current_user, require_role
from app.models.interaction_models import AddComment, AddRating
from app.utils.objectid import validate_object_id
from app.repositories.performance_logs_repo import PerformanceLogsRepository

router = APIRouter(prefix="/requests", tags=["Interactions"])


def get_logs_repo():
    return PerformanceLogsRepository(db.performance_logs)


@router.post("/{request_id}/comment")
def add_comment(
    request_id: str,
    payload: AddComment,
    user=Depends(require_role("citizen")),
    logs_repo=Depends(get_logs_repo),
):
    oid = validate_object_id(request_id)
    req = db.service_requests.find_one({"_id": oid})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if req.get("citizen_id") != user["_id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    comment = {
        "type": "comment",
        "by": {"actor_type": "citizen", "actor_id": user["_id"]},
        "meta": {"text": payload.text, "parent_id": payload.parent_id},
        "at": datetime.utcnow(),
    }
    logs_repo.append_event(oid, comment)
    return {"ok": True}


@router.post("/{request_id}/rating")
def rate_request(
    request_id: str,
    payload: AddRating,
    user=Depends(require_role("citizen")),
    logs_repo=Depends(get_logs_repo),
):
    oid = validate_object_id(request_id)
    req = db.service_requests.find_one({"_id": oid})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if req.get("citizen_id") != user["_id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    # allow rating only after resolved/closed
    if req.get("status") not in ("resolved", "closed"):
        raise HTTPException(status_code=400, detail="Can only rate after resolution")

    rating = {
        "type": "rating",
        "by": {"actor_type": "citizen", "actor_id": user["_id"]},
        "meta": {"stars": payload.stars, "comment": payload.comment, "reason_codes": payload.reason_codes},
        "at": datetime.utcnow(),
    }
    logs_repo.append_event(oid, rating)

    # store quick rating snapshot on request doc
    db.service_requests.update_one(
        {"_id": oid},
        {"$set": {"citizen_feedback": {"stars": payload.stars, "comment": payload.comment}}},
    )

    return {"ok": True}
