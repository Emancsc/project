from pydantic import BaseModel, Field
from typing import Optional, List, Literal


MilestoneType = Literal[
    "arrived",
    "started",
    "update",
    "complete",
    "completed"
]


class MilestonePayload(BaseModel):
    milestone: MilestoneType = Field(..., examples=["arrived"])
    note: Optional[str] = None
    evidence_urls: List[str] = Field(default_factory=list)
