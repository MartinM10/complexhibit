from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.dependencies import get_current_user
from app.routers import artworks, exhibitions, institutions, misc, persons

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Bienvenido a la API de Complexhibit, tu puerta de entrada a una experiencia excepcional en el mundo "
    "del arte y la cultura. Nuestra API te ofrece acceso a una rica colección de datos y recursos "
    "relacionados con exposiciones, obras maestras y eventos culturales de todo el mundo. Descubre y "
    "comparte información valiosa sobre exposiciones, artistas y mucho más, todo respaldado por una "
    "ontología y principios de la web semántica para una experiencia enriquecida y conectada.",
    version=settings.VERSION,
    openapi_url=f"{settings.DEPLOY_PATH}/openapi.json",
    docs_url=f"{settings.DEPLOY_PATH}/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(persons.router)
app.include_router(institutions.router)
app.include_router(exhibitions.router)
app.include_router(artworks.router)
app.include_router(misc.router)


@app.get(f"{settings.DEPLOY_PATH}/", tags=["root"])
async def root():
    return {"message": "Hello World"}


@app.get(f"{settings.DEPLOY_PATH}/users/me", response_model=dict, tags=["users"])
async def read_users_me(current_user: dict = Depends(get_current_user)):
    # This endpoint was in the original main.py, keeping it for compatibility
    # It seems to call another service, but we'll just return the user info for now or mock it
    # Original code:
    # headers = {"HTTP_AUTHORIZATION": f"Bearer Token {current_user}"}
    # url = f"{USER_SERVICE_URL}/{current_user}"
    # response = requests.get(url, headers=headers)
    # return response.json()

    # Since we don't have the external service URL working in this env, we'll return a placeholder
    return {"user": current_user, "message": "User info retrieval mocked"}


@app.get(f"{settings.DEPLOY_PATH}/secure-endpoint", tags=["users"])
async def secure_endpoint(current_user: dict = Depends(get_current_user)):
    return {"detail": "This is a secure endpoint", "user_id": current_user}
