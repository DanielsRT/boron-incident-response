export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  source: string;
  timestamp: string;
  event_count: number;
  affected_users: string[];
  source_ips: string[];
  event_ids: string[];
  raw_events: any[];
}

export interface AlertStats {
  total_alerts: number;
  by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  by_status: {
    open: number;
    investigating: number;
    resolved: number;
    false_positive: number;
  };
  recent_activity: {
    time: string;
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }[];
}
