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
    def get_obras_ids(limit: int, last_label: str = None, last_uri: str = None, text_search: str = None, 
                      author_name: str = None, type_filter: str = None, start_date: str = None, owner: str = None,
                      topic: str = None, exhibition: str = None) -> str:
        
        filters = []
        inner_joins = []
        
        # Always need label for sorting
        inner_joins.append("?uri rdfs:label ?inner_label .")
        
        if text_search:
            filters.append(f'(regex(?inner_label, "{text_search}", "i") || regex(?inner_author, "{text_search}", "i") || regex(?inner_type, "{text_search}", "i"))')
            inner_joins.append("OPTIONAL { ?uri <https://w3id.org/OntoExhibit#type> ?inner_type . }")
            inner_joins.append("""
                OPTIONAL {
                    ?uri <https://w3id.org/OntoExhibit#hasProduction> ?prod_ts .
                    OPTIONAL { ?prod_ts <https://w3id.org/OntoExhibit#hasProductionAuthor> ?uri_author_ts . ?uri_author_ts rdfs:label ?inner_author . }
                }
            """)
        
        if author_name and not text_search:
             filters.append(f'regex(?inner_author, "{author_name}", "i")')
             inner_joins.append("""
                OPTIONAL {
                    ?uri <https://w3id.org/OntoExhibit#hasProduction> ?prod_an .
                    OPTIONAL { ?prod_an <https://w3id.org/OntoExhibit#hasProductionAuthor> ?uri_author_an . ?uri_author_an rdfs:label ?inner_author . }
                }
            """)

        if type_filter:
             filters.append(f'regex(?inner_type, "{type_filter}", "i")')
             if not text_search:
                 inner_joins.append("OPTIONAL { ?uri <https://w3id.org/OntoExhibit#type> ?inner_type . }")

        if start_date:
             filters.append(f'regex(?inner_label_starting_date, "{start_date}", "i")')
             inner_joins.append("""
                OPTIONAL {
                    ?uri <https://w3id.org/OntoExhibit#hasProduction> ?prod_sd .
                    OPTIONAL { ?prod_sd <https://w3id.org/OntoExhibit#hasTimeSpan> ?tr_sd . ?date_sd <https://w3id.org/OntoExhibit#isStartingDateOf> ?tr_sd . ?date_sd rdfs:label ?inner_label_starting_date . }
                }
             """)

        if owner:
             filters.append(f'regex(?inner_owner, "{owner}", "i")')
             inner_joins.append("""
                OPTIONAL {
                    ?uri <https://w3id.org/OntoExhibit#hasOwner> ?uri_owner_ow .
                    ?uri_owner_ow <https://w3id.org/OntoExhibit#isRoleOf> ?uri_owner_role_ow .
                    ?uri_owner_role_ow rdfs:label ?inner_owner
                }
             """)

        if topic:
             filters.append(f'regex(?inner_topic, "{topic}", "i")')
             inner_joins.append("""
                OPTIONAL { ?uri <https://w3id.org/OntoExhibit#hasTheme> ?uri_topic_tp . ?uri_topic_tp rdfs:label ?inner_topic }
             """)

        if exhibition:
             filters.append(f'regex(?inner_exhibition, "{exhibition}", "i")')
             inner_joins.append("""
                OPTIONAL { ?uri <https://w3id.org/OntoExhibit#isDisplayedAt> ?uri_exhibition_ex . ?uri_exhibition_ex rdfs:label ?inner_exhibition }
             """)

        filter_clause = f"FILTER ({' && '.join(filters)})" if filters else ""
        
        pagination_filter = ""
        if last_label and last_uri:
            safe_label = last_label.replace('"', '\\"')
            pagination_filter = f"""
                FILTER (
                    lcase(?inner_label) > lcase("{safe_label}") || 
                    (lcase(?inner_label) = lcase("{safe_label}") && ?uri > <{last_uri}>)
                )
            """

        inner_joins_str = "\n".join(inner_joins)

        return f"""
            {PREFIXES}
            SELECT DISTINCT ?uri ?inner_label
            WHERE 
            {{
                ?uri rdf:type <https://w3id.org/OntoExhibit#Work_Manifestation> .
                {inner_joins_str}
                {filter_clause}
                {pagination_filter}
            }} 
            ORDER BY lcase(?inner_label) ?uri
            LIMIT {limit}
        """

    @staticmethod
    def get_obras_details(uris: list[str]) -> str:
        if not uris:
            return ""
        
        uris_str = " ".join([f"<{u}>" for u in uris])
        
        return f"""
            {PREFIXES}
            SELECT ?uri (SAMPLE(?inner_label) as ?label) 
                   (GROUP_CONCAT(DISTINCT ?inner_type; separator="|") as ?type)
                   (SAMPLE(?inner_apelation) as ?apelation)
                   (SAMPLE(?inner_label_place) as ?label_place)
                   (SAMPLE(?inner_label_starting_date) as ?label_starting_date)
                   (SAMPLE(?inner_label_ending_date) as ?label_ending_date)
                   (GROUP_CONCAT(DISTINCT CONCAT(?inner_author, ":::", STR(?uri_author)); separator="|") as ?authors)
                   (GROUP_CONCAT(DISTINCT CONCAT(?inner_owner, ":::", STR(?uri_owner_role)); separator="|") as ?owners)
                   (GROUP_CONCAT(DISTINCT ?inner_topic; separator="|") as ?topic)
                   (GROUP_CONCAT(DISTINCT CONCAT(?inner_exhibition, ":::", STR(?uri_exhibition)); separator="|") as ?exhibitions)
            WHERE 
            {{
                VALUES ?uri {{ {uris_str} }}
                
                ?uri rdfs:label ?inner_label .

                OPTIONAL {{ ?uri <https://w3id.org/OntoExhibit#type> ?inner_type . }}
                OPTIONAL {{ ?uri <https://w3id.org/OntoExhibit#apelation> ?inner_apelation }}

                OPTIONAL {{
                    ?uri <https://w3id.org/OntoExhibit#hasOwner> ?uri_owner .
                    ?uri_owner <https://w3id.org/OntoExhibit#isRoleOf> ?uri_owner_role .
                    ?uri_owner_role rdfs:label ?inner_owner
                }}
                OPTIONAL {{
                     ?uri <https://w3id.org/OntoExhibit#hasProduction> ?prod .
                     OPTIONAL {{
                        ?prod <https://w3id.org/OntoExhibit#hasProductionAuthor> ?author_role .
                        ?author_role <https://w3id.org/OntoExhibit#isRoleOf> ?uri_author .
                        ?uri_author rdfs:label ?inner_author .
                     }}
                     OPTIONAL {{
                        ?prod <https://w3id.org/OntoExhibit#hasTimeSpan> ?tr .
                        ?tr <https://w3id.org/OntoExhibit#hasStartingDate> ?start_date .
                        ?start_date rdfs:label ?inner_label_starting_date .
                     }}
                     OPTIONAL {{
                        ?prod <https://w3id.org/OntoExhibit#hasTimeSpan> ?tr .
                        ?tr <https://w3id.org/OntoExhibit#hasEndingDate> ?end_date .
                        ?end_date rdfs:label ?inner_label_ending_date .
                     }}
                }}
                OPTIONAL {{
                    ?uri <https://w3id.org/OntoExhibit#isDisplayedAt> ?uri_exhibition .
                    ?uri_exhibition rdfs:label ?inner_exhibition
                }}
                OPTIONAL {{
                    ?uri <https://w3id.org/OntoExhibit#hasTheme> ?uri_topic .
                    ?uri_topic rdfs:label ?inner_topic
                }}
            }} 
            GROUP BY ?uri
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
        triples.append(f"{uri_title}> {uri_ontologia}isTitleOf> {sujeto}> .")

        # ... (Production logic omitted for brevity as it was commented out in original snippet shown)
        
        # Build final query
        query = f"INSERT DATA\n{{\n\tGRAPH <{settings.DEFAULT_GRAPH_URL}> {{\n"
        for triple in triples:
            query += f"\t\t{triple}\n"
        query += "\t}\n}"
        
        return query

    GET_ARTWORK_BY_ID = f"""
        {PREFIXES}
        SELECT ?uri 
               (SAMPLE(?inner_label) as ?label)
               (GROUP_CONCAT(DISTINCT ?inner_type; separator="|") as ?type)
               (SAMPLE(?inner_apelation) as ?apelation)
               (SAMPLE(?inner_label_starting_date) as ?label_starting_date)
               (SAMPLE(?inner_label_ending_date) as ?label_ending_date)
               (GROUP_CONCAT(DISTINCT CONCAT(?inner_author, ":::", STR(?uri_author)); separator="|") as ?authors)
               (GROUP_CONCAT(DISTINCT CONCAT(?inner_owner, ":::", STR(?uri_owner)); separator="|") as ?owners)
               (GROUP_CONCAT(DISTINCT ?inner_topic; separator="|") as ?topic)
               (GROUP_CONCAT(DISTINCT CONCAT(?inner_exhibition, ":::", STR(?uri_exhibition)); separator="|") as ?exhibitions)
        WHERE 
        {{
            ?uri rdf:type <https://w3id.org/OntoExhibit#Work_Manifestation> .
            ?uri rdfs:label ?inner_label .
            FILTER (regex(str(?uri), "%s", "i"))
            
            OPTIONAL {{ ?uri <https://w3id.org/OntoExhibit#type> ?inner_type . }}
            OPTIONAL {{ ?uri <https://w3id.org/OntoExhibit#apelation> ?inner_apelation }}
            
            OPTIONAL {{
                ?uri <https://w3id.org/OntoExhibit#hasOwner> ?owner_role .
                ?owner_role <https://w3id.org/OntoExhibit#isRoleOf> ?uri_owner .
                ?uri_owner rdfs:label ?inner_owner
            }}
            OPTIONAL {{
                ?uri <https://w3id.org/OntoExhibit#hasProduction> ?prod .
                OPTIONAL {{
                    ?prod <https://w3id.org/OntoExhibit#hasProductionAuthor> ?author_role .
                    ?author_role <https://w3id.org/OntoExhibit#isRoleOf> ?uri_author .
                    ?uri_author rdfs:label ?inner_author
                }}
                OPTIONAL {{
                    ?prod <https://w3id.org/OntoExhibit#hasTimeSpan> ?tr .
                    ?tr <https://w3id.org/OntoExhibit#hasStartingDate> ?start_date .
                    ?start_date rdfs:label ?inner_label_starting_date .
                }}
                OPTIONAL {{
                    ?prod <https://w3id.org/OntoExhibit#hasTimeSpan> ?tr .
                    ?tr <https://w3id.org/OntoExhibit#hasEndingDate> ?end_date .
                    ?end_date rdfs:label ?inner_label_ending_date .
                }}
            }}
            OPTIONAL {{
                ?uri <https://w3id.org/OntoExhibit#isDisplayedAt> ?uri_exhibition .
                ?uri_exhibition rdfs:label ?inner_exhibition
            }}
            OPTIONAL {{
                ?uri <https://w3id.org/OntoExhibit#hasTheme> ?uri_topic .
                ?uri_topic rdfs:label ?inner_topic
            }}
        }} 
        GROUP BY ?uri
    """

