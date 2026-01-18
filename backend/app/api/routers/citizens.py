from fastapi import APIRouter

router = APIRouter(prefix="/citizens", tags=["Citizens"])

@router.get("/")
def list_citizens():
    return {"message": "Citizens router working"}
