# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-12-29

### Added

- **Premium UX/UI Design System**: Complete visual overhaul with modern, premium aesthetics
  - Custom color palette with primary/accent shades (50-900)
  - Google Fonts integration (Inter for body, Playfair Display for headings)
  - Glassmorphism effects for depth and modern feel
  - Custom CSS animations (gradient-shift, float, pulse-slow, shimmer)
  - Customized scrollbar with brand colors
  - Enhanced shadows, focus states, and selection styles

- **Homepage Redesign**: Modern, engaging landing page
  - Hero section with animated gradient text
  - Floating badge with glassmorphism
  - Animated background blobs in soft gradients
  - Enhanced CTA buttons with gradient backgrounds
  - Improved category cards with hover effects and decorative elements

- **Component Enhancements**:
  - ItemCard component with premium styling and micro-animations
  - Navbar with dynamic scroll effect (glassmorphism on scroll)
  - AsyncFilterSelect component for improved data filtering
  - DatePicker UI component

### Changed

- **SPARQL Queries**: Improved query structure for artworks, exhibitions, institutions, and persons
- **API Responses**: Better formatted responses and error handling
- **Type Definitions**: Enhanced TypeScript types for better type safety
- **Navbar Behavior**: Light glassmorphism on scroll for better link visibility

### Fixed

- **Navbar Contrast**: Resolved issue where navigation links were hard to read with dark glassmorphism effect

## [1.0.0] - 2024-11-26

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
