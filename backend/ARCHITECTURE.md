# System Architecture

## Overview

Complexhibit API follows a **layered architecture** pattern with clear separation of concerns. The application is built using FastAPI and follows modern Python best practices with async/await patterns throughout.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  (Web Browser, Mobile App, External Services)               │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                       │
│                    (FastAPI + CORS)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Routers (persons, institutions, exhibitions, etc.)  │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
│  ┌─────────────────┐  ┌──────────────────┐                  │
│  │ SPARQL Client   │  │  Query Builders  │                  │
│  │  (httpx async)  │  │  (persons, etc.) │                  │
│  └─────────────────┘  └──────────────────┘                  │
└────────────────────────┬────────────────────────────────────┘
                         │ SPARQL Protocol
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                │
│              Virtuoso Triplestore                           │
│         (RDF/OWL Knowledge Graph)                           │
└─────────────────────────────────────────────────────────────┘
```

## Layer Descriptions

### 1. API Gateway Layer (`app/routers/`)

**Responsibility**: Handle HTTP requests, route to appropriate handlers, validate input/output

**Components**:
- `persons.py` - Person/artist endpoints
- `institutions.py` - Institution endpoints
- `exhibitions.py` - Exhibition endpoints
- `artworks.py` - Artwork endpoints
- `misc.py` - Search and utility endpoints

**Key Features**:
- Request validation with Pydantic models
- Response serialization
- Error handling and HTTP status codes
- Dependency injection for authentication

### 2. Service Layer (`app/services/`)

**Responsibility**: Business logic, SPARQL query execution, data transformation

**Components**:

#### SPARQL Client (`sparql_client.py`)
- Asynchronous HTTP client using `httpx`
- Connection pooling and timeout management
- SELECT and UPDATE query execution
- Error handling and retry logic

#### Query Builders (`services/queries/`)
- `base.py` - Common SPARQL prefixes and constants
- `persons.py` - Person-related queries
- `institutions.py` - Institution queries
- `exhibitions.py` - Exhibition queries
- `artworks.py` - Artwork queries
- `misc.py` - Search and utility queries
- `utils.py` - Query generation helpers

**Design Pattern**: Builder pattern for constructing SPARQL queries

### 3. Model Layer (`app/models/`)

**Responsibility**: Data validation, serialization, type safety

**Components**:
- `domain.py` - Domain entities (Persona, Exposicion, ObraDeArte, etc.)
- `responses.py` - API response models (StandardResponseModel, ErrorResponseModel)

**Technology**: Pydantic v2 with full type hints

### 4. Core Layer (`app/core/`)

**Responsibility**: Application configuration, shared utilities, exceptions

**Components**:
- `config.py` - Environment-based settings using Pydantic Settings
- `exceptions.py` - Custom exception classes

### 5. Utilities (`app/utils/`)

**Responsibility**: Helper functions, data transformation

**Components**:
- `helpers.py` - Date conversion, hashing, string normalization
- `parsers.py` - SPARQL response parsing and grouping

## Data Flow

### Read Operation (GET Request)

```
1. Client → HTTP GET /api/v1/all_personas
2. Router → Validate request, inject dependencies
3. Service → Build SPARQL SELECT query
4. SPARQL Client → Execute query against Virtuoso
5. Parser → Transform SPARQL JSON to Python dicts
6. Router → Serialize to Pydantic models
7. Client ← JSON response
```

### Write Operation (POST Request)

```
1. Client → HTTP POST /api/v1/post_persona + JSON body
2. Router → Validate Persona model
3. Service → Build SPARQL INSERT query
4. SPARQL Client → Execute UPDATE against Virtuoso
5. Router → Return success/error response
6. Client ← JSON response
```

## Key Design Decisions

### 1. Asynchronous Architecture

**Why**: Non-blocking I/O for better performance and scalability

**Implementation**:
- `async/await` throughout the application
- `httpx.AsyncClient` for SPARQL queries
- FastAPI's native async support

### 2. Dependency Injection

**Why**: Testability, loose coupling, easier mocking

**Implementation**:
- FastAPI's `Depends()` for injecting SPARQL client
- Singleton pattern for client instance
- Easy to mock for testing

### 3. Pydantic Models

**Why**: Type safety, automatic validation, OpenAPI schema generation

**Implementation**:
- Domain models for entities
- Response models for API contracts
- Settings model for configuration

### 4. Modular Query Organization

**Why**: Maintainability, reusability, separation of concerns

**Implementation**:
- Queries organized by domain (persons, institutions, etc.)
- Shared utilities in `utils.py`
- Constants in `base.py`

### 5. Environment-Based Configuration

**Why**: Security, flexibility across environments

**Implementation**:
- `.env` file for local development
- Environment variables for production
- Pydantic Settings for validation

## Security Considerations

### Authentication Flow

```
1. Client → Request with JWT token in Authorization header
2. Middleware → Extract and validate token
3. Dependencies → Decode JWT using DJANGO_SECRET_KEY
4. Router → Access user info from decoded token
5. Service → Execute authorized operation
```

### Security Features

- JWT-based authentication
- CORS middleware for cross-origin requests
- Environment variable for secrets (not in code)
- Input validation with Pydantic
- SPARQL injection prevention (parameterized queries)

## Performance Optimizations

### Current

- Asynchronous I/O for concurrent requests
- Connection pooling in httpx client
- Efficient SPARQL query construction

### Planned

- Redis caching layer for frequent queries
- Query result pagination
- GraphQL endpoint for flexible querying
- Database query optimization

## Scalability

### Horizontal Scaling

The application is **stateless** and can be scaled horizontally:

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  API 1  │     │  API 2  │     │  API 3  │
└────┬────┘     └────┬────┘     └────┬────┘
     │               │               │
     └───────────────┼───────────────┘
                     │
              ┌──────▼──────┐
              │ Load Balancer│
              └──────┬──────┘
                     │
              ┌──────▼──────┐
              │  Virtuoso   │
              └─────────────┘
```

