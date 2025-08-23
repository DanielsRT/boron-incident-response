from fastapi import APIRouter

alerts_router = APIRouter(prefix="/alerts", tags=["alerts"])

from . import routes
