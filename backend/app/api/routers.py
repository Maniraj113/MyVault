"""Main API router configuration."""
from fastapi import APIRouter

from .chat import router as chat_router
from .expenses import router as expenses_router
from .tasks import router as tasks_router
from .items import router as items_router
from .calendar import router as calendar_router
from .files import router as files_router

api_router = APIRouter()

# Include all routers with their prefixes and tags
api_router.include_router(chat_router, prefix="/chat", tags=["Chat"])
api_router.include_router(expenses_router, prefix="/expenses", tags=["Expenses"])
api_router.include_router(tasks_router, prefix="/tasks", tags=["Tasks"])
api_router.include_router(items_router, prefix="/items", tags=["Items"])
api_router.include_router(calendar_router, prefix="/calendar", tags=["Calendar"])
api_router.include_router(files_router, prefix="/files", tags=["Files"])
