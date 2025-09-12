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

// Mock recharts to avoid canvas issues in Jest and be React 19 compatible
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
  XAxis: ({ dataKey, fontSize, stroke, tick }: { dataKey?: string; fontSize?: number; stroke?: string; tick?: any }) => (
    <div 
      data-testid="x-axis" 
      data-datakey={dataKey}
      data-font-size={fontSize}
      data-stroke={stroke}
      data-tick={typeof tick === 'object' ? JSON.stringify(tick) : tick}
    />
  ),
  YAxis: ({ fontSize, stroke, tick }: { fontSize?: number; stroke?: string; tick?: any }) => (
    <div 
      data-testid="y-axis"
      data-font-size={fontSize}
      data-stroke={stroke}
      data-tick={typeof tick === 'object' ? JSON.stringify(tick) : tick}
    />
  ),
  CartesianGrid: ({ stroke, strokeDasharray }: { stroke?: string; strokeDasharray?: string }) => (
    <div 
      data-testid="cartesian-grid" 
      data-stroke={stroke}
      data-stroke-dasharray={strokeDasharray}
    />
  ),
  Tooltip: ({ contentStyle, labelStyle }: { contentStyle?: any; labelStyle?: any }) => (
    <div 
      data-testid="tooltip"
      data-content-style={typeof contentStyle === 'object' ? JSON.stringify(contentStyle) : contentStyle}
      data-label-style={typeof labelStyle === 'object' ? JSON.stringify(labelStyle) : labelStyle}
    />
  ),
  Legend: () => <div data-testid="legend" />,
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
      expect(screen.getAllByText(mockAlertStats.by_severity.critical.toString())).toHaveLength(2); // Card + breakdown

      // Check high priority card
      expect(screen.getByText('High Priority')).toBeInTheDocument();
      expect(screen.getAllByText(mockAlertStats.by_severity.high.toString())).toHaveLength(2); // Card + breakdown

      // Check open alerts card
      expect(screen.getByText('Open Alerts')).toBeInTheDocument();
      expect(screen.getAllByText(mockAlertStats.by_status.open.toString())).toHaveLength(2); // Card + breakdown
    });

    it('renders severity breakdown section', () => {
      render(<AlertStatsOverview stats={mockAlertStats} />);

      expect(screen.getByText('Severity Breakdown')).toBeInTheDocument();
      
      // Check all severity levels are displayed (only in breakdown section now)
      expect(screen.getAllByText('Critical')).toHaveLength(1); // Only in breakdown section
      expect(screen.getAllByText('High')).toHaveLength(1); // Only in breakdown section  
      expect(screen.getAllByText('Medium')).toHaveLength(1); // Only in breakdown section
      expect(screen.getAllByText('Low')).toHaveLength(1); // Only in breakdown section

      // Check values are displayed (using getAllByText for duplicates)
      expect(screen.getAllByText(mockAlertStats.by_severity.critical.toString())).toHaveLength(2); // Card + breakdown
      expect(screen.getAllByText(mockAlertStats.by_severity.high.toString())).toHaveLength(2); // Card + breakdown
      expect(screen.getByText(mockAlertStats.by_severity.medium.toString())).toBeInTheDocument();
      expect(screen.getAllByText(mockAlertStats.by_severity.low.toString())).toHaveLength(2); // Appears in both breakdown and false positive
    });

    it('renders status breakdown section', () => {
      render(<AlertStatsOverview stats={mockAlertStats} />);

      expect(screen.getByText('Status Breakdown')).toBeInTheDocument();
      
      // Check all status types are displayed
      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('Investigating')).toBeInTheDocument();
      expect(screen.getByText('Resolved')).toBeInTheDocument();
      expect(screen.getByText('False Positive')).toBeInTheDocument();

      // Check values are displayed (only in breakdown sections now)
      expect(screen.getAllByText(mockAlertStats.by_status.open.toString())).toHaveLength(2); // Card + breakdown
      expect(screen.getByText(mockAlertStats.by_status.investigating.toString())).toBeInTheDocument();
      expect(screen.getByText(mockAlertStats.by_status.resolved.toString())).toBeInTheDocument(); // Only in breakdown
      expect(screen.getAllByText(mockAlertStats.by_status.false_positive.toString())).toHaveLength(2); // Appears in both severity (low) and status breakdown
    });

    it('renders 24h activity chart', () => {
      render(<AlertStatsOverview stats={mockAlertStats} />);

      expect(screen.getByText('24h Activity')).toBeInTheDocument();
      
      // Check that chart components are rendered
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-total')).toBeInTheDocument();
      expect(screen.getByTestId('line-critical')).toBeInTheDocument();
      expect(screen.getByTestId('line-high')).toBeInTheDocument();
      expect(screen.getByTestId('line-medium')).toBeInTheDocument();
      expect(screen.getByTestId('line-low')).toBeInTheDocument();
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

  describe('Activity Chart', () => {
    it('displays recent activity data in chart format', () => {
      render(<AlertStatsOverview stats={mockAlertStats} />);
      
      // Check for chart components
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('legend')).toBeInTheDocument();
      
      // Check for line components
      expect(screen.getByTestId('line-total')).toBeInTheDocument();
      expect(screen.getByTestId('line-critical')).toBeInTheDocument();
      expect(screen.getByTestId('line-high')).toBeInTheDocument();
      expect(screen.getByTestId('line-medium')).toBeInTheDocument();
      expect(screen.getByTestId('line-low')).toBeInTheDocument();
    });

    it('displays activity data with correct line colors', () => {
      render(<AlertStatsOverview stats={mockAlertStats} />);

      // Check line colors
      expect(screen.getByTestId('line-total')).toHaveAttribute('data-stroke', '#3b82f6');
      expect(screen.getByTestId('line-critical')).toHaveAttribute('data-stroke', '#dc2626');
      expect(screen.getByTestId('line-high')).toHaveAttribute('data-stroke', '#ea580c');
      expect(screen.getByTestId('line-medium')).toHaveAttribute('data-stroke', '#ca8a04');
      expect(screen.getByTestId('line-low')).toHaveAttribute('data-stroke', '#16a34a');
    });

    it('passes correct data to chart', () => {
      render(<AlertStatsOverview stats={mockAlertStats} />);

      const lineChart = screen.getByTestId('line-chart');
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');
      
      expect(chartData).toHaveLength(mockAlertStats.recent_activity.length);
      expect(chartData[0]).toHaveProperty('time');
      expect(chartData[0]).toHaveProperty('total');
      expect(chartData[0]).toHaveProperty('critical');
      expect(chartData[0]).toHaveProperty('high');
      expect(chartData[0]).toHaveProperty('medium');
      expect(chartData[0]).toHaveProperty('low');
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

      // Check that activity section still renders with chart components
      expect(screen.getByText('24h Activity')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      
      // Check that chart data is empty
      const lineChart = screen.getByTestId('line-chart');
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');
      expect(chartData).toHaveLength(0);
    });

    it('handles single data point in recent activity', () => {
      const singlePointStats = createMockAlertStats({
        recent_activity: [{
          time: '12:00',
          total: 10,
          critical: 2,
          high: 3,
          medium: 3,
          low: 2
        }]
      });

      render(<AlertStatsOverview stats={singlePointStats} />);

      // Check that chart renders with single data point
      expect(screen.getByText('24h Activity')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      
      // Check that chart data contains the single point
      const lineChart = screen.getByTestId('line-chart');
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');
      expect(chartData).toHaveLength(1);
      expect(chartData[0]).toEqual({
        time: '12:00 PM',
        total: 10,
        critical: 2,
        high: 3,
        medium: 3,
        low: 2
      });
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