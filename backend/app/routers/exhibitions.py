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


@router.get("/count_exposiciones", summary="Número de individuos de la clase exposición")
async def count_exposiciones(client: SparqlClient = Depends(get_sparql_client)):
    try:
        query = ExhibitionQueries.COUNT_EXPOSICIONES
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


from fastapi.responses import ORJSONResponse

# ... imports

from typing import Optional

# ... imports

from app.utils.cursor import decode_cursor, encode_cursor

@router.get("/all_exposiciones", summary="Individuos de la clase exposicion", response_class=ORJSONResponse)
async def all_exposiciones(
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

    query = ExhibitionQueries.get_all_exposiciones(limit=page_size + 1, last_label=last_label, last_uri=last_uri, text_search=q)
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


@router.post("/post_exposicion", status_code=status.HTTP_201_CREATED)
async def post_exposicion(
    exposicion: Exposicion, client: SparqlClient = Depends(get_sparql_client)
):
    try:
        query = ExhibitionQueries.add_exposicion(exposicion)
        response = await client.update(query)
        return response
    except Exception as e:
        return {"error": f"Error adding exhibition. {str(e)}"}
