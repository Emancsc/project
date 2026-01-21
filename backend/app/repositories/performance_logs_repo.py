# app/repositories/performance_logs_repo.py
from __future__ import annotations

from pymongo.collection import Collection
from datetime import datetime
from typing import Any, Dict, Optional, List


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
    ) -> None:
        evt = {
            "type": event_type,
            "by": {"actor_type": actor_type, "actor_id": actor_id},
            "at": datetime.utcnow(),
            "meta": meta or {},
        }
        self.col.update_one(
            {"request_id": request_id},
            {
                "$push": {"event_stream": evt},
                "$setOnInsert": {"created_at": datetime.utcnow()},
            },
            upsert=True,
        )

    def add_computed_kpis(self, request_id: str, kpis: Dict[str, Any]) -> None:
        """
        Store computed KPIs snapshot (SLA state, elapsed, etc.) for analytics.
        """
        self.col.update_one(
            {"request_id": request_id},
            {"$set": {"computed_kpis": kpis, "updated_at": datetime.utcnow()}},
            upsert=True,
        )

    def get_timeline(self, request_id: str) -> Dict[str, Any]:
        doc = self.col.find_one({"request_id": request_id}, {"_id": 0})
        if not doc:
            return {"request_id": request_id, "event_stream": []}

        # stringify datetimes for JSON
        for e in doc.get("event_stream", []):
            if "at" in e and hasattr(e["at"], "isoformat"):
                e["at"] = e["at"].isoformat()

        if "created_at" in doc and hasattr(doc["created_at"], "isoformat"):
            doc["created_at"] = doc["created_at"].isoformat()
        if "updated_at" in doc and hasattr(doc["updated_at"], "isoformat"):
            doc["updated_at"] = doc["updated_at"].isoformat()

        return doc
