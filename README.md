# Complexhibit / OntoExhibit

This is the monorepo for the Complexhibit project, consisting of a FastAPI backend and a Next.js frontend.

## Project Structure

- **`backend/`**: Contains the FastAPI application, ontology files, and data processing scripts.
- **`frontend/`**: Contains the Next.js web application.
- **`docker-compose.yml`**: Orchestrates the services (Backend, Frontend, Virtuoso).

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed.

### Configuration (.env)

The project uses environment variables for configuration.

1.  **Root `.env`**: This file is used by `docker-compose` to configure the services.
    - Copy `.env.template` to `.env` in the root directory (if not already present).
    - Key variables:
        - `URI_ONTOLOGIA`: Base URI for the ontology.
        - `DJANGO_SECRET_KEY`: Secret key for the backend (legacy name, used for FastAPI security).
        - `VIRTUOSO_DBA_PASSWORD`: Password for the Virtuoso database.
        - `NEXT_PUBLIC_API_URL`: URL for the backend API (client-side).
        - `API_URL`: URL for the backend API (server-side/Docker internal).

2.  **Backend `.env`**: Located in `backend/.env`.
    - This file is **only** used for local development (running backend without Docker). When running with Docker, all configuration comes from `docker-compose.yml` and the root `.env`.

### Running the Application

You can use the provided initialization scripts for a quick setup (checks Docker, creates .env, starts services, loads data):

**Windows:**
```powershell
.\init.ps1
```

**Linux/Mac:**
```bash
chmod +x init.sh
./init.sh
```

Or manually with Docker Compose:

```bash
docker-compose up -d --build
```

### Accessing the Services

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000/api/v1/](http://localhost:8000/api/v1/)
- **Virtuoso SPARQL Endpoint**: [http://localhost:8890/sparql](http://localhost:8890/sparql)
- **Virtuoso Conductor**: [http://localhost:8890/conductor](http://localhost:8890/conductor)

## Development

### Backend
See [backend/README.md](backend/README.md) for detailed backend development instructions.

### Frontend
See [frontend/README.md](frontend/README.md) for detailed frontend development instructions.

## License

**Software (Backend & Frontend)**: Proprietary - © 2025 iArtHis Lab. All Rights Reserved.

**Ontology (OntoExhibit/EDAAnOWL)**: Creative Commons (see ontology files for specific license).

This platform is proprietary software developed by iArtHis Lab. For licensing inquiries, please contact the lab.
