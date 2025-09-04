import { Alert, AlertStats } from '../../types';
import { createMockAlerts, mockAlertStats } from '../../testUtils';

describe('TypeScript Interfaces', () => {
  describe('Alert interface', () => {
    it('should validate Alert interface structure', () => {
      const alert: Alert = createMockAlerts(1)[0];
      
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('title');
      expect(alert).toHaveProperty('description');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('status');
      expect(alert).toHaveProperty('source');
      expect(alert).toHaveProperty('timestamp');
      expect(alert).toHaveProperty('event_count');
      expect(alert).toHaveProperty('affected_users');
      expect(alert).toHaveProperty('source_ips');
      expect(alert).toHaveProperty('event_ids');
      expect(alert).toHaveProperty('raw_events');
    });

    it('should validate Alert severity values', () => {
      const validSeverities: Alert['severity'][] = ['low', 'medium', 'high', 'critical'];
      
      validSeverities.forEach(severity => {
        const alert: Alert = { ...createMockAlerts(1)[0], severity };
        expect(alert.severity).toBe(severity);
      });
    });

    it('should validate Alert status values', () => {
      const validStatuses: Alert['status'][] = ['open', 'investigating', 'resolved', 'false_positive'];
      
      validStatuses.forEach(status => {
        const alert: Alert = { ...createMockAlerts(1)[0], status };
        expect(alert.status).toBe(status);
      });
    });

    it('should validate array properties', () => {
      const alert: Alert = createMockAlerts(1)[0];
      
      expect(Array.isArray(alert.affected_users)).toBe(true);
      expect(Array.isArray(alert.source_ips)).toBe(true);
      expect(Array.isArray(alert.event_ids)).toBe(true);
      expect(Array.isArray(alert.raw_events)).toBe(true);
    });

    it('should validate numeric properties', () => {
      const alert: Alert = createMockAlerts(1)[0];
      
      expect(typeof alert.event_count).toBe('number');
      expect(alert.event_count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('AlertStats interface', () => {
    it('should validate AlertStats interface structure', () => {
      const stats: AlertStats = mockAlertStats;
      
      expect(stats).toHaveProperty('total_alerts');
      expect(stats).toHaveProperty('by_severity');
      expect(stats).toHaveProperty('by_status');
      expect(stats).toHaveProperty('recent_activity');
    });

    it('should validate by_severity structure', () => {
      const stats: AlertStats = mockAlertStats;
      
      expect(stats.by_severity).toHaveProperty('critical');
      expect(stats.by_severity).toHaveProperty('high');
      expect(stats.by_severity).toHaveProperty('medium');
      expect(stats.by_severity).toHaveProperty('low');
      
      expect(typeof stats.by_severity.critical).toBe('number');
      expect(typeof stats.by_severity.high).toBe('number');
      expect(typeof stats.by_severity.medium).toBe('number');
      expect(typeof stats.by_severity.low).toBe('number');
    });

    it('should validate by_status structure', () => {
      const stats: AlertStats = mockAlertStats;
      
      expect(stats.by_status).toHaveProperty('open');
      expect(stats.by_status).toHaveProperty('investigating');
      expect(stats.by_status).toHaveProperty('resolved');
      expect(stats.by_status).toHaveProperty('false_positive');
      
      expect(typeof stats.by_status.open).toBe('number');
      expect(typeof stats.by_status.investigating).toBe('number');
      expect(typeof stats.by_status.resolved).toBe('number');
      expect(typeof stats.by_status.false_positive).toBe('number');
    });

    it('should validate numeric constraints', () => {
      const stats: AlertStats = mockAlertStats;
      
      expect(stats.total_alerts).toBeGreaterThanOrEqual(0);
      expect(stats.by_severity.critical).toBeGreaterThanOrEqual(0);
      expect(stats.by_status.open).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Type compatibility', () => {
    it('should allow partial Alert objects', () => {
      const partialAlert: Partial<Alert> = {
        id: 'test-id',
        title: 'Test Alert'
      };
      
      expect(partialAlert.id).toBe('test-id');
      expect(partialAlert.title).toBe('Test Alert');
    });

    it('should support Alert array operations', () => {
      const alerts: Alert[] = createMockAlerts(3);
      
      const openAlerts = alerts.filter(alert => alert.status === 'open');
      const highSeverityAlerts = alerts.filter(alert => alert.severity === 'high');
      
      expect(Array.isArray(openAlerts)).toBe(true);
      expect(Array.isArray(highSeverityAlerts)).toBe(true);
    });

    it('should support object spread operations', () => {
      const originalAlert = createMockAlerts(1)[0];
      const updatedAlert: Alert = {
        ...originalAlert,
        status: 'resolved'
      };
      
      expect(updatedAlert.status).toBe('resolved');
      expect(updatedAlert.id).toBe(originalAlert.id);
      expect(updatedAlert.title).toBe(originalAlert.title);
    });
  });
});
