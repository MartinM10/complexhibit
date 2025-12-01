#!/bin/bash

# Script para cargar datos RDF en Virtuoso
# Uso: ./load_data.sh

set -e

echo "=== Cargando datos en Virtuoso ==="

# Configuración
VIRTUOSO_HOST="localhost"
VIRTUOSO_PORT="1111"
VIRTUOSO_USER="dba"
VIRTUOSO_PASSWORD="${VIRTUOSO_DBA_PASSWORD:-dba}"
GRAPH_URI="http://localhost:8890/OntoExhibit"
DATA_FILE="/database/result.nt"

# Esperar a que Virtuoso esté listo
echo "Esperando a que Virtuoso esté disponible..."
max_attempts=30
attempt=0
while ! nc -z $VIRTUOSO_HOST $VIRTUOSO_PORT; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        echo "Error: Virtuoso no está disponible después de $max_attempts intentos"
        exit 1
    fi
    echo "Intento $attempt/$max_attempts - Esperando..."
    sleep 2
done

echo "Virtuoso está disponible!"

# Cargar datos usando isql
echo "Cargando datos desde $DATA_FILE al grafo $GRAPH_URI..."

docker exec -i complexhibit-virtuoso isql $VIRTUOSO_PORT $VIRTUOSO_USER $VIRTUOSO_PASSWORD <<EOF
SPARQL CLEAR GRAPH <$GRAPH_URI>;
DELETE FROM DB.DBA.load_list;
ld_dir('/database', 'result.nt', '$GRAPH_URI');
SELECT * FROM DB.DBA.load_list;
rdf_loader_run();
checkpoint;
SELECT COUNT(*) FROM DB.DBA.RDF_QUAD WHERE G = iri_to_id('$GRAPH_URI');
EXIT;
EOF

echo "=== Carga de datos completada ==="
echo ""
echo "Para verificar los datos cargados, accede a:"
echo "  - Conductor: http://localhost:8890/conductor"
echo "  - SPARQL Endpoint: http://localhost:8890/sparql"
echo ""
echo "Credenciales:"
echo "  Usuario: dba"
echo "  Contraseña: dba (o la configurada en VIRTUOSO_DBA_PASSWORD)"
