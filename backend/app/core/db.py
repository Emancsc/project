# app/core/db.py

from pymongo import MongoClient
from .app_config import settings

client = MongoClient(settings.MONGO_URI)
db = client[settings.DB_NAME]

def get_db():
    return db
