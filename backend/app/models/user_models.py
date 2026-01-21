# app/models/user_models.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# =====================================================
# Citizen (OTP / Verify – NO LOGIN, STUB)
# =====================================================

class CitizenCreate(BaseModel):
    full_name: Optional[str] = None

    # ⚠️ خليها string مش EmailStr
    # عشان admin@cst.local وما شابه
    email: Optional[str] = None

    phone: Optional[str] = None
    anonymous: bool = False


class CitizenVerification(BaseModel):
    state: str = "unverified"   # unverified | verified
    method: str = "otp_stub"
    verified_at: Optional[datetime] = None


class CitizenDB(BaseModel):
    id: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    anonymous: bool = False

    verification: CitizenVerification = CitizenVerification()
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CitizenVerifyPayload(BaseModel):
    citizen_id: str
    code: str


# =====================================================
# Staff Auth (ONLY staff, optional)
# =====================================================

class UserLogin(BaseModel):
    # هون EmailStr عادي
    email: EmailStr
    password: str = Field(..., min_length=3, max_length=200)


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(..., min_length=3, max_length=200)
