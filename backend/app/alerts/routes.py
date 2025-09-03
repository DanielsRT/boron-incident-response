from fastapi import HTTPException, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from . import alerts_router
from .service import alert_service
from .models import AlertSeverity, AlertStatus


class AlertStatusUpdate(BaseModel):
    status: AlertStatus

@alerts_router.get("/")
async def get_alerts(
    status: Optional[AlertStatus] = Query(None, description="Filter by alert status"),
    severity: Optional[AlertSeverity] = Query(None, description="Filter by alert severity"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of alerts to return")
) -> List[Dict[str, Any]]:
    """Get alerts with optional filtering"""
    try:
        alerts = alert_service.get_alerts(status=status, severity=severity, limit=limit)
        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching alerts: {str(e)}")


@alerts_router.get("/stats")
async def get_alert_stats() -> Dict[str, Any]:
    """Get alert statistics for dashboard"""
    try:
        stats = alert_service.get_alert_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching alert stats: {str(e)}")


@alerts_router.post("/generate")
async def generate_alerts() -> Dict[str, Any]:
    """Manually trigger alert generation"""
    try:
        alerts = alert_service.generate_alerts()
        return {
            "message": f"Generated {len(alerts)} alerts",
            "alert_count": len(alerts)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating alerts: {str(e)}")


@alerts_router.get("/events")
async def get_recent_events(hours: int = Query(24, ge=1, le=168, description="Hours of events to retrieve")) -> List[Dict[str, Any]]:
    """Get recent security events from Elasticsearch"""
    try:
        events = alert_service.get_recent_events(hours=hours)
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching events: {str(e)}")


@alerts_router.patch("/{alert_id}/status")
async def update_alert_status(alert_id: str, status_update: AlertStatusUpdate) -> Dict[str, Any]:
    """Update the status of an alert"""
    try:
        success = alert_service.update_alert_status(alert_id, status_update.status)
        if not success:
            raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found or could not be updated")
        
        return {
            "message": f"Alert {alert_id} status updated to {status_update.status.value}",
            "alert_id": alert_id,
            "new_status": status_update.status.value
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating alert status: {str(e)}")
