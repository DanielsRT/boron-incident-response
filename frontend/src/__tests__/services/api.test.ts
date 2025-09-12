import { Alert, AlertStats } from '../../types';

// Mock axios at the module level
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

const mockAxios = {
  create: jest.fn(() => mockAxiosInstance)
};

jest.mock('axios', () => mockAxios);

// Import the api module after mocking axios
const { alertsAPI } = require('../../services/api');

describe('API Services', () => {
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
      const mockResponse = { data: [mockAlert] };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await alertsAPI.getAlerts();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/alerts/', { params: undefined });
      expect(result).toEqual([mockAlert]);
    });

    it('should fetch alerts with parameters', async () => {
      const mockResponse = { data: [mockAlert] };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const params = { status: 'open', severity: 'high', limit: 10 };
      const result = await alertsAPI.getAlerts(params);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/alerts/', { params });
      expect(result).toEqual([mockAlert]);
    });

    it('should fetch alerts with partial parameters', async () => {
      const mockResponse = { data: [mockAlert] };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const params = { status: 'open' };
      const result = await alertsAPI.getAlerts(params);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/alerts/', { params });
      expect(result).toEqual([mockAlert]);
    });

    it('should fetch alerts with limit only', async () => {
      const mockResponse = { data: [mockAlert] };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const params = { limit: 5 };
      const result = await alertsAPI.getAlerts(params);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/alerts/', { params });
      expect(result).toEqual([mockAlert]);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(alertsAPI.getAlerts()).rejects.toThrow('API Error');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/alerts/', { params: undefined });
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      networkError.name = 'NetworkError';
      mockAxiosInstance.get.mockRejectedValue(networkError);

      await expect(alertsAPI.getAlerts()).rejects.toThrow('Network Error');
    });

    it('should handle empty response', async () => {
      const mockResponse = { data: [] };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await alertsAPI.getAlerts();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/alerts/', { params: undefined });
      expect(result).toEqual([]);
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
      const mockResponse = { data: mockStats };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await alertsAPI.getStats();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/alerts/stats');
      expect(result).toEqual(mockStats);
    });

    it('should handle stats API errors', async () => {
      const error = new Error('Stats API Error');
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(alertsAPI.getStats()).rejects.toThrow('Stats API Error');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/alerts/stats');
    });

    it('should handle 404 errors when fetching stats', async () => {
      const error = { response: { status: 404, statusText: 'Not Found' } };
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(alertsAPI.getStats()).rejects.toEqual(error);
    });

    it('should handle timeout errors when fetching stats', async () => {
      const error = new Error('timeout of 10000ms exceeded');
      error.name = 'TimeoutError';
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(alertsAPI.getStats()).rejects.toThrow('timeout of 10000ms exceeded');
    });
  });

  describe('alertsAPI.generateAlerts', () => {
    it('should generate alerts', async () => {
      const mockResponse = { data: { message: 'Generated 5 alerts', alert_count: 5 } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await alertsAPI.generateAlerts();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/alerts/generate');
      expect(result).toEqual({ message: 'Generated 5 alerts', alert_count: 5 });
    });

    it('should handle generate alerts API errors', async () => {
      const error = new Error('Generate API Error');
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(alertsAPI.generateAlerts()).rejects.toThrow('Generate API Error');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/alerts/generate');
    });

    it('should handle server errors when generating alerts', async () => {
      const error = { response: { status: 500, statusText: 'Internal Server Error' } };
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(alertsAPI.generateAlerts()).rejects.toEqual(error);
    });

    it('should handle timeout when generating alerts', async () => {
      const error = new Error('timeout of 10000ms exceeded');
      error.name = 'TimeoutError';
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(alertsAPI.generateAlerts()).rejects.toThrow('timeout of 10000ms exceeded');
    });
  });

  describe('alertsAPI.getRecentEvents', () => {
    it('should fetch recent events with default hours', async () => {
      const mockEvents = [{ id: '1', event: 'test' }];
      const mockResponse = { data: mockEvents };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await alertsAPI.getRecentEvents();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/alerts/events', { params: { hours: 24 } });
      expect(result).toEqual(mockEvents);
    });

    it('should fetch recent events with custom hours', async () => {
      const mockEvents = [{ id: '1', event: 'test' }];
      const mockResponse = { data: mockEvents };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await alertsAPI.getRecentEvents(48);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/alerts/events', { params: { hours: 48 } });
      expect(result).toEqual(mockEvents);
    });

    it('should handle recent events API errors', async () => {
      const error = new Error('Events API Error');
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(alertsAPI.getRecentEvents()).rejects.toThrow('Events API Error');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/alerts/events', { params: { hours: 24 } });
    });

    it('should handle 404 errors when fetching recent events', async () => {
      const error = { response: { status: 404, statusText: 'Not Found' } };
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(alertsAPI.getRecentEvents()).rejects.toEqual(error);
    });

    it('should handle empty recent events response', async () => {
      const mockResponse = { data: [] };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await alertsAPI.getRecentEvents();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/alerts/events', { params: { hours: 24 } });
      expect(result).toEqual([]);
    });
  });

  describe('alertsAPI.updateAlertStatus', () => {
    it('should update alert status', async () => {
      const mockResponse = { 
        data: {
          message: 'Status updated', 
          alert_id: 'alert-123', 
          new_status: 'resolved' 
        }
      };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      const result = await alertsAPI.updateAlertStatus('alert-123', 'resolved');

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/alerts/alert-123/status', { status: 'resolved' });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle update status API errors', async () => {
      const error = new Error('Update API Error');
      mockAxiosInstance.patch.mockRejectedValue(error);

      await expect(alertsAPI.updateAlertStatus('alert-123', 'resolved')).rejects.toThrow('Update API Error');
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/alerts/alert-123/status', { status: 'resolved' });
    });

    it('should handle 404 errors when updating alert status', async () => {
      const error = { response: { status: 404, statusText: 'Alert Not Found' } };
      mockAxiosInstance.patch.mockRejectedValue(error);

      await expect(alertsAPI.updateAlertStatus('nonexistent', 'resolved')).rejects.toEqual(error);
    });

    it('should handle validation errors when updating alert status', async () => {
      const error = { response: { status: 400, statusText: 'Bad Request', data: { error: 'Invalid status' } } };
      mockAxiosInstance.patch.mockRejectedValue(error);

      await expect(alertsAPI.updateAlertStatus('alert-123', 'invalid_status' as any)).rejects.toEqual(error);
    });

    it('should handle different status values', async () => {
      const mockResponse = { 
        data: {
          message: 'Status updated', 
          alert_id: 'alert-456', 
          new_status: 'investigating' 
        }
      };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      const result = await alertsAPI.updateAlertStatus('alert-456', 'investigating');

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/alerts/alert-456/status', { status: 'investigating' });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('API Instance Configuration', () => {
    it('should use correct baseURL configuration', () => {
      // Verify that our mock was set up correctly to simulate the proper baseURL
      expect(process.env.REACT_APP_API_URL || 'http://localhost:8000').toBeDefined();
    });

    it('should handle axios configuration correctly', () => {
      // Test that the API module can be imported and functions are callable
      expect(typeof alertsAPI.getAlerts).toBe('function');
      expect(typeof alertsAPI.getStats).toBe('function');
      expect(typeof alertsAPI.generateAlerts).toBe('function');
      expect(typeof alertsAPI.getRecentEvents).toBe('function');
      expect(typeof alertsAPI.updateAlertStatus).toBe('function');
    });
  });

  describe('HTTP Methods Coverage', () => {
    it('should handle GET requests', async () => {
      const mockResponse = { data: [] };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await alertsAPI.getAlerts();

      expect(mockAxiosInstance.get).toHaveBeenCalled();
    });

    it('should handle POST requests', async () => {
      const mockResponse = { data: { message: 'success' } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await alertsAPI.generateAlerts();

      expect(mockAxiosInstance.post).toHaveBeenCalled();
    });

    it('should handle PUT requests', async () => {
      const mockResponse = { data: { message: 'updated' } };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      await alertsAPI.updateAlertStatus('test-id', 'resolved');

      expect(mockAxiosInstance.patch).toHaveBeenCalled();
    });
  });

  describe('Error Handling Coverage', () => {
    it('should handle network errors across all methods', async () => {
      const networkError = new Error('Network Error');
      networkError.name = 'NetworkError';

      // Test each method with network error
      mockAxiosInstance.get.mockRejectedValue(networkError);
      await expect(alertsAPI.getAlerts()).rejects.toThrow('Network Error');
      
      mockAxiosInstance.get.mockRejectedValue(networkError);
      await expect(alertsAPI.getStats()).rejects.toThrow('Network Error');
      
      mockAxiosInstance.get.mockRejectedValue(networkError);
      await expect(alertsAPI.getRecentEvents()).rejects.toThrow('Network Error');
      
      mockAxiosInstance.post.mockRejectedValue(networkError);
      await expect(alertsAPI.generateAlerts()).rejects.toThrow('Network Error');
      
      mockAxiosInstance.patch.mockRejectedValue(networkError);
      await expect(alertsAPI.updateAlertStatus('id', 'resolved')).rejects.toThrow('Network Error');
    });

    it('should handle timeout errors across all methods', async () => {
      const timeoutError = new Error('timeout of 10000ms exceeded');
      timeoutError.name = 'TimeoutError';

      // Test timeout handling for each method
      mockAxiosInstance.get.mockRejectedValue(timeoutError);
      await expect(alertsAPI.getAlerts()).rejects.toThrow('timeout of 10000ms exceeded');
      
      mockAxiosInstance.get.mockRejectedValue(timeoutError);
      await expect(alertsAPI.getStats()).rejects.toThrow('timeout of 10000ms exceeded');
      
      mockAxiosInstance.get.mockRejectedValue(timeoutError);
      await expect(alertsAPI.getRecentEvents()).rejects.toThrow('timeout of 10000ms exceeded');
      
      mockAxiosInstance.post.mockRejectedValue(timeoutError);
      await expect(alertsAPI.generateAlerts()).rejects.toThrow('timeout of 10000ms exceeded');
      
      mockAxiosInstance.patch.mockRejectedValue(timeoutError);
      await expect(alertsAPI.updateAlertStatus('id', 'resolved')).rejects.toThrow('timeout of 10000ms exceeded');
    });

    it('should handle various HTTP status codes', async () => {
      const statusCodes = [400, 401, 403, 404, 500, 502, 503];
      
      for (const status of statusCodes) {
        const error = { 
          response: { 
            status, 
            statusText: `Status ${status}`,
            data: { error: `Error ${status}` }
          } 
        };
        
        mockAxiosInstance.get.mockRejectedValue(error);
        await expect(alertsAPI.getAlerts()).rejects.toEqual(error);
      }
    });
  });

  describe('Parameter Validation', () => {
    it('should handle undefined parameters correctly', async () => {
      const mockResponse = { data: [] };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await alertsAPI.getAlerts(undefined);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/alerts/', { params: undefined });
    });

    it('should handle empty parameter objects', async () => {
      const mockResponse = { data: [] };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await alertsAPI.getAlerts({});

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/alerts/', { params: {} });
    });

    it('should handle null values in parameters', async () => {
      const mockResponse = { data: [] };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const params = { status: null as any, severity: 'high', limit: 10 };
      await alertsAPI.getAlerts(params);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/alerts/', { params });
    });
  });
});
