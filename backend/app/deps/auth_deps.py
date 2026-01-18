from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from bson import ObjectId
from app.core.security import decode_token
from app.core.db import db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = None
    if ObjectId.is_valid(sub):
        user = db.users.find_one({"_id": ObjectId(sub)})
    else:
        user = db.users.find_one({"email": sub})

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    user["_id"] = str(user["_id"])
    return user


def require_role(role: str):
    def checker(user=Depends(get_current_user)):
        if user["role"] != role:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return checker
