# Contributing to Complexhibit / OntoExhibit

First off, thank you for considering contributing to this project! 🎉

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- **Docker** and **Docker Compose**
- **Node.js** 20+ (for local frontend dev)
- **Python** 3.9+ (for local backend dev)
- **Git**

### Installation

1. **Fork and Clone**
   ```bash
   git clone <your-fork-url>
   cd frontend-next
   ```

2. **Initialize Project**
   
   **Windows:**
   ```powershell
   .\init.ps1
   ```

   **Linux/Mac:**
   ```bash
   chmod +x init.sh
   ./init.sh
   ```

## Project Structure

- **`backend/`**: FastAPI application, SPARQL queries, and ontology logic.
- **`frontend/`**: Next.js 15 application (App Router).
- **`docker-compose.yml`**: Orchestration for Backend, Frontend, and Virtuoso.

## Development Workflow

### Full Stack (Recommended)
Run everything with Docker Compose:
```bash
docker-compose up -d --build
```

### Frontend Only
To work on the frontend with a running backend:
1. Start backend and database: `docker-compose up -d backend virtuoso`
2. Run frontend locally:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Backend Only
To work on the backend logic:
1. Start database: `docker-compose up -d virtuoso`
2. Run backend locally (see `backend/README.md` for details).

## Pull Request Process

1. **Create a Branch**: `git checkout -b feature/amazing-feature`
2. **Commit Changes**: Use clear commit messages (Conventional Commits recommended).
3. **Push**: `git push origin feature/amazing-feature`
4. **Open PR**: Describe your changes and link any related issues.

## Coding Standards

### Frontend
- Use **TypeScript** for all new components.
- Follow **Tailwind CSS** utility patterns.
- Ensure components are responsive.

### Backend
- Follow **PEP 8**.
- Type hint all functions.
- Write tests for new endpoints.

## Questions?

Feel free to open an issue or contact the maintainers.
