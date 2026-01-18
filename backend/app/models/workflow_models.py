from enum import Enum
from pydantic import BaseModel


class RequestStatus(str, Enum):
    new = "new"
    triaged = "triaged"
    assigned = "assigned"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


class TransitionPayload(BaseModel):
    next_status: RequestStatus
