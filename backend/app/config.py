from pydantic import BaseModel
import os
from pathlib import Path
from typing import List


def _default_sqlite_url() -> str:
    # Ensure DB file is created under backend folder regardless of CWD
    backend_dir = Path(__file__).resolve().parents[1]
    db_path = backend_dir / "myvault.db"
    return f"sqlite:///{db_path}"


def _default_cors_origins() -> List[str]:
    # Common local dev ports for Vite
    defaults = [
        os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"),
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]
    # De-duplicate while preserving order
    seen = set()
    result: List[str] = []
    for o in defaults:
        if o and o not in seen:
            seen.add(o)
            result.append(o)
    return result


class Settings(BaseModel):
    app_name: str = "MyVault API"
    environment: str = os.getenv("ENV", "local")
    database_url: str = os.getenv("DATABASE_URL", _default_sqlite_url())
    cors_origins: list[str] = _default_cors_origins()


def get_settings() -> Settings:
    return Settings()


