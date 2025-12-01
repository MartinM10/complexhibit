from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import settings
from app.dependencies import get_sparql_client
from app.models.domain import Institucion
from app.models.responses import ErrorResponseModel, StandardResponseModel
from app.services.queries.institutions import InstitutionQueries
from app.services.sparql_client import SparqlClient
from app.utils.parsers import group_by_uri, parse_sparql_response

router = APIRouter(prefix=f"{settings.DEPLOY_PATH}", tags=["instituciones"])


@router.get("/count_instituciones", summary="Número de individuos de la clase institucion")
async def count_instituciones(client: SparqlClient = Depends(get_sparql_client)):
    query = InstitutionQueries.COUNT_INSTITUCIONES
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


from fastapi.responses import ORJSONResponse

# ... imports

from typing import Optional

# ... imports

from app.utils.cursor import decode_cursor, encode_cursor

@router.get("/all_instituciones", summary="Individuos de la clase institucion", response_class=ORJSONResponse)
async def all_instituciones(
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

    query = InstitutionQueries.get_all_instituciones(limit=page_size + 1, last_label=last_label, last_uri=last_uri, text_search=q)
    try:
        response = await client.query(query)
        data = parse_sparql_response(response)
        
        next_cursor = None
        if len(data) > page_size:
            data = data[:page_size]  # Remove the extra item
            last_item = data[-1]
            if "label" in last_item and "uri" in last_item:
                next_cursor = encode_cursor(last_item["label"], last_item["uri"])

        return ORJSONResponse(content={"data": data, "next_cursor": next_cursor})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/get_institucion/{id:path}")
async def get_institucion(id: str, client: SparqlClient = Depends(get_sparql_client)):
    query = InstitutionQueries.GET_INSTITUCION % (
        id,
        id,
        id,
        id,
    )  # Format string needs 4 args based on query definition
    try:
        response = await client.query(query)
        flat_data = parse_sparql_response(response)
        grouped_data = group_by_uri(flat_data, list_fields=["label_place"])
        return grouped_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/post_institucion", status_code=status.HTTP_201_CREATED)
async def post_institucion(entidad: Institucion, client: SparqlClient = Depends(get_sparql_client)):
    try:
        query = InstitutionQueries.add_institucion(entidad)
        response = await client.update(query)
        # Original code returned a specific JSON structure on success
        results_to_json = {
            "label": entidad.nombre,
            "uri": f"{settings.URI_ONTOLOGIA}{entidad.id}",
        }
        return results_to_json
    except Exception as e:
        print(f"ERROR AL AÑADIR UNA INSTITUCION: {e}")
        raise HTTPException(status_code=500, detail=str(e))
