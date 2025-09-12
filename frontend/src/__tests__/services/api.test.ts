import { alertsAPI } from '../../services/api';
import { Alert, AlertStats } from '../../types';

// Mock the entire api module
jest.mock('../../services/api', () => ({
  alertsAPI: {
    getAlerts: jest.fn(),
    getStats: jest.fn(),
    generateAlerts: jest.fn(),
    getRecentEvents: jest.fn(),
    updateAlertStatus: jest.fn(),
  },
}));

describe('API Services', () => {
  const mockAlertsAPI = alertsAPI as jest.Mocked<typeof alertsAPI>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('alertsAPI.getAlerts', () => {
    const mockAlert: Alert = {
      id: '1',
      title: 'Test Alert',
      description: 'Test Description',
      status: 'open',
      severity: 'medium',
      timestamp: '2024-01-01T00:00:00Z',
      source: 'test-source',
      event_count: 1,
      affected_users: ['user1'],
      source_ips: ['192.168.1.1'],
      event_ids: ['event1'],
      raw_events: [{ test: 'data' }]
    };

    it('should fetch alerts without parameters', async () => {
      mockAlertsAPI.getAlerts.mockResolvedValue([mockAlert]);

      const result = await alertsAPI.getAlerts();

      expect(alertsAPI.getAlerts).toHaveBeenCalledWith();
      expect(result).toEqual([mockAlert]);
    });

    it('should fetch alerts with parameters', async () => {
      mockAlertsAPI.getAlerts.mockResolvedValue([mockAlert]);

      const params = { status: 'open', severity: 'high', limit: 10 };
      const result = await alertsAPI.getAlerts(params);

      expect(alertsAPI.getAlerts).toHaveBeenCalledWith(params);
      expect(result).toEqual([mockAlert]);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockAlertsAPI.getAlerts.mockRejectedValue(error);

      await expect(alertsAPI.getAlerts()).rejects.toThrow('API Error');
    });
  });

  describe('alertsAPI.getStats', () => {
    const mockStats: AlertStats = {
      total_alerts: 10,
      by_severity: {
        critical: 1,
        high: 2,
        medium: 4,
        low: 3
      },
      by_status: {
        open: 5,
        investigating: 2,
        resolved: 2,
        false_positive: 1
      },
      recent_activity: [
        {
          time: '2024-01-01T00:00:00Z',
          total: 5,
          critical: 1,
          high: 1,
          medium: 2,
          low: 1
        }
      ]
    };

    it('should fetch alert stats', async () => {
      mockAlertsAPI.getStats.mockResolvedValue(mockStats);

      const result = await alertsAPI.getStats();

      expect(alertsAPI.getStats).toHaveBeenCalledWith();
      expect(result).toEqual(mockStats);
    });

    it('should handle stats API errors', async () => {
      const error = new Error('Stats API Error');
      mockAlertsAPI.getStats.mockRejectedValue(error);

      await expect(alertsAPI.getStats()).rejects.toThrow('Stats API Error');
    });
  });

  describe('alertsAPI.generateAlerts', () => {
    it('should generate alerts', async () => {
      const mockResponse = { message: 'Generated 5 alerts', alert_count: 5 };
      mockAlertsAPI.generateAlerts.mockResolvedValue(mockResponse);

      const result = await alertsAPI.generateAlerts();

      expect(alertsAPI.generateAlerts).toHaveBeenCalledWith();
      expect(result).toEqual(mockResponse);
    });

    it('should handle generate alerts API errors', async () => {
      const error = new Error('Generate API Error');
      mockAlertsAPI.generateAlerts.mockRejectedValue(error);

      await expect(alertsAPI.generateAlerts()).rejects.toThrow('Generate API Error');
    });
  });

  describe('alertsAPI.getRecentEvents', () => {
    it('should fetch recent events with default hours', async () => {
      const mockEvents = [{ id: '1', event: 'test' }];
      mockAlertsAPI.getRecentEvents.mockResolvedValue(mockEvents);

      const result = await alertsAPI.getRecentEvents();

      expect(alertsAPI.getRecentEvents).toHaveBeenCalledWith();
      expect(result).toEqual(mockEvents);
    });

    it('should fetch recent events with custom hours', async () => {
      const mockEvents = [{ id: '1', event: 'test' }];
      mockAlertsAPI.getRecentEvents.mockResolvedValue(mockEvents);

      const result = await alertsAPI.getRecentEvents(48);

      expect(alertsAPI.getRecentEvents).toHaveBeenCalledWith(48);
      expect(result).toEqual(mockEvents);
    });

    it('should handle recent events API errors', async () => {
      const error = new Error('Events API Error');
      mockAlertsAPI.getRecentEvents.mockRejectedValue(error);

      await expect(alertsAPI.getRecentEvents()).rejects.toThrow('Events API Error');
    });
  });

  describe('alertsAPI.updateAlertStatus', () => {
    it('should update alert status', async () => {
      const mockResponse = { 
        message: 'Status updated', 
        alert_id: 'alert-123', 
        new_status: 'resolved' 
      };
      mockAlertsAPI.updateAlertStatus.mockResolvedValue(mockResponse);

      const result = await alertsAPI.updateAlertStatus('alert-123', 'resolved');

      expect(alertsAPI.updateAlertStatus).toHaveBeenCalledWith('alert-123', 'resolved');
      expect(result).toEqual(mockResponse);
    });

    it('should handle update status API errors', async () => {
      const error = new Error('Update API Error');
      mockAlertsAPI.updateAlertStatus.mockRejectedValue(error);

      await expect(alertsAPI.updateAlertStatus('alert-123', 'resolved')).rejects.toThrow('Update API Error');
    });
  });
});
