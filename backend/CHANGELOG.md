# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-26

### 🎉 Major Refactoring

This release represents a complete architectural overhaul of the Complexhibit API.

### Added

- **Modular Architecture**: Separated concerns into routers, services, models, and utilities
- **Async SPARQL Client**: Replaced synchronous `SPARQLWrapper` with async `httpx`
- **Query Organization**: Structured SPARQL queries into domain-specific modules
- **Type Safety**: Full Pydantic v2 models with type hints throughout
- **Configuration Management**: Environment-based settings with `pydantic-settings`
- **Response Models**: Standardized API responses with `StandardResponseModel` and `ErrorResponseModel`
- **Comprehensive Documentation**: 
  - Updated README.md with modern formatting
  - Added ARCHITECTURE.md with system design
  - Added CONTRIBUTING.md with development guidelines
  - Added LICENSE.md (MIT)
  - Added CHANGELOG.md (this file)
  - Enhanced ROUTES.md with all endpoints
- **Docker Improvements**: Multi-stage Dockerfile with security best practices
- **Docker Compose**: Full stack deployment with Virtuoso
- **HTTP Tests**: Comprehensive test file for all endpoints
- **Development Tools**: requirements-dev.txt with testing and linting tools

### Changed

- **Project Structure**: Reorganized into `app/` directory with clear separation
  - `app/core/` - Configuration and exceptions
  - `app/models/` - Pydantic models
  - `app/routers/` - API endpoints
  - `app/services/` - Business logic and SPARQL client
  - `app/utils/` - Helper functions
- **SPARQL Queries**: Refactored from monolithic `queries.py` into organized modules
- **Response Parsing**: Replaced complex `desglozarJSON` with cleaner parser utilities
- **Dependencies**: Updated to latest stable versions
  - FastAPI 0.122.0
  - Pydantic 2.12.4
  - httpx 0.28.1
  - Python 3.11+ recommended

### Removed

- **Legacy Files**: Removed old monolithic structure
  - `main.py` (root) → `app/main.py`
  - `queries.py` → `app/services/queries/*`
  - `commons.py` → `app/utils/helpers.py` + `app/core/config.py`
  - `models.py` → `app/models/domain.py`
  - `main_virtuoso.py` and `main_stardog.py` (obsolete)
- **SPARQLWrapper**: Removed in favor of async httpx

### Fixed

- **Async Operations**: All SPARQL queries now non-blocking
- **Import Organization**: Clean imports with proper module structure
- **Environment Variables**: Proper validation and type checking
- **Error Handling**: Consistent error responses across all endpoints

### Security

- **JWT Authentication**: Maintained and improved token-based auth
- **Input Validation**: Enhanced with Pydantic models
- **SPARQL Injection**: Better query parameterization
- **Docker Security**: Non-root user in container

### Performance

- **Async I/O**: Non-blocking operations for better concurrency
- **Connection Pooling**: Efficient httpx client management
- **Smaller Docker Image**: Multi-stage build reduces image size

## [0.9.0] - 2024-XX-XX (Previous Version)

### Initial Implementation

- Basic FastAPI application
- SPARQL queries with SPARQLWrapper
- Django frontend integration
- Stardog and Virtuoso support
- Basic authentication

---

## Migration Guide (0.9.0 → 1.0.0)

### Breaking Changes

1. **Import Paths Changed**
   ```python
   # Old
   from models import Persona
   from queries import Query
   
   # New
   from app.models.domain import Persona
   from app.services.queries.persons import PersonQueries
   ```

2. **SPARQL Client**
   ```python
   # Old (synchronous)
   from SPARQLWrapper import SPARQLWrapper
   sparql = SPARQLWrapper(endpoint)
   results = sparql.query()
   
   # New (asynchronous)
   from app.services.sparql_client import sparql_client
   results = await sparql_client.query(query_string)
   ```

3. **Configuration**
   ```python
   # Old
   from commons import URI_ONTOLOGIA
   
   # New
   from app.core.config import settings
   uri = settings.URI_ONTOLOGIA
   ```

4. **Response Format**
   - All responses now use `StandardResponseModel` or `ErrorResponseModel`
   - Consistent structure across all endpoints

### Upgrade Steps

1. Update imports
2. Update `.env` file with new structure
3. Install new dependencies: `pip install -r requirements.txt`
4. Update Docker configuration if using containers
5. Test all endpoints with new structure

---

**For more details, see the [GitHub Releases](https://github.com/MartinM10/ontoexhibit-api/releases) page.**
