from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class GeoLocation(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]


class CreateServiceRequest(BaseModel):
    category: str
    description: str
    priority: Optional[str] = "P3"
    location: GeoLocation

    model_config = {
        "json_schema_extra": {
            "example": {
                "category": "pothole",
                "description": "Large pothole near the school",
                "priority": "P3",
                "location": {"type": "Point", "coordinates": [35.2, 31.9]}
            }
        }
    }

class ServiceRequestDB(CreateServiceRequest):
    id: Optional[str] = None
    status: str = "new"
    created_at: datetime = Field(default_factory=datetime.utcnow)

from pydantic import BaseModel
from typing import Literal

Priority = Literal["P1", "P2", "P3"]

class UpdatePriority(BaseModel):
    priority: Priority
