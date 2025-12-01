# Project Structure

```
backend/
│
├── 📁 .github/
│   └── workflows/
│       └── ci-cd.yml                 # GitHub Actions CI/CD pipeline
│
├── 📁 app/                           # Main application directory
│   ├── 📁 core/                      # Core configuration
│   │   ├── __init__.py
│   │   ├── config.py                 # Pydantic settings
│   │   └── exceptions.py             # Custom exceptions
│   │
│   ├── 📁 models/                    # Data models
│   │   ├── __init__.py
│   │   ├── domain.py                 # Domain entities (Persona, Exposicion, etc.)
│   │   └── responses.py              # API response models
│   │
│   ├── 📁 routers/                   # API endpoints
│   │   ├── __init__.py
│   │   ├── persons.py                # /all_personas, /post_persona, etc.
│   │   ├── institutions.py           # /all_instituciones, etc.
│   │   ├── exhibitions.py            # /all_exposiciones, etc.
│   │   ├── artworks.py               # /all_obras, etc.
│   │   └── misc.py                   # /semantic_search, /all_classes, etc.
│   │
│   ├── 📁 services/                  # Business logic
│   │   ├── __init__.py
│   │   ├── sparql_client.py          # Async SPARQL client (httpx)
│   │   └── 📁 queries/               # SPARQL query builders
│   │       ├── __init__.py
│   │       ├── base.py               # Common prefixes and constants
│   │       ├── persons.py            # Person queries
│   │       ├── institutions.py       # Institution queries
│   │       ├── exhibitions.py        # Exhibition queries
│   │       ├── artworks.py           # Artwork queries
│   │       ├── misc.py               # Search queries
│   │       └── utils.py              # Query generation helpers
│   │
│   ├── 📁 utils/                     # Helper functions
│   │   ├── __init__.py
│   │   ├── helpers.py                # Date conversion, hashing, etc.
│   │   └── parsers.py                # SPARQL response parsing
│   │
│   ├── __init__.py
│   ├── dependencies.py               # FastAPI dependencies (auth, etc.)
│   └── main.py                       # Application entry point
│
├── 📄 .env.template                  # Environment variables template
├── 📄 .env                           # Local environment (gitignored)
├── 📄 .gitignore                     # Git ignore rules
├── 📄 .gitattributes                 # Git attributes (line endings)
├── 📄 .pre-commit-config.yaml        # Pre-commit hooks
│
├── 📄 ARCHITECTURE.md                # System architecture documentation
├── 📄 CHANGELOG.md                   # Version history and changes
├── 📄 CONTRIBUTING.md                # Contribution guidelines
├── 📄 DEPLOYMENT.md                  # Deployment instructions
├── 📄 LICENSE.md                     # MIT License
├── 📄 README.md                      # Project overview
├── 📄 ROUTES.md                      # API routes reference
├── 📄 SECURITY.md                    # Security policy
│
├── 📄 Dockerfile                     # Docker image definition
├── 📄 docker-compose.yml             # Docker Compose configuration
├── 📄 pyproject.toml                 # Python project configuration
├── 📄 requirements.txt               # Production dependencies
├── 📄 requirements-dev.txt           # Development dependencies
└── 📄 test_main.http                 # HTTP test requests
```

## File Descriptions

### Application Code (`app/`)

| File/Directory | Purpose |
|----------------|---------|
| `core/config.py` | Environment-based configuration using Pydantic Settings |
| `core/exceptions.py` | Custom exception classes (SparqlError, ResourceNotFoundError) |
| `models/domain.py` | Pydantic models for entities (Persona, Exposicion, ObraDeArte, etc.) |
| `models/responses.py` | Standardized API response models |
| `routers/*.py` | FastAPI routers for different resource types |
| `services/sparql_client.py` | Asynchronous SPARQL client using httpx |
| `services/queries/*.py` | SPARQL query builders organized by domain |
| `utils/helpers.py` | Helper functions (hashing, date conversion, normalization) |
| `utils/parsers.py` | SPARQL response parsing utilities |
| `dependencies.py` | FastAPI dependency injection (authentication, client) |
| `main.py` | FastAPI application instance and router registration |

