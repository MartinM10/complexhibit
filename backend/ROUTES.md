# API Routes Reference

**Base URL:** `http://localhost:8000/api/v1`

## 📚 Documentation
- **Interactive Docs (Swagger):** http://localhost:8000/api/v1/docs
- **ReDoc:** http://localhost:8000/api/v1/redoc
- **OpenAPI JSON:** http://localhost:8000/api/v1/openapi.json

## 🏠 General
- `GET /api/v1/` - Root endpoint (Hello World)

## 👥 Personas (Persons)
- `GET /api/v1/all_personas` - Get all persons
- `GET /api/v1/count_actants` - Count all actants
- `GET /api/v1/get_persona/{id}` - Get person by ID
- `POST /api/v1/post_persona` - Create new person

## 🏛️ Instituciones (Institutions)
- `GET /api/v1/all_instituciones` - Get all institutions
- `GET /api/v1/count_instituciones` - Count all institutions
- `GET /api/v1/get_institucion/{id}` - Get institution by ID
- `POST /api/v1/post_institucion` - Create new institution

## 🎨 Exposiciones (Exhibitions)
- `GET /api/v1/all_exposiciones` - Get all exhibitions
- `GET /api/v1/count_exposiciones` - Count all exhibitions
- `POST /api/v1/post_exposicion` - Create new exhibition

## 🖼️ Obras (Artworks)
- `GET /api/v1/all_obras` - Get all artworks
- `GET /api/v1/count_obras` - Count all artworks
- `POST /api/v1/post_obra` - Create new artwork

## 🔍 Miscellaneous
- `GET /api/v1/semantic_search?q={query}` - Semantic search
- `GET /api/v1/all_classes` - Get all ontology classes
- `GET /api/v1/get_object_any_type/{type}/{id}` - Get any object by type and ID

## 🔐 Users (Authentication)
- `GET /api/v1/users/me` - Get current user info (requires auth)
- `GET /api/v1/secure-endpoint` - Secure endpoint example (requires auth)

## 📝 Examples

### Test basic endpoint:
```bash
curl http://localhost:8000/api/v1/
```

### Count exhibitions:
```bash
curl http://localhost:8000/api/v1/count_exposiciones
```

### Get all persons:
```bash
curl http://localhost:8000/api/v1/all_personas
```

### Semantic search:
```bash
curl "http://localhost:8000/api/v1/semantic_search?q=picasso"
```

**Note:** All routes require the `/api/v1` prefix as configured in your `.env` file's `DEPLOY_PATH` variable.
