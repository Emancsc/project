from pydantic import BaseModel
from enum import Enum

class WorkflowStatus(str, Enum):
    new = "new"
    triaged = "triaged"
    assigned = "assigned"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"

class TransitionPayload(BaseModel):
    next_status: WorkflowStatus
