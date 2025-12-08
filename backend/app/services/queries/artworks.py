from urllib.parse import quote

from rdflib import RDF, RDFS

from app.core.config import settings
from app.models.domain import ObraDeArte
from app.services.queries.base import PREFIXES, URI_ONTOLOGIA, uri_ontologia
from app.services.queries.utils import add_any_type
from app.utils.helpers import hash_sha256, validar_fecha


class ArtworkQueries:
    COUNT_OBRAS = f"""
        {PREFIXES}
        SELECT (count(distinct ?uri) as ?count) WHERE 
        {{   
            ?uri rdf:type <https://w3id.org/OntoExhibit#Work_Manifestation>
        }}
    """

    @staticmethod
    def get_all_obras(limit: int, last_label: str = None, last_uri: str = None, text_search: str = None, 
                      author_name: str = None, type_filter: str = None, start_date: str = None, owner: str = None,
                      topic: str = None, exhibition: str = None) -> str:
        
        filters = []
        if text_search:
            filters.append(f'(regex(?label, "{text_search}", "i") || regex(?author, "{text_search}", "i") || regex(?type, "{text_search}", "i"))')
        
        if author_name:
             filters.append(f'regex(?author, "{author_name}", "i")')

        if type_filter:
             filters.append(f'regex(?type, "{type_filter}", "i")')

        if start_date:
             filters.append(f'regex(?label_starting_date, "{start_date}", "i")')

        if owner:
             filters.append(f'regex(?owner, "{owner}", "i")')

        if topic:
             filters.append(f'regex(?topic, "{topic}", "i")')

        if exhibition:
             filters.append(f'regex(?exhibition, "{exhibition}", "i")')

        filter_clause = f"FILTER ({' && '.join(filters)})" if filters else ""
        
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
            SELECT DISTINCT ?label ?uri ?type ?apelation ?label_place ?label_starting_date ?label_ending_date ?author ?owner 
                ?topic ?exhibition
            WHERE 
            {{
                ?uri rdf:type <https://w3id.org/OntoExhibit#Work_Manifestation> .
                ?uri rdfs:label ?label .

                OPTIONAL 
                {{ 
                    ?uri <https://w3id.org/OntoExhibit#type> ?type .
                }}
                OPTIONAL 
                {{
                    ?uri <https://w3id.org/OntoExhibit#apelation> ?apelation
                }}

                OPTIONAL
                {{
                    ?uri <https://w3id.org/OntoExhibit#hasOwner> ?uri_owner .
                    ?uri_owner <https://w3id.org/OntoExhibit#isRoleOf> ?uri_owner_role .
                    ?uri_owner_role rdfs:label ?owner
                }}
                OPTIONAL
                {{
                     ?uri <https://w3id.org/OntoExhibit#hasProduction> ?prod .
                     OPTIONAL {{
                        ?prod <https://w3id.org/OntoExhibit#hasProductionAuthor> ?uri_author .
                        ?uri_author rdfs:label ?author .
                     }}
                     OPTIONAL {{
                        ?prod <https://w3id.org/OntoExhibit#hasTimeSpan> ?tr .
                        ?date <https://w3id.org/OntoExhibit#isStartingDateOf> ?tr .
                        ?date rdfs:label ?label_starting_date .
                     }}
                     OPTIONAL {{
                        ?prod <https://w3id.org/OntoExhibit#hasTimeSpan> ?tr .
                        ?date <https://w3id.org/OntoExhibit#isEndingDateOf> ?tr .
                        ?date rdfs:label ?label_ending_date .
                     }}
                }}
                OPTIONAL
                {{
                    ?uri <https://w3id.org/OntoExhibit#isDisplayedAt> ?uri_exhibition .
                    ?uri_exhibition rdfs:label ?exhibition
                }}
                OPTIONAL
                {{
                    ?uri <https://w3id.org/OntoExhibit#hasTheme> ?uri_topic .
                    ?uri_topic rdfs:label ?topic
                }}
                {filter_clause}
                {pagination_filter}
            }} 
            ORDER BY lcase(?label) ?uri
            LIMIT {limit}
        """

    @staticmethod
    def add_obra(obra: ObraDeArte) -> str:
        if obra.type:
            data_to_hash = f"{obra.name} - {obra.type}"
        else:
            data_to_hash = f"{obra.name} - work manifestation"

        sujeto = f'{uri_ontologia}{quote("work_manifestation")}/{hash_sha256(data_to_hash)}'

        triples = add_any_type(obra, "WorkManifestation")
        
        triples.append(f'{sujeto}> <{RDFS.label}> "{obra.name.title()}"^^<http://www.w3.org/2001/XMLSchema#string> .')

        uri_title = f"{uri_ontologia}title/{hash_sha256(obra.name)}"
        triples.append(f"{uri_title}> <{RDF.type}> {uri_ontologia}Title> .")
        triples.append(f'{uri_title}> <{RDFS.label}> "{obra.name.title()}"^^<http://www.w3.org/2001/XMLSchema#string> .')
        triples.append(f"{sujeto}> {uri_ontologia}hasTitle> {uri_title}> .")
        triples.append(f"{uri_title}> {uri_ontologia}isTheTitleOf> {sujeto}> .")

        # ... (Production logic omitted for brevity as it was commented out in original snippet shown)
        
        # Build final query
        query = f"INSERT DATA\n{{\n\tGRAPH <{settings.DEFAULT_GRAPH_URL}> {{\n"
        for triple in triples:
            query += f"\t\t{triple}\n"
        query += "\t}\n}"
        
        return query

    GET_ARTWORK_BY_ID = f"""
        {PREFIXES}
        SELECT DISTINCT ?label ?uri ?type ?apelation ?label_place ?label_starting_date ?label_ending_date ?author ?owner 
            ?topic ?exhibition
        WHERE 
        {{
            ?uri rdf:type <https://w3id.org/OntoExhibit#Work_Manifestation> .
            ?uri rdfs:label ?label .
            FILTER (regex(str(?uri), "%s", "i"))
            
            OPTIONAL 
            {{ 
                ?uri <https://w3id.org/OntoExhibit#type> ?type .
            }}
            OPTIONAL 
            {{
                ?uri <https://w3id.org/OntoExhibit#apelation> ?apelation
            }}
            OPTIONAL
            {{
                ?uri <https://w3id.org/OntoExhibit#hasOwner> ?uri_owner .
                ?uri_owner <https://w3id.org/OntoExhibit#isTheRoleOf> ?uri_person .
                ?uri_person rdfs:label ?owner
            }}
            OPTIONAL
            {{
                ?uri <https://w3id.org/OntoExhibit#isDisplayedAt> ?uri_exhibition .
                ?uri_exhibition rdfs:label ?exhibition
            }}
            OPTIONAL
            {{
                ?uri <https://w3id.org/OntoExhibit#hasTheme> ?uri_topic .
                ?uri_topic rdfs:label ?topic
            }}
        }} 
    """

