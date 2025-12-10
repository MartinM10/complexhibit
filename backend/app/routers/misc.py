from fastapi import APIRouter, Depends, HTTPException

from app.core.config import settings
from app.dependencies import get_sparql_client
from app.services.queries.misc import MiscQueries
from app.services.sparql_client import SparqlClient
from app.utils.parsers import group_by_uri, parse_sparql_response

router = APIRouter(prefix=f"{settings.DEPLOY_PATH}", tags=["misc"])


@router.get("/semantic_search")
async def semantic_search(q: str, client: SparqlClient = Depends(get_sparql_client)):
    if not q:
        return {"error": "Consulta no proporcionada"}

    query = MiscQueries.SEMANTIC_SEARCH % (q, q)
    try:
        response = await client.query(query)
        data = parse_sparql_response(response)
        # Original code used procesar_json which filtered out some types
        # We can implement filtering here if needed, but for now return raw parsed data
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/filter_options/{filter_type}")
async def get_filter_options(filter_type: str, client: SparqlClient = Depends(get_sparql_client)):
    query = ""
    if filter_type == "gender":
        query = MiscQueries.GET_DISTINCT_GENDERS
    elif filter_type == "activity":
         query = MiscQueries.GET_DISTINCT_ACTIVITIES
    elif filter_type == "artwork_type":
        query = MiscQueries.GET_DISTINCT_ARTWORK_TYPES
    elif filter_type == "topic":
        query = MiscQueries.GET_DISTINCT_TOPICS
    elif filter_type == "exhibition_type":
        query = MiscQueries.GET_DISTINCT_EXHIBITION_TYPES
    elif filter_type == "exhibition_theme":
        query = MiscQueries.GET_DISTINCT_EXHIBITION_THEMES
    else:
        raise HTTPException(status_code=400, detail="Invalid filter type")

    try:
        response = await client.query(query)
        data = parse_sparql_response(response)
        # Flatten list of dicts to list of values
        values = [item.get('value') for item in data if item.get('value')]
        return {"data": values}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/all_classes",
    tags=["ontologia"],
    description="Obtiene todas las clases de la ontología",
    summary="Clases de la ontología",
)
async def all_classes(client: SparqlClient = Depends(get_sparql_client)):
    query = MiscQueries.ALL_CLASSES
    try:
        response = await client.query(query)
        data = parse_sparql_response(response)
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/get_object_any_type/{type}/{id:path}")
async def get_object_any_type(
    type: str, id: str, client: SparqlClient = Depends(get_sparql_client)
):
    type = type.lower()
    if type in ["exposicion", "exhibition"]:
        type = "exhibition"
    elif type in ["persona", "person", "human_actant", "actant"]:
        type = "human_actant"
    elif type in ["institucion", "institution"]:
        type = "institution"
    elif type in ["empresa", "company"]:
        type = "company"
    elif type in ["artwork", "obra", "work", "work_manifestation"]:
        type = "work_manifestation"

    query = MiscQueries.GET_OBJECT_ANY_TYPE % (type, id)
    try:
        response = await client.query(query)
        flat_data = parse_sparql_response(response)
        grouped_data = group_by_uri(flat_data)  # Group by URI if needed
        return {"data": grouped_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
