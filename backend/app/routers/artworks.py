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

    query = ArtworkQueries.get_all_obras(
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
        response = await client.query(query)
        data = parse_sparql_response(response)
        
        next_cursor = None
        if len(data) > page_size:
            data = data[:page_size]
            last_item = data[-1]
            if "label" in last_item and "uri" in last_item:
                next_cursor = encode_cursor(last_item["label"], last_item["uri"])

        return ORJSONResponse(content={"data": data, "next_cursor": next_cursor})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




@router.get("/get_artwork/{id:path}")
async def get_artwork(id: str, client: SparqlClient = Depends(get_sparql_client)):
    query = ArtworkQueries.GET_ARTWORK_BY_ID % id
    try:
        response = await client.query(query)
        data = parse_sparql_response(response)
        return {"data": data}
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