### Deployment Options

1. **Docker Containers**: Multiple containers behind a load balancer
2. **Kubernetes**: Pod autoscaling based on CPU/memory
3. **Serverless**: AWS Lambda / Google Cloud Functions (with cold start considerations)

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Web Framework | FastAPI | High-performance async API |
| HTTP Client | httpx | Async SPARQL queries |
| Validation | Pydantic v2 | Type safety and validation |
| Authentication | python-jose | JWT handling |
| Triplestore | Virtuoso | RDF/SPARQL database |
| Ontology | OntoExhibit | Cultural heritage schema |
| Container | Docker | Deployment |
| Server | Uvicorn | ASGI server |

## Future Enhancements

### Short Term
- [ ] Comprehensive test suite (pytest + httpx)
- [ ] API rate limiting
- [ ] Request/response logging
- [ ] Health check endpoints

### Medium Term
- [ ] GraphQL endpoint
- [ ] Redis caching layer
- [ ] Elasticsearch for full-text search
- [ ] WebSocket support for real-time updates

### Long Term
- [ ] Microservices architecture
- [ ] Event-driven architecture with message queues
- [ ] Machine learning for recommendations
- [ ] Multi-tenancy support

## Monitoring and Observability

### Recommended Tools

- **Logging**: Structured logging with `structlog`
- **Metrics**: Prometheus + Grafana
- **Tracing**: OpenTelemetry
- **Error Tracking**: Sentry
- **APM**: New Relic or DataDog

## Development Workflow

```
1. Feature Branch → Local Development
2. Unit Tests → pytest
3. Code Review → Pull Request
4. CI/CD → GitHub Actions
5. Staging Deploy → Docker Compose
6. Integration Tests → Automated
7. Production Deploy → Kubernetes/Docker Swarm
```

---

**Last Updated**: 2025-11-26
**Version**: 1.0.0
