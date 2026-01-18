from datetime import datetime, timedelta
from typing import Optional

from jose import jwt, JWTError
import bcrypt

SECRET_KEY = "CHANGE_ME_SUPER_SECRET"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def _bcrypt_safe_bytes(password: str) -> bytes:
    # bcrypt limit: 72 bytes
    return password.encode("utf-8")[:72]


def hash_password(password: str) -> str:
    pw = _bcrypt_safe_bytes(password)
    hashed = bcrypt.hashpw(pw, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    pw = _bcrypt_safe_bytes(password)
    return bcrypt.checkpw(pw, password_hash.encode("utf-8"))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
