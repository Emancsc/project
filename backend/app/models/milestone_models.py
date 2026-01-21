from pydantic import BaseModel, Field
from typing import Optional, List


class MilestonePayload(BaseModel):
    milestone: str = Field(..., examples=["arrived"])
    note: Optional[str] = None
    evidence_urls: List[str] = []
