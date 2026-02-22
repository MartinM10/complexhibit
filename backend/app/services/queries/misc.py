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
        SELECT DISTINCT ?p ?o
        WHERE {{
            {{
                # Direct properties
                <https://w3id.org/OntoExhibit#%s/%s> ?p ?o .
            }}
            UNION
            {{
                # Synthesize label from person_name if available and direct label missing (optional)
                BIND(rdfs:label AS ?p)
                <https://w3id.org/OntoExhibit#%s/%s> <https://w3id.org/OntoExhibit#person_name> ?o .
            }}
            UNION
            {{
                # Synthesize label from hasTitle -> label if available
                BIND(rdfs:label AS ?p)
                <https://w3id.org/OntoExhibit#%s/%s> <https://w3id.org/OntoExhibit#hasTitle> ?title_entity .
                ?title_entity rdfs:label ?o .
            }}
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

    # Institution types based on rdf:type subclass hierarchy
    GET_INSTITUTION_TYPES = f"""
        {PREFIXES}
        SELECT DISTINCT ?value WHERE {{
            {{
                ?type_class rdfs:subClassOf* <https://w3id.org/OntoExhibit#Institution> .
            }}
            UNION
            {{
                VALUES ?type_class {{
                    <https://w3id.org/OntoExhibit#Cultural_Institution>
                    <https://w3id.org/OntoExhibit#Academy_Of_Fine_Arts>
                    <https://w3id.org/OntoExhibit#Archive>
                    <https://w3id.org/OntoExhibit#Art_Center>
                    <https://w3id.org/OntoExhibit#Cultural_Center>
                    <https://w3id.org/OntoExhibit#Foundation_(Institution)>
                    <https://w3id.org/OntoExhibit#Interpretation_Center>
                    <https://w3id.org/OntoExhibit#Library>
                    <https://w3id.org/OntoExhibit#Museographic_Collection>
                    <https://w3id.org/OntoExhibit#Museum>
                    <https://w3id.org/OntoExhibit#Educational_Institution>
                    <https://w3id.org/OntoExhibit#Art_School>
                    <https://w3id.org/OntoExhibit#University>
                }}
            }}
            ?type_class rdfs:label ?value .
            FILTER(lang(?value) = "en" || lang(?value) = "")
            FILTER(?type_class != <https://w3id.org/OntoExhibit#Institution>) 
        }} ORDER BY ?value
    """

    GET_COMPANY_ISIC4_CATEGORIES = f"""
        {PREFIXES}
        SELECT DISTINCT ?value WHERE {{
            ?s rdf:type <https://w3id.org/OntoExhibit#Company> .
            ?s <https://w3id.org/OntoExhibit#ISIC4Category> ?value .
            FILTER(STRLEN(STR(?value)) > 0)
        }} ORDER BY ?value
    """

    GET_COMPANY_SIZES = f"""
        {PREFIXES}
        SELECT DISTINCT ?value WHERE {{
            ?s rdf:type <https://w3id.org/OntoExhibit#Company> .
            ?s <https://w3id.org/OntoExhibit#size> ?value .
            FILTER(STRLEN(STR(?value)) > 0)
        }} ORDER BY ?value
    """
