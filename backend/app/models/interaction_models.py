from pydantic import BaseModel, Field
from typing import Optional, List


class AddComment(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    parent_id: Optional[str] = None  # for threading (optional)


class AddRating(BaseModel):
    stars: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=2000)
    reason_codes: List[str] = []
