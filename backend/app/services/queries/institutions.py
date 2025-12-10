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
    def get_instituciones_ids(limit: int, last_label: str = None, last_uri: str = None, text_search: str = None) -> str:
        filter_clause = f'FILTER regex(?label, "{text_search}", "i")' if text_search else ""
        
        pagination_filter = ""
        if last_label and last_uri:
            safe_label = last_label.replace('"', '\\"')
            pagination_filter = f"""
                FILTER (
                    lcase(?label) > lcase("{safe_label}") || 
                    (lcase(?label) = lcase("{safe_label}") && ?uri > <{last_uri}>)
                )
            """

        return f"""
            {PREFIXES}
            SELECT DISTINCT ?label ?uri
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
            }} 
            ORDER BY lcase(?label) ?uri
            LIMIT {limit}
        """

    @staticmethod
    def get_instituciones_details(uris: list[str]) -> str:
        if not uris:
            return ""
        
        uris_str = " ".join([f"<{u}>" for u in uris])
        
        return f"""
            {PREFIXES}
            SELECT ?uri (SAMPLE(?inner_label) as ?label) 
                   (SAMPLE(?inner_apelation) as ?apelation)
                   (GROUP_CONCAT(DISTINCT ?inner_label_place; separator="|") as ?label_place)
            WHERE 
            {{
                VALUES ?uri {{ {uris_str} }}
                
                ?uri rdfs:label ?inner_label .

                OPTIONAL 
                {{ 
                    ?uri <https://w3id.org/OntoExhibit#hasLocation> ?location.
                    ?location <https://w3id.org/OntoExhibit#isLocatedAt> ?place .
                    ?place rdfs:label ?inner_label_place
                }}
                OPTIONAL {{ ?uri <https://w3id.org/OntoExhibit#apelation> ?inner_apelation }}
            }} 
            GROUP BY ?uri
        """

    GET_INSTITUTION = f"""
        {PREFIXES}
        SELECT DISTINCT ?label ?uri ?apelation ?label_place ?place_uri
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
                ?location <https://w3id.org/OntoExhibit#isLocatedAt> ?place_uri .
                ?place_uri rdfs:label ?label_place
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
