from pydantic import BaseModel
import os


class Settings(BaseModel):
    app_name: str = "MyVault API"
    environment: str = os.getenv("ENV", "local")
    cors_origins: list[str] = [os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")]


def get_settings() -> "Settings":
    return Settings()


