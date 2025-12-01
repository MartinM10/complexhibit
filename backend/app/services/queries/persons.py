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
    def get_all_personas(limit: int, last_label: str = None, last_uri: str = None, text_search: str = None) -> str:
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
                {filter_clause}
                {pagination_filter}
            }}
            ORDER BY lcase(?label) ?uri
            LIMIT {limit}
        """

    GET_PERSONS_AND_GROUPS = f"""
        {PREFIXES}
        SELECT DISTINCT ?label ?uri ?label_place ?label_date 
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
            OPTIONAL 
            {{
                ?uri <https://w3id.org/OntoExhibit#wasBorn> ?uri_born .
                ?uri_born <https://w3id.org/OntoExhibit#tookPlaceAt> ?uri_place .
                ?uri_place rdfs:label ?label_place
            }}
            OPTIONAL
            {{
                ?uri <https://w3id.org/OntoExhibit#wasBorn> ?uri_born .
                ?uri_born <https://w3id.org/OntoExhibit#tookPlaceIn> ?uri_date .
                ?uri_date rdfs:label ?label_date
            }}
            FILTER (regex(str(?uri), "%s", "i"))
        }} ORDER BY ?label
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
            POST_PERSONA += f"\t\t{sujeto}> {uri_ontologia}wasBorn> {sujeto}/birth> .\n"
            POST_PERSONA += f"\t\t{sujeto}/birth> {uri_ontologia}broughtIntoLife> {sujeto}> .\n"

            if persona.country:
                uri_lugar = (
                    f"{uri_ontologia}territorialEntity/{hash_sha256(persona.country.title())}"
                )
                POST_PERSONA += (
                    f"\t\t{uri_lugar}> <{RDF.type}> {uri_ontologia}TerritorialEntity> .\n"
                )
                POST_PERSONA += f'\t\t{uri_lugar}> <{RDFS.label}> "{persona.country.title()}"^^<http://www.w3.org/2001/XMLSchema#string> .\n'
                POST_PERSONA += f"\t\t{sujeto}/birth> <https://w3id.org/OntoExhibit#tookPlaceAt> {uri_lugar}> .\n"
                POST_PERSONA += f"\t\t{uri_lugar}> <https://w3id.org/OntoExhibit#wasThePlaceOf> {sujeto}/birth> .\n"

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
                        f"\t\t{sujeto}/birth> {uri_ontologia}tookPlaceIn> {uri_fecha} .\n"
                    )
                    POST_PERSONA += (
                        f"\t\t{uri_fecha} {uri_ontologia}isTheTimeSpanOf> {sujeto}/birth> .\n"
                    )

        if persona.death_date:
            POST_PERSONA += f"\t\t{sujeto}> {uri_ontologia}died> {sujeto}/death> .\n"
            POST_PERSONA += f"\t\t{sujeto}/death> {uri_ontologia}isTheDeathOf> {sujeto}> .\n"

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

                POST_PERSONA += f"\t\t{sujeto}/death> {uri_ontologia}tookPlaceIn> {uri_fecha} .\n"
                POST_PERSONA += (
                    f"\t\t{uri_fecha} {uri_ontologia}isTheTimeSpanOf> {sujeto}/death> .\n"
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
