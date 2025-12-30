from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.core.config import settings
from app.services.sparql_client import SparqlClient, sparql_client

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

ALGORITHM = "HS256"


def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        sub: str = payload.get("sub")
        if sub is None:
            raise credentials_exception
        return sub
    except JWTError:
        raise credentials_exception


def get_sparql_client() -> SparqlClient:
    return sparql_client
