from fastapi import APIRouter, Depends
from app.core.db import db
from app.deps.auth_deps import require_role
from app.repositories.requests_assignment_repo import RequestsAssignmentRepository

router = APIRouter(prefix="/requests", tags=["Assignment"])


def get_repo():
    return RequestsAssignmentRepository(db.service_requests, db.service_agents, db.performance_logs)


@router.post("/{request_id}/auto-assign")
def auto_assign(request_id: str, _user=Depends(require_role("staff")), repo=Depends(get_repo)):
    return repo.auto_assign(request_id)


@router.post("/{request_id}/assign/{agent_id}")
def assign_to_agent(request_id: str, agent_id: str, _user=Depends(require_role("staff")), repo=Depends(get_repo)):
    return repo.set_assigned_agent(request_id, agent_id)
