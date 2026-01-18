from fastapi import APIRouter

router = APIRouter(prefix="/agents", tags=["Agents"])

@router.get("/")
def list_agents():
    return {"message": "Agents router working"}