### Documentation

| File | Purpose |
|------|---------|
| `README.md` | Project overview, quick start, features |
| `ARCHITECTURE.md` | System design, architecture diagrams, design decisions |
| `CONTRIBUTING.md` | Development setup, coding standards, PR process |
| `DEPLOYMENT.md` | Deployment guides for various platforms |
| `ROUTES.md` | Complete API endpoint reference |
| `CHANGELOG.md` | Version history and migration guides |
| `SECURITY.md` | Security policy and vulnerability reporting |
| `LICENSE.md` | MIT License |

### Configuration

| File | Purpose |
|------|---------|
| `.env.template` | Template for environment variables |
| `.gitignore` | Files to ignore in version control |
| `.gitattributes` | Git attributes (line endings, etc.) |
| `.pre-commit-config.yaml` | Pre-commit hooks for code quality |
| `pyproject.toml` | Python project metadata and tool configuration |
| `requirements.txt` | Production Python dependencies |
| `requirements-dev.txt` | Development dependencies (testing, linting) |

### Docker

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage Docker image definition |
| `docker-compose.yml` | Full stack deployment (API + Virtuoso) |

### Testing

| File | Purpose |
|------|---------|
| `test_main.http` | HTTP request examples for manual testing |

### CI/CD

| File | Purpose |
|------|---------|
| `.github/workflows/ci-cd.yml` | GitHub Actions pipeline (test, lint, build, deploy) |

## Key Directories

### `app/routers/` - API Endpoints

Each router file handles a specific resource type:
- **persons.py**: Person/artist management
- **institutions.py**: Museum, gallery, institution management
- **exhibitions.py**: Exhibition event management
- **artworks.py**: Artwork management
- **misc.py**: Search, utility endpoints

### `app/services/queries/` - SPARQL Queries

Organized by domain for maintainability:
- **base.py**: Common SPARQL prefixes and constants
- **persons.py**: Person-related queries (SELECT, INSERT)
- **institutions.py**: Institution queries
- **exhibitions.py**: Exhibition queries
- **artworks.py**: Artwork queries
- **misc.py**: Search and utility queries
- **utils.py**: Query generation helpers

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | FastAPI 0.122.0 |
| **Server** | Uvicorn (ASGI) |
| **HTTP Client** | httpx (async) |
| **Validation** | Pydantic v2 |
| **Authentication** | python-jose (JWT) |
| **Database** | Virtuoso (SPARQL) |
| **Ontology** | OntoExhibit + CIDOC-CRM |
| **Container** | Docker |
| **CI/CD** | GitHub Actions |

## Development Workflow

```
1. Clone repository
2. Create virtual environment
3. Install dependencies (requirements.txt + requirements-dev.txt)
4. Configure .env file
5. Run development server (uvicorn --reload)
6. Make changes
7. Run tests (pytest)
8. Format code (black, isort)
9. Commit (pre-commit hooks run automatically)
10. Push and create PR
```

## Deployment Options

- **Local**: `uvicorn app.main:app --reload`
- **Docker**: `docker build` + `docker run`
- **Docker Compose**: `docker-compose up`
- **Cloud**: AWS ECS, Google Cloud Run, Heroku, DigitalOcean

## Next Steps

1. Read [README.md](README.md) for project overview
2. Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design
3. Follow [CONTRIBUTING.md](CONTRIBUTING.md) for development
4. Use [DEPLOYMENT.md](DEPLOYMENT.md) for deployment
5. Reference [ROUTES.md](ROUTES.md) for API endpoints

---

**Last Updated**: 2025-11-26
**Version**: 1.0.0
