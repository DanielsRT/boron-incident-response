from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.log import log_router
from app.celery_utils import create_celery
from app.log.service import fetch_all_security_logs, send_azure_logs_to_logstash



@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP ---
    security_logs = fetch_all_security_logs()
    
    send_azure_logs_to_logstash(security_logs)
    yield
    # --- SHUTDOWN (optional) ---
    print("[Shutdown] FastAPI application is shutting down")

celery_app = create_celery()

def create_app() -> FastAPI:
    app = FastAPI(lifespan=lifespan)

    app.celery_app = celery_app # type: ignore

    app.include_router(log_router)

    @app.get('/')
    async def root():
        return {"message" : "Hello, World!"}
    
    return app


from . import core, log