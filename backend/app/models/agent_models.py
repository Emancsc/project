from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class Shift(BaseModel):
    day: str  # "Mon", "Tue", ...
    start: str  # "08:00"
    end: str    # "16:00"


class AgentSchedule(BaseModel):
    timezone: str = "Asia/Jerusalem"
    shifts: List[Shift] = []
    on_call: bool = False


class GeoFence(BaseModel):
    type: str = "Polygon"
    coordinates: Any  # keep flexible


class Coverage(BaseModel):
    zone_ids: List[str] = []
    geo_fence: Optional[GeoFence] = None


class AgentCreate(BaseModel):
    agent_code: str = Field(..., examples=["AG-PW-07"])
    name: str
    department: str = "Public Works"
    skills: List[str] = []
    coverage: Coverage
    schedule: AgentSchedule
    active: bool = True
    contacts: Dict[str, str] = {}


class AgentOut(BaseModel):
    id: str
    agent_code: str
    name: str
    department: str
    skills: List[str]
    coverage: Coverage
    schedule: AgentSchedule
    active: bool
    contacts: Dict[str, str]
