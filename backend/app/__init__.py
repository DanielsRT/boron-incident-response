from fastapi import FastAPI

from celery import current_app as current_celery_app

from app.core.config import settings

def create_celery():
    celery_app = current_celery_app
    celery_app.config_from_object(settings, namespace='CELERY') # type: ignore

    return celery_app

def create_app() -> FastAPI:
    app = FastAPI()

    app.celery_app = create_celery() # type: ignore

    from features.log import log_router
    app.include_router(log_router)

    @app.get('/')
    async def root():
        return {"message" : "Hello, World!"}
    
    return app

from . import core, ingestion