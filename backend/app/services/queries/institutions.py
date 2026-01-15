from app.core.config import settings
from app.models.domain import Institucion
from app.services.queries.base import PREFIXES
from app.services.queries.utils import add_any_type, escape_sparql_string
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
            # Use URI-only comparison which is safe from special character issues
            pagination_filter = f"""
                FILTER (?uri > <{last_uri}>)
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
            ORDER BY ?uri
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
                        ?ownershipType ?email ?telephone ?uriHtml
                        ?headquarters_address ?headquarters_lat ?headquarters_long
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
            OPTIONAL {{ ?uri <https://w3id.org/OntoExhibit#ownershipType> ?ownershipType }}
            OPTIONAL {{ ?uri <https://w3id.org/OntoExhibit#email> ?email }}
            OPTIONAL {{ ?uri <https://w3id.org/OntoExhibit#phone> ?telephone }}
            OPTIONAL {{ ?uri <https://w3id.org/OntoExhibit#webPage> ?uriHtml }}
            OPTIONAL {{
                ?uri <https://w3id.org/OntoExhibit#hasHeadquarters> ?headquarters .
                ?headquarters rdf:type <https://w3id.org/OntoExhibit#Headquarter> .
                OPTIONAL {{
                    ?headquarters <https://w3id.org/OntoExhibit#isHeadquarteredAt> ?hq_site .
                    ?hq_site rdfs:label ?headquarters_address
                }}
                OPTIONAL {{ ?headquarters <http://www.w3.org/2003/01/geo/wgs84_pos#lat> ?headquarters_lat }}
                OPTIONAL {{ ?headquarters <http://www.w3.org/2003/01/geo/wgs84_pos#long> ?headquarters_long }}
            }}
        }}
    """

    @staticmethod
    def get_institution_executives(inst_id: str) -> str:
        """Get executive positions held at this institution."""
        return f"""
            {PREFIXES}
            SELECT DISTINCT ?person_uri ?person_label
            WHERE {{
                BIND(<https://w3id.org/OntoExhibit#institution/{inst_id}> AS ?institution)
                
                # Institution has executive position
                ?institution <https://w3id.org/OntoExhibit#executivePositionHeldsBy> ?exec_position .
                ?exec_position rdf:type <https://w3id.org/OntoExhibit#Executive_Position> .
                ?exec_position <https://w3id.org/OntoExhibit#isExecutivePositionOf> ?person_uri .
                
                ?person_uri rdfs:label ?person_label .
            }}
            ORDER BY ?person_label
        """


    GET_HOSTED_EXHIBITIONS = f"""
        {PREFIXES}
        SELECT DISTINCT ?uri (SAMPLE(?label) as ?label) (SAMPLE(?start_date) as ?start_date) (SAMPLE(?role) as ?role)
        WHERE 
        {{
            ?inst_uri rdfs:label ?inst_label .
            FILTER (regex(str(?inst_uri), "%s", "i"))
            
            {{
                ?uri <https://w3id.org/OntoExhibit#hasVenue> ?inst_uri .
                BIND("Venue" AS ?role)
            }}
            UNION
            {{
                ?uri <https://w3id.org/OntoExhibit#hasExhibitionMaking> ?making .
                ?making <https://w3id.org/OntoExhibit#hasOrganizer> ?role_node .
                ?role_node <https://w3id.org/OntoExhibit#isRoleOf> ?inst_uri .
                BIND("Organizer" AS ?role)
            }}
            UNION
            {{
                # Funder/Sponsor role - institution has a financer role
                ?inst_uri <https://w3id.org/OntoExhibit#hasRole> ?funder_role .
                ?funder_role <https://w3id.org/OntoExhibit#isFunderOf> ?making .
                ?making <https://w3id.org/OntoExhibit#isExhibitionMakingOf> ?uri .
                BIND("Funder" AS ?role)
            }}
            
            ?uri rdf:type <https://w3id.org/OntoExhibit#Exhibition> .
            
            OPTIONAL {{ ?uri rdfs:label ?label }}
            
            OPTIONAL {{
                ?uri <https://w3id.org/OntoExhibit#hasOpening> ?opening .
                ?opening <https://w3id.org/OntoExhibit#hasTimeSpan> ?time_opening .
                ?time_opening rdfs:label ?start_date
            }}
        }} GROUP BY ?uri
    """

    # Query to find exhibitions where institution was a lender
    GET_LENDER_EXHIBITIONS = f"""
        {PREFIXES}
        SELECT DISTINCT ?uri (SAMPLE(?label) as ?label) (SAMPLE(?start_date) as ?start_date)
        WHERE 
        {{
            ?inst_uri rdfs:label ?inst_label .
            FILTER (regex(str(?inst_uri), "%s", "i"))
            
            # Institution has a lender role
            ?inst_uri <https://w3id.org/OntoExhibit#hasRole> ?lender_role .
            ?lender_role <https://w3id.org/OntoExhibit#isLenderOf> ?making .
            ?making <https://w3id.org/OntoExhibit#isExhibitionMakingOf> ?uri .
            
            ?uri rdf:type <https://w3id.org/OntoExhibit#Exhibition> .
            
            OPTIONAL {{ ?uri rdfs:label ?label }}
            
            OPTIONAL {{
                ?uri <https://w3id.org/OntoExhibit#hasOpening> ?opening .
                ?opening <https://w3id.org/OntoExhibit#hasTimeSpan> ?time_opening .
                ?time_opening rdfs:label ?start_date
            }}
        }} GROUP BY ?uri
    """

    # Query to find artworks owned by the institution
    GET_OWNED_ARTWORKS = f"""
        {PREFIXES}
        SELECT DISTINCT ?uri (SAMPLE(?label) as ?label) (SAMPLE(?type) as ?type)
        WHERE 
        {{
            ?inst_uri rdfs:label ?inst_label .
            FILTER (regex(str(?inst_uri), "%s", "i"))
            
            # Institution has an owner role for the artwork
            ?inst_uri <https://w3id.org/OntoExhibit#hasRole> ?owner_role .
            ?uri <https://w3id.org/OntoExhibit#hasOwner> ?owner_role .
            
            ?uri rdf:type <https://w3id.org/OntoExhibit#Work_Manifestation> .
            
            OPTIONAL {{ ?uri rdfs:label ?label }}
            OPTIONAL {{ ?uri <https://w3id.org/OntoExhibit#type> ?type }}
        }} GROUP BY ?uri
    """

    @staticmethod
    def get_institution_collaborators(inst_id: str) -> str:
        """Get all persons who collaborate with this institution."""
        return f"""
            {PREFIXES}
            SELECT DISTINCT ?collaborator_uri ?collaborator_label
            WHERE {{
                BIND(<https://w3id.org/OntoExhibit#institution/{inst_id}> AS ?institution)
                
                # --- AFFILIATIONS (Person <-> Institution) ---
                {{
                     # Institution has affiliated (Institution has a person affiliated)
                     ?institution <https://w3id.org/OntoExhibit#hasAffiliated> ?affiliation .
                     ?affiliation <https://w3id.org/OntoExhibit#isAffiliationOf> ?collaborator_uri .
                }}
                UNION
                {{
                     # Person is affiliated with (Person points to Institution) - bidirectional check
                     ?collaborator_uri <https://w3id.org/OntoExhibit#hasAffiliation> ?affiliation .
                     ?affiliation <https://w3id.org/OntoExhibit#isAffiliatedWith> ?institution .
                }}
                
                ?collaborator_uri rdfs:label ?collaborator_label .
                
                # Ensure it's a person/human_actant
                {{
                    ?collaborator_uri rdf:type <https://w3id.org/OntoExhibit#Human_Actant> .
                }}
                UNION
                {{
                    ?collaborator_uri rdf:type <https://cidoc-crm.org/cidoc-crm/7.1.1/E21_Person> .
                }}
                UNION
                {{
                    ?collaborator_uri rdf:type <https://cidoc-crm.org/cidoc-crm/7.1.1/E74_Group> .
                }}
            }}
            ORDER BY ?collaborator_label
        """

    @staticmethod
    def get_parent_organization(inst_id: str) -> str:
        """Get the parent organization of this institution (hasParentOrganization)."""
        return f"""
            {PREFIXES}
            SELECT DISTINCT ?parent_uri ?parent_label
            WHERE {{
                BIND(<https://w3id.org/OntoExhibit#institution/{inst_id}> AS ?institution)
                
                # Institution has a parent organization
                ?institution <https://w3id.org/OntoExhibit#hasParentOrganization> ?parent_uri .
                ?parent_uri rdfs:label ?parent_label .
            }}
            ORDER BY ?parent_label
        """

    @staticmethod
    def get_child_organizations(inst_id: str) -> str:
        """Get child organizations of this institution (isParentOrganizationOf)."""
        return f"""
            {PREFIXES}
            SELECT DISTINCT ?child_uri ?child_label
            WHERE {{
                BIND(<https://w3id.org/OntoExhibit#institution/{inst_id}> AS ?institution)
                
                # Institution is the parent of child organizations
                ?institution <https://w3id.org/OntoExhibit#isParentOrganizationOf> ?child_uri .
                ?child_uri rdfs:label ?child_label .
            }}
            ORDER BY ?child_label
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
