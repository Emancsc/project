from app.core.db import db

def ensure_indexes():
    col = db.service_requests

    # Geo index for location (GeoJSON Point)
    col.create_index([("location", "2dsphere")])

    # Common filters
    col.create_index("status")
    col.create_index("category")
    col.create_index("priority")
    col.create_index("created_at")
