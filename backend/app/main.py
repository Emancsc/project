from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.app_config import settings
from app.api.routers import requests, citizens, agents, analytics, interactions, milestones, assignment
from app.api.routers import dev_seed, auth
from app.services.indexes import ensure_indexes
from app.api.routers import citizens


app = FastAPI(title=settings.PROJECT_NAME)

ensure_indexes()

# ✅ Staff auth (JWT)
app.include_router(auth.router)
app.include_router(citizens.router)


# Routers
app.include_router(requests.router)
app.include_router(citizens.router)
app.include_router(agents.router)
app.include_router(analytics.router)
app.include_router(interactions.router)
app.include_router(milestones.router)
app.include_router(assignment.router)
app.include_router(dev_seed.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "CST backend running"}

