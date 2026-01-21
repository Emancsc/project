from pymongo.collection import Collection
from fastapi import HTTPException
from datetime import datetime
from typing import Dict, Any, List, Optional

from app.utils.objectid import validate_object_id


class RequestsAssignmentRepository:
    def __init__(self, requests_col: Collection, agents_col: Collection, logs_col: Optional[Collection] = None):
        self.requests = requests_col
        self.agents = agents_col
        self.logs = logs_col  # db.performance_logs (optional)

    # -------------------------
    # helpers: logs
    # -------------------------
    def _append_event(self, request_id: str, event_type: str, actor_type: str, actor_id: str, meta: Dict[str, Any]):
        if self.logs is None:
            return
        evt = {
            "type": event_type,
            "by": {"actor_type": actor_type, "actor_id": actor_id},
            "at": datetime.utcnow(),
            "meta": meta or {},
        }
        self.logs.update_one(
            {"request_id": request_id},
            {"$push": {"event_stream": evt}, "$setOnInsert": {"created_at": datetime.utcnow()}},
            upsert=True,
        )

    # -------------------------
    # helpers: selection policy
    # -------------------------
    def _agent_matches_zone(self, agent: Dict[str, Any], zone_id: Optional[str]) -> bool:
        if not zone_id:
            return True
        # try common shapes:
        # agent.coverage_zones: ["ZONE-1", ...] OR agent.zone_id: "ZONE-1"
        zones = agent.get("coverage_zones")
        if isinstance(zones, list):
            return zone_id in zones
        if agent.get("zone_id") == zone_id:
            return True
        return False

    def _agent_matches_skill(self, agent: Dict[str, Any], category: Optional[str]) -> bool:
        if not category:
            return True
        skills = agent.get("skills")
        if isinstance(skills, list) and skills:
            return category in skills or "general" in skills
        return True  # if no skills field, don't block

    def _compute_workload(self, agent_id_str: str) -> int:
        # workload = number of assigned or in_progress tasks for this agent
        return int(self.requests.count_documents({
            "assignment.assigned_agent_id": agent_id_str,
            "status": {"$in": ["assigned", "in_progress"]}
        }))

    def _pick_best_agent(self, candidates: List[Dict[str, Any]], category: Optional[str], zone_id: Optional[str]) -> Dict[str, Any]:
        # Filter by zone
        zone_filtered = [a for a in candidates if self._agent_matches_zone(a, zone_id)]
        pool = zone_filtered if zone_filtered else candidates

        # Filter by skills
        skill_filtered = [a for a in pool if self._agent_matches_skill(a, category)]
        pool2 = skill_filtered if skill_filtered else pool

        # Choose by minimal workload
        best = None
        best_load = float("inf")

        for a in pool2:
            aid = str(a.get("_id"))
            wl = self._compute_workload(aid)

            if wl < best_load:
                best = a
                best_load = wl


        if best is None:
            raise HTTPException(status_code=400, detail="No suitable agents found")
        return best

    # -------------------------
    # auto assign
    # -------------------------
    def auto_assign(self, request_id: str) -> Dict[str, Any]:
        oid = validate_object_id(request_id)
        req = self.requests.find_one({"_id": oid})
        if not req:
            raise HTTPException(status_code=404, detail="Request not found")

        # gather request info
        category = req.get("category")
        loc = req.get("location") or {}
        zone_id = loc.get("zone_id")

        # candidates
        candidates = list(self.agents.find({"active": True}).limit(200))
        if not candidates:
            raise HTTPException(status_code=400, detail="No active agents available")

        chosen = self._pick_best_agent(candidates, category=category, zone_id=zone_id)
        chosen_id = str(chosen["_id"])

        now = datetime.utcnow()
        update_doc = {
            "status": "assigned",
            "assignment": {
                "assigned_agent_id": chosen_id,
                "assigned_at": now,
                "method": "auto",
                "policy": {
                    "zone_id": zone_id,
                    "category": category,
                    "tie_breaker": "min_workload"
                }
            },
            "timestamps.assigned_at": now,
            "timestamps.updated_at": now,
            "updated_at": now,
            "workflow.current_state": "assigned",
        }

        self.requests.update_one({"_id": oid}, {"$set": update_doc})

        # log
        self._append_event(
            request_id=request_id,
            event_type="assigned",
            actor_type="staff",
            actor_id="staff",
            meta={"method": "auto", "agent_id": chosen_id, "zone_id": zone_id, "category": category},
        )

        updated = self.requests.find_one({"_id": oid})
        if not updated:
            raise HTTPException(status_code=500, detail="Failed to fetch updated request")
        updated["_id"] = str(updated["_id"])
        return updated

    # -------------------------
    # manual assign
    # -------------------------
    def set_assigned_agent(self, request_id: str, agent_id: str) -> Dict[str, Any]:
        roid = validate_object_id(request_id)
        aoid = validate_object_id(agent_id)

        req = self.requests.find_one({"_id": roid})
        if not req:
            raise HTTPException(status_code=404, detail="Request not found")

        agent = self.agents.find_one({"_id": aoid})
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        now = datetime.utcnow()
        update_doc = {
            "status": "assigned",
            "assignment": {
                "assigned_agent_id": str(agent["_id"]),
                "assigned_at": now,
                "method": "manual",
            },
            "timestamps.assigned_at": now,
            "timestamps.updated_at": now,
            "updated_at": now,
            "workflow.current_state": "assigned",
        }

        self.requests.update_one({"_id": roid}, {"$set": update_doc})

        # log
        self._append_event(
            request_id=request_id,
            event_type="assigned",
            actor_type="staff",
            actor_id="staff",
            meta={"method": "manual", "agent_id": str(agent["_id"])},
        )

        updated = self.requests.find_one({"_id": roid})
        if not updated:
            raise HTTPException(status_code=500, detail="Failed to fetch updated request")

        updated["_id"] = str(updated["_id"])
        return updated
