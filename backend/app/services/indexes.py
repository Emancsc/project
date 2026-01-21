from app.core.db import db

def ensure_indexes():
    col = db.service_requests

    # Geo index for location (GeoJSON Point)
    col.create_index([("location", "2dsphere")])

    # Common filters
    col.create_index("status")
    col.create_index("category")
    col.create_index("priority")

    # Timestamps (new structure)
    col.create_index("timestamps.created_at")

    # Legacy compatibility
    col.create_index("created_at")

    # Optional compound indexes
    col.create_index([("status", 1), ("priority", 1)])
    col.create_index([("category", 1), ("status", 1)])

    # ---- Remove idempotency unique index (compatibility) ----
    # Some MongoDB deployments don't support partialFilterExpression well.
    try:
        col.drop_index("idempotency.key_1_citizen_id_1")
    except Exception:
        pass
