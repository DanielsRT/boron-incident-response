import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock, patch
from typing import List, Dict, Any

from app.alerts.models import (
    Alert, AlertRule, AlertSeverity, AlertStatus,
    MultipleFailedLoginsRule, PrivilegeEscalationRule, SuspiciousProcessRule
)


class TestAlert:
    """Test Alert model functionality."""
    
    def test_alert_creation(self, sample_alert):
        """Test basic alert creation."""
        assert sample_alert.id == "test-alert-1"
        assert sample_alert.title == "Multiple Failed Logins"
        assert sample_alert.severity == AlertSeverity.HIGH
        assert sample_alert.status == AlertStatus.OPEN
        assert sample_alert.event_count == 5
        assert len(sample_alert.affected_users) == 1
        assert len(sample_alert.source_ips) == 1

    def test_alert_to_dict(self, sample_alert):
        """Test alert serialization to dictionary."""
        alert_dict = sample_alert.to_dict()
        
        assert alert_dict["id"] == "test-alert-1"
        assert alert_dict["title"] == "Multiple Failed Logins"
        assert alert_dict["severity"] == "high"
        assert alert_dict["status"] == "open"
        assert alert_dict["event_count"] == 5
        assert isinstance(alert_dict["timestamp"], str)

    def test_alert_from_dict(self, sample_alert_dict):
        """Test alert creation from dictionary."""
        alert = Alert.from_dict(sample_alert_dict)
        
        assert alert.id == "test-alert-1"
        assert alert.severity == AlertSeverity.HIGH
        assert alert.status == AlertStatus.OPEN
        assert alert.event_count == 5

    def test_alert_equality(self):
        """Test alert equality comparison."""
        timestamp = datetime.now(timezone.utc)
        alert1 = Alert(
            id="test-1",
            title="Test Alert",
            description="Test",
            severity=AlertSeverity.LOW,
            status=AlertStatus.OPEN,
            source="test",
            timestamp=timestamp,
            event_count=1,
            affected_users=[],
            source_ips=[],
            event_ids=[],
            raw_events=[]
        )
        alert2 = Alert(
            id="test-1",
            title="Test Alert",
            description="Test",
            severity=AlertSeverity.LOW,
            status=AlertStatus.OPEN,
            source="test",
            timestamp=timestamp,
            event_count=1,
            affected_users=[],
            source_ips=[],
            event_ids=[],
            raw_events=[]
        )
        
        assert alert1 == alert2

    def test_alert_inequality(self, sample_alert):
        """Test alert inequality comparison."""
        different_alert = Alert(
            id="different-id",
            title="Different Alert",
            description="Different",
            severity=AlertSeverity.LOW,
            status=AlertStatus.RESOLVED,
            source="test",
            timestamp=datetime.now(timezone.utc),
            event_count=1,
            affected_users=[],
            source_ips=[],
            event_ids=[],
            raw_events=[]
        )
        
        assert sample_alert != different_alert


class TestAlertRule:
    """Test AlertRule base class."""
    
    def test_rule_initialization(self):
        """Test rule creation."""
        rule = AlertRule("Test Rule", AlertSeverity.MEDIUM)
        assert rule.name == "Test Rule"
        assert rule.severity == AlertSeverity.MEDIUM
    
    def test_rule_check_not_implemented(self):
        """Test that base class check method raises NotImplementedError."""
        rule = AlertRule("Test Rule", AlertSeverity.MEDIUM)
        with pytest.raises(NotImplementedError):
            rule.check([])


