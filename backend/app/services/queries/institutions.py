from app.core.config import settings
from app.models.domain import Institucion
from app.services.queries.base import PREFIXES
from app.services.queries.utils import add_any_type
from app.utils.helpers import generate_hashed_id


class InstitutionQueries:
    COUNT_INSTITUCIONES = f"""
        {PREFIXES}
        SELECT (count(distinct ?uri) as ?count) WHERE 
        {{   
            {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Institution> }}
            UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Cultural_Institution> }}
            UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Art_Center> }}
            UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Cultural_Center> }}
            UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#ExhibitionSpace> }}
            UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Interpretation_Center> }}
            UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Library> }}
            UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Museum> }}
            UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Educational_Institution> }}
            UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#University> }}
            UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Foundation_(Institution)> }}
        }}
    """

    @staticmethod
    def get_all_instituciones(limit: int, last_label: str = None, last_uri: str = None, text_search: str = None) -> str:
        filter_clause = f'FILTER regex(?label, "{text_search}", "i")' if text_search else ""
        
        pagination_filter = ""
        if last_label and last_uri:
            # Escape quotes in label to prevent SPARQL injection/errors
            safe_label = last_label.replace('"', '\\"')
            pagination_filter = f"""
                FILTER (
                    lcase(?label) > lcase("{safe_label}") || 
                    (lcase(?label) = lcase("{safe_label}") && ?uri > <{last_uri}>)
                )
            """

        return f"""
            {PREFIXES}
            SELECT DISTINCT ?label ?uri ?apelation ?label_place ?representative ?organizer ?financer ?lender ?owner
            WHERE 
            {{
                {{
                    ?uri rdf:type <https://w3id.org/OntoExhibit#Institution> .
                    ?uri rdfs:label ?label
                }}
                UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Cultural_Institution> . ?uri rdfs:label ?label }}
                UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Art_Center> . ?uri rdfs:label ?label }}
                UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Cultural_Center> . ?uri rdfs:label ?label }}
                UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#ExhibitionSpace> . ?uri rdfs:label ?label }}
                UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Interpretation_Center> . ?uri rdfs:label ?label }}
                UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Library> . ?uri rdfs:label ?label }}
                UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Museum> . ?uri rdfs:label ?label }}
                UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Educational_Institution> . ?uri rdfs:label ?label }}
                UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#University> . ?uri rdfs:label ?label }}
                UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Foundation_(Institution)> . ?uri rdfs:label ?label }}
                
                {filter_clause}
                {pagination_filter}

                OPTIONAL 
                {{ 
                    ?uri <https://w3id.org/OntoExhibit#hasLocation> ?location.
                    ?location <https://w3id.org/OntoExhibit#isLocatedAt> ?place .
                    ?place rdfs:label ?label_place
                }}
                OPTIONAL {{ ?uri <https://w3id.org/OntoExhibit#apelation> ?apelation }}
            }} 
            ORDER BY lcase(?label) ?uri
            LIMIT {limit}
        """

    GET_INSTITUTION = f"""
        {PREFIXES}
        SELECT DISTINCT ?label ?uri ?apelation ?label_place
        WHERE 
        {{
            {{
                ?uri rdf:type <https://w3id.org/OntoExhibit#Institution> .
                ?uri rdfs:label ?label
            }}
            UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Cultural_Institution> . ?uri rdfs:label ?label }}
            UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Art_Center> . ?uri rdfs:label ?label }}
            UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Cultural_Center> . ?uri rdfs:label ?label }}
            UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#ExhibitionSpace> . ?uri rdfs:label ?label }}
            UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Interpretation_Center> . ?uri rdfs:label ?label }}
            UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Library> . ?uri rdfs:label ?label }}
            UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Museum> . ?uri rdfs:label ?label }}
            UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Educational_Institution> . ?uri rdfs:label ?label }}
            UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#University> . ?uri rdfs:label ?label }}
            UNION {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Foundation_(Institution)> . ?uri rdfs:label ?label }}
            
            FILTER (regex(str(?uri), "%s", "i"))

            OPTIONAL 
            {{ 
                ?uri <https://w3id.org/OntoExhibit#hasLocation> ?location.
                ?location <https://w3id.org/OntoExhibit#isLocatedAt> ?place .
                ?place rdfs:label ?label_place
            }}
            OPTIONAL {{ ?uri <https://w3id.org/OntoExhibit#apelation> ?apelation }}
        }}
    """

    @staticmethod
    def add_institucion(entidad: Institucion) -> str:
        id_generated = generate_hashed_id()
        entidad.id = id_generated

        triples = add_any_type(entidad, "institution")
        
        # Build final query
        query = f"INSERT DATA\n{{\n\tGRAPH <{settings.DEFAULT_GRAPH_URL}> {{\n"
        for triple in triples:
            query += f"\t\t{triple}\n"
        query += "\t}\n}"

        return query
