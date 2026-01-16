from fastapi import APIRouter
from app.api.v1.endpoints import books, users, preferences, system

api_router = APIRouter()

# Mount routers with compatible paths
api_router.include_router(books.router, prefix="/books", tags=["books"])
api_router.include_router(
    users.router, tags=["users"]
)  # /me, /admin are in users router
api_router.include_router(
    preferences.router, prefix="/preferences", tags=["preferences"]
)
api_router.include_router(system.router, tags=["system"])  # /proxy/image
