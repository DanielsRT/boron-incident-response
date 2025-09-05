import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlertStatsOverview from '../../components/AlertStatsOverview';
import { 
  mockAlertStats, 
  createMockAlertStats,
  setupTestEnvironment,
  cleanupTestEnvironment 
} from '../../testUtils';

// Mock recharts to avoid canvas issues in Jest
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children, data }: { children: React.ReactNode; data: any[] }) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Line: ({ dataKey, stroke, name }: { dataKey: string; stroke: string; name: string }) => (
    <div data-testid={`line-${dataKey}`} data-stroke={stroke} data-name={name} />
  ),
  XAxis: (props: any) => <div data-testid="x-axis" {...props} />,
  YAxis: (props: any) => <div data-testid="y-axis" {...props} />,
  CartesianGrid: (props: any) => <div data-testid="cartesian-grid" {...props} />,
  Tooltip: (props: any) => <div data-testid="tooltip" {...props} />,
  Legend: (props: any) => <div data-testid="legend" {...props} />,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertTriangle: ({ className }: { className?: string }) => (
    <div data-testid="alert-triangle-icon" className={className} />
  ),
  Shield: ({ className }: { className?: string }) => (
    <div data-testid="shield-icon" className={className} />
  ),
  Eye: ({ className }: { className?: string }) => (
    <div data-testid="eye-icon" className={className} />
  ),
  CheckCircle: ({ className }: { className?: string }) => (
    <div data-testid="check-circle-icon" className={className} />
  ),
  Clock: ({ className }: { className?: string }) => (
    <div data-testid="clock-icon" className={className} />
  ),
  X: ({ className }: { className?: string }) => (
    <div data-testid="x-icon" className={className} />
  ),
}));

