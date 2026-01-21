from pymongo.collection import Collection
from datetime import datetime
from typing import Dict, Optional, Any

from fastapi import HTTPException
from bson import ObjectId

from app.models.request_models import CreateServiceRequest
from app.utils.objectid import validate_object_id
from app.services.workflow_service import build_transition_update
from app.services.sla_service import build_sla_fields_from_request


class RequestsRepository:
    def __init__(self, collection: Collection, logs_collection: Optional[Collection] = None):
        self.collection = collection
        self.logs_collection = logs_collection

    # -------------------------
    # helpers: logs
    # -------------------------
    def _append_event(
        self,
        request_oid: ObjectId,
        event_type: str,
        actor_type: str,
        actor_id: str,
        meta: Optional[Dict[str, Any]] = None,
    ) -> None:
        if self.logs_collection is None:
            return

        rid = str(request_oid)
        evt = {
            "type": event_type,
            "by": {"actor_type": actor_type, "actor_id": actor_id},
            "at": datetime.utcnow(),
            "meta": meta or {},
        }
        self.logs_collection.update_one(
            {"request_id": rid},
            {"$push": {"event_stream": evt}, "$setOnInsert": {"created_at": datetime.utcnow()}},
            upsert=True,
        )

    def _set_computed_kpis(self, request_oid: ObjectId, kpis: Dict[str, Any]) -> None:
        if self.logs_collection is None:
            return

        rid = str(request_oid)
        self.logs_collection.update_one(
            {"request_id": rid},
            {"$set": {"computed_kpis": kpis, "updated_at": datetime.utcnow()}},
            upsert=True,
        )

    # -------------------------
    # helpers: timestamps shape
    # -------------------------
    def _ensure_timestamps_shape(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.utcnow()
        ts = doc.get("timestamps") or {}

        if "created_at" not in ts:
            ts["created_at"] = doc.get("created_at", now)

        ts.setdefault("triaged_at", None)
        ts.setdefault("assigned_at", None)
        ts.setdefault("work_started_at", None)
        ts.setdefault("resolved_at", None)
        ts.setdefault("closed_at", None)

        ts["updated_at"] = now

        doc["timestamps"] = ts
        doc["created_at"] = ts["created_at"]
        doc["updated_at"] = ts["updated_at"]
        return doc

    # -------------------------
    # helpers: duplicates merge
    # -------------------------
    def merge_into_master(self, duplicate_request_id: str, master_request_id: str) -> Dict[str, Any]:
        dup_oid = validate_object_id(duplicate_request_id)
        master_oid = validate_object_id(master_request_id)

        if dup_oid == master_oid:
            raise HTTPException(status_code=400, detail="master_request_id cannot equal request_id")

        dup = self.collection.find_one({"_id": dup_oid})
        master = self.collection.find_one({"_id": master_oid})
        if not dup:
            raise HTTPException(status_code=404, detail="Duplicate request not found")
        if not master:
            raise HTTPException(status_code=404, detail="Master request not found")

        # ensure master marked correctly
        now = datetime.utcnow()

        # 1) update duplicate: mark as non-master, set master_request_id
        self.collection.update_one(
            {"_id": dup_oid},
            {"$set": {
                "duplicates.is_master": False,
                "duplicates.master_request_id": str(master_oid),
                "updated_at": now,
                "timestamps.updated_at": now,
            }},
        )

        # 2) update master: ensure is_master and add linked duplicate id
        self.collection.update_one(
            {"_id": master_oid},
            {"$set": {
                "duplicates.is_master": True,
                "duplicates.master_request_id": None,
                "updated_at": now,
                "timestamps.updated_at": now,
            },
             "$addToSet": {"duplicates.linked_duplicates": str(dup_oid)}},
        )

        # logs (optional)
        self._append_event(master_oid, "duplicate_linked", "staff", "staff", {"duplicate_id": str(dup_oid)})
        self._append_event(dup_oid, "duplicate_marked", "staff", "staff", {"master_id": str(master_oid)})

        updated_master = self.collection.find_one({"_id": master_oid})
        if updated_master is None:
            raise HTTPException(status_code=500, detail="Failed to fetch master request")

        updated_master["_id"] = str(updated_master["_id"])
        return updated_master

    # -------------------------
    # create (with idempotency)
    # -------------------------
    def create_request(
        self,
        data: CreateServiceRequest,
        citizen_id: str,
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:

        # ✅ Idempotency: if key exists for same citizen, return existing request
        if idempotency_key:
            existing = self.collection.find_one({
                "idempotency.key": idempotency_key,
                "citizen_id": citizen_id,
            })
            if existing:
                existing["_id"] = str(existing["_id"])
                return existing

        doc = data.dict()
        doc["status"] = "new"
        doc["citizen_id"] = citizen_id

        doc["workflow"] = {
            "current_state": "new",
            "allowed_next": ["triaged", "closed"],
            "transition_rules_version": "v1",
        }

        doc["duplicates"] = {
            "is_master": True,
            "master_request_id": None,
            "linked_duplicates": [],
        }

        if idempotency_key:
            doc["idempotency"] = {
                "key": idempotency_key,
                "created_at": datetime.utcnow(),
            }

        doc = self._ensure_timestamps_shape(doc)

        sla_fields = build_sla_fields_from_request(doc)
        doc["sla_policy"] = sla_fields["sla_policy"]
        doc["sla_state"] = sla_fields["computed_kpis"]["sla_state"]
        doc["sla_computed"] = sla_fields["computed_kpis"]

        result = self.collection.insert_one(doc)
        oid = result.inserted_id

        # request_id = _id string
        self.collection.update_one({"_id": oid}, {"$set": {"request_id": str(oid)}})

        doc["_id"] = str(oid)
        doc["request_id"] = str(oid)

        self._append_event(oid, "created", "citizen", str(citizen_id), {"channel": "web"})
        self._set_computed_kpis(oid, sla_fields["computed_kpis"])

        return doc

    # -------------------------
    # list (staff)
    # -------------------------
    def list_requests(
        self,
        status: Optional[str] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> Dict[str, Any]:
        query: Dict[str, Any] = {}
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
        return {"items": items, "page": page, "page_size": page_size, "total": total}

    # -------------------------
    # get by id
    # -------------------------
    def get_by_id(self, request_id: str) -> Dict[str, Any]:
        oid = validate_object_id(request_id)
        r = self.collection.find_one({"_id": oid})
        if not r:
            raise HTTPException(status_code=404, detail="Not found")
        r["_id"] = str(r["_id"])
        return r

    # -------------------------
    # workflow transition (staff)
    # -------------------------
    def transition_request(self, request_id: str, next_status: str) -> Dict[str, Any]:
        oid = validate_object_id(request_id)

        request = self.collection.find_one({"_id": oid})
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")

        current_status = request.get("status", "new")

        update = build_transition_update(current_status=current_status, next_status=next_status)

        existing_ts = request.get("timestamps") or {}
        for k in ["triaged_at", "assigned_at", "work_started_at", "resolved_at", "closed_at"]:
            if existing_ts.get(k) is not None:
                update["$set"].pop(f"timestamps.{k}", None)

        res = self.collection.update_one({"_id": oid}, update)
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Request not found")

        updated = self.collection.find_one({"_id": oid})
        if updated is None:
            raise HTTPException(status_code=500, detail="Failed to fetch updated request")

        updated = self._ensure_timestamps_shape(updated)
        sla_fields = build_sla_fields_from_request(updated)

        self.collection.update_one(
            {"_id": oid},
            {"$set": {
                "sla_policy": sla_fields["sla_policy"],
                "sla_state": sla_fields["computed_kpis"]["sla_state"],
                "sla_computed": sla_fields["computed_kpis"],
                "updated_at": datetime.utcnow(),
                "timestamps.updated_at": datetime.utcnow(),
            }},
        )

        self._append_event(oid, "transition", "staff", "staff", {"from": current_status, "to": next_status})
        self._set_computed_kpis(oid, sla_fields["computed_kpis"])

        updated2 = self.collection.find_one({"_id": oid})
        if updated2 is None:
            raise HTTPException(status_code=500, detail="Failed to fetch updated request")

        updated2["_id"] = str(updated2["_id"])
        return updated2

    # -------------------------
    # geo nearby
    # -------------------------
    def nearby(self, lng: float, lat: float, radius_m: int = 1000) -> Dict[str, Any]:
        query = {
            "location": {
                "$near": {
                    "$geometry": {"type": "Point", "coordinates": [lng, lat]},
                    "$maxDistance": radius_m,
                }
            }
        }

        items = []
        for r in self.collection.find(query).limit(200):
            r["_id"] = str(r["_id"])
            items.append(r)

        return {"items": items}

    # -------------------------
    # citizen list
    # -------------------------
    def list_by_citizen(self, citizen_id: str) -> Dict[str, Any]:
        q: Dict[str, Any] = {"citizen_id": citizen_id}
        if ObjectId.is_valid(citizen_id):
            q = {"$or": [{"citizen_id": citizen_id}, {"citizen_id": ObjectId(citizen_id)}]}

        cursor = self.collection.find(q).sort("created_at", -1)
        items = []
        for r in cursor:
            r["_id"] = str(r["_id"])
            items.append(r)

        return {"items": items}

    # -------------------------
    # priority update (staff)
    # -------------------------
    def update_priority(self, request_id: str, priority: str) -> Dict[str, Any]:
        oid = validate_object_id(request_id)

        self.collection.update_one(
            {"_id": oid},
            {"$set": {"priority": priority, "updated_at": datetime.utcnow(), "timestamps.updated_at": datetime.utcnow()}},
        )

        updated = self.collection.find_one({"_id": oid})
        if not updated:
            raise HTTPException(status_code=404, detail="Request not found")

        updated = self._ensure_timestamps_shape(updated)
        sla_fields = build_sla_fields_from_request(updated)

        self.collection.update_one(
            {"_id": oid},
            {"$set": {
                "sla_policy": sla_fields["sla_policy"],
                "sla_state": sla_fields["computed_kpis"]["sla_state"],
                "sla_computed": sla_fields["computed_kpis"],
                "updated_at": datetime.utcnow(),
                "timestamps.updated_at": datetime.utcnow(),
            }},
        )

        self._append_event(oid, "priority_updated", "staff", "staff", {"priority": priority})
        self._set_computed_kpis(oid, sla_fields["computed_kpis"])

        updated2 = self.collection.find_one({"_id": oid})
        if updated2 is None:
            raise HTTPException(status_code=500, detail="Failed to fetch updated request")

        updated2["_id"] = str(updated2["_id"])
        return updated2
