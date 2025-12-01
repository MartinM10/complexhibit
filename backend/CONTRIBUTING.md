# Contributing to Complexhibit API

First off, thank you for considering contributing to Complexhibit API! 🎉

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- Python 3.9 or higher
- Git
- A Virtuoso SPARQL endpoint (or access to one)
- Basic knowledge of FastAPI and SPARQL

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone <repository-url>
   cd frontend-next/backend
   ```

## Development Setup

### 1. Create Virtual Environment

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt  # Development dependencies
```

### 3. Configure Environment

```bash
cp .env.template .env
# Edit .env with your local configuration
```

### 4. Run Development Server

```bash
python -m uvicorn app.main:app --reload --port 8000
```

### 5. Verify Installation

Visit http://localhost:8000/api/v1/docs to see the interactive API documentation.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Environment details** (OS, Python version, etc.)
- **Code samples** if applicable

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Use case** - why is this enhancement useful?
- **Possible implementation** (if you have ideas)
- **Examples** from other projects (if applicable)

### Your First Code Contribution

Unsure where to start? Look for issues labeled:
- `good first issue` - Simple issues for beginners
- `help wanted` - Issues where we need help

## Coding Standards

### Python Style Guide

We follow [PEP 8](https://pep8.org/) with some modifications:

- **Line length**: 100 characters (not 79)
- **Quotes**: Use double quotes for strings
- **Imports**: Organized with `isort`
- **Formatting**: Use `black` for code formatting

### Code Formatting

```bash
# Format code with black
black app/

# Sort imports
isort app/

# Check with flake8
flake8 app/
```

### Type Hints

All functions should have type hints:

```python
from typing import List, Optional
from app.models.domain import Persona

async def get_person(person_id: str) -> Optional[Persona]:
    """Get a person by ID."""
    ...
```

### Docstrings

Use Google-style docstrings:

```python
def parse_sparql_response(response: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Parse a SPARQL JSON response into a list of dictionaries.
    
    Args:
        response: The raw SPARQL JSON response
        
    Returns:
        A list of dictionaries with extracted values
        
    Raises:
        ValueError: If the response format is invalid
    """
    ...
```

### Naming Conventions

- **Functions/Variables**: `snake_case`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private methods**: `_leading_underscore`

## Testing Guidelines

### Writing Tests

We use `pytest` for testing. Tests should be placed in the `tests/` directory:

```
tests/
├── test_routers/
│   ├── test_persons.py
│   └── test_institutions.py
├── test_services/
│   └── test_sparql_client.py
└── test_utils/
    └── test_parsers.py
```

### Test Example

```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_get_all_personas():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/all_personas")
    assert response.status_code == 200
    assert "data" in response.json()
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_routers/test_persons.py

# Run with verbose output
pytest -v
```

### Mocking SPARQL Responses

Use `pytest-httpx` to mock SPARQL endpoint responses:

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_sparql_query(httpx_mock):
    httpx_mock.add_response(
        url="http://localhost:8890/sparql",
        json={"results": {"bindings": []}}
    )
    # Your test code here
```

## Pull Request Process

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding tests

### 2. Make Your Changes

- Write clean, readable code
- Follow coding standards
- Add/update tests
- Update documentation if needed

### 3. Commit Your Changes

Use clear, descriptive commit messages:

```bash
git commit -m "feat: add semantic search endpoint"
git commit -m "fix: resolve SPARQL injection vulnerability"
git commit -m "docs: update API documentation"
```

We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance

### 4. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 5. Open a Pull Request

- Go to the original repository on GitHub
- Click "New Pull Request"
- Select your branch
- Fill in the PR template:
  - **Description**: What does this PR do?
  - **Related Issue**: Link to issue (if applicable)
  - **Type of Change**: Feature, bug fix, etc.
  - **Testing**: How was this tested?
  - **Checklist**: Complete all items

### 6. Code Review

- Address review comments
- Make requested changes
- Push updates to your branch (PR will update automatically)

### 7. Merge

Once approved, a maintainer will merge your PR.

## Project Structure

```
ontoexhibit-api/
├── app/
│   ├── core/              # Configuration and exceptions
│   ├── models/            # Pydantic models
│   ├── routers/           # API endpoints
│   ├── services/          # Business logic
│   │   └── queries/       # SPARQL queries
│   ├── utils/             # Helper functions
│   ├── dependencies.py    # FastAPI dependencies
│   └── main.py           # Application entry point
├── tests/                # Test suite
├── .env.template         # Environment template
├── requirements.txt      # Production dependencies
├── requirements-dev.txt  # Development dependencies
└── README.md            # Project documentation
```

### Adding New Endpoints

1. **Create router** in `app/routers/`
2. **Add queries** in `app/services/queries/`
3. **Define models** in `app/models/domain.py`
4. **Include router** in `app/main.py`
5. **Write tests** in `tests/test_routers/`
6. **Update documentation**

### Adding New SPARQL Queries

1. Add query to appropriate file in `app/services/queries/`
2. Follow existing patterns (use PREFIXES, parameterize)
3. Add docstring explaining the query
4. Write tests with mocked responses

## Development Tools

### Recommended VS Code Extensions

- Python
- Pylance
- Python Docstring Generator
- REST Client (for testing HTTP endpoints)
- Docker

### Pre-commit Hooks

Install pre-commit hooks to automatically check code:

```bash
pip install pre-commit
pre-commit install
```

This will run `black`, `isort`, and `flake8` before each commit.

## Questions?

- Open an issue with the `question` label
- Contact the maintainers
- Check existing documentation

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing! 🙏