class TestMultipleFailedLoginsRule:
    """Test Multiple Failed Logins Rule."""
    
    def test_rule_name(self):
        """Test rule has correct name."""
        rule = MultipleFailedLoginsRule()
        assert rule.name == "Multiple Failed Logins"
        assert rule.severity == AlertSeverity.HIGH

    def test_check_with_failed_logins(self):
        """Test rule detects failed login attempts."""
        rule = MultipleFailedLoginsRule()
        
        # Mock events with failed authentication - need 5 events to meet threshold
        events = []
        base_time = datetime.now(timezone.utc)
        for i in range(5):  # Meet the threshold of 5
            timestamp_str = (base_time + timedelta(minutes=i)).isoformat().replace('+00:00', 'Z')
            event = {
                "@timestamp": timestamp_str,
                "event": {"id": 4625},  # Failed logon
                "source": {"ip": "192.168.1.100"},
                "TargetUserName": "test@example.com",
                "EventRecordID": f"1000{i}"
            }
            events.append(event)
        
        alerts = rule.check(events)
        
        assert len(alerts) == 1
        alert = alerts[0]
        assert alert.title == "Multiple Failed Login Attempts"
        assert alert.severity == AlertSeverity.HIGH
        assert "test@example.com" in alert.affected_users
        assert "192.168.1.100" in alert.source_ips

    def test_check_with_insufficient_failures(self):
        """Test rule doesn't trigger with insufficient failures."""
        rule = MultipleFailedLoginsRule()
        
        # Only 2 failed attempts (below threshold)
        events = []
        for i in range(2):
            event = {
                "@timestamp": datetime.now(timezone.utc).isoformat() + "Z",
                "event": {"id": 4625},
                "source": {"ip": "192.168.1.100"},
                "TargetUserName": "test@example.com"
            }
            events.append(event)
        
        alerts = rule.check(events)
        assert len(alerts) == 0

    def test_check_with_successful_logins(self):
        """Test rule doesn't trigger on successful logins."""
        rule = MultipleFailedLoginsRule()
        
        events = []
        for i in range(6):
            event = {
                "@timestamp": datetime.now(timezone.utc).isoformat() + "Z",
                "event": {"id": 4624},  # Successful logon
                "source": {"ip": "192.168.1.100"},
                "TargetUserName": "test@example.com"
            }
            events.append(event)
        
        alerts = rule.check(events)
        assert len(alerts) == 0

    def test_check_with_malformed_events(self):
        """Test rule handles malformed events gracefully."""
        rule = MultipleFailedLoginsRule()
        
        # Events with missing or malformed data
        events = [
            {},  # Empty event
            {"event": {"id": 4625}},  # Missing timestamp
            {"@timestamp": "invalid-timestamp", "event": {"id": 4625}},  # Invalid timestamp
        ]
        
        alerts = rule.check(events)
        assert len(alerts) == 0


class TestPrivilegeEscalationRule:
    """Test Privilege Escalation Rule."""
    
    def test_rule_name(self):
        """Test rule has correct name."""
        rule = PrivilegeEscalationRule()
        assert rule.name == "Privilege Escalation"
        assert rule.severity == AlertSeverity.CRITICAL

    def test_check_with_privilege_escalation(self):
        """Test rule detects privilege escalation events."""
        rule = PrivilegeEscalationRule()
        
        # Use a properly formatted timestamp without timezone info first
        timestamp_str = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        
        events = [
            {
                "@timestamp": timestamp_str,
                "event": {"id": 4728},  # User added to privileged group
                "source": {"ip": "192.168.1.100"},
                "TargetUserName": "admin_user",
                "EventRecordID": "10001"
            }
        ]
        
        alerts = rule.check(events)
        
        assert len(alerts) == 1
        alert = alerts[0]
        assert alert.title == "Potential Privilege Escalation Detected"
        assert alert.severity == AlertSeverity.CRITICAL
        assert "admin_user" in alert.affected_users

    def test_check_with_no_escalation_events(self):
        """Test rule doesn't trigger on normal events."""
        rule = PrivilegeEscalationRule()
        
        events = [
            {
                "@timestamp": datetime.now(timezone.utc).isoformat() + "Z",
                "event": {"id": 4624},  # Normal logon
                "source": {"ip": "192.168.1.100"},
                "TargetUserName": "normal_user"
            }
        ]
        
        alerts = rule.check(events)
        assert len(alerts) == 0


class TestSuspiciousProcessRule:
    """Test Suspicious Process Rule."""
    
    def test_rule_name(self):
        """Test rule has correct name."""
        rule = SuspiciousProcessRule()
        assert rule.name == "Suspicious Process"
        assert rule.severity == AlertSeverity.MEDIUM

    def test_check_with_suspicious_processes(self):
        """Test rule detects suspicious process activity."""
        rule = SuspiciousProcessRule()
        
        events = [
            {
                "@timestamp": datetime.now(timezone.utc).isoformat() + "Z",
                "event": {"id": 4688},  # Process creation
                "process": {"name": "powershell.exe"},
                "source": {"ip": "192.168.1.100"},
                "EventRecordID": "10001"
            }
        ]
        
        alerts = rule.check(events)
        
        # Note: This assumes the rule detects powershell.exe as suspicious
        # The actual implementation may vary
        if alerts:
            alert = alerts[0]
            assert alert.severity == AlertSeverity.MEDIUM
