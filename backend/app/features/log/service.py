import time
import httpx
from azure.identity import ClientSecretCredential
from fastapi import HTTPException

from core.config import settings
from log import log_router
from log.model import QueryRequest


_token_cache = {
    "access_token": None,
    "expires_at": 0
}


def token_expired() -> bool:
    """Returns True if token is missing or expired."""
    return time.time() >= _token_cache["expires_at"]

def get_access_token() -> str:
    """Returns cached token or fetches a new one if expired."""
    if not token_expired():
        return _token_cache["access_token"]

    credential = ClientSecretCredential (
        tenant_id = settings.TENANT_ID,
        client_id = settings.CLIENT_ID,
        client_secret = settings.CLIENT_SECRET
        )
    token = credential.get_token("https://management.azure.com/.default")
    _token_cache["access_token"] = token.token
    _token_cache["expires_at"] = token.expires_on - 60 # buffer

    return _token_cache["access_token"]

@log_router.post("query-logs")
async def query_logs(request: QueryRequest):
    token = get_access_token()
    url = f"https://api.loganalytics.azure.com/v1/workspaces/{settings.WORKSPACE_ID}/query"
    headers = {
        "Authorization" : f"Bearer {token}",
        "Content-Type" : "application/json"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json={"query": request.kql})

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail=response.text)
    
    return format_azure_log_response(response.json())


def format_azure_log_response(response_json):

    return {}