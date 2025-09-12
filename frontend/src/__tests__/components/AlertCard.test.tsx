import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlertCard from '../../components/AlertCard';
import { Alert } from '../../types';
import { alertsAPI } from '../../services/api';

// Mock the API
jest.mock('../../services/api');
const mockedAlertsAPI = alertsAPI as jest.Mocked<typeof alertsAPI>;

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'PPpp') return 'Jan 1, 2024 at 12:00:00 AM';
    if (formatStr === 'MMM dd, HH:mm') return 'Jan 01, 00:00';
    if (formatStr === 'MMM dd, yyyy HH:mm') return 'Jan 01, 2024 00:00';
    return 'Jan 01, 00:00';
  }),
  parseISO: jest.fn((dateStr) => new Date(dateStr)),
}));

describe('AlertCard', () => {
  const mockAlert: Alert = {
    id: 'alert-123',
    title: 'Test Security Alert',
    description: 'This is a test alert description that should be displayed properly.',
    status: 'open',
    severity: 'high',
    timestamp: '2024-01-01T00:00:00Z',
    source: 'security-scanner',
    event_count: 5,
    affected_users: ['user1@example.com', 'user2@example.com'],
    source_ips: ['192.168.1.100', '10.0.0.50'],
    event_ids: ['event-1', 'event-2', 'event-3'],
    raw_events: [
      { type: 'login_attempt', user: 'user1', ip: '192.168.1.100' },
      { type: 'failed_auth', user: 'user2', ip: '10.0.0.50' }
    ]
  };

  const mockOnStatusUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAlertsAPI.updateAlertStatus.mockResolvedValue({
      message: 'Status updated successfully',
      alert_id: 'alert-123',
      new_status: 'investigating'
    });
  });

  describe('Basic Rendering', () => {
    it('should render alert with all basic information', () => {
      render(<AlertCard alert={mockAlert} onStatusUpdate={mockOnStatusUpdate} />);
      
      expect(screen.getByText('Test Security Alert')).toBeInTheDocument();
      expect(screen.getByText('This is a test alert description that should be displayed properly.')).toBeInTheDocument();
      expect(screen.getByText('Time:')).toBeInTheDocument();
      expect(screen.getByText('Source: security-scanner')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should display correct severity styling for high severity', () => {
      render(<AlertCard alert={mockAlert} onStatusUpdate={mockOnStatusUpdate} />);
      
      const severityBadge = screen.getByText('high');
      expect(severityBadge).toHaveClass('bg-warning-600', 'text-white');
    });

    it('should display correct severity styling for critical severity', () => {
      const criticalAlert = { ...mockAlert, severity: 'critical' as const };
      render(<AlertCard alert={criticalAlert} onStatusUpdate={mockOnStatusUpdate} />);
      
      const severityBadge = screen.getByText('critical');
      expect(severityBadge).toHaveClass('bg-danger-600', 'text-white');
    });

    it('should display correct severity styling for medium severity', () => {
      const mediumAlert = { ...mockAlert, severity: 'medium' as const };
      render(<AlertCard alert={mediumAlert} onStatusUpdate={mockOnStatusUpdate} />);
      
      const severityBadge = screen.getByText('medium');
      expect(severityBadge).toHaveClass('bg-yellow-600', 'text-white');
    });

    it('should display correct severity styling for low severity', () => {
      const lowAlert = { ...mockAlert, severity: 'low' as const };
      render(<AlertCard alert={lowAlert} onStatusUpdate={mockOnStatusUpdate} />);
      
      const severityBadge = screen.getByText('low');
      expect(severityBadge).toHaveClass('bg-blue-600', 'text-white');
    });

    it('should display correct status styling for open status', () => {
      render(<AlertCard alert={mockAlert} onStatusUpdate={mockOnStatusUpdate} />);
      
      const statusText = screen.getByText('open');
      expect(statusText).toBeInTheDocument();
    });

    it('should display correct status styling for resolved status', () => {
      const resolvedAlert = { ...mockAlert, status: 'resolved' as const };
      render(<AlertCard alert={resolvedAlert} onStatusUpdate={mockOnStatusUpdate} />);
      
      const statusText = screen.getByText('resolved');
      expect(statusText).toBeInTheDocument();
    });
  });

  describe('Expandable Details', () => {
    it('should show basic user information', () => {
      render(<AlertCard alert={mockAlert} onStatusUpdate={mockOnStatusUpdate} />);
      
      expect(screen.getByText('user1@example.com, user2@example.com')).toBeInTheDocument();
    });

    it('should show basic IP information', () => {
      render(<AlertCard alert={mockAlert} onStatusUpdate={mockOnStatusUpdate} />);
      
      expect(screen.getByText('192.168.1.100, 10.0.0.50')).toBeInTheDocument();
    });

    it('should show event count', () => {
      render(<AlertCard alert={mockAlert} onStatusUpdate={mockOnStatusUpdate} />);
      
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('Status Updates', () => {
    it('should show status update dropdown when status button is clicked', () => {
      render(<AlertCard alert={mockAlert} onStatusUpdate={mockOnStatusUpdate} />);
      
      const statusButton = screen.getByRole('button', { name: /open/i });
      fireEvent.click(statusButton);
      
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should update status successfully', async () => {
      render(<AlertCard alert={mockAlert} onStatusUpdate={mockOnStatusUpdate} />);
      
      const statusButton = screen.getByRole('button', { name: /open/i });
      fireEvent.click(statusButton);
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'investigating' } });
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockedAlertsAPI.updateAlertStatus).toHaveBeenCalledWith('alert-123', 'investigating');
      });
      
      expect(mockOnStatusUpdate).toHaveBeenCalled();
    });

    it('should handle status update errors', async () => {
      mockedAlertsAPI.updateAlertStatus.mockRejectedValue(new Error('Update failed'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<AlertCard alert={mockAlert} onStatusUpdate={mockOnStatusUpdate} />);
      
      const statusButton = screen.getByRole('button', { name: /open/i });
      fireEvent.click(statusButton);
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'investigating' } });
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to update alert status:', expect.any(Error));
      });
      
      expect(mockOnStatusUpdate).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should cancel status editing when cancel button is clicked', () => {
      render(<AlertCard alert={mockAlert} onStatusUpdate={mockOnStatusUpdate} />);
      
      const statusButton = screen.getByRole('button', { name: /open/i });
      fireEvent.click(statusButton);
      
      const cancelButton = screen.getByTitle('Cancel');
      fireEvent.click(cancelButton);
      
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('should show all status options in dropdown', () => {
      render(<AlertCard alert={mockAlert} onStatusUpdate={mockOnStatusUpdate} />);
      
      const statusButton = screen.getByRole('button', { name: /open/i });
      fireEvent.click(statusButton);
      
      expect(screen.getByRole('option', { name: 'Open' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Investigating' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Resolved' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'False Positive' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle alert with no affected users', () => {
      const alertWithoutUsers = { ...mockAlert, affected_users: [] };
      render(<AlertCard alert={alertWithoutUsers} onStatusUpdate={mockOnStatusUpdate} />);
      
      expect(screen.queryByText('Users:')).not.toBeInTheDocument();
    });

    it('should handle alert with no source IPs', () => {
      const alertWithoutIPs = { ...mockAlert, source_ips: [] };
      render(<AlertCard alert={alertWithoutIPs} onStatusUpdate={mockOnStatusUpdate} />);
      
      expect(screen.queryByText('IPs:')).not.toBeInTheDocument();
    });

    it('should handle alert with many users and truncation', () => {
      const alertWithManyUsers = { 
        ...mockAlert, 
        affected_users: ['user1@example.com', 'user2@example.com', 'user3@example.com', 'user4@example.com'] 
      };
      render(<AlertCard alert={alertWithManyUsers} onStatusUpdate={mockOnStatusUpdate} />);
      
      expect(screen.getByText('user1@example.com, user2@example.com')).toBeInTheDocument();
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('should handle alerts with single event count', () => {
      const singleEventAlert = { ...mockAlert, event_count: 1 };
      render(<AlertCard alert={singleEventAlert} onStatusUpdate={mockOnStatusUpdate} />);
      
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should handle zero event count', () => {
      const zeroEventAlert = { ...mockAlert, event_count: 0 };
      render(<AlertCard alert={zeroEventAlert} onStatusUpdate={mockOnStatusUpdate} />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle long alert titles', () => {
      const longTitleAlert = { 
        ...mockAlert, 
        title: 'This is an extremely long alert title that should be displayed properly without breaking the layout' 
      };
      render(<AlertCard alert={longTitleAlert} onStatusUpdate={mockOnStatusUpdate} />);
      
      expect(screen.getByText(longTitleAlert.title)).toBeInTheDocument();
    });

    it('should handle all different severity levels', () => {
      const severities = ['critical', 'high', 'medium', 'low'] as const;
      
      severities.forEach(severity => {
        const severityAlert = { ...mockAlert, severity };
        const { unmount } = render(<AlertCard alert={severityAlert} onStatusUpdate={mockOnStatusUpdate} />);
        
        expect(screen.getByText(severity)).toBeInTheDocument();
        unmount();
      });
    });

    it('should handle all different status levels', () => {
      const statuses = ['open', 'investigating', 'resolved', 'false_positive'] as const;
      
      statuses.forEach(status => {
        const statusAlert = { ...mockAlert, status };
        const { unmount } = render(<AlertCard alert={statusAlert} onStatusUpdate={mockOnStatusUpdate} />);
        
        expect(screen.getByText(status.replace('_', ' '))).toBeInTheDocument();
        unmount();
      });
    });
  });
});
