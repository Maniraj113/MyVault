from pydantic import BaseModel
import os


class Settings(BaseModel):
    app_name: str = "MyVault API"
    environment: str = os.getenv("ENV", "local")
    
    # CORS configuration - read from environment variables
    cors_origins: list[str] = []
    
    # Database configuration
    firestore_database_id: str = os.getenv("FIRESTORE_DATABASE_ID", "myvault")
    
    # Google Cloud Configuration
    google_cloud_project: str = os.getenv("GOOGLE_CLOUD_PROJECT", "myvault-f3f99")
    firebase_storage_bucket: str = os.getenv("FIREBASE_STORAGE_BUCKET", "")
    
    # Server Configuration
    port: int = int(os.getenv("PORT", "8000"))
    host: str = os.getenv("HOST", "0.0.0.0")
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Parse CORS origins from environment variable
        cors_origins_str = os.getenv("CORS_ORIGINS", "")
        if cors_origins_str:
            self.cors_origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]
        else:
            # Fallback to default origins based on environment
            if self.environment == "production":
                self.cors_origins = [
                    "https://myvault-frontend-219371541860.asia-south1.run.app",
                    "https://myvault-frontend-219371541860.asia-south1.run.app/",
                    "https://myvault-frontend-219371541860.asia-south1.run.app/*",
                    "https://myvault-backend-219371541860.asia-south1.run.app",
                    "https://myvault-backend-219371541860.asia-south1.run.app/",
                    "https://myvault-backend-219371541860.asia-south1.run.app/*"
                ]
            else:
                self.cors_origins = [
                    "http://localhost:5173",
                    "http://localhost:3000",
                    "http://localhost:8000",
                    "http://127.0.0.1:5173",
                    "http://127.0.0.1:3000",
                    "http://127.0.0.1:8000"
                ]


def get_settings() -> "Settings":
    return Settings()


