from fastapi import APIRouter, HTTPException
from app.core.db import db
from app.repositories.users_repo import UsersRepository

router = APIRouter(prefix="/dev", tags=["Dev"])

@router.post("/seed-staff")
def seed_staff():
    repo = UsersRepository(db.users)

    email = "admin@cst.local"
    exists = repo.find_by_email(email)
    if exists:
        return {"ok": True, "message": "Staff already exists", "email": email}

    user = repo.create_staff("Admin", email, "admin123")
    return {"ok": True, "email": email, "password": "admin123", "user_id": user["_id"]}
