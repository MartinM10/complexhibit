# Build multi-stage para imagen más pequeña
FROM python:3.11-slim as builder

# Establecer directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage de producción
FROM python:3.11-slim

# Establecer directorio de trabajo
WORKDIR /app

# Copiar dependencias de Python desde builder (instalación a nivel de sistema)
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copiar código de la aplicación
COPY ./app ./app

# Crear usuario no-root
RUN useradd -m -u 1000 appuser

# Copiar script de entrypoint
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh && chown appuser:appuser entrypoint.sh

# Establecer permisos de app
RUN chown -R appuser:appuser /app

USER appuser

# Exponer puerto
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/api/v1/')"

# Entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

# Ejecutar la aplicación
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
