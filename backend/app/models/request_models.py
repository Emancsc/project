from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime


Priority = Literal["P1", "P2", "P3"]

RequestStatus = Literal[
    "new",
    "triaged",
    "assigned",
    "in_progress",
    "resolved",
    "closed",
]

STATUS_IN_PROGRESS: RequestStatus = "in_progress"
STATUS_RESOLVED: RequestStatus = "resolved"


class GeoLocation(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: List[float]  # [longitude, latitude]
    address_hint: Optional[str] = None
    zone_id: Optional[str] = None


class RequestTimestamps(BaseModel):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    triaged_at: Optional[datetime] = None
    assigned_at: Optional[datetime] = None
    work_started_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CreateServiceRequest(BaseModel):
    category: str
    description: str
    priority: Priority = "P3"
    location: GeoLocation

    model_config = {
        "json_schema_extra": {
            "example": {
                "category": "pothole",
                "description": "Large pothole near the school",
                "priority": "P3",
                "location": {
                    "type": "Point",
                    "coordinates": [35.2, 31.9],
                    "address_hint": "Main Rd, Downtown",
                    "zone_id": "ZONE-DT-01",
                },
            }
        }
    }


class ServiceRequestDB(CreateServiceRequest):
    id: Optional[str] = None
    status: RequestStatus = "new"
    timestamps: RequestTimestamps = Field(default_factory=RequestTimestamps)

    # legacy compatibility (optional)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UpdatePriority(BaseModel):
    priority: Priority


class MergeDuplicatePayload(BaseModel):
    master_request_id: str
