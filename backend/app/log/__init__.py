from fastapi import APIRouter

log_router = APIRouter(
    prefix="/logs"
)

from . import service