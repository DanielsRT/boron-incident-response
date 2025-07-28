import time
import httpx
import socket
import json
import logging
import sys
from azure.identity import ClientSecretCredential
from typing import Any, List, Dict

from app.core.config import settings
from app.log import log_router


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    stream=sys.stdout
)

logger = logging.getLogger(__name__)

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
    token = credential.get_token("https://api.loganalytics.io/.default")
    _token_cache["access_token"] = token.token
    _token_cache["expires_at"] = token.expires_on - 60 # buffer

    return _token_cache["access_token"]

def fetch_all_security_logs() -> List[Dict[str, Any]]:
    """Fetch all security events from Azure Log Analytics and returns a flat list of dicts"""
    logger.info("Getting access token...")
    try:
        token = get_access_token()
        url = f"https://api.loganalytics.io/v1/workspaces/{settings.WORKSPACE_ID}/query"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        body = {"query": "SecurityEvent | where TimeGenerated >= ago(30d) | sort by TimeGenerated desc"}

    
        resp = httpx.post(url, headers=headers, json=body, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        return flatten_response(data)

    except httpx.HTTPError as e:
        logger.error(f"Error fetching Azure logs: {e}")
        raise

    return []

def flatten_response(response_json) -> List[Dict[str, Any]]:
    table = response_json.get("tables", [])

    all_logs = []
    for table in response_json["tables"]:
        columns = [col["name"] for col in table["columns"]]
        for row in table["rows"]:
            entry = dict(zip(columns, row))
            entry["_table"] = table.get("name", "unknown")
            all_logs.append(entry)
            
    return all_logs

def send_azure_logs_to_logstash(logs):
    print("Sending Azure logs to logstash...")
    with socket.create_connection(("logstash", 5000)) as sock:
        for entry in logs:
            line = json.dumps(entry, default=str)+"\n"
            sock.sendall(line.encode("utf-8"))