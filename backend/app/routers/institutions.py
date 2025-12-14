"""
Institution router endpoints.

Provides REST API endpoints for accessing and managing institution data.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import ORJSONResponse

from app.core.config import settings
from app.dependencies import get_sparql_client
from app.models.domain import Institucion
from app.models.responses import ErrorResponseModel, StandardResponseModel
from app.routers.pagination import paginated_query
from app.services.queries.institutions import InstitutionQueries
from app.services.sparql_client import SparqlClient
from app.utils.cursor import decode_cursor
from app.utils.parsers import group_by_uri, parse_sparql_response

router = APIRouter(prefix=f"{settings.DEPLOY_PATH}", tags=["instituciones"])


@router.get("/count_institutions", summary="Count of individuals of class institution")
async def count_institutions(client: SparqlClient = Depends(get_sparql_client)):
    """Get total count of institutions in the knowledge graph."""
    try:
        query = InstitutionQueries.COUNT_INSTITUCIONES
        response = await client.query(query)
        parsed = parse_sparql_response(response)
        count = parsed[0]["count"] if parsed else 0
        return StandardResponseModel(data={"count": count}, message="Operation successful")
    except Exception as e:
        error_response = ErrorResponseModel(
            error_code="INTERNAL_SERVER_ERROR",
            error_message="Internal Server Error",
            error_details={"error": str(e)},
        )
        raise HTTPException(status_code=500, detail=error_response.dict())


@router.get(
    "/all_institutions", 
    summary="Individuals of class institution", 
    response_class=ORJSONResponse
)
async def all_institutions(
    cursor: Optional[str] = None,
    page_size: int = 10, 
    q: Optional[str] = None,
    client: SparqlClient = Depends(get_sparql_client)
):
    """
    Get paginated list of institutions with optional filtering.
    
    Uses cursor-based pagination for stable, efficient results.
    """
    # Decode cursor
    last_label, last_uri = None, None
    if cursor:
        decoded = decode_cursor(cursor)
        if decoded:
            last_label, last_uri = decoded

    # Build IDs query with text search filter
    query_ids = InstitutionQueries.get_instituciones_ids(
        limit=page_size + 1, 
        last_label=last_label, 
        last_uri=last_uri, 
        text_search=q
    )
    
    # Use shared pagination utility
    result = await paginated_query(
        client=client,
        get_ids_query=query_ids,
        get_details_func=InstitutionQueries.get_instituciones_details,
        page_size=page_size,
        label_field="label"
    )
    
    return ORJSONResponse(content=result)


@router.get("/get_institution/{id:path}")
async def get_institution(id: str, client: SparqlClient = Depends(get_sparql_client)):
    """Get detailed information for a specific institution by ID."""
    query = InstitutionQueries.GET_INSTITUTION % id
    try:
        response = await client.query(query)
        flat_data = parse_sparql_response(response)
        grouped_data = group_by_uri(flat_data, list_fields=["label_place"])
        return {"data": grouped_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create_institution", status_code=status.HTTP_201_CREATED)
async def create_institution(
    entidad: Institucion, 
    client: SparqlClient = Depends(get_sparql_client)
):
    """Create a new institution in the knowledge graph."""
    try:
        query = InstitutionQueries.add_institucion(entidad)
        await client.update(query)
        return {
            "label": entidad.nombre,
            "uri": f"{settings.URI_ONTOLOGIA}{entidad.id}",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding institution: {str(e)}")
