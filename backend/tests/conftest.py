import pytest
import asyncio
from unittest.mock import Mock, MagicMock, patch
from datetime import datetime, timezone
from typing import List, Dict, Any

# Import test configuration to set up environment and mocks
import tests.test_config

from app.alerts.models import Alert, AlertSeverity, AlertStatus


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
def mock_alert_service_elasticsearch():
    """Automatically mock Elasticsearch in AlertService for all tests."""
    with patch('app.alerts.service.Elasticsearch') as mock_es_class:
        mock_es = Mock()
        mock_es.ping.return_value = False  # Simulate no connection to avoid real ES calls
        mock_es.search.return_value = {"hits": {"hits": [], "total": {"value": 0}}}
        mock_es.index.return_value = {"_id": "test-id", "result": "created"}
        mock_es.update.return_value = {"_id": "test-id", "result": "updated"}
        mock_es_class.return_value = mock_es
        yield mock_es


@pytest.fixture
def mock_elasticsearch():
    """Mock Elasticsearch client for testing."""
    mock_es = Mock()
    mock_es.ping.return_value = True
    mock_es.indices.exists.return_value = True
    mock_es.indices.create.return_value = {"acknowledged": True}
    mock_es.search.return_value = {
        "hits": {
            "hits": [],
            "total": {"value": 0}
        }
    }
    mock_es.index.return_value = {"_id": "test-id", "result": "created"}
    mock_es.update.return_value = {"_id": "test-id", "result": "updated"}
    mock_es.exists.return_value = True
    return mock_es


@pytest.fixture
def sample_events() -> List[Dict[str, Any]]:
    """Sample security events for testing."""
    return [
        {
            "_id": "event-1",
            "_source": {
                "@timestamp": "2025-09-03T10:00:00Z",
                "event": {
                    "category": "authentication",
                    "outcome": "failure"
                },
                "user": {
                    "name": "test@example.com"
                },
                "source": {
                    "ip": "192.168.1.100"
                },
                "message": "Authentication failed for user test@example.com"
            }
        },
        {
            "_id": "event-2",
            "_source": {
                "@timestamp": "2025-09-03T10:05:00Z",
                "event": {
                    "category": "authentication",
                    "outcome": "failure"
                },
                "user": {
                    "name": "test@example.com"
                },
                "source": {
                    "ip": "192.168.1.100"
                },
                "message": "Authentication failed for user test@example.com"
            }
        }
    ]


@pytest.fixture
def sample_alert() -> Alert:
    """Sample alert for testing."""
    return Alert(
        id="test-alert-1",
        title="Multiple Failed Logins",
        description="Multiple failed login attempts detected",
        severity=AlertSeverity.HIGH,
        status=AlertStatus.OPEN,
        source="authentication",
        timestamp=datetime.now(timezone.utc),
        event_count=5,
        affected_users=["test@example.com"],
        source_ips=["192.168.1.100"],
        event_ids=["event-1", "event-2"],
        raw_events=[]
    )


@pytest.fixture
def sample_alert_dict() -> Dict[str, Any]:
    """Sample alert dictionary for testing."""
    return {
        "id": "test-alert-1",
        "title": "Multiple Failed Logins",
        "description": "Multiple failed login attempts detected",
        "severity": "high",
        "status": "open",
        "source": "authentication",
        "timestamp": "2025-09-03T10:00:00Z",
        "event_count": 5,
        "affected_users": ["test@example.com"],
        "source_ips": ["192.168.1.100"],
        "event_ids": ["event-1", "event-2"],
        "raw_events": []
    }
