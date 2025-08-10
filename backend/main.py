"""
MyVault Backend API
FastAPI application with SQLite database for personal data management.
"""
from __future__ import annotations

from fastapi import FastAPI, Request
import logging
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.routers import api_router
from app.models import Base
from app.db import engine


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    settings = get_settings()
    
    app = FastAPI(
        title=settings.app_name,
        description="""
        ## MyVault Personal Data Management API
        
        A comprehensive RESTful API for managing personal data including:
        - **Chat Messages**: WhatsApp-style messaging system
        - **Expenses & Income**: Financial tracking with categories
        - **Tasks**: Todo management with due dates
        - **Calendar**: Unified view of tasks and expenses
        
        ### Features
        - Real-time data synchronization
        - Comprehensive filtering and reporting
        - Mobile-responsive design support
        - SQLite database backend
        
        ### Authentication
        Currently using basic setup. JWT tokens recommended for production.
        """,
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        contact={
            "name": "MyVault Development Team",
            "email": "developer@myvault.com"
        },
        license_info={
            "name": "MIT License",
            "url": "https://opensource.org/licenses/MIT"
        }
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )

    # Create database tables
    Base.metadata.create_all(bind=engine)
    
    # Basic request logging
    logging.basicConfig(level=logging.INFO)

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        logging.info(f"{request.method} {request.url}")
        response = await call_next(request)
        logging.info(f"Completed {response.status_code}")
        return response

    # Include API routes
    app.include_router(api_router, prefix="/api")
    
    @app.get("/")
    async def root():
        return {"message": "MyVault API", "version": "1.0.0", "docs": "/api/docs"}
    
    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}
    
    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
