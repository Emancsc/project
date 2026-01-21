from fastapi import APIRouter, Depends, HTTPException
from app.core.db import db
from app.deps.auth_deps import require_role

router = APIRouter(prefix="/analytics", tags=["Analytics"])


# ----------------------------
# KPIs (STAFF ONLY)
# ----------------------------
@router.get("/kpis")
def kpis(_user=Depends(require_role("staff"))):
    total = db.service_requests.count_documents({})
    by_status = list(
        db.service_requests.aggregate([
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ])
    )

    return {
        "total_requests": total,
        "by_status": by_status,
    }


# ----------------------------
# HEATMAP (PUBLIC)
# ----------------------------
@router.get("/geofeeds/heatmap")
def heatmap():
    """
    Returns [[lat, lng, weight], ...]
    """
    points = []

    cursor = db.service_requests.find(
        {"location.coordinates": {"$size": 2}},
        {"location.coordinates": 1, "priority": 1}
    )

    for r in cursor:
        lng, lat = r["location"]["coordinates"]
        weight = 1
        if r.get("priority") == "P1":
            weight = 3
        elif r.get("priority") == "P2":
            weight = 2

        points.append([lat, lng, weight])

    return {"points": points}


# ----------------------------
# COHORTS (STAFF ONLY – stub)
# ----------------------------
@router.get("/cohorts")
def cohorts(_user=Depends(require_role("staff"))):
    return {"message": "Cohorts analytics stub"}


# ----------------------------
# AGENTS (STAFF ONLY – stub)
# ----------------------------
@router.get("/agents")
def agents(_user=Depends(require_role("staff"))):
    return {"message": "Agents analytics stub"}
