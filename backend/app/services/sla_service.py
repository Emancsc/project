# app/services/sla_service.py
from __future__ import annotations

from datetime import datetime
from typing import Dict, Optional, Any
import math

# Simple SLA policy table (extend later)
DEFAULT_SLA_HOURS = {
    "P1": 48,
    "P2": 72,
    "P3": 120,
}

# Used for heatmap weights
PRIORITY_WEIGHT = {"P1": 1.0, "P2": 0.7, "P3": 0.4}


def select_sla_policy(category: str, priority: str, zone_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Minimal SLA policy generator to match the guideline schema.
    You can later extend per category/zone.
    """
    target_hours = int(DEFAULT_SLA_HOURS.get(priority, 72))
    breach_threshold_hours = int(math.ceil(target_hours * 1.25))

    return {
        "policy_id": f"SLA-{category.upper()}-{priority}",
        "target_hours": target_hours,
        "breach_threshold_hours": breach_threshold_hours,
        "escalation_steps": [
            {"after_hours": target_hours, "action": "notify_dispatcher"},
            {"after_hours": breach_threshold_hours, "action": "notify_manager"},
        ],
        "zone_id": zone_id,
        "category": category,
        "priority": priority,
    }


def compute_sla_state(
    created_at: datetime,
    triaged_at: Optional[datetime],
    assigned_at: Optional[datetime],
    resolved_at: Optional[datetime],
    target_hours: int,
    breach_threshold_hours: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Compute SLA state using created_at -> resolved_at (or now).
    State:
      - on_time
      - at_risk  (>= 80% of target and not resolved)
      - breached (if resolved late OR if now beyond breach_threshold)
    """
    now = datetime.utcnow()
    end = resolved_at or now

    elapsed_hours = (end - created_at).total_seconds() / 3600.0
    elapsed_hours = max(elapsed_hours, 0.0)

    breach_threshold = breach_threshold_hours if breach_threshold_hours is not None else int(math.ceil(target_hours * 1.25))

    if resolved_at is not None:
        state = "breached" if elapsed_hours > target_hours else "on_time"
        breach_reason = "late_resolution" if state == "breached" else None
    else:
        if elapsed_hours >= breach_threshold:
            state = "breached"
            breach_reason = "overdue_open"
        elif elapsed_hours >= (0.8 * target_hours):
            state = "at_risk"
            breach_reason = None
        else:
            state = "on_time"
            breach_reason = None

    return {
        "sla_target_hours": int(target_hours),
        "breach_threshold_hours": int(breach_threshold),
        "elapsed_hours": round(elapsed_hours, 2),
        "sla_state": state,
        "breach_reason": breach_reason,
        "milestones": {
            "created_at": created_at,
            "triaged_at": triaged_at,
            "assigned_at": assigned_at,
            "resolved_at": resolved_at,
        },
    }


def build_sla_fields_from_request(request_doc: Dict[str, Any]) -> Dict[str, Any]:
    """
    Given a request document, build SLA policy + computed SLA state fields.
    Expects request_doc fields:
      - category, priority
      - location.zone_id (optional)
      - timestamps.created_at, timestamps.triaged_at, timestamps.assigned_at, timestamps.resolved_at
    Returns dict with:
      - sla_policy
      - computed_kpis (or sla_computed)
    """
    category = request_doc.get("category", "general")
    priority = request_doc.get("priority", "P2")

    zone_id = None
    loc = request_doc.get("location") or {}
    zone_id = loc.get("zone_id")

    ts = request_doc.get("timestamps") or {}
    created_at = ts.get("created_at") or datetime.utcnow()
    triaged_at = ts.get("triaged_at")
    assigned_at = ts.get("assigned_at")
    resolved_at = ts.get("resolved_at")

    sla_policy = request_doc.get("sla_policy") or select_sla_policy(category=category, priority=priority, zone_id=zone_id)

    computed = compute_sla_state(
        created_at=created_at,
        triaged_at=triaged_at,
        assigned_at=assigned_at,
        resolved_at=resolved_at,
        target_hours=int(sla_policy.get("target_hours", DEFAULT_SLA_HOURS.get(priority, 72))),
        breach_threshold_hours=int(sla_policy.get("breach_threshold_hours", int(math.ceil(DEFAULT_SLA_HOURS.get(priority, 72) * 1.25)))),
    )

    return {
        "sla_policy": sla_policy,
        "computed_kpis": computed,  # you can store this in performance_logs.computed_kpis too
    }


def weight_for_heatmap(priority: str, age_hours: float) -> float:
    return float(PRIORITY_WEIGHT.get(priority, 0.5) * math.log1p(max(age_hours, 0.0)))
