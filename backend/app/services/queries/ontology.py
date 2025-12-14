"""
OntoExhibit ontology constants.

Centralizes all ontology URIs and class names to avoid hardcoding 
throughout the codebase.
"""

from app.core.config import settings

# Base URI
BASE_URI = settings.URI_ONTOLOGIA

# Helper to create full URI
def uri(name: str) -> str:
    """Create full ontology URI from local name."""
    return f"<{BASE_URI}{name}>"


class Classes:
    """OntoExhibit class URIs."""
    
    # Exhibitions
    EXHIBITION = uri("Exhibition")
    PERMANENT_EXHIBITION = uri("Permanent_Exhibition")
    TEMPORARY_EXHIBITION = uri("Temporary_Exhibition")
    TRAVELLING_EXHIBITION = uri("Travelling_Exhibition")
    
    # Actors
    HUMAN_ACTANT = uri("Human_Actant")
    ACTOR = uri("Actor")
    
    # Artworks
    WORK_MANIFESTATION = uri("Work_Manifestation")
    ARTWORK = uri("Artwork")
    
    # Institutions
    INSTITUTION = uri("Institution")
    CULTURAL_INSTITUTION = uri("Cultural_Institution")
    ART_CENTER = uri("Art_Center")
    CULTURAL_CENTER = uri("Cultural_Center")
    EXHIBITION_SPACE = uri("ExhibitionSpace")
    INTERPRETATION_CENTER = uri("Interpretation_Center")
    LIBRARY = uri("Library")
    MUSEUM = uri("Museum")
    EDUCATIONAL_INSTITUTION = uri("Educational_Institution")
    UNIVERSITY = uri("University")
    FOUNDATION = uri("Foundation_(Institution)")
    
    # All institution types for UNION queries
    ALL_INSTITUTION_TYPES = [
        INSTITUTION,
        CULTURAL_INSTITUTION,
        ART_CENTER,
        CULTURAL_CENTER,
        EXHIBITION_SPACE,
        INTERPRETATION_CENTER,
        LIBRARY,
        MUSEUM,
        EDUCATIONAL_INSTITUTION,
        UNIVERSITY,
        FOUNDATION,
    ]
    
    # Places
    SITE = uri("Site")
    GEOGRAPHIC_PLACE = uri("Geographic_Place")
    
    # Events
    EXHIBITION_MAKING = uri("Exhibition_Making")


class Properties:
    """OntoExhibit property URIs."""
    
    # Core relationships
    IS_ROLE_OF = uri("isRoleOf")
    TAKES_PLACE_AT = uri("takesPlaceAt")
    HAS_LOCATION = uri("hasLocation")
    IS_LOCATED_AT = uri("isLocatedAt")
    HAS_VENUE = uri("hasVenue")
    
    # Exhibition relationships
    HAS_CURATOR = uri("hasCurator")
    HAS_CURATOR_ROLE = uri("hasCuratorRole")
    HAS_ORGANIZER = uri("hasOrganizer")
    HAS_SPONSOR = uri("hasSponsor")
    HAS_FUNDER = uri("hasFunder")
    
    # Time
    HAS_OPENING = uri("hasOpening")
    HAS_CLOSING = uri("hasClosing")
    BEGIN_OF_BEGIN = uri("BeginOfBegin")
    END_OF_END = uri("EndOfEnd")
    
    # Artworks
    HAS_AUTHOR = uri("hasAuthor")
    HAS_OWNER = uri("hasOwner")
    IS_SHOWN_AT = uri("isShownAt")
    HAS_TOPIC = uri("hasTopic")
    
    # Actor properties
    HAS_BIRTH = uri("hasBirth")
    HAS_DEATH = uri("hasDeath")
    HAS_GENDER = uri("hasGender")
    CARRIED_OUT_BY = uri("carriedOutBy")
    
    # Exhibition display
    HAS_EXHIBITING_ACTANT = uri("hasExhibitingActant")
    SHOWS = uri("shows")


def build_institution_union_pattern(label_var: str = "label") -> str:
    """
    Build UNION pattern for all institution types.
    
    Returns:
        SPARQL WHERE clause matching all institution types
    """
    patterns = []
    for cls in Classes.ALL_INSTITUTION_TYPES:
        patterns.append(f"{{ ?uri rdf:type {cls} . ?uri rdfs:label ?{label_var} }}")
    
    return "\n                UNION ".join(patterns)
