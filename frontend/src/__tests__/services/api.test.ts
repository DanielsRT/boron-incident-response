import { alertsAPI } from '../../services/api';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: { message: 'success' } }),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }))
}));

describe('API Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export alertsAPI object', () => {
    expect(alertsAPI).toBeDefined();
    expect(typeof alertsAPI.getAlerts).toBe('function');
    expect(typeof alertsAPI.getStats).toBe('function');
    expect(typeof alertsAPI.generateAlerts).toBe('function');
  });

  it('should handle API calls without throwing', async () => {
    // Test that API functions can be called
    expect(() => alertsAPI.getAlerts()).not.toThrow();
    expect(() => alertsAPI.getStats()).not.toThrow();
    expect(() => alertsAPI.generateAlerts()).not.toThrow();
  });
});
