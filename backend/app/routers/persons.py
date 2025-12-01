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

@router.get("/all_personas", summary="Individuos de la clase persona", response_class=ORJSONResponse)
async def all_personas(
    cursor: Optional[str] = None,
    page_size: int = 10, 
    q: Optional[str] = None,
    client: SparqlClient = Depends(get_sparql_client)
):
    last_label, last_uri = None, None
    if cursor:
        decoded = decode_cursor(cursor)
        if decoded:
            last_label, last_uri = decoded

    query = PersonQueries.get_all_personas(limit=page_size + 1, last_label=last_label, last_uri=last_uri, text_search=q)
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


@router.get("/count_actants", summary="Número de individuos de la clase actant")
async def count_personas(client: SparqlClient = Depends(get_sparql_client)):
    query = PersonQueries.COUNT_ACTANTS
    try:
        response = await client.query(query)
        parsed = parse_sparql_response(response)
        count = parsed[0]["count"] if parsed else 0
        return StandardResponseModel(data={"count": count}, message="Operación realizada con éxito")
    except Exception as e:
        error_response = ErrorResponseModel(
            error_code="INTERNAL_SERVER_ERROR",
            error_message="Ocurrió un error interno en el servidor",
            error_details={"error": str(e)},
        )
        raise HTTPException(status_code=500, detail=error_response.dict())


@router.get("/get_persona/{id}")
async def get_persona(id: str, client: SparqlClient = Depends(get_sparql_client)):
    query = PersonQueries.GET_PERSONS_AND_GROUPS % id
    try:
        response = await client.query(query)
        # Original code used desglozarJSON(results, 2) which grouped by URI and handled lists
        # We can use group_by_uri helper
        flat_data = parse_sparql_response(response)
        # We might need to group if the query returns multiple rows per person (e.g. multiple places)
        # GET_PERSONS_AND_GROUPS returns DISTINCT ?label ?uri ?label_place ?label_date
        # If a person has multiple places, it will return multiple rows.
        grouped_data = group_by_uri(flat_data, list_fields=["label_place", "label_date"])

        # Original desglozarJSON logic for num_param_dict=2 was a bit generic,
        # but it seems it was trying to build a dict where keys are predicates.
        # But GET_PERSONS_AND_GROUPS selects specific variables.
        # So group_by_uri should be fine.

        return grouped_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/post_persona", status_code=status.HTTP_201_CREATED)
async def post_persona(persona: Persona, client: SparqlClient = Depends(get_sparql_client)):
    try:
        query = PersonQueries.add_persona(persona)
        # The original code used sparql.method = 'POST' and sparql.query()
        # Our client.update() handles POST
        response = await client.update(query)
        return response
    except Exception as e:
        return {"error": f"Error adding person. {str(e)}"}
