import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_token
from app.dependencies import get_sparql_client
from app.services.queries.misc import MiscQueries
from app.services.sparql_client import SparqlClient
from app.utils.parsers import group_by_uri, parse_sparql_response
from sqlalchemy.orm import Session

router = APIRouter(prefix=f"{settings.DEPLOY_PATH}", tags=["misc"])
security = HTTPBearer(auto_error=False)


def is_modifying_query(query: str) -> bool:
    """
    Check if SPARQL query contains INSERT, UPDATE, DELETE, or other modifying operations.
    Returns True if the query attempts to modify data.
    """
    pattern = r'\b(INSERT|DELETE|UPDATE|CLEAR|DROP|CREATE|LOAD|ADD|MOVE|COPY)\b'
    return bool(re.search(pattern, query.upper()))


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
    # Handle static options that don't require SPARQL query
    if filter_type == "entity_type":
        return {"data": ["Person", "Group"]}
    
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
    elif filter_type == "institution_type":
        query = MiscQueries.GET_INSTITUTION_TYPES
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


@router.post("/sparql")
async def execute_sparql(
    request: dict,
    client: SparqlClient = Depends(get_sparql_client),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Execute a SPARQL query.
    
    SELECT, ASK, CONSTRUCT, DESCRIBE queries are allowed for all users.
    INSERT, DELETE, UPDATE and other modifying queries require authentication.
    """
    query = request.get("query")
    if not query:
        raise HTTPException(status_code=400, detail="Query is required")
    
    try:
        # Check if this is a modifying query
        if is_modifying_query(query):
            # Require authentication for modifying queries
            if not credentials:
                raise HTTPException(
                    status_code=401, 
                    detail="Authentication required for INSERT/UPDATE/DELETE queries. Please log in first."
                )
            
            # Validate token
            payload = decode_token(credentials.credentials)
            if not payload:
                raise HTTPException(
                    status_code=401, 
                    detail="Invalid or expired token. Please log in again."
                )
            
            # Verify user exists and is active
            from app.models.user import User, UserStatus
            user_id = payload.get("sub")
            user = db.query(User).filter(User.id == int(user_id)).first()
            
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            
            if user.status != UserStatus.ACTIVE:
                raise HTTPException(status_code=403, detail="Account not active")
            
            # Use update method for modifying queries
            response = await client.update(query)
            # Update responses might be different format
            if isinstance(response, dict) and "message" in response:
                return {"data": [], "message": response.get("message", "Update successful")}
            data = parse_sparql_response(response) if response else []
        else:
            # SELECT/ASK/CONSTRUCT queries allowed for everyone
            response = await client.query(query)
            data = parse_sparql_response(response)
        
        return {"data": data}
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/report")
async def report_incident(
    report: dict
):
    # For now, just print to console or log. In a real app, save to DB or send email.
    print(f"INCIDENT REPORT: {report}")
    return {"status": "received", "message": "Report submitted successfully"}

@router.get("/get_object_any_type/{type}/{id:path}")
async def get_object_any_type(
    type: str, id: str, client: SparqlClient = Depends(get_sparql_client)
):
    type = type.lower()
    if type in ["exposicion", "exhibition"]:
        type = "exhibition"
    elif type in ["persona", "person", "human_actant", "actant", "actor"]:
        type = "human_actant"
    elif type in ["institucion", "institution"]:
        type = "institution"
    elif type in ["empresa", "company"]:
        type = "company"
    elif type in ["artwork", "obra", "work", "work_manifestation"]:
        type = "work_manifestation"

    query = MiscQueries.GET_OBJECT_ANY_TYPE % (type, id, type, id, type, id)
    try:
        response = await client.query(query)
        flat_data = parse_sparql_response(response)
        print(f"DEBUG: get_object_any_type({type}, {id}) response: {flat_data}")
        
        # Pivot data: convert list of {p, o} to single dict {p: o}
        # This matches what frontend expects (properties object)
        properties = {}
        for item in flat_data:
            p = item.get("p")
            o = item.get("o")
            if p and o:
                # If multiple values exist for same property, you might want a list, 
                # but frontend seems to take first or simple value. 
                # We'll just overwrite or keep first. Let's keep first for simplicity or overwrite?
                # Frontend loop iterates keys, so we need keys to be predicates.
                properties[p] = o
                
        return {"data": [properties]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
