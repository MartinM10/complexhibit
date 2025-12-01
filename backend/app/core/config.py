import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    URI_ONTOLOGIA: str
    DATABASE_STARDOG: str = ""
    ENDPOINT_STARDOG: str = ""
    USERNAME_STARDOG: str = ""
    PASSWORD_STARDOG: str = ""
    DJANGO_SECRET_KEY: str
    VIRTUOSO_URL: str
    DEPLOY_PATH: str = ""
    USER_SERVICE_URL: str = ""
    DEFAULT_GRAPH_URL: str = ""
    VIRTUOSO_USER: str = "dba"
    VIRTUOSO_PASSWORD: str = "dba"

    # App config
    PROJECT_NAME: str = "Complexhibit API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
