"""
MyVault Backend API
FastAPI application with Firestore database for personal data management.
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
from dotenv import load_dotenv
import os
from app.api.routers import api_router


def setup_logging():
    """Configure detailed logging with proper encoding for Windows."""
    # Reduce noise: info to file, warnings+ to console; no tracebacks on known client errors
    app_logger = logging.getLogger("myvault")
    app_logger.setLevel(logging.INFO)

    fmt = logging.Formatter('%(asctime)s [%(levelname)s] %(name)s: %(message)s')

    file_handler = logging.FileHandler('myvault.log', encoding='utf-8')
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(fmt)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.WARNING)
    console_handler.setFormatter(fmt)

    # Clear existing handlers to avoid duplication
    if app_logger.handlers:
        for h in list(app_logger.handlers):
            app_logger.removeHandler(h)
    app_logger.addHandler(file_handler)
    app_logger.addHandler(console_handler)

    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    load_dotenv()
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
        - Firestore database backend

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

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )

    # Firestore requires no schema creation. Ensure Firestore API and IAM set up in GCP.

    @app.middleware("http")
    async def log_requests(request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        logger = logging.getLogger("myvault")

        try:
            client_ip = request.client.host if request.client else "unknown"
            logger.info(f"Request: {request.method} {request.url.path}")
            logger.info(f"Client: {client_ip}")
            if request.query_params:
                logger.info(f"Query Params: {dict(request.query_params)}")
        except Exception as e:
            logger.warning(f"Error logging request details: {str(e)}")

        response = await call_next(request)
        process_time = time.time() - start_time
        try:
            status_indicator = "SUCCESS" if response.status_code < 400 else "ERROR"
            # Avoid dumping full tracebacks into logs; keep response line concise
            logger.info(
                f"Response: {response.status_code} - {request.method} {request.url.path} - Time: {process_time:.3f}s - Status: {status_indicator}"
            )
        except Exception as e:
            logger.warning(f"Error logging response details: {str(e)}")
        return response

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
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)



