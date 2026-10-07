"""
backend/api/__init__.py

Exports the unified API router.
"""

from .routes import router as api_router

__all__ = ["api_router"]
