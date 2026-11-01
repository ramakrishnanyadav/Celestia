import os
from typing import List
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "CELESTIA AI Event Planning Assistant"
    VERSION: str = "2.0.0"
    API_PREFIX: str = "/api"
    ENV: str = os.getenv("ENV", "development").lower()
    
    # Secret key must be explicitly set and >= 32 chars in production
    SECRET_KEY: str = os.getenv("SECRET_KEY", "celestia_super_secure_secret_key_2026_indian_weddings")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 # 1 hour
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7 # 7 days
    
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'celestia.db'))}".replace("\\", "/")
    )
    
    # Demo account controlled by explicit flag, OFF by default in production
    DEMO_ACCOUNT_ENABLED: bool = (
        os.getenv("DEMO_ACCOUNT_ENABLED", "false" if os.getenv("ENV", "development").lower() == "production" else "true").lower() in ("true", "1")
    )
    
    # Strict CORS allowlist
    CORS_ORIGINS: List[str] = [
        origin.strip() for origin in os.getenv(
            "CORS_ORIGINS", 
            "http://localhost:3000,http://127.0.0.1:3000"
        ).split(",") if origin.strip()
    ]
    
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # AI Gateway Settings
    AI_PAUSED_GLOBAL: bool = os.getenv("AI_PAUSED_GLOBAL", "false").lower() in ("true", "1")
    AI_PER_USER_DAILY_BUDGET: int = int(os.getenv("AI_PER_USER_DAILY_BUDGET", "50"))
    AI_PER_CALL_TIMEOUT_SEC: float = float(os.getenv("AI_PER_CALL_TIMEOUT_SEC", "15.0"))

    def validate_production_config(self):
        """Refuses to run in production with missing or weak credentials."""
        if self.ENV == "production":
            insecure_defaults = [
                "celestia_super_secure_secret_key_2026_indian_weddings",
                "secret",
                "changeme",
                "default"
            ]
            if not self.SECRET_KEY or self.SECRET_KEY in insecure_defaults or len(self.SECRET_KEY) < 32:
                raise RuntimeError(
                    "FATAL: Insecure or missing SECRET_KEY in production. "
                    "Must be an unguessable string with at least 32 characters."
                )
            if "sqlite" in self.DATABASE_URL.lower():
                raise RuntimeError(
                    "FATAL: SQLite is prohibited in production. "
                    "Please configure a production PostgreSQL DATABASE_URL."
                )

settings = Settings()
