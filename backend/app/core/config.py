"""
Application settings configuration.

Loads settings from environment variables with defaults.
"""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Ontology settings
    URI_ONTOLOGIA: str
    DATABASE_STARDOG: str = ""
    ENDPOINT_STARDOG: str = ""
    USERNAME_STARDOG: str = ""
    PASSWORD_STARDOG: str = ""
    
    # Virtuoso settings
    VIRTUOSO_URL: str
    DEFAULT_GRAPH_URL: str = ""
    VIRTUOSO_USER: str = "dba"
    VIRTUOSO_PASSWORD: str = "dba"
    
    # App config
    PROJECT_NAME: str = "Complexhibit API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = ""
    DEPLOY_PATH: str = ""
    
    # Legacy settings
    DJANGO_SECRET_KEY: str = ""
    USER_SERVICE_URL: str = ""
    
    # Database (PostgreSQL for auth)
    DATABASE_URL: str = "postgresql://complexhibit:complexhibit@localhost:5432/complexhibit_auth"
    
    # JWT Auth
    JWT_SECRET: str = "change_this_in_production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60
    
    # Admin
    ADMIN_EMAIL: str = "martinjs@uma.es"
    
    # SMTP Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@complexhibit.org"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
