from fastapi import HTTPException

ALLOWED_TRANSITIONS = {
    "new": ["triaged", "closed"],
    "triaged": ["assigned", "closed"],
    "assigned": ["in_progress"],
    "in_progress": ["resolved"],
    "resolved": ["closed"],
    "closed": []
}


def validate_transition(current_status: str, next_status: str):
    allowed = ALLOWED_TRANSITIONS.get(current_status, [])
    if next_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition from {current_status} to {next_status}"
        )
