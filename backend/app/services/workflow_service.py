# app/services/workflow_service.py
from __future__ import annotations

from datetime import datetime
from typing import Dict, Any
from fastapi import HTTPException


ALLOWED_TRANSITIONS = {
    "new": ["triaged", "closed"],
    "triaged": ["assigned", "closed"],
    "assigned": ["in_progress"],
    "in_progress": ["resolved"],
    "resolved": ["closed"],
    "closed": []
}

# Map each status to the timestamp field that should be set when entering that status
STATUS_TIMESTAMP_FIELD = {
    "triaged": "triaged_at",
    "assigned": "assigned_at",
    "in_progress": "work_started_at",  # optional but useful
    "resolved": "resolved_at",
    "closed": "closed_at",
}


def validate_transition(current_status: str, next_status: str) -> None:
    allowed = ALLOWED_TRANSITIONS.get(current_status, [])
    if next_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition from {current_status} to {next_status}"
        )


def build_transition_update(current_status: str, next_status: str) -> Dict[str, Any]:
    """
    Returns a MongoDB update dict to apply a workflow transition:
      - updates status
      - sets timestamps.timestamps.<field> when applicable
      - updates timestamps.timestamps.updated_at always
    Assumes your request document has:
      timestamps: { created_at, triaged_at, assigned_at, resolved_at, closed_at, updated_at, ... }
    """
    validate_transition(current_status, next_status)

    now = datetime.utcnow()

    set_fields: Dict[str, Any] = {
        "status": next_status,
        "workflow.current_state": next_status,
        "timestamps.updated_at": now,
    }

    # Set the "entering-state" timestamp if exists and not already set
    ts_field = STATUS_TIMESTAMP_FIELD.get(next_status)
    if ts_field:
        # Use $set only; repository can conditionally set if null.
        # Here we provide it as a separate field so repo can use $set if missing.
        set_fields[f"timestamps.{ts_field}"] = now

    # Also update allowed_next for convenience (optional)
    set_fields["workflow.allowed_next"] = ALLOWED_TRANSITIONS.get(next_status, [])

    return {"$set": set_fields}
