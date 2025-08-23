from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass
from enum import Enum

class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertStatus(str, Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"

@dataclass
class Alert:
    id: str
    title: str
    description: str
    severity: AlertSeverity
    status: AlertStatus
    source: str
    timestamp: datetime
    event_count: int
    affected_users: List[str]
    source_ips: List[str]
    event_ids: List[str]
    raw_events: List[Dict[str, Any]]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "severity": self.severity.value,
            "status": self.status.value,
            "source": self.source,
            "timestamp": self.timestamp.isoformat(),
            "event_count": self.event_count,
            "affected_users": self.affected_users,
            "source_ips": self.source_ips,
            "event_ids": self.event_ids,
            "raw_events": self.raw_events
        }

class AlertRule:
    """Base class for alert rules"""
    
    def __init__(self, name: str, severity: AlertSeverity):
        self.name = name
        self.severity = severity
    
    def check(self, events: List[Dict[str, Any]]) -> List[Alert]:
        """Override this method in subclasses to implement rule logic"""
        raise NotImplementedError

class MultipleFailedLoginsRule(AlertRule):
    """Alert on multiple failed login attempts from same IP"""
    
    def __init__(self):
        super().__init__("Multiple Failed Logins", AlertSeverity.HIGH)
        self.threshold = 5
        self.time_window_minutes = 10
    
    def check(self, events: List[Dict[str, Any]]) -> List[Alert]:
        alerts = []
        
        # Group events by source IP and filter for logon failures
        failed_logins = {}
        current_time = datetime.now(timezone.utc)
        
        for event in events:
            if (event.get("EventID") == 4625 and  # Failed logon
                event.get("@timestamp")):
                
                try:
                    event_time = datetime.fromisoformat(event["@timestamp"].replace('Z', '+00:00'))
                    # Only consider events within time window
                    if (current_time - event_time).total_seconds() <= self.time_window_minutes * 60:
                        source_ip = event.get("IpAddress", "Unknown")
                        target_user = event.get("TargetUserName", "Unknown")
                        
                        key = (source_ip, target_user)
                        if key not in failed_logins:
                            failed_logins[key] = []
                        failed_logins[key].append(event)
                except (ValueError, TypeError):
                    continue
        
        # Create alerts for IPs with too many failed attempts
        for (source_ip, target_user), login_events in failed_logins.items():
            if len(login_events) >= self.threshold:
                alert_id = f"failed_logins_{source_ip}_{target_user}_{int(current_time.timestamp())}"
                
                alert = Alert(
                    id=alert_id,
                    title=f"Multiple Failed Login Attempts",
                    description=f"Detected {len(login_events)} failed login attempts for user '{target_user}' from IP {source_ip} in the last {self.time_window_minutes} minutes",
                    severity=self.severity,
                    status=AlertStatus.OPEN,
                    source="Security Events",
                    timestamp=max(datetime.fromisoformat(e["@timestamp"].replace('Z', '+00:00')) for e in login_events),
                    event_count=len(login_events),
                    affected_users=[target_user],
                    source_ips=[source_ip],
                    event_ids=[str(e.get("EventRecordID", "")) for e in login_events],
                    raw_events=login_events
                )
                alerts.append(alert)
        
        return alerts

class PrivilegeEscalationRule(AlertRule):
    """Alert on potential privilege escalation"""
    
    def __init__(self):
        super().__init__("Privilege Escalation", AlertSeverity.CRITICAL)
    
    def check(self, events: List[Dict[str, Any]]) -> List[Alert]:
        alerts = []
        
        # Look for privilege escalation events (Event ID 4728, 4732, 4756)
        escalation_events = []
        for event in events:
            if event.get("EventID") in [4728, 4732, 4756]:  # User added to privileged group
                escalation_events.append(event)
        
        if escalation_events:
            current_time = datetime.now(timezone.utc)
            alert_id = f"privilege_escalation_{int(current_time.timestamp())}"
            
            users = list(set(e.get("TargetUserName", "Unknown") for e in escalation_events))
            source_ips = list(set(e.get("IpAddress", "Unknown") for e in escalation_events if e.get("IpAddress")))
            
            alert = Alert(
                id=alert_id,
                title="Potential Privilege Escalation Detected",
                description=f"Detected {len(escalation_events)} privilege escalation events affecting users: {', '.join(users)}",
                severity=self.severity,
                status=AlertStatus.OPEN,
                source="Security Events",
                timestamp=max(datetime.fromisoformat(e["@timestamp"].replace('Z', '+00:00')) for e in escalation_events if e.get("TimeGenerated")),
                event_count=len(escalation_events),
                affected_users=users,
                source_ips=source_ips,
                event_ids=[str(e.get("EventRecordID", "")) for e in escalation_events],
                raw_events=escalation_events
            )
            alerts.append(alert)
        
        return alerts

class SuspiciousProcessRule(AlertRule):
    """Alert on suspicious process creation"""
    
    def __init__(self):
        super().__init__("Suspicious Process", AlertSeverity.MEDIUM)
        self.suspicious_processes = [
            "powershell.exe", "cmd.exe", "wscript.exe", "cscript.exe",
            "rundll32.exe", "regsvr32.exe", "mshta.exe", "certutil.exe"
        ]
    
    def check(self, events: List[Dict[str, Any]]) -> List[Alert]:
        alerts = []
        
        # Look for process creation events with suspicious processes
        suspicious_events = []
        for event in events:
            if (event.get("EventID") == 4688 and  # Process creation
                event.get("NewProcessName")):
                
                process_name = event["NewProcessName"].lower()
                if any(susp_proc in process_name for susp_proc in self.suspicious_processes):
                    suspicious_events.append(event)
        
        if suspicious_events:
            current_time = datetime.now(timezone.utc)
            alert_id = f"suspicious_process_{int(current_time.timestamp())}"
            
            users = list(set(e.get("SubjectUserName", "Unknown") for e in suspicious_events))
            source_ips = list(set(e.get("IpAddress", "Unknown") for e in suspicious_events if e.get("IpAddress")))
            
            alert = Alert(
                id=alert_id,
                title="Suspicious Process Activity Detected",
                description=f"Detected {len(suspicious_events)} suspicious process executions",
                severity=self.severity,
                status=AlertStatus.OPEN,
                source="Security Events",
                timestamp=max(datetime.fromisoformat(e["@timestamp"].replace('Z', '+00:00')) for e in suspicious_events if e.get("TimeGenerated")),
                event_count=len(suspicious_events),
                affected_users=users,
                source_ips=source_ips,
                event_ids=[str(e.get("EventRecordID", "")) for e in suspicious_events],
                raw_events=suspicious_events
            )
            alerts.append(alert)
        
        return alerts

# Registry of all alert rules
ALERT_RULES = [
    MultipleFailedLoginsRule(),
    PrivilegeEscalationRule(),
    SuspiciousProcessRule()
]
