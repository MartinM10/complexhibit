"""
Application settings configuration.

Loads settings from environment variables with defaults.
"""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Ontology settings
    URI_ONTOLOGIA: str = "https://w3id.org/OntoExhibit#" # kept as sensible default
    
    # Virtuoso settings
    VIRTUOSO_URL: str
    DEFAULT_GRAPH_URL: str = ""
    VIRTUOSO_USER: str = "dba"
    VIRTUOSO_PASSWORD: str = ""  # Must be provided by env
    
    # App config
    PROJECT_NAME: str = "Complexhibit API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = ""
    DEPLOY_PATH: str = ""
    
    # User service URL (optional)
    USER_SERVICE_URL: str = ""
    
    # Database (PostgreSQL for auth)
    DATABASE_URL: str = ""  # Must be provided by env
    
    # JWT Auth
    JWT_SECRET: str = ""    # Must be provided by env
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60
    
    # Admin
    ADMIN_EMAIL: str = ""    # Must be provided by env
    ADMIN_PASSWORD: str = "" # Must be provided by env
    
    # SMTP Email
    SMTP_HOST: str = ""      # Must be provided by env
    SMTP_PORT: int = 587
    SMTP_USER: str = ""      # Must be provided by env
    SMTP_PASSWORD: str = ""  # Must be provided by env
    SMTP_FROM: str = ""      # Must be provided by env
    
    # Frontend URL (for email links)
    FRONTEND_URL: str = ""   # Must be provided by env

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
