from fastapi import APIRouter

from .routers import api_router

# Re-export the main API router
__all__ = ["api_router"]


