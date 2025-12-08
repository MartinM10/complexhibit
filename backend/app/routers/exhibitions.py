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
    client: SparqlClient = Depends(get_sparql_client)
):
    last_label, last_uri = None, None
    if cursor:
        decoded = decode_cursor(cursor)
        if decoded:
            last_label, last_uri = decoded

    query = ExhibitionQueries.get_all_exposiciones(
        limit=page_size + 1, 
        last_label=last_label, 
        last_uri=last_uri, 
        text_search=q,
        curator_name=curator_name,
        start_date=start_date,
        end_date=end_date,
        place=place,
        organizer=organizer,
        sponsor=sponsor
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
