import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timezone

from app.alerts.service import AlertService
from app.alerts.models import AlertStatus, AlertSeverity


class TestAlertService:
    """Test AlertService functionality."""

    @pytest.fixture
    def alert_service(self, mock_elasticsearch):
        """Create AlertService instance with mocked Elasticsearch."""
        with patch('app.alerts.service.Elasticsearch') as mock_es_class:
            mock_es_class.return_value = mock_elasticsearch
            service = AlertService()
            return service

    def test_service_initialization_success(self, mock_elasticsearch):
        """Test successful service initialization."""
        with patch('app.alerts.service.Elasticsearch') as mock_es_class:
            mock_es_class.return_value = mock_elasticsearch
            service = AlertService()
            
            assert service.es is not None
            mock_elasticsearch.ping.assert_called_once()

    def test_service_initialization_failure(self):
        """Test service initialization with Elasticsearch failure."""
        with patch('app.alerts.service.Elasticsearch') as mock_es_class:
            mock_es = Mock()
            mock_es.ping.return_value = False
            mock_es_class.return_value = mock_es
            
            service = AlertService()
            
            assert service.es is None

    def test_ensure_alerts_index_creates_index(self, alert_service, mock_elasticsearch):
        """Test alerts index creation."""
        mock_elasticsearch.indices.exists.return_value = False
        
        alert_service._ensure_alerts_index()
        
        mock_elasticsearch.indices.exists.assert_called_with(index="security-alerts")
        mock_elasticsearch.indices.create.assert_called_once()

    def test_ensure_alerts_index_exists(self, alert_service, mock_elasticsearch):
        """Test when alerts index already exists."""
        mock_elasticsearch.indices.exists.return_value = True
        
        alert_service._ensure_alerts_index()
        
        mock_elasticsearch.indices.exists.assert_called_with(index="security-alerts")
        mock_elasticsearch.indices.create.assert_not_called()

    def test_get_recent_events_success(self, alert_service, mock_elasticsearch, sample_events):
        """Test successful retrieval of recent events."""
        mock_elasticsearch.search.return_value = {
            "hits": {
                "hits": sample_events,
                "total": {"value": len(sample_events)}
            }
        }
        
        events = alert_service.get_recent_events(hours=24)
        
        assert len(events) == len(sample_events)
        mock_elasticsearch.search.assert_called_once()

    def test_get_recent_events_no_elasticsearch(self):
        """Test get_recent_events when Elasticsearch is unavailable."""
        with patch('app.alerts.service.Elasticsearch') as mock_es_class:
            mock_es_class.side_effect = Exception("Connection failed")
            service = AlertService()
            
            events = service.get_recent_events()
            
            assert events == []

    def test_store_alert_success(self, alert_service, mock_elasticsearch, sample_alert):
        """Test successful alert storage."""
        mock_elasticsearch.index.return_value = {"_id": "test-alert-1", "result": "created"}
        
        result = alert_service.store_alert(sample_alert)
        
        assert result is True
        mock_elasticsearch.index.assert_called_once()

    def test_store_alert_failure(self, alert_service, mock_elasticsearch, sample_alert):
        """Test alert storage failure."""
        mock_elasticsearch.index.side_effect = Exception("Storage failed")
        
        result = alert_service.store_alert(sample_alert)
        
        assert result is False

    def test_store_alert_no_elasticsearch(self, sample_alert):
        """Test alert storage when Elasticsearch is unavailable."""
        with patch('app.alerts.service.Elasticsearch') as mock_es_class:
            mock_es_class.side_effect = Exception("Connection failed")
            service = AlertService()
            
            result = service.store_alert(sample_alert)
            
            assert result is False

    def test_update_alert_status_success(self, alert_service, mock_elasticsearch):
        """Test successful alert status update."""
        mock_elasticsearch.exists.return_value = True
        mock_elasticsearch.update.return_value = {"_id": "test-alert-1", "result": "updated"}
        
        result = alert_service.update_alert_status("test-alert-1", AlertStatus.INVESTIGATING)
        
        assert result is True
        mock_elasticsearch.update.assert_called_once()

    def test_update_alert_status_not_found(self, alert_service, mock_elasticsearch):
        """Test alert status update for non-existent alert."""
        mock_elasticsearch.exists.return_value = False
        
        result = alert_service.update_alert_status("non-existent", AlertStatus.RESOLVED)
        
        assert result is False
        mock_elasticsearch.update.assert_not_called()

    def test_update_alert_status_failure(self, alert_service, mock_elasticsearch):
        """Test alert status update failure."""
        mock_elasticsearch.exists.return_value = True
        mock_elasticsearch.update.side_effect = Exception("Update failed")
        
        result = alert_service.update_alert_status("test-alert-1", AlertStatus.RESOLVED)
        
        assert result is False

    def test_get_stored_alerts_success(self, alert_service, mock_elasticsearch, sample_alert_dict):
        """Test successful retrieval of stored alerts."""
        mock_elasticsearch.search.return_value = {
            "hits": {
                "hits": [{"_source": sample_alert_dict}],
                "total": {"value": 1}
            }
        }
        
        alerts = alert_service.get_stored_alerts()
        
        assert len(alerts) == 1
        assert alerts[0]["id"] == "test-alert-1"

    def test_get_stored_alerts_with_filters(self, alert_service, mock_elasticsearch):
        """Test stored alerts retrieval with filters."""
        mock_elasticsearch.search.return_value = {
            "hits": {
                "hits": [],
                "total": {"value": 0}
            }
        }
        
        alerts = alert_service.get_stored_alerts(
            status=AlertStatus.OPEN,
            severity=AlertSeverity.HIGH,
            limit=50
        )
        
        mock_elasticsearch.search.assert_called_once()
        call_args = mock_elasticsearch.search.call_args
        query = call_args[1]["body"]["query"]
        
        # Check that filters were applied
        assert "bool" in query
        assert len(query["bool"]["must"]) == 2

    def test_get_stored_alerts_fallback(self, alert_service, mock_elasticsearch):
        """Test fallback to generated alerts when storage fails."""
        mock_elasticsearch.search.side_effect = Exception("Search failed")
        
        with patch.object(alert_service, 'get_alerts') as mock_get_alerts:
            mock_get_alerts.return_value = []
            
            alerts = alert_service.get_stored_alerts()
            
            mock_get_alerts.assert_called_once()

    @patch('app.alerts.service.ALERT_RULES')
    def test_generate_alerts_success(self, mock_rules, alert_service, sample_events, sample_alert):
        """Test successful alert generation."""
        # Mock alert rule
        mock_rule = Mock()
        mock_rule.name = "Test Rule"
        mock_rule.check.return_value = [sample_alert]
        mock_rules.__iter__.return_value = [mock_rule]
        
        with patch.object(alert_service, 'get_recent_events') as mock_get_events:
            mock_get_events.return_value = sample_events
            
            alerts = alert_service.generate_alerts()
            
            assert len(alerts) == 1
            assert alerts[0] == sample_alert

    @patch('app.alerts.service.ALERT_RULES')
    def test_generate_alerts_rule_exception(self, mock_rules, alert_service, sample_events):
        """Test alert generation with rule exception."""
        # Mock alert rule that raises exception
        mock_rule = Mock()
        mock_rule.name = "Failing Rule"
        mock_rule.check.side_effect = Exception("Rule failed")
        mock_rules.__iter__.return_value = [mock_rule]
        
        with patch.object(alert_service, 'get_recent_events') as mock_get_events:
            mock_get_events.return_value = sample_events
            
            alerts = alert_service.generate_alerts()
            
            # Should continue processing despite rule failure
            assert alerts == []

    def test_get_alert_stats(self, alert_service, sample_alert):
        """Test alert statistics generation."""
        with patch.object(alert_service, 'generate_alerts') as mock_generate:
            mock_generate.return_value = [sample_alert]
            
            stats = alert_service.get_alert_stats()
            
            assert stats["total_alerts"] == 1
            assert stats["by_severity"]["high"] == 1
            assert stats["by_status"]["open"] == 1
            assert "recent_activity" in stats

    def test_get_recent_activity_stats(self, alert_service, sample_alert):
        """Test recent activity statistics generation."""
        with patch.object(alert_service, 'generate_alerts') as mock_generate:
            mock_generate.return_value = [sample_alert]
            
            stats = alert_service._get_recent_activity_stats([sample_alert])
            
            assert isinstance(stats, list)
            assert len(stats) == 24  # 24 hours
            assert all("time" in stat for stat in stats)
            assert all("total" in stat for stat in stats)

    def test_get_all_events_success(self, alert_service, mock_elasticsearch):
        """Test successful retrieval of all events."""
        mock_elasticsearch.search.return_value = {
            "hits": {
                "hits": [
                    {"_source": {"@timestamp": "2025-09-03T10:00:00Z", "event": "test1"}},
                    {"_source": {"@timestamp": "2025-09-03T09:00:00Z", "event": "test2"}}
                ]
            }
        }
        
        events = alert_service.get_all_events(limit=5000)
        
        assert len(events) == 2
        assert events[0]["event"] == "test1"
        assert events[1]["event"] == "test2"
        
        # Verify correct query was made
        expected_query = {
            "query": {"match_all": {}},
            "sort": [{"@timestamp": {"order": "desc"}}],
            "size": 5000
        }
        mock_elasticsearch.search.assert_called_with(
            index="security-events-*",
            body=expected_query
        )

    def test_get_all_events_no_elasticsearch(self):
        """Test get_all_events when Elasticsearch is not available."""
        service = AlertService()
        service.es = None
        
        events = service.get_all_events()
        
        assert events == []

    def test_get_all_events_exception(self, alert_service, mock_elasticsearch):
        """Test get_all_events with Elasticsearch exception."""
        mock_elasticsearch.search.side_effect = Exception("Search failed")
        
        events = alert_service.get_all_events()
        
        assert events == []

    def test_generate_alerts_with_fallback_to_all_events(self, alert_service):
        """Test generate_alerts falling back to all events when recent events are empty."""
        with patch.object(alert_service, 'get_recent_events') as mock_recent, \
             patch.object(alert_service, 'get_all_events') as mock_all, \
             patch('app.alerts.service.ALERT_RULES') as mock_rules:
            
            # Setup: recent events return empty, all events return data
            mock_recent.return_value = []
            mock_all.return_value = [{"event": "test"}]
            
            # Mock rule
            mock_rule = Mock()
            mock_rule.name = "Test Rule"
            mock_rule.check.return_value = []
            mock_rules.__iter__.return_value = [mock_rule]
            
            alerts = alert_service.generate_alerts()
            
            mock_recent.assert_called_once()
            mock_all.assert_called_once()
            mock_rule.check.assert_called_once_with([{"event": "test"}])

    def test_generate_alerts_rule_exception_handling(self, alert_service):
        """Test generate_alerts when a rule raises an exception."""
        with patch.object(alert_service, 'get_recent_events') as mock_recent, \
             patch('app.alerts.service.ALERT_RULES') as mock_rules:
            
            mock_recent.return_value = [{"event": "test"}]
            
            # Mock rule that raises exception
            mock_rule = Mock()
            mock_rule.name = "Failing Rule"
            mock_rule.check.side_effect = Exception("Rule failed")
            mock_rules.__iter__.return_value = [mock_rule]
            
            alerts = alert_service.generate_alerts()
            
            # Should return empty list and log error
            assert alerts == []

    def test_get_alerts_with_fallback_generation(self, alert_service):
        """Test get_alerts falling back to real-time generation when no stored alerts."""
        with patch.object(alert_service, 'get_stored_alerts') as mock_stored, \
             patch.object(alert_service, 'generate_alerts') as mock_generate, \
             patch.object(alert_service, 'store_alert') as mock_store:
            
            # Setup: no stored alerts, generate new ones
            mock_stored.return_value = []
            mock_alert = Mock()
            mock_alert.status = AlertStatus.OPEN
            mock_alert.severity = AlertSeverity.HIGH
            mock_alert.timestamp = datetime.now(timezone.utc)
            mock_alert.to_dict.return_value = {"id": "test", "status": "open"}
            mock_generate.return_value = [mock_alert]
            
            result = alert_service.get_alerts()
            
            mock_stored.assert_called_once()
            mock_generate.assert_called_once()
            mock_store.assert_called_once_with(mock_alert)
            assert len(result) == 1

    def test_get_alerts_with_status_filtering(self, alert_service):
        """Test get_alerts with status filtering applied to generated alerts."""
        with patch.object(alert_service, 'get_stored_alerts') as mock_stored, \
             patch.object(alert_service, 'generate_alerts') as mock_generate, \
             patch.object(alert_service, 'store_alert') as mock_store:
            
            mock_stored.return_value = []
            
            # Create alerts with different statuses
            alert1 = Mock()
            alert1.status = AlertStatus.OPEN
            alert1.severity = AlertSeverity.HIGH
            alert1.timestamp = datetime.now(timezone.utc)
            alert1.to_dict.return_value = {"id": "1", "status": "open"}
            
            alert2 = Mock()
            alert2.status = AlertStatus.RESOLVED
            alert2.severity = AlertSeverity.LOW
            alert2.timestamp = datetime.now(timezone.utc)
            alert2.to_dict.return_value = {"id": "2", "status": "resolved"}
            
            mock_generate.return_value = [alert1, alert2]
            
            # Test filtering by status
            result = alert_service.get_alerts(status=AlertStatus.OPEN)
            assert len(result) == 1
            assert result[0]["id"] == "1"

    def test_get_alerts_with_severity_filtering(self, alert_service):
        """Test get_alerts with severity filtering applied to generated alerts."""
        with patch.object(alert_service, 'get_stored_alerts') as mock_stored, \
             patch.object(alert_service, 'generate_alerts') as mock_generate, \
             patch.object(alert_service, 'store_alert') as mock_store:
            
            mock_stored.return_value = []
            
            # Create alerts with different severities
            alert1 = Mock()
            alert1.status = AlertStatus.OPEN
            alert1.severity = AlertSeverity.HIGH
            alert1.timestamp = datetime.now(timezone.utc)
            alert1.to_dict.return_value = {"id": "1", "severity": "high"}
            
            alert2 = Mock()
            alert2.status = AlertStatus.OPEN
            alert2.severity = AlertSeverity.LOW
            alert2.timestamp = datetime.now(timezone.utc)
            alert2.to_dict.return_value = {"id": "2", "severity": "low"}
            
            mock_generate.return_value = [alert1, alert2]
            
            # Test filtering by severity  
            result = alert_service.get_alerts(severity=AlertSeverity.LOW)
            assert len(result) == 1
            assert result[0]["id"] == "2"

    def test_update_alert_status_alert_not_found(self, alert_service, mock_elasticsearch):
        """Test updating status of non-existent alert."""
        mock_elasticsearch.exists.return_value = False
        
        result = alert_service.update_alert_status("nonexistent-id", AlertStatus.RESOLVED)
        
        assert result is False
        mock_elasticsearch.exists.assert_called_once_with(index="security-alerts", id="nonexistent-id")
        mock_elasticsearch.update.assert_not_called()

    def test_update_alert_status_elasticsearch_exception(self, alert_service, mock_elasticsearch):
        """Test update_alert_status with Elasticsearch exception."""
        mock_elasticsearch.exists.side_effect = Exception("Connection failed")
        
        result = alert_service.update_alert_status("test-id", AlertStatus.RESOLVED)
        
        assert result is False

    def test_get_stored_alerts_no_elasticsearch_fallback(self):
        """Test get_stored_alerts falling back when Elasticsearch unavailable."""
        service = AlertService()
        service.es = None
        
        with patch.object(service, 'get_alerts') as mock_get_alerts:
            mock_get_alerts.return_value = [{"id": "fallback"}]
            
            result = service.get_stored_alerts(status=AlertStatus.OPEN)
            
            mock_get_alerts.assert_called_once_with(
                status=AlertStatus.OPEN, 
                severity=None, 
                limit=100
            )
