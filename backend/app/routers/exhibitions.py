import json

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import settings
from app.dependencies import get_sparql_client
from app.models.domain import Exposicion
from app.models.responses import ErrorResponseModel, StandardResponseModel
from app.services.queries.exhibitions import ExhibitionQueries
from app.services.sparql_client import SparqlClient
from app.utils.parsers import parse_sparql_response

router = APIRouter(prefix=f"{settings.DEPLOY_PATH}", tags=["exposiciones"])


@router.get("/count_exhibitions", summary="Count of individuals of class exhibition")
async def count_exhibitions(client: SparqlClient = Depends(get_sparql_client)):
    try:
        query = ExhibitionQueries.COUNT_EXPOSICIONES
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

@router.get("/all_exhibitions", summary="Individuals of class exhibition", response_class=ORJSONResponse)
async def all_exhibitions(
    cursor: Optional[str] = None,
    page_size: int = 10, 
    q: Optional[str] = None,
    curator_name: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    place: Optional[str] = None,
    organizer: Optional[str] = None,
    sponsor: Optional[str] = None,
    theme: Optional[str] = None,
    type: Optional[str] = None,
    client: SparqlClient = Depends(get_sparql_client)
):
    last_label, last_uri = None, None
    if cursor:
        decoded = decode_cursor(cursor)
        if decoded:
            last_label, last_uri = decoded

    # STEP 1: Fetch filtered and paginated IDs
    query_ids = ExhibitionQueries.get_exposiciones_ids(
        limit=page_size + 1, 
        last_label=last_label, 
        last_uri=last_uri, 
        text_search=q,
        curator_name=curator_name,
        start_date=start_date,
        end_date=end_date,
        place=place,
        organizer=organizer,
        sponsor=sponsor,
        theme=theme,
        exhibition_type=type
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
            # Note: get_exposiciones_ids returns 'inner_label', not 'label'
            if "inner_label" in last_item and "uri" in last_item:
                next_cursor = encode_cursor(last_item["inner_label"], last_item["uri"])

        # Extract URIs
        uris = [item["uri"] for item in data_ids]
        
        # STEP 2: Fetch details for these IDs
        query_details = ExhibitionQueries.get_exposiciones_details(uris)
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
                # Fallback if details query missed something (unlikely), use ID data
                final_data.append(item_id)

        return ORJSONResponse(content={"data": final_data, "next_cursor": next_cursor})
    except Exception as e:
        print(f"Error in all_exhibitions: {e}") 
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/get_exhibition/{id:path}")
async def get_exhibition(id: str, client: SparqlClient = Depends(get_sparql_client)):
    query = ExhibitionQueries.GET_EXHIBITION_BY_ID % id
    try:
        response = await client.query(query)
        data = parse_sparql_response(response)
        # Usually get one, but data is a list
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create_exhibition", status_code=status.HTTP_201_CREATED)
async def create_exhibition(
    exposicion: Exposicion, client: SparqlClient = Depends(get_sparql_client)
):
    try:
        query = ExhibitionQueries.add_exposicion(exposicion)
        response = await client.update(query)
        return response
    except Exception as e:
        return {"error": f"Error adding exhibition. {str(e)}"}
