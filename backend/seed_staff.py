from app.core.db import db
from app.core.security import hash_password
from datetime import datetime, timezone

email = "staff@cst.com"
password = "eman123"

if not db.users.find_one({"email": email}):
    db.users.insert_one({
        "name": "Staff Admin",
        "email": email,
        "password_hash": hash_password(password),
        "role": "staff",
        "created_at": datetime.now(timezone.utc)
    })
    print("Staff user created")
else:
    print("Staff already exists")