describe('AlertStatsOverview', () => {
  beforeAll(() => {
    setupTestEnvironment();
  });

  afterAll(() => {
    cleanupTestEnvironment();
  });

  describe('Basic Rendering', () => {
    it('renders all stat cards with correct values', () => {
      render(<AlertStatsOverview stats={mockAlertStats} />);

      // Check total alerts card
      expect(screen.getByText('Total Alerts')).toBeInTheDocument();
      expect(screen.getByText(mockAlertStats.total_alerts.toString())).toBeInTheDocument();

      // Check critical alerts card
      expect(screen.getByText('Critical Alerts')).toBeInTheDocument();
      expect(screen.getAllByText(mockAlertStats.by_severity.critical.toString())).toHaveLength(3); // Card + breakdown + activity table

      // Check high priority card
      expect(screen.getByText('High Priority')).toBeInTheDocument();
      expect(screen.getAllByText(mockAlertStats.by_severity.high.toString())).toHaveLength(3); // Card + breakdown + activity table

      // Check open alerts card
      expect(screen.getByText('Open Alerts')).toBeInTheDocument();
      expect(screen.getAllByText(mockAlertStats.by_status.open.toString())).toHaveLength(2); // Card + breakdown
    });

    it('renders severity breakdown section', () => {
      render(<AlertStatsOverview stats={mockAlertStats} />);

      expect(screen.getByText('Severity Breakdown')).toBeInTheDocument();
      
      // Check all severity levels are displayed (using getAllByText for items that appear in multiple places)
      expect(screen.getAllByText('Critical')).toHaveLength(2); // Breakdown section + table header
      expect(screen.getAllByText('High')).toHaveLength(2); // Breakdown section + table header  
      expect(screen.getAllByText('Medium')).toHaveLength(2); // Breakdown section + table header
      expect(screen.getAllByText('Low')).toHaveLength(2); // Breakdown section + table header

      // Check values are displayed (using getAllByText for duplicates)
      expect(screen.getAllByText(mockAlertStats.by_severity.critical.toString())).toHaveLength(3); // Card + breakdown + activity table
      expect(screen.getAllByText(mockAlertStats.by_severity.high.toString())).toHaveLength(3); // Card + breakdown + activity table
      expect(screen.getByText(mockAlertStats.by_severity.medium.toString())).toBeInTheDocument();
      expect(screen.getAllByText(mockAlertStats.by_severity.low.toString())).toHaveLength(6); // Appears throughout the activity table
    });

    it('renders status breakdown section', () => {
      render(<AlertStatsOverview stats={mockAlertStats} />);

      expect(screen.getByText('Status Breakdown')).toBeInTheDocument();
      
      // Check all status types are displayed
      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('Investigating')).toBeInTheDocument();
      expect(screen.getByText('Resolved')).toBeInTheDocument();
      expect(screen.getByText('False Positive')).toBeInTheDocument();

      // Check values are displayed (some appear in multiple places)
      expect(screen.getAllByText(mockAlertStats.by_status.open.toString())).toHaveLength(2); // Card + breakdown
      expect(screen.getByText(mockAlertStats.by_status.investigating.toString())).toBeInTheDocument();
      expect(screen.getAllByText(mockAlertStats.by_status.resolved.toString())).toHaveLength(3); // Appears multiple times in activity table too
      expect(screen.getAllByText(mockAlertStats.by_status.false_positive.toString())).toHaveLength(6); // Appears throughout the activity table
    });

    it('renders 24h activity table', () => {
      render(<AlertStatsOverview stats={mockAlertStats} />);

      expect(screen.getByText('24h Activity')).toBeInTheDocument();
      expect(screen.getByText('Time')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('renders correct icons for stat cards', () => {
      render(<AlertStatsOverview stats={mockAlertStats} />);

      // Should have multiple AlertTriangle icons
      expect(screen.getAllByTestId('alert-triangle-icon')).toHaveLength(2);
      
      // Should have Shield icon for high priority
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
      
      // Should have Clock icons for open alerts (appears in summary and status breakdown)
      expect(screen.getAllByTestId('clock-icon')).toHaveLength(2);
    });

    it('renders correct icons in status breakdown', () => {
      render(<AlertStatsOverview stats={mockAlertStats} />);

      // Status breakdown should have icons for each status
      expect(screen.getAllByTestId('clock-icon')).toHaveLength(2); // Open alerts card + status breakdown
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });
  });

  describe('Activity Table', () => {
    it('displays recent activity data in table format', () => {
      render(<AlertStatsOverview stats={mockAlertStats} />);
      
      // Check for table headers
      expect(screen.getByText('Time')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getAllByText('Critical')).toHaveLength(2); // One in severity breakdown, one in table header
      expect(screen.getAllByText('High')).toHaveLength(2); // One in severity breakdown, one in table header
      expect(screen.getAllByText('Medium')).toHaveLength(2); // One in severity breakdown, one in table header
      expect(screen.getAllByText('Low')).toHaveLength(2); // One in severity breakdown, one in table header
      
      // Check for first row of data
      expect(screen.getByText('04:00 AM')).toBeInTheDocument();
    });

    it('displays activity data with correct formatting', () => {
      render(<AlertStatsOverview stats={mockAlertStats} />);

      // Check that numbers are displayed correctly
      const criticalValues = screen.getAllByText('1');
      expect(criticalValues.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles zero values correctly', () => {
      const zeroStats = createMockAlertStats({
        total_alerts: 0,
        by_severity: { critical: 0, high: 0, medium: 0, low: 0 },
        by_status: { open: 0, investigating: 0, resolved: 0, false_positive: 0 },
        recent_activity: []
      });

      render(<AlertStatsOverview stats={zeroStats} />);

      // All stat cards should show 0 - expecting 12: 4 summary cards + 4 severity + 4 status
      expect(screen.getAllByText('0')).toHaveLength(12);
    });

    it('handles large numbers correctly', () => {
      const largeStats = createMockAlertStats({
        total_alerts: 999999,
        by_severity: { critical: 111111, high: 222222, medium: 333333, low: 444444 },
        by_status: { open: 250000, investigating: 260000, resolved: 270000, false_positive: 280000 }
      });

      render(<AlertStatsOverview stats={largeStats} />);

      expect(screen.getByText('999999')).toBeInTheDocument();
      expect(screen.getAllByText('111111')).toHaveLength(2); // Summary card + breakdown
      expect(screen.getAllByText('222222')).toHaveLength(2); // Summary card + breakdown
    });

    it('handles empty recent activity data', () => {
      const emptyActivityStats = createMockAlertStats({
        recent_activity: []
      });

      render(<AlertStatsOverview stats={emptyActivityStats} />);

      // Check that activity section still renders with headers
      expect(screen.getByText('24h Activity')).toBeInTheDocument();
      expect(screen.getByText('Time')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      
      // No data rows should be present
      expect(screen.queryByText('04:00 AM')).not.toBeInTheDocument();
    });

    it('handles single data point in recent activity', () => {
      const noon = new Date();
      noon.setHours(12, 0, 0, 0);
      
      const singlePointStats = createMockAlertStats({
        recent_activity: [{
          time: noon.toISOString(),
          total: 10,
          critical: 2,
          high: 3,
          medium: 3,
          low: 2
        }]
      });

      render(<AlertStatsOverview stats={singlePointStats} />);

      // Check that the single data point is displayed correctly
      expect(screen.getByText('12:00 PM')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getAllByText('2')).toHaveLength(3); // Appears multiple times in the activity table
      expect(screen.getAllByText('3')).toHaveLength(4); // Appears multiple times in the activity table
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<AlertStatsOverview stats={mockAlertStats} />);

      expect(screen.getByRole('heading', { name: 'Severity Breakdown' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Status Breakdown' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: '24h Activity' })).toBeInTheDocument();
    });

    it('has proper semantic structure for stat cards', () => {
      render(<AlertStatsOverview stats={mockAlertStats} />);

      // Check that definition lists are used for stats
      const dtElements = screen.getAllByRole('term');
      expect(dtElements.length).toBeGreaterThan(0);
    });
  });

  describe('Component Props', () => {
    it('accepts and renders different stats objects', () => {
      const customStats = createMockAlertStats({
        total_alerts: 50,
        by_severity: { critical: 7, high: 13, medium: 20, low: 10 },
        by_status: { open: 25, investigating: 15, resolved: 8, false_positive: 2 }
      });

      render(<AlertStatsOverview stats={customStats} />);

      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getAllByText('7')).toHaveLength(2); // Summary card + breakdown  
      expect(screen.getAllByText('25')).toHaveLength(2); // Summary card + breakdown
    });

    it('re-renders when stats prop changes', () => {
      const { rerender } = render(<AlertStatsOverview stats={mockAlertStats} />);
      
      expect(screen.getByText(mockAlertStats.total_alerts.toString())).toBeInTheDocument();

      const newStats = createMockAlertStats({ total_alerts: 999 });
      rerender(<AlertStatsOverview stats={newStats} />);

      expect(screen.getByText('999')).toBeInTheDocument();
      expect(screen.queryByText(mockAlertStats.total_alerts.toString())).not.toBeInTheDocument();
    });
  });
});