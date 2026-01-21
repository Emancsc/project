from fastapi import APIRouter, Depends
from app.core.db import db
from app.deps.auth_deps import require_role
from app.repositories.agents_repo import AgentsRepository
from app.models.agent_models import AgentCreate

router = APIRouter(prefix="/agents", tags=["Agents"])


def get_repo():
    return AgentsRepository(db.service_agents)


@router.post("/")
def create_agent(payload: AgentCreate, _user=Depends(require_role("staff")), repo=Depends(get_repo)):
    return repo.create(payload.model_dump())


@router.get("/{agent_id}")
def get_agent(agent_id: str, _user=Depends(require_role("staff")), repo=Depends(get_repo)):
    return repo.get_by_id(agent_id)


@router.get("/")
def list_agents(_user=Depends(require_role("staff")), repo=Depends(get_repo)):
    return repo.list_active()
