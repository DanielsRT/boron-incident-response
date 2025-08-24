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
        except Exception as e:
            logger.error(f"Error connecting to Elasticsearch: {e}")
            self.es = None
    
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
        
        # For now, generate alerts in real-time
        # In production, you might want to cache/store alerts
        alerts = self.generate_alerts()
        
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
