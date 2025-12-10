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

    # STEP 1: Fetch filtered and paginated IDs
    query_ids = PersonQueries.get_personas_ids(
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
        response_ids = await client.query(query_ids)
        data_ids = parse_sparql_response(response_ids)
        
        if not data_ids:
             return ORJSONResponse(content={"data": [], "next_cursor": None})

        # Cursor Logic
        next_cursor = None
        if len(data_ids) > page_size:
            data_ids = data_ids[:page_size]
            last_item = data_ids[-1]
            if "label" in last_item and "uri" in last_item:
                next_cursor = encode_cursor(last_item["label"], last_item["uri"])

        # Extract URIs
        uris = [item["uri"] for item in data_ids]
        
        # STEP 2: Fetch details for these IDs
        query_details = PersonQueries.get_personas_details(uris)
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


@router.get("/get_actor_roles/{id:path}")
async def get_actor_roles(id: str, client: SparqlClient = Depends(get_sparql_client)):
    """Get all exhibitions where the actor participated in any role."""
    query = PersonQueries.get_actor_roles(id)
    try:
        response = await client.query(query)
        flat_data = parse_sparql_response(response)
        # Group by role type
        roles_by_type: dict = {}
        for item in flat_data:
            role_type = item.get("role_type", "Participant")
            if role_type not in roles_by_type:
                roles_by_type[role_type] = []
            roles_by_type[role_type].append({
                "uri": item.get("exhibition_uri"),
                "label": item.get("exhibition_label")
            })
        return {"data": roles_by_type}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

