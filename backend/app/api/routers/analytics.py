from fastapi import APIRouter, Depends
from datetime import datetime
from app.core.db import db
from app.deps.auth_deps import require_role
from app.services.sla_service import compute_sla_state, weight_for_heatmap

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/kpis")
def kpis(_user=Depends(require_role("staff"))):
    # backlog by status
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    backlog = list(db.service_requests.aggregate(pipeline))

    # avg rating (from request snapshot)
    rating_pipeline = [
        {"$match": {"citizen_feedback.stars": {"$exists": True}}},
        {"$group": {"_id": None, "avg_rating": {"$avg": "$citizen_feedback.stars"}, "count": {"$sum": 1}}},
    ]
    rating = list(db.service_requests.aggregate(rating_pipeline))
    rating_summary = rating[0] if rating else {"avg_rating": None, "count": 0}

    return {
        "backlog_by_status": backlog,
        "rating_summary": rating_summary,
    }


@router.get("/geofeeds/heatmap")
def heatmap(
    status_in: str = "new,triaged,assigned,in_progress",
    _user=Depends(require_role("staff")),
):
    statuses = [s.strip() for s in status_in.split(",") if s.strip()]
    now = datetime.utcnow()

    cursor = db.service_requests.find(
        {"status": {"$in": statuses}, "location": {"$exists": True}}
    ).limit(2000)

    features = []
    for r in cursor:
        loc = r.get("location") or {}
        coords = loc.get("coordinates")
        if not coords or len(coords) != 2:
            continue

        created_at = r.get("created_at") or now
        age_hours = (now - created_at).total_seconds() / 3600.0
        priority = r.get("priority", "P3")
        w = weight_for_heatmap(priority, age_hours)

        features.append({
            "type": "Feature",
            "properties": {
                "request_id": str(r.get("_id")),
                "category": r.get("category"),
                "priority": priority,
                "weight": w,
                "age_hours": round(age_hours, 2),
            },
            "geometry": {"type": "Point", "coordinates": coords},
        })

    return {"type": "FeatureCollection", "features": features}


@router.get("/cohorts")
def cohorts(_user=Depends(require_role("staff"))):
    # Repeat-issue cohorts (very simple): group by (zone_id, category) and count
    pipeline = [
        {"$group": {
            "_id": {"zone_id": "$location.zone_id", "category": "$category"},
            "count": {"$sum": 1},
        }},
        {"$sort": {"count": -1}},
        {"$limit": 50},
    ]
    items = list(db.service_requests.aggregate(pipeline))
    return {"items": items}


@router.get("/agents")
def agent_analytics(_user=Depends(require_role("staff"))):
    # Workload = number of assigned requests by agent_id
    pipeline = [
        {"$match": {"assignment.assigned_agent_id": {"$exists": True, "$ne": None}}},
        {"$group": {"_id": "$assignment.assigned_agent_id", "assigned_count": {"$sum": 1}}},
        {"$sort": {"assigned_count": -1}},
    ]
    workload = list(db.service_requests.aggregate(pipeline))
    return {"workload": workload}
