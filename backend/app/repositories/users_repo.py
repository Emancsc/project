from pymongo.collection import Collection
from datetime import datetime
from app.core.security import hash_password

class UsersRepository:
    def __init__(self, collection: Collection):
        self.collection = collection
        self.collection.create_index("email", unique=True)

    def create_citizen(self, name: str, email: str, password: str):
        user = {
            "name": name,
            "email": email,
            "password_hash": hash_password(password),
            "role": "citizen",
            "created_at": datetime.utcnow()
        }
        self.collection.insert_one(user)
        user["_id"] = str(user["_id"])
        return user

    def find_by_email(self, email: str):
        return self.collection.find_one({"email": email})
