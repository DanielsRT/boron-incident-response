import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Dashboard from '../../components/Dashboard';
import { createMockAlerts, mockAlertStats } from '../../testUtils';

// Mock the API
jest.mock('../../services/api', () => ({
  alertsAPI: {
    getAlerts: jest.fn(),
    getStats: jest.fn(),
    generateAlerts: jest.fn(),
    updateAlertStatus: jest.fn()
  }
}));

// Mock child components
jest.mock('../../components/AlertStatsOverview', () => {
  return function MockAlertStatsOverview({ stats }: { stats: any }) {
    return <div data-testid="alert-stats">Stats: {stats ? 'loaded' : 'null'}</div>;
  };
});

jest.mock('../../components/AlertList', () => {
  return function MockAlertList({ alerts, loading, onRefresh }: { alerts: any[], loading: boolean, onRefresh: () => void }) {
    return (
      <div data-testid="alert-list">
        <div>Alerts: {alerts.length}</div>
        <div>Loading: {loading.toString()}</div>
        <button data-testid="alert-list-refresh" onClick={onRefresh}>Refresh</button>
      </div>
    );
  };
});

describe('Dashboard', () => {
  const mockAlerts = createMockAlerts(5);

  beforeEach(() => {
    jest.clearAllMocks();
    const { alertsAPI } = require('../../services/api');
    alertsAPI.getAlerts.mockResolvedValue(mockAlerts);
    alertsAPI.getStats.mockResolvedValue(mockAlertStats);
    alertsAPI.generateAlerts.mockResolvedValue({ message: 'Generated 10 alerts' });
  });

  it('should render dashboard components', async () => {
    render(<Dashboard />);

    expect(screen.getByText(/incident response dashboard/i)).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('alert-stats')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('alert-list')).toBeInTheDocument();
  });

  it('should load alerts and stats on mount', async () => {
    const { alertsAPI } = require('../../services/api');
    
    render(<Dashboard />);

    await waitFor(() => {
      expect(alertsAPI.getAlerts).toHaveBeenCalledTimes(1);
    });
    
    expect(alertsAPI.getStats).toHaveBeenCalledTimes(1);
    
    await waitFor(() => {
      expect(screen.getByText('Stats: loaded')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Alerts: 5')).toBeInTheDocument();
  });

  it('should handle refresh action', async () => {
    const { alertsAPI } = require('../../services/api');
    
    render(<Dashboard />);

    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getByText('Alerts: 5')).toBeInTheDocument();
    });

    // Use the specific refresh button from AlertList
    const refreshButton = screen.getByTestId('alert-list-refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(alertsAPI.getAlerts).toHaveBeenCalledTimes(2); // Initial + refresh
    });
  });

  it('should show loading state initially', async () => {
    render(<Dashboard />);

    // Check for loading text in the dashboard
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Stats: loaded')).toBeInTheDocument();
    });
  });

  it('should handle generate alerts action', async () => {
    const { alertsAPI } = require('../../services/api');
    
    render(<Dashboard />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Stats: loaded')).toBeInTheDocument();
    });

    const generateButton = screen.getByRole('button', { name: /generate alerts/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(alertsAPI.generateAlerts).toHaveBeenCalled();
    });
  });
});
