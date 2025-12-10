from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import settings
from app.dependencies import get_sparql_client
from app.models.domain import Institucion
from app.models.responses import ErrorResponseModel, StandardResponseModel
from app.services.queries.institutions import InstitutionQueries
from app.services.sparql_client import SparqlClient
from app.utils.parsers import group_by_uri, parse_sparql_response

router = APIRouter(prefix=f"{settings.DEPLOY_PATH}", tags=["instituciones"])


@router.get("/count_institutions", summary="Count of individuals of class institution")
async def count_institutions(client: SparqlClient = Depends(get_sparql_client)):
    query = InstitutionQueries.COUNT_INSTITUCIONES
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


from fastapi.responses import ORJSONResponse

from typing import Optional
from app.utils.cursor import decode_cursor, encode_cursor

@router.get("/all_institutions", summary="Individuals of class institution", response_class=ORJSONResponse)
async def all_institutions(
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

    # STEP 1: Fetch filtered and paginated IDs
    query_ids = InstitutionQueries.get_instituciones_ids(limit=page_size + 1, last_label=last_label, last_uri=last_uri, text_search=q)
    
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
        query_details = InstitutionQueries.get_instituciones_details(uris)
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


@router.get("/get_institution/{id:path}")
async def get_institution(id: str, client: SparqlClient = Depends(get_sparql_client)):
    # New query uses regex, so just one placeholder
    query = InstitutionQueries.GET_INSTITUTION % id
    try:
        response = await client.query(query)
        flat_data = parse_sparql_response(response)
        grouped_data = group_by_uri(flat_data, list_fields=["label_place"])
        return {"data": grouped_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create_institution", status_code=status.HTTP_201_CREATED)
async def create_institution(entidad: Institucion, client: SparqlClient = Depends(get_sparql_client)):
    try:
        query = InstitutionQueries.add_institucion(entidad)
        response = await client.update(query)
        results_to_json = {
            "label": entidad.nombre,
            "uri": f"{settings.URI_ONTOLOGIA}{entidad.id}",
        }
        return results_to_json
    except Exception as e:
        print(f"ERROR ADDING INSTITUTION: {e}")
        raise HTTPException(status_code=500, detail=str(e))
