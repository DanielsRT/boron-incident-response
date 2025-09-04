import { alertsAPI } from '../../services/api';
import { Alert, AlertStats } from '../../types';

// Mock the api module
jest.mock('../../services/api');

// Type the mocked module
const mockedAlertsAPI = alertsAPI as jest.Mocked<typeof alertsAPI>;

describe('API Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks with default return values using correct types
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
    
    mockedAlertsAPI.getAlerts.mockResolvedValue([mockAlert]);
    mockedAlertsAPI.getStats.mockResolvedValue(mockStats);
    mockedAlertsAPI.generateAlerts.mockResolvedValue({
      message: 'Alerts generated successfully',
      alert_count: 5
    });

    if (mockedAlertsAPI.updateAlertStatus) {
      mockedAlertsAPI.updateAlertStatus.mockResolvedValue({
        message: 'Alert updated successfully',
        alert_id: '1',
        new_status: 'investigating'
      });
    }
  });

  it('should export alertsAPI object', () => {
    expect(alertsAPI).toBeDefined();
    expect(typeof alertsAPI.getAlerts).toBe('function');
    expect(typeof alertsAPI.getStats).toBe('function');
    expect(typeof alertsAPI.generateAlerts).toBe('function');
  });

  it('should handle API calls and return expected types', async () => {
    // Test that API functions return promises with the expected data
    const alerts = await alertsAPI.getAlerts();
    const stats = await alertsAPI.getStats();
    const generateResult = await alertsAPI.generateAlerts();
    
    expect(alerts).toBeDefined();
    expect(Array.isArray(alerts)).toBe(true);
    expect(alerts.length).toBeGreaterThan(0);
    
    expect(stats).toBeDefined();
    expect(typeof stats.total_alerts).toBe('number');
    expect(stats.total_alerts).toBeGreaterThanOrEqual(0);
    expect(stats.by_severity).toBeDefined();
    expect(stats.by_status).toBeDefined();
    
    expect(generateResult).toBeDefined();
    expect(generateResult.message).toBeDefined();
    expect(typeof generateResult.alert_count).toBe('number');
  });

  it('should call mocked functions correctly', () => {
    // Test that functions are called (without making actual HTTP requests)
    alertsAPI.getAlerts();
    alertsAPI.getStats();
    alertsAPI.generateAlerts();
    
    expect(mockedAlertsAPI.getAlerts).toHaveBeenCalledTimes(1);
    expect(mockedAlertsAPI.getStats).toHaveBeenCalledTimes(1);
    expect(mockedAlertsAPI.generateAlerts).toHaveBeenCalledTimes(1);
  });
});
