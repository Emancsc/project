from typing import Optional, Dict, Any, List
from datetime import datetime


def _agent_is_on_shift(agent_doc: Dict[str, Any]) -> bool:
    # minimal stub: treat active agents as available
    return bool(agent_doc.get("active", True))


def choose_agent(candidates: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    # minimal: pick first available (extend later: workload, skill, zone)
    for a in candidates:
        if _agent_is_on_shift(a):
            return a
    return None
