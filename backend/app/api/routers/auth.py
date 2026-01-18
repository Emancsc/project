from fastapi import APIRouter, Depends, HTTPException
from datetime import timedelta
from app.models.user_models import UserCreate, UserLogin
from app.core.security import verify_password, create_access_token
from app.repositories.users_repo import UsersRepository
from app.core.db import db

router = APIRouter(prefix="/auth", tags=["Auth"])
repo = UsersRepository(db.users)

@router.post("/register")
def register(data: UserCreate):
    if repo.find_by_email(data.email):
        raise HTTPException(status_code=400, detail="Email already exists")

    user = repo.create_citizen(data.name, data.email, data.password)
    return {"message": "Registered successfully", "user_id": user["_id"]}

@router.post("/login")
def login(data: UserLogin):
    user = repo.find_by_email(data.email)
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user["_id"]), "role": user["role"]})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/staff/login")
def staff_login(data: UserLogin):
    user = repo.find_by_email(data.email)
    if not user or user["role"] != "staff":
        raise HTTPException(status_code=401, detail="Invalid staff credentials")

    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid staff credentials")

    token = create_access_token({"sub": str(user["_id"]), "role": "staff"})
    return {"access_token": token, "token_type": "bearer"}
