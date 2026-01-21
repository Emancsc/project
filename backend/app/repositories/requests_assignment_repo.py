from pymongo.collection import Collection
from fastapi import HTTPException
from datetime import datetime
from typing import Dict, Any

from app.utils.objectid import validate_object_id

class RequestsAssignmentRepository:
    def __init__(self, requests_col: Collection, agents_col: Collection):
        self.requests = requests_col
        self.agents = agents_col

    def auto_assign(self, request_id: str) -> Dict[str, Any]:
        oid = validate_object_id(request_id)
        req = self.requests.find_one({"_id": oid})
        if not req:
            raise HTTPException(status_code=404, detail="Request not found")

        candidates = list(self.agents.find({"active": True}).limit(50))
        if not candidates:
            raise HTTPException(status_code=400, detail="No active agents available")

        chosen = candidates[0]

        self.requests.update_one(
            {"_id": oid},
            {"$set": {
                "status": "assigned",
                "assignment.assigned_agent_id": str(chosen["_id"]),
                "timestamps.assigned_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }},
        )

        updated = self.requests.find_one({"_id": oid})
        if not updated:
            raise HTTPException(status_code=404, detail="Request not found")
        updated["_id"] = str(updated["_id"])
        return updated

    def set_assigned_agent(self, request_id: str, agent_id: str) -> Dict[str, Any]:
        roid = validate_object_id(request_id)
        aoid = validate_object_id(agent_id)

        agent = self.agents.find_one({"_id": aoid})
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        self.requests.update_one(
            {"_id": roid},
            {"$set": {
                "status": "assigned",
                "assignment.assigned_agent_id": str(agent["_id"]),
                "timestamps.assigned_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }},
        )
        updated = self.requests.find_one({"_id": roid})
        if not updated:
            raise HTTPException(status_code=404, detail="Request not found")
        updated["_id"] = str(updated["_id"])
        return updated
