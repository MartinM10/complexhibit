import json

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import settings
from app.dependencies import get_sparql_client
from app.models.domain import ObraDeArte
from app.models.responses import ErrorResponseModel, StandardResponseModel
from app.services.queries.artworks import ArtworkQueries
from app.services.sparql_client import SparqlClient
from app.utils.parsers import parse_sparql_response

router = APIRouter(prefix=f"{settings.DEPLOY_PATH}", tags=["obras"])


@router.get("/count_artworks", summary="Count of individuals of class artwork")
async def count_artworks(client: SparqlClient = Depends(get_sparql_client)):
    try:
        query = ArtworkQueries.COUNT_OBRAS
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


from fastapi.responses import ORJSONResponse

from typing import Optional
from app.utils.cursor import decode_cursor, encode_cursor

@router.get("/all_artworks", summary="Individuals of class artwork", response_class=ORJSONResponse)
async def all_artworks(
    cursor: Optional[str] = None,
    page_size: int = 20, 
    q: Optional[str] = None,
    author_name: Optional[str] = None,
    type_filter: Optional[str] = None,
    start_date: Optional[str] = None,
    owner: Optional[str] = None,
    topic: Optional[str] = None,
    exhibition: Optional[str] = None,
    client: SparqlClient = Depends(get_sparql_client)
):
    last_label, last_uri = None, None
    if cursor:
        decoded = decode_cursor(cursor)
        if decoded:
            last_label, last_uri = decoded

    # STEP 1: Fetch filtered and paginated IDs
    query_ids = ArtworkQueries.get_obras_ids(
        limit=page_size + 1, 
        last_label=last_label, 
        last_uri=last_uri, 
        text_search=q,
        author_name=author_name,
        type_filter=type_filter,
        start_date=start_date,
        owner=owner,
        topic=topic,
        exhibition=exhibition
    )
    
    try:
        response_ids = await client.query(query_ids)
        data_ids = parse_sparql_response(response_ids)
        
        if not data_ids:
             return ORJSONResponse(content={"data": [], "next_cursor": None})

        # Cursor Logic
        next_cursor = None
        if len(data_ids) > page_size:
            data_ids = data_ids[:page_size]
            last_item = data_ids[-1]
            # Note: get_obras_ids returns 'inner_label', not 'label'
            if "inner_label" in last_item and "uri" in last_item:
                next_cursor = encode_cursor(last_item["inner_label"], last_item["uri"])

        # Extract URIs
        uris = [item["uri"] for item in data_ids]
        
        # STEP 2: Fetch details for these IDs
        query_details = ArtworkQueries.get_obras_details(uris)
        response_details = await client.query(query_details)
        data_details = parse_sparql_response(response_details)
        
        # Merge/Sort: Map details by URI
        details_map = {item["uri"]: item for item in data_details}
        
        # Reconstruct list in the original order (from data_ids)
        final_data = []
        for item_id in data_ids:
            uri = item_id["uri"]
            if uri in details_map:
                final_data.append(details_map[uri])
            else:
                final_data.append(item_id)

        return ORJSONResponse(content={"data": final_data, "next_cursor": next_cursor})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




@router.get("/get_artwork/{id:path}")
async def get_artwork(id: str, client: SparqlClient = Depends(get_sparql_client)):
    query = ArtworkQueries.GET_ARTWORK_BY_ID % id
    try:
        response = await client.query(query)
        data = parse_sparql_response(response)
        return {"data": data, "sparql": query}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create_artwork", status_code=status.HTTP_201_CREATED)
async def create_artwork(obra: ObraDeArte, client: SparqlClient = Depends(get_sparql_client)):
    try:
        query = ArtworkQueries.add_obra(obra)
        response = await client.update(query)
        return response
    except Exception as e:
        return {"error": f"Error adding artwork. {str(e)}"}
