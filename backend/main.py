"""
MyVault Backend API
FastAPI application with SQLite database for personal data management.
"""
from __future__ import annotations

import logging
import sys
import time
from typing import Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.api.routers import api_router
from app.models import Base
from app.db import engine


def setup_logging():
    """Configure detailed logging."""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('myvault.log')
        ]
    )

def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    setup_logging()
    logger = logging.getLogger("myvault")
    
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
    
    # Enhanced logging configuration
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(),
        ]
    )
    
    # Create logger
    logger = logging.getLogger("myvault")

    @app.middleware("http")
    async def log_requests(request: Request, call_next: Callable) -> Response:
        """Enhanced request logging middleware."""
        start_time = time.time()
        logger = logging.getLogger("myvault")
        
        # Log request details
        client_ip = request.client.host if request.client else "unknown"
        logger.info(f"🚀 Request: {request.method} {request.url.path}")
        logger.info(f"👤 Client: {client_ip}")
        logger.info(f"🔍 Query Params: {dict(request.query_params)}")
        
        # Log request body for POST/PUT requests
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
                if body:
                    logger.info(f"📝 Request Body: {body.decode()}")
            except Exception as e:
                logger.warning(f"⚠️ Could not log request body: {str(e)}")
        
        # Process request
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            status_emoji = "✅" if response.status_code < 400 else "❌"
            logger.info(
                f"{status_emoji} Response: {response.status_code} - {request.method} {request.url.path} "
                f"- Time: {process_time:.3f}s"
            )
            
            # For errors, try to get more details
            if response.status_code >= 400:
                try:
                    response_body = b""
                    async for chunk in response.body_iterator:
                        response_body += chunk
                    logger.error(f"❌ Error Response Body: {response_body.decode()}")
                except Exception:
                    pass
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"💥 Error processing {request.method} {request.url.path}\n"
                f"Error: {str(e)}\n"
                f"Time: {process_time:.3f}s",
                exc_info=True
            )
            # Return a JSON error response instead of raising
            return JSONResponse(
                status_code=500,
                content={"detail": str(e)}
            )

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
