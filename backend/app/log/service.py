import time
import httpx
import socket
import ssl
import json
import logging
import sys
import redis
from azure.identity import ClientSecretCredential
from typing import Any, List, Dict
from datetime import datetime, timedelta, timezone

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

REDIS_KEY = "azure:last_fetch_time"
QUERY_TEMPLATE = "SecurityEvent | where TimeGenerated > datetime('{}')"

# Connect to Redis (adjust host/port/db as needed)
redis_client = redis.Redis(host="redis", port=6379, decode_responses=True)

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

def get_last_fetch_time() -> datetime:
    value = redis_client.get(REDIS_KEY)
    if value:
        return datetime.fromisoformat(str(value))
    # Default to 1 hour ago if no value
    return datetime.now(timezone.utc) - timedelta(hours=1)

def save_last_fetch_time(timestamp: datetime):
    redis_client.set(REDIS_KEY, timestamp.isoformat())

def fetch_all_security_logs() -> List[Dict[str, Any]]:
    """Fetch all security events from Azure Log Analytics and returns a flat list of dicts"""
    logger.info("Getting access token...")
    try:
        token = get_access_token()
        last_fetch_time = get_last_fetch_time().isoformat()

        url = f"https://api.loganalytics.io/v1/workspaces/{settings.WORKSPACE_ID}/query"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        body = {"query": QUERY_TEMPLATE.format(last_fetch_time)}

    
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
    print("Sending Azure logs to Logstash...")

    # Create SSL context with your CA cert to verify Logstash's server certificate
    context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH, cafile="/app/certs/ca.crt")
    
    # Optional: require certificate verification and hostname checking
    context.check_hostname = True
    context.verify_mode = ssl.CERT_REQUIRED

    # Connect to Logstash over TCP
    with socket.create_connection(("logstash", 5000)) as sock:
        # Wrap socket with SSL; server_hostname must match Logstash cert SAN (e.g. "logstash")
        with context.wrap_socket(sock, server_hostname="logstash") as ssl_sock:
            for entry in logs:
                line = json.dumps(entry, default=str) + "\n"
                ssl_sock.sendall(line.encode("utf-8"))

    print("Finished sending logs.")