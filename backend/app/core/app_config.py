import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME = "Citizen Services Tracker"
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    DB_NAME = os.getenv("DB_NAME", "cst_db")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

settings = Settings()
