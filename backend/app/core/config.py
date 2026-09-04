from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "NER Smart Logistics"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "ner_logistics"
    DATABASE_URL: Optional[str] = None
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Security
    JWT_SECRET: str = "supersecretkey_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # External APIs
    WEATHER_API_KEY: Optional[str] = None
    NEWS_API_KEY: Optional[str] = None
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8', extra='ignore')

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return "sqlite:///./logistics.db"

settings = Settings()
