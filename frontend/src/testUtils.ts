import { Alert, AlertStats } from './types';

// Mock Alert data for consistent testing
export const mockAlert: Alert = {
  id: 'test-alert-1',
  title: 'Multiple Failed Logins',
  description: 'Multiple failed login attempts detected for user test@example.com',
  severity: 'high',
  status: 'open',
  source: 'test-source',
  timestamp: '2024-01-15T10:00:00Z',
  event_count: 5,
  affected_users: ['test@example.com'],
  source_ips: ['192.168.1.100'],
  event_ids: ['event-1', 'event-2', 'event-3'],
  raw_events: [
    { id: 'event-1', timestamp: '2024-01-15T10:00:00Z', details: 'Login failed' },
    { id: 'event-2', timestamp: '2024-01-15T10:01:00Z', details: 'Login failed' },
    { id: 'event-3', timestamp: '2024-01-15T10:02:00Z', details: 'Login failed' }
  ]
};

// Mock AlertStats data
export const mockAlertStats: AlertStats = {
  total_alerts: 15,
  by_severity: {
    critical: 3,
    high: 5,
    medium: 6,
    low: 1
  },
  by_status: {
    open: 8,
    investigating: 4,
    resolved: 2,
    false_positive: 1
  },
  recent_activity: [
    {
      time: '2024-01-15T09:00:00Z',
      total: 3,
      critical: 1,
      high: 1,
      medium: 1,
      low: 0
    },
    {
      time: '2024-01-15T10:00:00Z',
      total: 5,
      critical: 1,
      high: 2,
      medium: 2,
      low: 0
    }
  ]
};

// Helper function to create alert variants
export const createMockAlert = (overrides: Partial<Alert> = {}): Alert => ({
  ...mockAlert,
  ...overrides
});

// Helper function to create alerts with different severities
export const createMockAlerts = (count: number = 3): Alert[] => {
  const severities: Alert['severity'][] = ['critical', 'high', 'medium', 'low'];
  const statuses: Alert['status'][] = ['open', 'investigating', 'resolved', 'false_positive'];
  const descriptions = [
    'Multiple failed login attempts detected for user admin@example.com',
    'Suspicious network activity detected from external IP',
    'Unusual file access pattern detected in sensitive directory',
    'Potential malware detected in system files',
    'Unauthorized privilege escalation attempt detected'
  ];
  
  return Array.from({ length: count }, (_, index) => ({
    ...mockAlert,
    id: `alert-${index + 1}`,
    title: `Test Alert ${index + 1}`,
    description: descriptions[index % descriptions.length],
    severity: severities[index % severities.length],
    status: statuses[index % statuses.length],
    timestamp: new Date(Date.now() - (index * 3600000)).toISOString(), // Different timestamps
    affected_users: [`user${index + 1}@example.com`],
    source_ips: [`192.168.1.${100 + index}`],
  }));
};

// Helper function to create stats variants
export const createMockStats = (overrides: Partial<AlertStats> = {}): AlertStats => ({
  ...mockAlertStats,
  ...overrides
});

// Helper function to create alert stats variants (alias for consistency)
export const createMockAlertStats = (overrides: Partial<AlertStats> = {}): AlertStats => ({
  ...mockAlertStats,
  ...overrides
});

// Test environment setup and cleanup utilities
export const setupTestEnvironment = () => {
  // Setup any global test state or mocks
  jest.clearAllMocks();
};

export const cleanupTestEnvironment = () => {
  // Clean up any test state
  jest.clearAllMocks();
};

// Test wrapper utilities
export const waitForLoadingToFinish = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock API responses
export const mockApiResponses = {
  alerts: {
    success: { data: [mockAlert] },
    empty: { data: [] },
    multiple: { data: createMockAlerts(5) },
    error: new Error('API Error')
  },
  stats: {
    success: { data: mockAlertStats },
    error: new Error('Stats API Error')
  },
  generate: {
    success: { data: { message: 'Generated 3 alerts successfully', alert_count: 3 } },
    error: new Error('Generation failed')
  },
  updateStatus: {
    success: { data: { message: 'Status updated', alert_id: 'test-alert-1', new_status: 'investigating' } },
    error: new Error('Update failed')
  }
};

// Date formatting helper for tests
export const formatTestDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};
