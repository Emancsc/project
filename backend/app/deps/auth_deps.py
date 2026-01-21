# app/deps/auth_deps.py
from fastapi import Depends, HTTPException, Header

ALLOWED_ROLES = {"citizen", "staff", "agent"}

def get_current_user(
    x_role: str = Header(default="citizen", alias="X-Role"),
    x_citizen_id: str | None = Header(default=None, alias="X-Citizen-Id"),
):
    role = (x_role or "citizen").lower()

    if role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")

    return {
        "_id": x_citizen_id or "public-citizen",
        "role": role,
        "name": "Public Citizen" if role == "citizen" else role.title(),
    }

def require_role(role: str):
    def checker(user=Depends(get_current_user)):
        if user["role"] != role:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return checker
