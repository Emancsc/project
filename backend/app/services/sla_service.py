from datetime import datetime
from typing import Dict, Optional

# Simple SLA policy table (extend later)
# Based on guideline idea: per category/priority/zone; keep minimal now.
DEFAULT_SLA_HOURS = {
    "P1": 48,
    "P2": 72,
    "P3": 120,
}

PRIORITY_WEIGHT = {"P1": 1.0, "P2": 0.7, "P3": 0.4}


def pick_priority_for_request(category: str, zone_id: Optional[str]) -> str:
    # minimal rule: pothole near "school/hospital" would be P1, else P2, else P3
    # You can improve later.
    if category in ("water_leak", "pothole"):
        return "P2"
    return "P3"


def compute_sla_state(created_at: datetime, triaged_at: Optional[datetime], assigned_at: Optional[datetime], resolved_at: Optional[datetime], target_hours: int) -> Dict:
    now = datetime.utcnow()
    end = resolved_at or now
    elapsed_hours = (end - created_at).total_seconds() / 3600.0

    if resolved_at is not None:
        state = "breached" if elapsed_hours > target_hours else "on_time"
    else:
        # at risk if > 80% of target
        state = "at_risk" if elapsed_hours >= (0.8 * target_hours) else "on_time"

    return {
        "sla_target_hours": target_hours,
        "elapsed_hours": round(elapsed_hours, 2),
        "sla_state": state,
    }


def weight_for_heatmap(priority: str, age_hours: float) -> float:
    import math
    return float(PRIORITY_WEIGHT.get(priority, 0.5) * math.log1p(max(age_hours, 0.0)))
