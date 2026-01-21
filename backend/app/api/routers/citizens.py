# app/api/routers/citizens.py
from fastapi import APIRouter, HTTPException, Header
from datetime import datetime, timedelta
from typing import Dict, Any
import random, hashlib
from bson import ObjectId
from app.core.db import db
from app.models.user_models import CitizenCreate

router = APIRouter(prefix="/citizens", tags=["Citizens"])

OTP_EXPIRE_MINUTES = 5
OTP_MAX_ATTEMPTS = 5

def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()

def _now():
    return datetime.utcnow()

def _oid(s: str):
    if not ObjectId.is_valid(s):
        raise HTTPException(status_code=400, detail="Invalid citizen id")
    return ObjectId(s)

@router.post("")
def create_or_update_citizen(
    payload: CitizenCreate,
    x_citizen_id: str | None = Header(default=None, alias="X-Citizen-Id"),
):
    """
    - If X-Citizen-Id is provided and valid: update that citizen.
    - Else: create new citizen.
    """
    doc: Dict[str, Any] = {
        "full_name": payload.full_name,
        "email": payload.email,
        "phone": payload.phone,
        "anonymous": bool(payload.anonymous),
        "updated_at": _now(),
    }

    if doc["anonymous"]:
        doc["full_name"] = None
        doc["email"] = None
        doc["phone"] = None

    # Update existing
    if x_citizen_id:
        oid = _oid(x_citizen_id)
        existing = db.citizens.find_one({"_id": oid})
        if not existing:
            raise HTTPException(status_code=404, detail="Citizen not found")

        db.citizens.update_one({"_id": oid}, {"$set": doc})
        c = db.citizens.find_one({"_id": oid})
        if not c:
            raise HTTPException(status_code=404, detail="Citizen not found")

        c["_id"] = str(c["_id"])
        return {"citizen_id": str(oid), "citizen": c}

    # Create new
    doc["verification"] = {
        "state": "unverified",
        "method": "otp_stub",
        "verified_at": None,
    }
    doc["created_at"] = _now()

    res = db.citizens.insert_one(doc)
    return {"citizen_id": str(res.inserted_id), "citizen": {**doc, "_id": str(res.inserted_id)}}

@router.get("/me")
def get_me(x_citizen_id: str | None = Header(default=None, alias="X-Citizen-Id")):
    if not x_citizen_id:
        raise HTTPException(status_code=400, detail="Missing X-Citizen-Id")

    c = db.citizens.find_one({"_id": _oid(x_citizen_id)})
    if not c:
        raise HTTPException(status_code=404, detail="Citizen not found")

    c["_id"] = str(c["_id"])
    return c

@router.post("/otp/send")
def otp_send(
    channel: str = "email",
    x_citizen_id: str | None = Header(default=None, alias="X-Citizen-Id"),
):
    if not x_citizen_id:
        raise HTTPException(status_code=400, detail="Missing X-Citizen-Id")

    oid = _oid(x_citizen_id)
    citizen = db.citizens.find_one({"_id": oid})
    if not citizen:
        raise HTTPException(status_code=404, detail="Citizen not found")

    dest = None
    if channel == "email":
        dest = citizen.get("email")
    elif channel == "phone":
        dest = citizen.get("phone")
    else:
        raise HTTPException(status_code=400, detail="Invalid channel (use email/phone)")

    if not dest:
        raise HTTPException(status_code=400, detail=f"Citizen has no {channel}")

    code = f"{random.randint(0, 999999):06d}"
    expires_at = _now() + timedelta(minutes=OTP_EXPIRE_MINUTES)

    db.citizens.update_one(
        {"_id": oid},
        {"$set": {
            "otp": {
                "channel": channel,
                "to": dest,
                "code_hash": _hash_code(code),
                "expires_at": expires_at,
                "attempts": 0,
                "sent_at": _now(),
            },
            "verification.state": "unverified",
            "verification.method": "otp_stub",
            "verification.verified_at": None,
            "updated_at": _now(),
        }},
    )

    return {
        "ok": True,
        "channel": channel,
        "to": dest,
        "expires_in_seconds": OTP_EXPIRE_MINUTES * 60,
        "otp_stub_code": code,
    }

@router.post("/otp/verify")
def otp_verify(
    code: str,
    x_citizen_id: str | None = Header(default=None, alias="X-Citizen-Id"),
):
    if not x_citizen_id:
        raise HTTPException(status_code=400, detail="Missing X-Citizen-Id")

    oid = _oid(x_citizen_id)
    citizen = db.citizens.find_one({"_id": oid})
    if not citizen:
        raise HTTPException(status_code=404, detail="Citizen not found")

    otp = citizen.get("otp")
    if not otp:
        raise HTTPException(status_code=400, detail="No OTP requested")

    if otp.get("expires_at") and otp["expires_at"] < _now():
        raise HTTPException(status_code=400, detail="OTP expired")

    attempts = int(otp.get("attempts", 0))
    if attempts >= OTP_MAX_ATTEMPTS:
        raise HTTPException(status_code=400, detail="Too many attempts")

    if _hash_code(code.strip()) != otp.get("code_hash"):
        db.citizens.update_one({"_id": oid}, {"$inc": {"otp.attempts": 1}, "$set": {"updated_at": _now()}})
        raise HTTPException(status_code=400, detail="Invalid OTP")

    db.citizens.update_one(
        {"_id": oid},
        {"$set": {
            "verification.state": "verified",
            "verification.method": "otp_stub",
            "verification.verified_at": _now(),
            "updated_at": _now(),
        }, "$unset": {"otp": ""}},
    )

    updated = db.citizens.find_one({"_id": oid})
    if not updated:
        raise HTTPException(status_code=404, detail="Citizen not found")

    updated["_id"] = str(updated["_id"])
    return {"ok": True, "citizen": updated}
