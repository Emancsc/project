from pymongo.collection import Collection
from datetime import datetime
from typing import Dict, Optional

from fastapi import HTTPException

from bson import ObjectId
from fastapi import HTTPException
from datetime import datetime, timezone
from app.models.request_models import CreateServiceRequest
from app.utils.objectid import validate_object_id
from app.services.workflow_service import validate_transition


class RequestsRepository:
    def __init__(self, collection: Collection):
        self.collection = collection

    def create_request(self, data: CreateServiceRequest, citizen_id: str):
        doc = data.dict()
        doc["status"] = "new"
        doc["citizen_id"] = citizen_id
        doc["created_at"] = datetime.utcnow()

        result = self.collection.insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        return doc


    def list_requests(
        self,
        status: Optional[str] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        page: int = 1,
        page_size: int = 10
    ) -> Dict:
        query = {}
        if status:
            query["status"] = status
        if category:
            query["category"] = category
        if priority:
            query["priority"] = priority

        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        skip = (page - 1) * page_size

        cursor = (
            self.collection.find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(page_size)
        )

        items = []
        for r in cursor:
            r["_id"] = str(r["_id"])
            items.append(r)

        total = self.collection.count_documents(query)

        return {
            "items": items,
            "page": page,
            "page_size": page_size,
            "total": total
        }

    def get_request_by_id(self, request_id: str) -> Dict:
        oid = validate_object_id(request_id)
        r = self.collection.find_one({"_id": oid})
        if not r:
            raise HTTPException(status_code=404, detail="Request not found")
        r["_id"] = str(r["_id"])
        return r
    def transition_request(self, request_id: str, next_status: str) -> Dict:
        oid = validate_object_id(request_id)

        request = self.collection.find_one({"_id": oid})
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")

        current_status = request["status"]
        validate_transition(current_status, next_status)

        result = self.collection.update_one(
            {"_id": oid},
            {"$set": {"status": next_status, "updated_at": datetime.utcnow()}}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Request not found")

        updated = self.collection.find_one({"_id": oid})
        if not updated:
            raise HTTPException(status_code=500, detail="Failed to fetch updated request")

        updated["_id"] = str(updated["_id"])
        return updated
    def nearby(self, lng: float, lat: float, radius_m: int = 1000):
        query = {
            "location": {
                "$near": {
                    "$geometry": {"type": "Point", "coordinates": [lng, lat]},
                    "$maxDistance": radius_m
                }
            }
        }

        items = []
        for r in self.collection.find(query).limit(200):
            r["_id"] = str(r["_id"])
            items.append(r)
        return {"items": items}
   
    def list_by_citizen(self, citizen_id: str):
        q = {"citizen_id": citizen_id}

        # support old records where citizen_id stored as ObjectId
        if ObjectId.is_valid(citizen_id):
            q = {"$or": [{"citizen_id": citizen_id}, {"citizen_id": ObjectId(citizen_id)}]}

        cursor = self.collection.find(q).sort("created_at", -1)
        items = []
        for r in cursor:
            r["_id"] = str(r["_id"])
            items.append(r)
        return {"items": items}

    def get_by_id(self, request_id: str):
        oid = validate_object_id(request_id)
        r = self.collection.find_one({"_id": oid})
        if not r:
            raise HTTPException(status_code=404, detail="Not found")
        r["_id"] = str(r["_id"])
        return r
    def update_priority(self, request_id: str, priority: str) -> dict:
        oid = ObjectId(request_id)
        self.collection.update_one(
            {"_id": oid},
            {"$set": {"priority": priority, "updated_at": datetime.now(timezone.utc)}}
        )
        updated = self.collection.find_one({"_id": oid})
        if not updated:
            raise HTTPException(status_code=404, detail="Request not found")
        updated["_id"] = str(updated["_id"])
        return updated





   
    
