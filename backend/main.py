"""
backend/main.py

FastAPI application entrypoint for FireCalendar.
Modular architecture:
  - backend/api/       : Route handlers (health, countries, analysis, trust)
  - backend/services/  : Analysis math & country registry services
  - backend/models/    : Pydantic schemas & response models
  - backend/core/      : Global configuration, paths & constants
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from backend.api import api_router

app = FastAPI(
    title="FireCalendar API",
    description="Harmonized NASA FIRMS Fire Activity Calendar & Early Warning API",
    version="1.0.0",
)

# Enable CORS for frontend and external callers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enable GZip compression for responses > 1000 bytes
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Register all modular API routers under /api
app.include_router(api_router)


@app.get("/")
def root():
    """Root landing endpoint."""
    return {
        "app": "FireCalendar Backend",
        "docs": "/docs",
        "health": "/api/health",
        "countries": "/api/countries",
    }
