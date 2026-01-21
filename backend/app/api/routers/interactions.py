# app/api/routers/interactions.py

from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from bson import ObjectId

from app.core.db import db
from app.deps.auth_deps import require_role
from app.models.interaction_models import AddComment, AddRating
from app.utils.objectid import validate_object_id
from app.repositories.performance_logs_repo import PerformanceLogsRepository

router = APIRouter(prefix="/requests", tags=["Interactions"])


def get_logs_repo():
    return PerformanceLogsRepository(db.performance_logs)


def _safe_find_display_name(citizen_id: str) -> str:
    """
    Try to load a citizen/user name from DB.
    Priority:
      1) db.citizens.full_name
      2) db.users.name
    """
    if not citizen_id or citizen_id == "public-citizen":
        return "Anonymous Citizen"

    if ObjectId.is_valid(citizen_id):
        oid = ObjectId(citizen_id)

        c = db.citizens.find_one({"_id": oid})
        if c:
            return (c.get("full_name") or c.get("name") or "Verified Citizen")

        u = db.users.find_one({"_id": oid})
        if u:
            return (u.get("name") or u.get("full_name") or "Verified Citizen")

    # fallback if not ObjectId
    c = db.citizens.find_one({"id": citizen_id}) or db.citizens.find_one({"citizen_id": citizen_id})
    if c:
        return (c.get("full_name") or c.get("name") or "Verified Citizen")

    u = db.users.find_one({"email": citizen_id}) or db.users.find_one({"id": citizen_id})
    if u:
        return (u.get("name") or u.get("full_name") or "Verified Citizen")

    return "Verified Citizen"


@router.post("/{request_id}/comment")
def add_comment(
    request_id: str,
    payload: AddComment,
    user=Depends(require_role("citizen")),
    logs_repo: PerformanceLogsRepository = Depends(get_logs_repo),
):
    oid = validate_object_id(request_id)
    req = db.service_requests.find_one({"_id": oid})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    # citizen can comment only on own request
    if req.get("citizen_id") != user["_id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    display_name = _safe_find_display_name(str(user["_id"]))

    logs_repo.append_event(
        request_id=request_id,
        event_type="comment",
        actor_type="citizen",
        actor_id=str(user["_id"]),
        meta={
            "text": payload.text,
            "parent_id": payload.parent_id,
            "display_name": display_name,
        },
    )

    return {"ok": True}


@router.post("/{request_id}/rating")
def rate_request(
    request_id: str,
    payload: AddRating,
    user=Depends(require_role("citizen")),
    logs_repo: PerformanceLogsRepository = Depends(get_logs_repo),
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

    display_name = _safe_find_display_name(str(user["_id"]))

    logs_repo.append_event(
        request_id=request_id,
        event_type="rating",
        actor_type="citizen",
        actor_id=str(user["_id"]),
        meta={
            "stars": payload.stars,
            "comment": payload.comment,
            "reason_codes": payload.reason_codes,
            "display_name": display_name,
        },
    )

    # store quick snapshot on request doc
    db.service_requests.update_one(
        {"_id": oid},
        {"$set": {
            "citizen_feedback": {
                "stars": payload.stars,
                "comment": payload.comment,
                "display_name": display_name,
                "rated_at": datetime.utcnow(),
            }
        }},
    )

    return {"ok": True}
