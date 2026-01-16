"""
Exhibition router endpoints.

Provides REST API endpoints for accessing and managing exhibition data.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import ORJSONResponse

from app.core.config import settings
from app.dependencies import get_sparql_client, require_user
from app.models.domain import Exposicion
from app.models.user import User
from app.models.responses import ErrorResponseModel, StandardResponseModel
from app.routers.pagination import paginated_query
from app.services.queries.exhibitions import ExhibitionQueries
from app.services.sparql_client import SparqlClient
from app.utils.cursor import decode_cursor
from app.utils.parsers import parse_sparql_response

router = APIRouter(prefix=f"{settings.DEPLOY_PATH}", tags=["exposiciones"])


@router.get("/count_exhibitions", summary="Count of individuals of class exhibition")
async def count_exhibitions(client: SparqlClient = Depends(get_sparql_client)):
    """Get total count of exhibitions in the knowledge graph."""
# ... (skipping unchanged parts) ...

@router.post("/create_exhibition", status_code=status.HTTP_201_CREATED)
async def create_exhibition(
    exposicion: Exposicion, 
    client: SparqlClient = Depends(get_sparql_client),
    user: User = Depends(require_user)
):
    """Create a new exhibition in the knowledge graph."""
    try:
        query = ExhibitionQueries.add_exposicion(exposicion)
        response = await client.update(query)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding exhibition: {str(e)}")


@router.get("/get_exhibition_museographers/{id:path}")
async def get_exhibition_museographers(id: str, client: SparqlClient = Depends(get_sparql_client)):
    """Get companies that provided museography services for this exhibition."""
    query = ExhibitionQueries.get_exhibition_museographers(id)
    try:
        response = await client.query(query)
        flat_data = parse_sparql_response(response)
        
        museographers = []
        for item in flat_data:
            museographers.append({
                "uri": item.get("company_uri"),
                "label": item.get("company_label")
            })
        
        return {"data": museographers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

