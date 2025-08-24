import os
import pathlib
from functools import lru_cache

class BaseConfig:
    BASE_DIR:pathlib.Path = pathlib.Path(__file__).parent.parent

    DATABASE_URL:str = os.environ.get("DATABASE_URL", f"sqlite:///{BASE_DIR}/db.sqlite3")
    DATABASE_CONNECT_DICT: dict = {}

    CELERY_BROKER_URL: str = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

    TENANT_ID: str = os.environ.get("TENANT_ID", "NO_TENANT_ID")
    CLIENT_ID: str = os.environ.get("CLIENT_ID", "NO_CLIENT_ID")
    CLIENT_SECRET: str = os.environ.get("CLIENT_SECRET", "NO_CLIENT_SECRET")
    WORKSPACE_ID: str = os.environ.get("WORKSPACE_ID", "LOCALHOST")

    ELASTIC_PASSWORD: str = os.environ.get("ELASTIC_PASSWORD", "")
    ELASTIC_USERNAME: str = os.environ.get("ELASTIC_USERNAME", "elastic")
    ELASTICSEARCH_HOST: str = os.environ.get("ELASTICSEARCH_HOST", "http://localhost:9200")
    APP_CERT_PATH: str = os.environ.get("APP_CERT_PATH", "")

class DevelopmentConfig(BaseConfig):
    DEBUG = True
    TESTING = True

class ProductionConfig(BaseConfig):
    pass

class TestingConfig(BaseConfig):
    pass

@lru_cache()

def get_settings():
    config_cls_dict = {
        "development": DevelopmentConfig,
        "production": ProductionConfig,
        "testing": TestingConfig
    }
    config_name = os.getenv("FASTAPI_CONFIG", "development")
    config_cls = config_cls_dict[config_name]
    return config_cls()

settings = get_settings()