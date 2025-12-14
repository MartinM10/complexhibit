from urllib.parse import quote

from rdflib import RDF, RDFS

from app.core.config import settings
from app.models.domain import Persona
from app.services.queries.base import OBJECT_PROPERTIES, PREFIXES, URI_ONTOLOGIA, uri_ontologia
from app.utils.helpers import convertir_fecha, hash_sha256, pascal_case_to_camel_case, validar_fecha


class PersonQueries:
    ALL_PERSONAS = f"""
        {PREFIXES}
        SELECT distinct ?uri ?label
        WHERE 
        {{
            ?uri rdf:type <https://w3id.org/OntoExhibit#Human_Actant> .
            ?uri rdfs:label ?label
        }}
        ORDER BY ?label
    """

    @staticmethod
    def get_personas_ids(limit: int, last_label: str = None, last_uri: str = None, text_search: str = None,
                         birth_place: str = None, birth_date: str = None, death_date: str = None, 
                         gender: str = None, activity: str = None) -> str:
        
        filters = []
        inner_joins = []
        
        if text_search:
            filters.append(f'(regex(?label, "{text_search}", "i") || regex(?inner_birth_place_label, "{text_search}", "i") || regex(?inner_activity, "{text_search}", "i"))')
            inner_joins.append("""
                OPTIONAL {
                    ?uri <https://w3id.org/OntoExhibit#hasBirth> ?birth_ts .
                    OPTIONAL { ?birth_ts <https://w3id.org/OntoExhibit#hasPlaceOfBirth> ?place_ts . ?place_ts rdfs:label ?inner_birth_place_label }
                }
            """)
            inner_joins.append("OPTIONAL { ?uri <https://w3id.org/OntoExhibit#activity_type> ?inner_activity }")
        
        if birth_place and not text_search:
            filters.append(f'regex(?inner_birth_place_label, "{birth_place}", "i")')
            inner_joins.append("""
                OPTIONAL {
                    ?uri <https://w3id.org/OntoExhibit#hasBirth> ?birth_bp .
                    OPTIONAL { ?birth_bp <https://w3id.org/OntoExhibit#hasPlaceOfBirth> ?place_bp . ?place_bp rdfs:label ?inner_birth_place_label }
                }
            """)

        if birth_date:
            filters.append(f'regex(?inner_birth_date_label, "{birth_date}", "i")')
            inner_joins.append("""
                OPTIONAL {
                    ?uri <https://w3id.org/OntoExhibit#hasBirth> ?birth_bd .
                    OPTIONAL { ?birth_bd <https://w3id.org/OntoExhibit#hasTimeSpan> ?time_bd . ?time_bd rdfs:label ?inner_birth_date_label }
                }
            """)
            
        if death_date:
            filters.append(f'regex(?inner_death_date_label, "{death_date}", "i")')
            inner_joins.append("""
                OPTIONAL {
                    ?uri <https://w3id.org/OntoExhibit#died> ?death_dd .
                    ?death_dd <https://w3id.org/OntoExhibit#hasTimeSpan> ?time_death_dd .
                    ?time_death_dd rdfs:label ?inner_death_date_label
                }
            """)

        if gender:
            filters.append(f'regex(?inner_gender, "^{gender}$", "i")')
            inner_joins.append("OPTIONAL { ?uri <https://w3id.org/OntoExhibit#gender> ?inner_gender }")

        if activity and not text_search:
            filters.append(f'regex(?inner_activity, "{activity}", "i")')
            inner_joins.append("OPTIONAL { ?uri <https://w3id.org/OntoExhibit#activity_type> ?inner_activity }")

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

        inner_joins_str = "\n".join(inner_joins)

        return f"""
            {PREFIXES}
            SELECT distinct ?uri ?label
            WHERE 
            {{
                {{
                    ?uri rdf:type <https://w3id.org/OntoExhibit#Human_Actant> .
                    ?uri rdfs:label ?label
                }}
                UNION
                {{
                    ?uri rdf:type <https://cidoc-crm.org/cidoc-crm/7.1.1/E21_Person> .
                    ?uri rdfs:label ?label
                }}
                UNION
                {{
                    ?uri rdf:type <https://cidoc-crm.org/cidoc-crm/7.1.1/E74_Group> .
                    ?uri rdfs:label ?label
                }}
                {inner_joins_str}
                {filter_clause}
                {pagination_filter}
            }}
            ORDER BY lcase(?label) ?uri
            LIMIT {limit}
        """

    @staticmethod
    def get_personas_details(uris: list[str]) -> str:
        if not uris:
            return ""
        
        uris_str = " ".join([f"<{u}>" for u in uris])
        
        return f"""
            {PREFIXES}
            SELECT ?uri (SAMPLE(COALESCE(?inner_person_name, ?inner_label, "")) as ?label) 
                   (SAMPLE(?inner_birth_place_label) as ?birth_place_label)
                   (SAMPLE(?inner_birth_date_label) as ?birth_date_label)
                   (SAMPLE(?inner_death_date_label) as ?death_date_label)
                   (SAMPLE(?inner_gender) as ?gender)
                   (GROUP_CONCAT(DISTINCT ?inner_activity; separator="|") as ?activity)
            WHERE 
            {{
                VALUES ?uri {{ {uris_str} }}
                
                OPTIONAL {{ ?uri rdfs:label ?inner_label . }}
                OPTIONAL {{ ?uri <https://w3id.org/OntoExhibit#person_name> ?inner_person_name . }}
                
                OPTIONAL {{
                    ?uri <https://w3id.org/OntoExhibit#hasBirth> ?birth .
                    OPTIONAL {{ 
                        ?birth <https://w3id.org/OntoExhibit#hasPlaceOfBirth> ?place .
                        ?place rdfs:label ?inner_birth_place_label 
                    }}
                    OPTIONAL {{
                        ?birth <https://w3id.org/OntoExhibit#hasTimeSpan> ?time .
                        ?time rdfs:label ?inner_birth_date_label
                    }}
                }}
                OPTIONAL {{
                    ?uri <https://w3id.org/OntoExhibit#died> ?death .
                    ?death <https://w3id.org/OntoExhibit#hasTimeSpan> ?time_death .
                    ?time_death rdfs:label ?inner_death_date_label
                }}
                OPTIONAL {{
                    ?uri <https://w3id.org/OntoExhibit#gender> ?inner_gender
                }}
                OPTIONAL {{
                    ?uri <https://w3id.org/OntoExhibit#activity_type> ?inner_activity
                }}
            }}
            GROUP BY ?uri
        """

    GET_PERSONS_AND_GROUPS = f"""
        {PREFIXES}
        SELECT ?uri 
               (SAMPLE(COALESCE(?inner_person_name, ?inner_label, "")) as ?label)
               (SAMPLE(?inner_label_place) as ?label_place)
               (SAMPLE(?inner_place_uri) as ?place_uri)
               (SAMPLE(?inner_label_date) as ?label_date)
               (SAMPLE(?inner_death_date) as ?death_date)
               (SAMPLE(?inner_gender) as ?gender)
               (GROUP_CONCAT(DISTINCT ?inner_activity; separator="|") as ?activity)
        WHERE 
        {{
            {{
                ?uri rdf:type <https://w3id.org/OntoExhibit#Human_Actant> .
            }}
            UNION
            {{
                ?uri rdf:type <https://cidoc-crm.org/cidoc-crm/7.1.1/E21_Person> .
            }}
            UNION
            {{
                ?uri rdf:type <https://cidoc-crm.org/cidoc-crm/7.1.1/E74_Group> .
            }}
            
            OPTIONAL {{ ?uri rdfs:label ?inner_label }}
            OPTIONAL {{ ?uri <https://w3id.org/OntoExhibit#person_name> ?inner_person_name }}

            OPTIONAL 
            {{
                ?uri <https://w3id.org/OntoExhibit#hasBirth> ?birth .
                OPTIONAL {{
                    ?birth <https://w3id.org/OntoExhibit#hasPlaceOfBirth> ?inner_place_uri .
                    ?inner_place_uri rdfs:label ?inner_label_place
                }}
                OPTIONAL {{
                    ?birth <https://w3id.org/OntoExhibit#hasTimeSpan> ?birth_date .
                    ?birth_date rdfs:label ?inner_label_date
                }}
            }}
            OPTIONAL
            {{
                ?uri <https://w3id.org/OntoExhibit#hasDeath> ?death .
                ?death <https://w3id.org/OntoExhibit#hasTimeSpan> ?death_date_uri .
                ?death_date_uri rdfs:label ?inner_death_date
            }}
            OPTIONAL {{ ?uri <https://w3id.org/OntoExhibit#gender> ?inner_gender }}
            OPTIONAL {{ ?uri <https://w3id.org/OntoExhibit#activity_type> ?inner_activity }}
            FILTER (regex(str(?uri), "%s", "i"))
        }} 
        GROUP BY ?uri
        ORDER BY ?label
    """

    @staticmethod
    def get_actor_roles(actor_id: str) -> str:
        """Get all exhibitions and artworks where the actor participated in any role."""
        return f"""
            {PREFIXES}
            SELECT DISTINCT ?item_uri ?item_label ?role_type ?item_type
            WHERE {{
                BIND(<https://w3id.org/OntoExhibit#human_actant/{actor_id}> AS ?actor)
                
                # Link Actor to Role (check both directions)
                {{ ?actor <https://w3id.org/OntoExhibit#hasRole> ?role }}
                UNION
                {{ ?role <https://w3id.org/OntoExhibit#isRoleOf> ?actor }}
                
                # --- EXHIBITION ROLES ---
                {{
                    {{
                        # Exhibitor
                        {{ ?making <https://w3id.org/OntoExhibit#hasExhibitingActant> ?role }}
                        UNION
                        {{ ?role <https://w3id.org/OntoExhibit#isExhibitingActantIn> ?making }}
                        BIND("Exhibitor" AS ?role_type)
                    }}
                    UNION
                    {{
                        # Curator
                        {{ ?making <https://w3id.org/OntoExhibit#hasCurator> ?role }}
                        UNION
                        {{ ?role <https://w3id.org/OntoExhibit#isCuratorOf> ?making }}
                        BIND("Curator" AS ?role_type)
                    }}
                    UNION
                    {{
                        # Organizer
                        {{ ?making <https://w3id.org/OntoExhibit#hasOrganizer> ?role }}
                        UNION
                        {{ ?role <https://w3id.org/OntoExhibit#isOrganizerOf> ?making }}
                        BIND("Organizer" AS ?role_type)
                    }}
                    UNION
                    {{
                        # Funder
                        {{ ?making <https://w3id.org/OntoExhibit#hasFunder> ?role }}
                        UNION
                        {{ ?role <https://w3id.org/OntoExhibit#isFunderOf> ?making }}
                        BIND("Funder" AS ?role_type)
                    }}
                    UNION
                    {{
                        # Lender
                        {{ ?making <https://w3id.org/OntoExhibit#hasLender> ?role }}
                        UNION
                        {{ ?role <https://w3id.org/OntoExhibit#isLenderOf> ?making }}
                        BIND("Lender" AS ?role_type)
                    }}
                    
                    # Get the exhibition from making
                    ?making <https://w3id.org/OntoExhibit#madeExhibition> ?item_uri .
                    BIND("exhibition" AS ?item_type)
                }}
                
                # --- ARTWORK ROLES ---
                UNION
                {{
                    # Author
                    {{
                        {{ ?prod <https://w3id.org/OntoExhibit#hasProductionAuthor> ?role }}
                        UNION
                        {{ ?role <https://w3id.org/OntoExhibit#isProductionAuthorOf> ?prod }}
                        
                        ?item_uri <https://w3id.org/OntoExhibit#hasProduction> ?prod .
                        BIND("Author" AS ?role_type)
                    }}
                    UNION
                    {{
                        # Owner
                        {{ ?item_uri <https://w3id.org/OntoExhibit#hasOwner> ?role }}
                        UNION
                        {{ ?role <https://w3id.org/OntoExhibit#isOwnerOf> ?item_uri }}
                        BIND("Owner" AS ?role_type)
                    }}
                    BIND("artwork" AS ?item_type)
                }}

                ?item_uri rdfs:label ?item_label .
            }}
            ORDER BY ?item_label
        """

    COUNT_ACTANTS = f"""
        {PREFIXES}
        SELECT (count(distinct ?uri) as ?count) WHERE 
        {{   
            {{ ?uri rdf:type <https://w3id.org/OntoExhibit#Human_Actant> }}
            UNION {{ ?uri rdf:type <https://cidoc-crm.org/cidoc-crm/7.1.1/E74_Group> }}
            UNION {{ ?uri rdf:type <https://cidoc-crm.org/cidoc-crm/7.1.1/E21_Person> }}
        }}
    """

    @staticmethod
    def add_persona(persona: Persona) -> str:
        POST_PERSONA = f"INSERT DATA\n\t{{\n\t\tGRAPH <{settings.DEFAULT_GRAPH_URL}> {{\n"

        if persona.type:
            if persona.type == "Individual":
                persona.type = "person"
            elif persona.type == "Group":
                persona.type = "group"
        else:
            persona.type = "human actant"

        data_to_hash = f"{persona.name} - {persona.type}"
        sujeto = f'{uri_ontologia}{quote("human_actant").lower()}/{hash_sha256(data_to_hash)}'

        if "group" == persona.type.lower():
            POST_PERSONA += (
                f"\t\t{sujeto}> <{RDF.type}> <https://cidoc-crm.org/cidoc-crm/7.1.1/E74_Group> .\n"
            )
        elif "individual" == persona.type.lower():
            POST_PERSONA += (
                f"\t\t{sujeto}> <{RDF.type}> <https://cidoc-crm.org/cidoc-crm/7.1.1/E21_Person> .\n"
            )
        else:
            POST_PERSONA += f"\t\t{sujeto}> <{RDF.type}> {uri_ontologia}Human_Actant> .\n"

        if persona.name:
            POST_PERSONA += f'\t\t{sujeto}> <{RDFS.label}> "{persona.name.title()}"^^<http://www.w3.org/2001/XMLSchema#string> .\n'
            POST_PERSONA += f'\t\t{sujeto}> {uri_ontologia}name> "{persona.name.title()}"^^<http://www.w3.org/2001/XMLSchema#string> .\n'

        if persona.country or persona.birth_date:
            POST_PERSONA += f"\t\t{sujeto}> {uri_ontologia}hasBirth> {sujeto}/birth> .\n"
            POST_PERSONA += f"\t\t{sujeto}/birth> {uri_ontologia}isBirthOf> {sujeto}> .\n"

            if persona.country:
                uri_lugar = (
                    f"{uri_ontologia}territorialEntity/{hash_sha256(persona.country.title())}"
                )
                POST_PERSONA += (
                    f"\t\t{uri_lugar}> <{RDF.type}> {uri_ontologia}TerritorialEntity> .\n"
                )
                POST_PERSONA += f'\t\t{uri_lugar}> <{RDFS.label}> "{persona.country.title()}"^^<http://www.w3.org/2001/XMLSchema#string> .\n'
                POST_PERSONA += f"\t\t{sujeto}/birth> <https://w3id.org/OntoExhibit#takesPlaceAt> {uri_lugar}> .\n"
                POST_PERSONA += f"\t\t{uri_lugar}> <https://w3id.org/OntoExhibit#isPlaceOfBirthOf> {sujeto}/birth> .\n"

            if persona.birth_date:
                fecha = validar_fecha(persona.birth_date)
                if fecha:
                    if (fecha.month == 1 and fecha.day == 1) or (
                        fecha.month == 12 and fecha.day == 31
                    ):
                        fecha_str = str(fecha.year)
                        tipo_indiv = "ApproximateDate"
                        uri_fecha = (
                            f"<{URI_ONTOLOGIA}{tipo_indiv.lower()}/{hash_sha256(fecha_str)}>"
                        )
                        POST_PERSONA += (
                            f"\t\t{uri_fecha} <{RDF.type}> <{URI_ONTOLOGIA}{tipo_indiv}> .\n"
                        )
                        POST_PERSONA += f'\t\t{uri_fecha} <{RDFS.label}> "{fecha_str}-01-01"^^<http://www.w3.org/2001/XMLSchema#date> .\n'
                    else:
                        fecha_str = fecha.strftime("%Y-%m-%d")
                        tipo_indiv = "ExactDate"
                        uri_fecha = (
                            f"<{URI_ONTOLOGIA}{tipo_indiv.lower()}/{hash_sha256(fecha_str)}>"
                        )
                        POST_PERSONA += (
                            f"\t\t{uri_fecha} <{RDF.type}> <{URI_ONTOLOGIA}{tipo_indiv}> .\n"
                        )
                        POST_PERSONA += f'\t\t{uri_fecha} <{RDFS.label}> "{fecha_str}"^^<http://www.w3.org/2001/XMLSchema#date> .\n'

                    POST_PERSONA += (
                        f"\t\t{sujeto}/birth> {uri_ontologia}hasTimeSpan> {uri_fecha} .\n"
                    )
                    POST_PERSONA += (
                        f"\t\t{uri_fecha} {uri_ontologia}isTimeSpanOf> {sujeto}/birth> .\n"
                    )

        if persona.death_date:
            POST_PERSONA += f"\t\t{sujeto}/death> {uri_ontologia}isDeathOf> {sujeto}> .\n"

            fecha = validar_fecha(persona.death_date)
            if fecha:
                if (fecha.month == 1 and fecha.day == 1) or (fecha.month == 12 and fecha.day == 31):
                    fecha_str = str(fecha.year)
                    tipo_indiv = "ApproximateDate"
                    uri_fecha = f"<{URI_ONTOLOGIA}{tipo_indiv.lower()}/{hash_sha256(fecha_str)}>"
                    POST_PERSONA += (
                        f"\t\t{uri_fecha} <{RDF.type}> <{URI_ONTOLOGIA}{tipo_indiv}> .\n"
                    )
                    POST_PERSONA += f'\t\t{uri_fecha} <{RDFS.label}> "{fecha_str}-01-01"^^<http://www.w3.org/2001/XMLSchema#date> .\n'
                else:
                    fecha_str = fecha.strftime("%Y-%m-%d")
                    tipo_indiv = "ExactDate"
                    uri_fecha = f"<{URI_ONTOLOGIA}{tipo_indiv.lower()}/{hash_sha256(fecha_str)}>"
                    POST_PERSONA += (
                        f"\t\t{uri_fecha} <{RDF.type}> <{URI_ONTOLOGIA}{tipo_indiv}> .\n"
                    )
                    POST_PERSONA += f'\t\t{uri_fecha} <{RDFS.label}> "{fecha_str}"^^<http://www.w3.org/2001/XMLSchema#date> .\n'

                POST_PERSONA += f"\t\t{sujeto}/death> {uri_ontologia}hasTimeSpan> {uri_fecha} .\n"
                POST_PERSONA += (
                    f"\t\t{uri_fecha} {uri_ontologia}isTimeSpanOf> {sujeto}/death> .\n"
                )

        if persona.activity:
            if isinstance(persona.activity, list):
                for act in persona.activity:
                    POST_PERSONA += f'\t\t{sujeto}> <https://w3id.org/OntoExhibit#activity> "{act}"^^<http://www.w3.org/2001/XMLSchema#string> .\n'
            else:
                POST_PERSONA += f'\t\t{sujeto}> <https://w3id.org/OntoExhibit#activity> "{persona.activity}"^^<http://www.w3.org/2001/XMLSchema#string> .\n'

        if persona.gender:
            POST_PERSONA += f'\t\t{sujeto}> <https://w3id.org/OntoExhibit#gender> "{persona.gender}"^^<http://www.w3.org/2001/XMLSchema#string> .\n'

        POST_PERSONA += "\t}\n}"
        return POST_PERSONA
