from app.services.queries.base import PREFIXES


class MiscQueries:
    ALL_CLASSES = f"""
        {PREFIXES}
        SELECT DISTINCT ?class ?label
        WHERE {{
            ?s a ?class .
            OPTIONAL {{ ?class rdfs:label ?label . FILTER (lang(?label) = "en") }}
        }}
    """

    SEMANTIC_SEARCH = f"""
        {PREFIXES}
        SELECT DISTINCT ?uri ?uri_type ?label_type ?label WHERE 
        {{
            ?uri rdfs:label ?label .
            ?uri rdf:type ?uri_type .
            OPTIONAL {{ ?uri_type rdfs:label ?label_type . FILTER(lang(?label_type)="en") }}
            FILTER (regex(str(?uri), "%s", "i") || regex(str(?label), "%s", "i"))
        }} ORDER BY ?label
    """

    GET_OBJECT_ANY_TYPE = f"""
        {PREFIXES}
        SELECT *
        WHERE {{
            <https://w3id.org/OntoExhibit#%s/%s> ?p ?o .
        }}
    """

    GET_DISTINCT_GENDERS = f"""
        {PREFIXES}
        SELECT DISTINCT ?value WHERE {{
            ?s <https://w3id.org/OntoExhibit#gender> ?value .
        }} ORDER BY ?value
    """

    GET_DISTINCT_ACTIVITIES = f"""
        {PREFIXES}
        SELECT DISTINCT ?value WHERE {{
            ?s <https://w3id.org/OntoExhibit#activity_type> ?value .
        }} ORDER BY ?value
    """
    
    GET_DISTINCT_ARTWORK_TYPES = f"""
        {PREFIXES}
        SELECT DISTINCT ?value WHERE {{
            ?s rdf:type <https://w3id.org/OntoExhibit#Work_Manifestation> .
            ?s <https://w3id.org/OntoExhibit#type> ?value .
        }} ORDER BY ?value
    """
    
    GET_DISTINCT_TOPICS = f"""
        {PREFIXES}
        SELECT DISTINCT ?value WHERE {{
            ?s rdf:type <https://w3id.org/OntoExhibit#Work_Manifestation> .
            ?s <https://w3id.org/OntoExhibit#hasTheme> ?t .
            ?t rdfs:label ?value .
        }} ORDER BY ?value
    """

    GET_DISTINCT_EXHIBITION_TYPES = f"""
        {PREFIXES}
        SELECT DISTINCT ?value WHERE {{
            ?s rdf:type <https://w3id.org/OntoExhibit#Exhibition> .
            ?s <https://w3id.org/OntoExhibit#type> ?value .
        }} ORDER BY ?value
    """

    GET_DISTINCT_EXHIBITION_THEMES = f"""
        {PREFIXES}
        SELECT DISTINCT ?value WHERE {{
            ?s rdf:type <https://w3id.org/OntoExhibit#Exhibition> .
            ?s <https://w3id.org/OntoExhibit#hasTheme> ?t .
            ?t rdfs:label ?value .
        }} ORDER BY ?value
    """
