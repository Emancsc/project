from fastapi import APIRouter, HTTPException
from app.models.user_models import UserLogin
from app.core.security import verify_password, create_access_token
from app.repositories.users_repo import UsersRepository
from app.core.db import db

router = APIRouter(prefix="/auth", tags=["Auth"])
repo = UsersRepository(db.users)


@router.post("/staff/login")
def staff_login(data: UserLogin):
    user = repo.find_by_email(data.email)

    if not user or user.get("role") != "staff":
        raise HTTPException(status_code=401, detail="Invalid staff credentials")

    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid staff credentials")

    token = create_access_token({
        "sub": str(user["_id"]),
        "role": "staff"
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }
