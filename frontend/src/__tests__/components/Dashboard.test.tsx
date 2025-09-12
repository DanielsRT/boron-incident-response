import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
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
    if (!stats) return <div data-testid="alert-stats">Stats: null</div>;
    return (
      <div data-testid="alert-stats">
        <div>Stats: loaded</div>
        <div>Total Alerts: {stats.total_alerts}</div>
        <div>Open: {stats.open}</div>
        <div>High Priority: {stats.high}</div>
      </div>
    );
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

// Mock timers for auto-refresh testing
jest.useFakeTimers();

describe('Dashboard', () => {
  const mockAlerts = createMockAlerts(5);

  beforeEach(() => {
    jest.clearAllMocks();
    const { alertsAPI } = require('../../services/api');
    
    alertsAPI.getAlerts.mockResolvedValue(mockAlerts);
    alertsAPI.getStats.mockResolvedValue(mockAlertStats);
    alertsAPI.generateAlerts.mockResolvedValue({ message: 'Generated 10 alerts' });
    alertsAPI.updateAlertStatus.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Basic Rendering', () => {
    it('should render dashboard components', async () => {
      render(<Dashboard />);

      expect(screen.getByText(/incident response dashboard/i)).toBeInTheDocument();
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('alert-stats')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('alert-list')).toBeInTheDocument();
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
  });

  describe('Data Loading', () => {
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

    it('should handle alerts loading error', async () => {
      const { alertsAPI } = require('../../services/api');
      alertsAPI.getAlerts.mockRejectedValue(new Error('Failed to load alerts'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching data:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('should handle stats loading error', async () => {
      const { alertsAPI } = require('../../services/api');
      alertsAPI.getStats.mockRejectedValue(new Error('Failed to load stats'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching data:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('should handle empty alerts response', async () => {
      const { alertsAPI } = require('../../services/api');
      alertsAPI.getAlerts.mockResolvedValue([]);
      
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Alerts: 0')).toBeInTheDocument();
      });
    });

    it('should handle empty stats response', async () => {
      const { alertsAPI } = require('../../services/api');
      alertsAPI.getStats.mockResolvedValue(null);
      
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Alerts: 5')).toBeInTheDocument();
      });
    });
  });

  describe('User Actions', () => {
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

    it('should handle generate alerts error', async () => {
      const { alertsAPI } = require('../../services/api');
      alertsAPI.generateAlerts.mockRejectedValue(new Error('Generation failed'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Stats: loaded')).toBeInTheDocument();
      });

      const generateButton = screen.getByRole('button', { name: /generate alerts/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error generating alerts:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('should show generating state while generating alerts', async () => {
      const { alertsAPI } = require('../../services/api');
      let resolveGeneration: (value: any) => void;
      const generationPromise = new Promise((resolve) => {
        resolveGeneration = resolve;
      });
      alertsAPI.generateAlerts.mockReturnValue(generationPromise);
      
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Stats: loaded')).toBeInTheDocument();
      });

      const generateButton = screen.getByRole('button', { name: /generate alerts/i });
      fireEvent.click(generateButton);

      expect(generateButton).toBeDisabled();
      expect(screen.getByText('Loading: true')).toBeInTheDocument();
      
      act(() => {
        resolveGeneration!({ message: 'Generated' });
      });
    });
  });

  describe('Auto Refresh', () => {
    it('should auto refresh every 30 seconds', async () => {
      const { alertsAPI } = require('../../services/api');
      
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Stats: loaded')).toBeInTheDocument();
      });

      // Clear initial calls
      jest.clearAllMocks();
      alertsAPI.getAlerts.mockResolvedValue(mockAlerts);
      alertsAPI.getStats.mockResolvedValue(mockAlertStats);

      // Fast forward 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(alertsAPI.getAlerts).toHaveBeenCalledWith({ limit: 100 });
      });
      
      expect(alertsAPI.getStats).toHaveBeenCalledWith();
    });

    it('should stop auto refresh on unmount', async () => {
      const { alertsAPI } = require('../../services/api');
      
      const { unmount } = render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Stats: loaded')).toBeInTheDocument();
      });

      unmount();

      // Clear initial calls
      jest.clearAllMocks();

      // Fast forward 30 seconds after unmount
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(alertsAPI.getAlerts).not.toHaveBeenCalled();
      expect(alertsAPI.getStats).not.toHaveBeenCalled();
    });

    it('should handle auto refresh errors gracefully', async () => {
      const { alertsAPI } = require('../../services/api');
      
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Stats: loaded')).toBeInTheDocument();
      });

      // Set up error for auto refresh
      alertsAPI.getAlerts.mockRejectedValue(new Error('Auto refresh failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Fast forward 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching data:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Loading States', () => {
    it('should handle concurrent loading states', async () => {
      const { alertsAPI } = require('../../services/api');
      let resolveAlerts: (value: any) => void;
      let resolveStats: (value: any) => void;
      
      const alertsPromise = new Promise((resolve) => {
        resolveAlerts = resolve;
      });
      
      const statsPromise = new Promise((resolve) => {
        resolveStats = resolve;
      });
      
      alertsAPI.getAlerts.mockReturnValue(alertsPromise);
      alertsAPI.getStats.mockReturnValue(statsPromise);
      
      render(<Dashboard />);
      
      expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
      
      // Resolve stats first - but with Promise.all, nothing should change yet
      act(() => {
        resolveStats!(mockAlertStats);
      });
      
      // Should still be loading because alerts haven't resolved
      expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
      
      // Resolve alerts - now both should be available
      act(() => {
        resolveAlerts!(mockAlerts);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Total Alerts: 15')).toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(screen.getByText('Alerts: 5')).toBeInTheDocument();
      });
    });

    it('should show appropriate loading states for different components', async () => {
      render(<Dashboard />);
      
      // Should show main loading state initially
      expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Loading: false')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed alert data', async () => {
      const { alertsAPI } = require('../../services/api');
      const malformedAlerts = [null, undefined, { invalid: 'data' }] as any;
      alertsAPI.getAlerts.mockResolvedValue(malformedAlerts);
      
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Alerts: 3')).toBeInTheDocument();
      });
    });

    it('should handle large datasets', async () => {
      const { alertsAPI } = require('../../services/api');
      const largeAlertSet = createMockAlerts(1000);
      alertsAPI.getAlerts.mockResolvedValue(largeAlertSet);
      
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Alerts: 1000')).toBeInTheDocument();
      });
    });

    it('should handle network timeout scenarios', async () => {
      const { alertsAPI } = require('../../services/api');
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      alertsAPI.getAlerts.mockRejectedValue(timeoutError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching data:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });
});
