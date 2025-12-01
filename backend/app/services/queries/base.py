from app.core.config import settings

PREFIXES = f"""
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
"""

URI_ONTOLOGIA = settings.URI_ONTOLOGIA
uri_ontologia = f"<{URI_ONTOLOGIA}"

OBJECT_PROPERTIES = [
    "relacionConPersona",
    "relacionConInstitucion",
    "institucionMatriz",
    "personaPropietaria",
    "institucionPropietaria",
    "autorDeObra",
    "dispositivoDeInscripcionExhibeObraDeArte",
    "dispositivoDeInscripcionExhibeInstitucion",
    "dispositivoDeInscripcionExhibePersona",
    "dispositivoDeInscripcionMatriz",
    "ilustrador",
    "editor",
    "personaAutoraDeDispositivoDeInscripcion",
    "dispositivoDeInscripcionPatrocinadoPor",
    "institucionAutoraDeDispositivoDeInscripcion",
    "editorialDelDispositivoDeInscripcion",
    "dispositivoMatriz",
    "comisario",
    "tieneDispositivoDeInscripcion",
    "exposicionExhibeArtista",
    "exposicionExhibeObraDeArte",
    "fuenteInformacion",
    "organiza",
    "institucionColeccionsita",
    "personaColeccionsita",
    "exposicionPatrocinadaPor",
    "empresaResponsableMuseografia",
    "exposicionMatriz",
    "productionPlace",
    "productionEndDate",
    "productionStartDate",
    "author",
]
