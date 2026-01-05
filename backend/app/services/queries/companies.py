"""
Company SPARQL queries.

Provides SPARQL queries for company entity operations including
listing, detail retrieval, and museographer role relationships.
"""

from app.services.queries.base import PREFIXES


class CompanyQueries:
    COUNT_COMPANIES = f"""
        {PREFIXES}
        SELECT (count(distinct ?uri) as ?count) WHERE 
        {{   
            ?uri rdf:type <https://w3id.org/OntoExhibit#Company> .
        }}
    """

    @staticmethod
    def get_companies_ids(limit: int, last_label: str = None, last_uri: str = None, text_search: str = None) -> str:
        filter_clause = f'FILTER regex(?label, "{text_search}", "i")' if text_search else ""
        
        pagination_filter = ""
        if last_label and last_uri:
            pagination_filter = f"""
                FILTER (?uri > <{last_uri}>)
            """

        return f"""
            {PREFIXES}
            SELECT DISTINCT ?label ?uri
            WHERE 
            {{
                ?uri rdf:type <https://w3id.org/OntoExhibit#Company> .
                ?uri rdfs:label ?label .
                
                {filter_clause}
                {pagination_filter}
            }} 
            ORDER BY ?uri
            LIMIT {limit}
        """

    @staticmethod
    def get_companies_details(uris: list[str]) -> str:
        if not uris:
            return ""
        
        uris_str = " ".join([f"<{u}>" for u in uris])
        
        return f"""
            {PREFIXES}
            SELECT ?uri (SAMPLE(?inner_label) as ?label) 
                   (SAMPLE(?inner_isic) as ?isic4_category)
                   (SAMPLE(?inner_size) as ?size)
                   (SAMPLE(?inner_place_label) as ?location_label)
                   (SAMPLE(?inner_place_uri) as ?location_uri)
            WHERE 
            {{
                VALUES ?uri {{ {uris_str} }}
                
                ?uri rdfs:label ?inner_label .

                OPTIONAL {{ ?uri <https://w3id.org/OntoExhibit#ISIC4Category> ?inner_isic }}
                OPTIONAL {{ ?uri <https://w3id.org/OntoExhibit#size> ?inner_size }}
                OPTIONAL {{ 
                    ?uri <https://w3id.org/OntoExhibit#hasLocation> ?location .
                    ?location <https://w3id.org/OntoExhibit#hasPlaceOfLocation> ?inner_place_uri .
                    ?inner_place_uri rdfs:label ?inner_place_label
                }}
            }} 
            GROUP BY ?uri
        """

    GET_COMPANY = f"""
        {PREFIXES}
        SELECT DISTINCT ?label ?uri ?isic4_category ?size ?location_label ?location_uri
        WHERE 
        {{
            ?uri rdf:type <https://w3id.org/OntoExhibit#Company> .
            ?uri rdfs:label ?label .
            
            FILTER (regex(str(?uri), "%s", "i"))

            OPTIONAL {{ ?uri <https://w3id.org/OntoExhibit#ISIC4Category> ?isic4_category }}
            OPTIONAL {{ ?uri <https://w3id.org/OntoExhibit#size> ?size }}
            OPTIONAL {{ 
                ?uri <https://w3id.org/OntoExhibit#hasLocation> ?location .
                ?location <https://w3id.org/OntoExhibit#hasPlaceOfLocation> ?location_uri .
                ?location_uri rdfs:label ?location_label
            }}
        }}
    """

    @staticmethod
    def get_museographer_exhibitions(company_id: str) -> str:
        """Get exhibitions where this company was the museographer."""
        return f"""
            {PREFIXES}
            SELECT DISTINCT ?exhibition_uri ?exhibition_label ?start_date
            WHERE {{
                BIND(<https://w3id.org/OntoExhibit#company/{company_id}> AS ?company)
                
                # 1. Company <-> Role (Support both directions)
                {{ ?museographer_role <https://w3id.org/OntoExhibit#isRoleOf> ?company }}
                UNION
                {{ ?company <https://w3id.org/OntoExhibit#hasRole> ?museographer_role }}
                
                # 2. Role <-> Making (Support both directions)
                {{ ?museographer_role <https://w3id.org/OntoExhibit#isMuseographerOf> ?making }}
                UNION
                {{ ?making <https://w3id.org/OntoExhibit#hasMuseographer> ?museographer_role }}
                
                # 3. Making <-> Exhibition (Support both directions)
                {{ ?making <https://w3id.org/OntoExhibit#isExhibitionMakingOf> ?exhibition_uri }}
                UNION
                {{ ?exhibition_uri <https://w3id.org/OntoExhibit#hasExhibitionMaking> ?making }}
                
                ?exhibition_uri rdf:type <https://w3id.org/OntoExhibit#Exhibition> .
                ?exhibition_uri rdfs:label ?exhibition_label .
                
                OPTIONAL {{
                    ?exhibition_uri <https://w3id.org/OntoExhibit#hasOpening> ?opening .
                    ?opening <https://w3id.org/OntoExhibit#hasTimeSpan> ?time_opening .
                    ?time_opening rdfs:label ?start_date
                }}
            }}
            ORDER BY ?exhibition_label
        """
