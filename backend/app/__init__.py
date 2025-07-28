from fastapi import FastAPI
from contextlib import asynccontextmanager
from celery import current_app as current_celery_app

from app.core.config import settings
from app.log import log_router
from app.log.service import fetch_all_security_logs, send_azure_logs_to_logstash

def create_celery():
    celery_app = current_celery_app
    celery_app.config_from_object(settings, namespace='CELERY') # type: ignore

    return celery_app

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP ---
    security_logs = fetch_all_security_logs()
    
    send_azure_logs_to_logstash(security_logs)
    yield
    # --- SHUTDOWN (optional) ---
    print("[Shutdown] FastAPI application is shutting down")

def create_app() -> FastAPI:
    app = FastAPI(lifespan=lifespan)

    app.celery_app = create_celery() # type: ignore

    app.include_router(log_router)

    @app.get('/')
    async def root():
        return {"message" : "Hello, World!"}
    
    return app


from . import core, log