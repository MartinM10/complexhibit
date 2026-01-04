"""
Catalog router endpoints.

Provides REST API endpoints for accessing catalog (inscription devices/documentation resources) data.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import ORJSONResponse

from app.core.config import settings
from app.dependencies import get_sparql_client
from app.routers.pagination import paginated_query
from app.services.queries.catalogs import CatalogQueries
from app.services.sparql_client import SparqlClient
from app.utils.cursor import decode_cursor
from app.utils.parsers import parse_sparql_response

router = APIRouter(prefix=f"{settings.DEPLOY_PATH}", tags=["catalogs"])


@router.get(
    "/all_catalogs", 
    summary="Individuals of class catalog", 
    response_class=ORJSONResponse
)
async def all_catalogs(
    cursor: Optional[str] = None,
    page_size: int = 20, 
    q: Optional[str] = None,
    client: SparqlClient = Depends(get_sparql_client)
):
    """
    Get paginated list of catalogs with optional filtering.
    
    Uses cursor-based pagination for stable, efficient results.
    """
    last_label, last_uri = None, None
    if cursor:
        decoded = decode_cursor(cursor)
        if decoded:
            last_label, last_uri = decoded

    query_ids = CatalogQueries.get_catalogs_ids(
        limit=page_size + 1, 
        last_label=last_label, 
        last_uri=last_uri, 
        text_search=q
    )
    
    result = await paginated_query(
        client=client,
        get_ids_query=query_ids,
        get_details_func=CatalogQueries.get_catalogs_details,
        page_size=page_size,
        label_field="inner_label"
    )
    
    return ORJSONResponse(content=result)


@router.get("/get_catalog/{id:path}")
async def get_catalog(id: str, client: SparqlClient = Depends(get_sparql_client)):
    """Get detailed information for a specific catalog by ID."""
    query_main = CatalogQueries.GET_CATALOG_BY_ID % id
    query_producers = CatalogQueries.GET_CATALOG_PRODUCERS % id
    
    try:
        response_main = await client.query(query_main)
        data_main = parse_sparql_response(response_main)
        
        # Fetch producers
        if data_main:
            response_producers = await client.query(query_producers)
            data_producers = parse_sparql_response(response_producers)
            
            # Format producers as pipe-separated string for consistency
            if data_producers:
                producer_labels = [p.get("producer_label", "") for p in data_producers if p.get("producer_label")]
                producer_uris = [p.get("producer_uri", "") for p in data_producers if p.get("producer_uri")]
                data_main[0]["producers"] = "|".join(f"{uri}::{label}" for uri, label in zip(producer_uris, producer_labels))
        
        combined_query = f"{query_main}\n\n# PRODUCERS QUERY\n\n{query_producers}"
        
        return {"data": data_main, "sparql": combined_query}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/get_exhibition_catalogs/{id:path}")
async def get_exhibition_catalogs(id: str, client: SparqlClient = Depends(get_sparql_client)):
    """Get catalogs associated with an exhibition."""
    query = CatalogQueries.GET_EXHIBITION_CATALOGS % id
    
    try:
        response = await client.query(query)
        data = parse_sparql_response(response)
        return {"data": data, "sparql": query}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/get_producer_catalogs/{id:path}")
async def get_producer_catalogs(id: str, client: SparqlClient = Depends(get_sparql_client)):
    """Get catalogs produced by an actant or institution."""
    query = CatalogQueries.GET_PRODUCER_CATALOGS % id
    
    try:
        response = await client.query(query)
        data = parse_sparql_response(response)
        return {"data": data, "sparql": query}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/get_catalog_exhibitions/{id:path}")
async def get_catalog_exhibitions(id: str, client: SparqlClient = Depends(get_sparql_client)):
    """Get all exhibitions associated with a catalog."""
    query = CatalogQueries.GET_CATALOG_EXHIBITIONS % id
    
    try:
        response = await client.query(query)
        data = parse_sparql_response(response)
        return {"data": data, "sparql": query}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

