"""
Artwork router endpoints.

Provides REST API endpoints for accessing and managing artwork data.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import ORJSONResponse

from app.core.config import settings
from app.dependencies import get_sparql_client, require_user
from app.models.domain import ObraDeArte
from app.models.user import User
from app.models.responses import ErrorResponseModel, StandardResponseModel
from app.routers.pagination import paginated_query
from app.services.queries.artworks import ArtworkQueries
from app.services.sparql_client import SparqlClient
from app.utils.cursor import decode_cursor
from app.utils.parsers import parse_sparql_response

router = APIRouter(prefix=f"{settings.DEPLOY_PATH}", tags=["obras"])


@router.get("/count_artworks", summary="Count of individuals of class artwork")
async def count_artworks(client: SparqlClient = Depends(get_sparql_client)):
    """Get total count of artworks in the knowledge graph."""
# ... (skipping unchanged parts) ...

@router.post("/create_artwork", status_code=status.HTTP_201_CREATED)
async def create_artwork(
    obra: ObraDeArte, 
    client: SparqlClient = Depends(get_sparql_client),
    user: User = Depends(require_user)
):
    """Create a new artwork in the knowledge graph."""
    try:
        query, uri = ArtworkQueries.add_obra(obra)
        response = await client.update(query)
        return {"uri": uri, "label": obra.name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding artwork: {str(e)}")
