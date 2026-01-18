from app.core.db import db
from app.repositories.requests_repo import RequestsRepository
from app.models.request_models import CreateServiceRequest

repo = RequestsRepository(db.service_requests)

req = CreateServiceRequest(
    category="pothole",
    description="Test pothole request",
    location={"type": "Point", "coordinates": [35.2, 31.9]}
)

result = repo.create_request(req)
print(result)
