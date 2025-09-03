import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from elasticsearch import Elasticsearch

from app.core.config import settings
from .models import Alert, ALERT_RULES, AlertStatus, AlertSeverity

logger = logging.getLogger(__name__)

class AlertService:
    def __init__(self):
        # Connect to Elasticsearch
        try:
            self.es = Elasticsearch(
                [settings.ELASTICSEARCH_HOST],
                ca_certs=settings.APP_CERT_PATH,
                basic_auth=(settings.ELASTIC_USERNAME, settings.ELASTIC_PASSWORD)
                )
            if not self.es.ping():
                logger.error("Could not connect to Elasticsearch")
                self.es = None
            else:
                # Ensure alerts index exists
                self._ensure_alerts_index()
        except Exception as e:
            logger.error(f"Error connecting to Elasticsearch: {e}")
            self.es = None
            
    def _ensure_alerts_index(self):
        """Ensure the alerts index exists with proper mapping"""
        if not self.es:
            return
            
        index_name = "security-alerts"
        
        if not self.es.indices.exists(index=index_name):
            mapping = {
                "mappings": {
                    "properties": {
                        "id": {"type": "keyword"},
                        "title": {"type": "text"},
                        "description": {"type": "text"},
                        "severity": {"type": "keyword"},
                        "status": {"type": "keyword"},
                        "source": {"type": "keyword"},
                        "timestamp": {"type": "date"},
                        "event_count": {"type": "integer"},
                        "affected_users": {"type": "keyword"},
                        "source_ips": {"type": "ip"},
                        "event_ids": {"type": "keyword"},
                        "raw_events": {"type": "object"},
                        "created_at": {"type": "date"},
                        "updated_at": {"type": "date"}
                    }
                }
            }
            self.es.indices.create(index=index_name, body=mapping)
            logger.info(f"Created alerts index: {index_name}")
    
    def get_recent_events(self, hours: int = 24) -> List[Dict[str, Any]]:
        """Fetch recent security events from Elasticsearch"""
        if not self.es:
            logger.warning("Elasticsearch not available, returning empty events")
            return []
        
        try:
            # Calculate time range
            end_time = datetime.now(timezone.utc)
            start_time = end_time - timedelta(hours=hours)
            
            # Search query for security events
            query = {
                "query": {
                    "bool": {
                        "must": [
                            {
                                "range": {
                                    "@timestamp": {
                                        "gte": start_time.isoformat(),
                                        "lte": end_time.isoformat()
                                    }
                                }
                            }
                        ]
                    }
                },
                "sort": [
                    {"@timestamp": {"order": "desc"}}
                ],
                "size": 10000  # Adjust as needed
            }
            
            # Execute search
            response = self.es.search(
                index="security-events-*",  # Adjust index pattern as needed
                body=query
            )
            
            events = []
            for hit in response["hits"]["hits"]:
                events.append(hit["_source"])
            
            logger.info(f"Retrieved {len(events)} events from Elasticsearch")
            return events
            
        except Exception as e:
            logger.error(f"Error fetching events from Elasticsearch: {e}")
            return []
    
    def get_all_events(self, limit: int = 10000) -> List[Dict[str, Any]]:
        """Fetch all available security events from Elasticsearch (fallback when recent events are empty)"""
        if not self.es:
            logger.warning("Elasticsearch not available, returning empty events")
            return []
        
        try:
            # Search query for all security events
            query = {
                "query": {
                    "match_all": {}
                },
                "sort": [
                    {"@timestamp": {"order": "desc"}}
                ],
                "size": limit  # Limit to prevent memory issues
            }
            
            # Execute search
            response = self.es.search(
                index="security-events-*",  # Adjust index pattern as needed
                body=query
            )
            
            events = []
            for hit in response["hits"]["hits"]:
                events.append(hit["_source"])
            
            logger.info(f"Retrieved {len(events)} total events from Elasticsearch (fallback)")
            return events
            
        except Exception as e:
            logger.error(f"Error fetching all events from Elasticsearch: {e}")
            return []
    
    def generate_alerts(self, events: Optional[List[Dict[str, Any]]] = None) -> List[Alert]:
        """Generate alerts by applying all rules to recent events"""
        if events is None:
            events = self.get_recent_events()
            
            # If recent events are empty, try to get all events as fallback
            if not events:
                logger.warning("No recent events found, attempting to fetch all events as fallback")
                events = self.get_all_events()
        
        all_alerts = []
        
        for rule in ALERT_RULES:
            try:
                alerts = rule.check(events)
                all_alerts.extend(alerts)
                logger.info(f"Rule '{rule.name}' generated {len(alerts)} alerts")
            except Exception as e:
                logger.error(f"Error running rule '{rule.name}': {e}")
        
        return all_alerts
    
    def get_alerts(self, 
                   status: Optional[AlertStatus] = None,
                   severity: Optional[AlertSeverity] = None,
                   limit: int = 100) -> List[Dict[str, Any]]:
        """Get alerts with optional filtering"""
        
        # Try to get stored alerts first
        stored_alerts = self.get_stored_alerts(status=status, severity=severity, limit=limit)
        if stored_alerts:
            return stored_alerts
        
        # Fallback to generating alerts in real-time
        alerts = self.generate_alerts()
        
        # Store newly generated alerts
        for alert in alerts:
            self.store_alert(alert)
        
        # Apply filters
        if status:
            alerts = [a for a in alerts if a.status == status]
        
        if severity:
            alerts = [a for a in alerts if a.severity == severity]
        
        # Sort by timestamp (newest first) and limit
        alerts.sort(key=lambda x: x.timestamp, reverse=True)
        alerts = alerts[:limit]
        
        # Convert to dict format
        return [alert.to_dict() for alert in alerts]
    
    def get_alert_stats(self) -> Dict[str, Any]:
        """Get alert statistics for dashboard"""
        alerts = self.generate_alerts()
        
        stats = {
            "total_alerts": len(alerts),
            "by_severity": {
                "critical": len([a for a in alerts if a.severity == AlertSeverity.CRITICAL]),
                "high": len([a for a in alerts if a.severity == AlertSeverity.HIGH]),
                "medium": len([a for a in alerts if a.severity == AlertSeverity.MEDIUM]),
                "low": len([a for a in alerts if a.severity == AlertSeverity.LOW])
            },
            "by_status": {
                "open": len([a for a in alerts if a.status == AlertStatus.OPEN]),
                "investigating": len([a for a in alerts if a.status == AlertStatus.INVESTIGATING]),
                "resolved": len([a for a in alerts if a.status == AlertStatus.RESOLVED]),
                "false_positive": len([a for a in alerts if a.status == AlertStatus.FALSE_POSITIVE])
            },
            "recent_activity": self._get_recent_activity_stats(alerts)
        }
        
        return stats
    
    def store_alert(self, alert: Alert) -> bool:
        """Store an alert in Elasticsearch"""
        if not self.es:
            logger.warning("Elasticsearch not available, cannot store alert")
            return False
            
        try:
            alert_dict = alert.to_dict()
            alert_dict["created_at"] = datetime.now(timezone.utc).isoformat()
            alert_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
            
            self.es.index(
                index="security-alerts",
                id=alert.id,
                body=alert_dict
            )
            logger.info(f"Stored alert {alert.id} in Elasticsearch")
            return True
        except Exception as e:
            logger.error(f"Error storing alert {alert.id}: {e}")
            return False
    
    def update_alert_status(self, alert_id: str, status: AlertStatus) -> bool:
        """Update the status of an alert"""
        if not self.es:
            logger.warning("Elasticsearch not available, cannot update alert")
            return False
            
        try:
            # Check if alert exists
            if not self.es.exists(index="security-alerts", id=alert_id):
                logger.error(f"Alert {alert_id} not found")
                return False
                
            # Update the alert status
            update_body = {
                "doc": {
                    "status": status.value,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
            
            self.es.update(
                index="security-alerts",
                id=alert_id,
                body=update_body
            )
            logger.info(f"Updated alert {alert_id} status to {status.value}")
            return True
        except Exception as e:
            logger.error(f"Error updating alert {alert_id} status: {e}")
            return False
    
    def get_stored_alerts(self, 
                         status: Optional[AlertStatus] = None,
                         severity: Optional[AlertSeverity] = None,
                         limit: int = 100) -> List[Dict[str, Any]]:
        """Get stored alerts from Elasticsearch with optional filtering"""
        if not self.es:
            logger.warning("Elasticsearch not available, falling back to generated alerts")
            return self.get_alerts(status=status, severity=severity, limit=limit)
        
        try:
            # Build query
            query = {"match_all": {}}
            filters = []
            
            if status:
                filters.append({"term": {"status": status.value}})
            if severity:
                filters.append({"term": {"severity": severity.value}})
                
            if filters:
                query = {
                    "bool": {
                        "must": filters
                    }
                }
            
            # Search for alerts
            response = self.es.search(
                index="security-alerts",
                body={
                    "query": query,
                    "sort": [{"timestamp": {"order": "desc"}}],
                    "size": limit
                }
            )
            
            alerts = []
            for hit in response["hits"]["hits"]:
                alert_data = hit["_source"]
                alerts.append(alert_data)
                
            return alerts
        except Exception as e:
            logger.error(f"Error retrieving stored alerts: {e}")
            # Fallback to generated alerts
            return self.get_alerts(status=status, severity=severity, limit=limit)
    
    def _get_recent_activity_stats(self, alerts: List[Alert]) -> List[Dict[str, Any]]:
        """Get recent activity statistics for charts"""
        # Group alerts by hour for the last 24 hours
        current_time = datetime.now(timezone.utc)
        hourly_stats = {}
        
        for i in range(24):
            hour_start = current_time - timedelta(hours=i+1)
            hour_end = current_time - timedelta(hours=i)
            hour_key = hour_start.strftime("%H:00")
            
            hour_alerts = [
                a for a in alerts 
                if hour_start <= a.timestamp <= hour_end
            ]
            
            hourly_stats[hour_key] = {
                "time": hour_key,
                "total": len(hour_alerts),
                "critical": len([a for a in hour_alerts if a.severity == AlertSeverity.CRITICAL]),
                "high": len([a for a in hour_alerts if a.severity == AlertSeverity.HIGH]),
                "medium": len([a for a in hour_alerts if a.severity == AlertSeverity.MEDIUM]),
                "low": len([a for a in hour_alerts if a.severity == AlertSeverity.LOW])
            }
        
        return list(hourly_stats.values())

# Global service instance
alert_service = AlertService()
