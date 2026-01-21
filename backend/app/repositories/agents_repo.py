from pymongo.collection import Collection
from datetime import datetime
from typing import Dict
from fastapi import HTTPException
from app.utils.objectid import validate_object_id


class AgentsRepository:
    def __init__(self, collection: Collection):
        self.collection = collection

    def create(self, data: dict) -> Dict:
        doc = {**data, "created_at": datetime.utcnow()}
        r = self.collection.insert_one(doc)
        doc["_id"] = str(r.inserted_id)
        return doc

    def get_by_id(self, agent_id: str) -> Dict:
        oid = validate_object_id(agent_id)
        doc = self.collection.find_one({"_id": oid})
        if not doc:
            raise HTTPException(status_code=404, detail="Agent not found")
        doc["_id"] = str(doc["_id"])
        return doc

    def list_active(self) -> Dict:
        items = []
        for a in self.collection.find({"active": True}).sort("created_at", -1).limit(200):
            a["_id"] = str(a["_id"])
            items.append(a)
        return {"items": items}
