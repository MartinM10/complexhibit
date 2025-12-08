from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import settings
from app.dependencies import get_sparql_client
from app.models.domain import Persona
from app.models.responses import ErrorResponseModel, StandardResponseModel
from app.services.queries.persons import PersonQueries
from app.services.sparql_client import SparqlClient
from app.utils.parsers import group_by_uri, parse_sparql_response

router = APIRouter(prefix=f"{settings.DEPLOY_PATH}", tags=["personas"])


from fastapi.responses import ORJSONResponse

# ... imports

from typing import Optional

# ... imports

from app.utils.cursor import decode_cursor, encode_cursor

@router.get("/all_persons", summary="Individuals of class person", response_class=ORJSONResponse)
async def all_persons(
    cursor: Optional[str] = None,
    page_size: int = 10, 
    q: Optional[str] = None,
    birth_place: Optional[str] = None,
    birth_date: Optional[str] = None,
    death_date: Optional[str] = None,
    gender: Optional[str] = None,
    activity: Optional[str] = None,
    client: SparqlClient = Depends(get_sparql_client)
):
    last_label, last_uri = None, None
    if cursor:
        decoded = decode_cursor(cursor)
        if decoded:
            last_label, last_uri = decoded

    query = PersonQueries.get_all_personas(
        limit=page_size + 1, 
        last_label=last_label, 
        last_uri=last_uri, 
        text_search=q,
        birth_place=birth_place,
        birth_date=birth_date,
        death_date=death_date,
        gender=gender,
        activity=activity
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


@router.get("/count_persons", summary="Count of individuals of class actant/person")
async def count_persons(client: SparqlClient = Depends(get_sparql_client)):
    query = PersonQueries.COUNT_ACTANTS
    try:
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


@router.get("/get_person/{id:path}")
async def get_person(id: str, client: SparqlClient = Depends(get_sparql_client)):
    query = PersonQueries.GET_PERSONS_AND_GROUPS % id
    try:
        response = await client.query(query)
        flat_data = parse_sparql_response(response)
        grouped_data = group_by_uri(flat_data, list_fields=["label_place", "label_date"])
        return {"data": grouped_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create_person", status_code=status.HTTP_201_CREATED)
async def create_person(persona: Persona, client: SparqlClient = Depends(get_sparql_client)):
    try:
        query = PersonQueries.add_persona(persona)
        response = await client.update(query)
        return response
    except Exception as e:
        return {"error": f"Error adding person. {str(e)}"}
