from pymongo.collection import Collection
from datetime import datetime
from typing import Any, Dict, Optional

class PerformanceLogsRepository:
    def __init__(self, col: Collection):
        self.col = col

    def append_event(
        self,
        request_id: str,
        event_type: str,
        actor_type: str,
        actor_id: str,
        meta: Optional[Dict[str, Any]] = None,
    ):
        evt = {
            "type": event_type,
            "by": {"actor_type": actor_type, "actor_id": actor_id},
            "at": datetime.utcnow(),
            "meta": meta or {},
        }
        self.col.update_one(
            {"request_id": request_id},
            {"$push": {"event_stream": evt}, "$setOnInsert": {"created_at": datetime.utcnow()}},
            upsert=True,
        )

    def get_timeline(self, request_id: str):
        doc = self.col.find_one({"request_id": request_id}, {"_id": 0})
        if not doc:
            return {"request_id": request_id, "event_stream": []}
        # stringify datetimes for JSON
        for e in doc.get("event_stream", []):
            if "at" in e and hasattr(e["at"], "isoformat"):
                e["at"] = e["at"].isoformat()
        return doc
