import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch

from main import app
from app.alerts.models import AlertStatus, AlertSeverity


class TestAlertsAPI:
    """Test Alert API endpoints."""

    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)

    @pytest.fixture
    def mock_alert_service(self):
        """Mock alert service for testing."""
        with patch('app.alerts.routes.alert_service') as mock_service:
            yield mock_service

    def test_get_alerts_success(self, client, mock_alert_service, sample_alert_dict):
        """Test successful alerts retrieval."""
        mock_alert_service.get_alerts.return_value = [sample_alert_dict]
        
        response = client.get("/alerts/")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == "test-alert-1"

    def test_get_alerts_with_filters(self, client, mock_alert_service):
        """Test alerts retrieval with filters."""
        mock_alert_service.get_alerts.return_value = []
        
        response = client.get("/alerts/?status=open&severity=high&limit=50")
        
        assert response.status_code == 200
        mock_alert_service.get_alerts.assert_called_once_with(
            status=AlertStatus.OPEN,
            severity=AlertSeverity.HIGH,
            limit=50
        )

    def test_get_alerts_service_error(self, client, mock_alert_service):
        """Test alerts retrieval with service error."""
        mock_alert_service.get_alerts.side_effect = Exception("Service error")
        
        response = client.get("/alerts/")
        
        assert response.status_code == 500
        assert "Error fetching alerts" in response.json()["detail"]

    def test_get_alert_stats_success(self, client, mock_alert_service):
        """Test successful alert stats retrieval."""
        mock_stats = {
            "total_alerts": 10,
            "by_severity": {"critical": 2, "high": 3, "medium": 3, "low": 2},
            "by_status": {"open": 5, "investigating": 2, "resolved": 2, "false_positive": 1},
            "recent_activity": []
        }
        mock_alert_service.get_alert_stats.return_value = mock_stats
        
        response = client.get("/alerts/stats")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_alerts"] == 10
        assert "by_severity" in data
        assert "by_status" in data

    def test_get_alert_stats_service_error(self, client, mock_alert_service):
        """Test alert stats retrieval with service error."""
        mock_alert_service.get_alert_stats.side_effect = Exception("Stats error")
        
        response = client.get("/alerts/stats")
        
        assert response.status_code == 500
        assert "Error fetching alert stats" in response.json()["detail"]

    def test_generate_alerts_success(self, client, mock_alert_service, sample_alert):
        """Test successful alert generation."""
        mock_alert_service.generate_alerts.return_value = [sample_alert]
        
        response = client.post("/alerts/generate")
        
        assert response.status_code == 200
        data = response.json()
        assert data["alert_count"] == 1
        assert "Generated 1 alerts" in data["message"]

    def test_generate_alerts_service_error(self, client, mock_alert_service):
        """Test alert generation with service error."""
        mock_alert_service.generate_alerts.side_effect = Exception("Generation error")
        
        response = client.post("/alerts/generate")
        
        assert response.status_code == 500
        assert "Error generating alerts" in response.json()["detail"]

    def test_get_recent_events_success(self, client, mock_alert_service, sample_events):
        """Test successful recent events retrieval."""
        mock_alert_service.get_recent_events.return_value = sample_events
        
        response = client.get("/alerts/events?hours=12")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == len(sample_events)
        mock_alert_service.get_recent_events.assert_called_once_with(hours=12)

    def test_get_recent_events_default_hours(self, client, mock_alert_service):
        """Test recent events retrieval with default hours."""
        mock_alert_service.get_recent_events.return_value = []
        
        response = client.get("/alerts/events")
        
        assert response.status_code == 200
        mock_alert_service.get_recent_events.assert_called_once_with(hours=24)

    def test_get_recent_events_service_error(self, client, mock_alert_service):
        """Test recent events retrieval with service error."""
        mock_alert_service.get_recent_events.side_effect = Exception("Events error")
        
        response = client.get("/alerts/events")
        
        assert response.status_code == 500
        assert "Error fetching events" in response.json()["detail"]

    def test_update_alert_status_success(self, client, mock_alert_service):
        """Test successful alert status update."""
        mock_alert_service.update_alert_status.return_value = True
        
        response = client.patch(
            "/alerts/test-alert-1/status",
            json={"status": "investigating"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["alert_id"] == "test-alert-1"
        assert data["new_status"] == "investigating"
        mock_alert_service.update_alert_status.assert_called_once_with(
            "test-alert-1", AlertStatus.INVESTIGATING
        )

    def test_update_alert_status_not_found(self, client, mock_alert_service):
        """Test alert status update for non-existent alert."""
        mock_alert_service.update_alert_status.return_value = False
        
        response = client.patch(
            "/alerts/non-existent/status",
            json={"status": "resolved"}
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]

    def test_update_alert_status_invalid_status(self, client, mock_alert_service):
        """Test alert status update with invalid status."""
        response = client.patch(
            "/alerts/test-alert-1/status",
            json={"status": "invalid_status"}
        )
        
        assert response.status_code == 422  # Validation error

    def test_update_alert_status_service_error(self, client, mock_alert_service):
        """Test alert status update with service error."""
        mock_alert_service.update_alert_status.side_effect = Exception("Update error")
        
        response = client.patch(
            "/alerts/test-alert-1/status",
            json={"status": "resolved"}
        )
        
        assert response.status_code == 500
        assert "Error updating alert status" in response.json()["detail"]

    def test_invalid_alert_id_format(self, client, mock_alert_service):
        """Test alert status update with invalid alert ID format."""
        response = client.patch(
            "/alerts//status",  # Empty alert ID
            json={"status": "resolved"}
        )
        
        assert response.status_code == 404

    def test_missing_request_body(self, client, mock_alert_service):
        """Test alert status update with missing request body."""
        response = client.patch("/alerts/test-alert-1/status")
        
        assert response.status_code == 422  # Validation error
