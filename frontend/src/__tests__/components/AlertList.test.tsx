import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AlertList from '../../components/AlertList';
import { createMockAlerts } from '../../testUtils';

describe('AlertList', () => {
  const mockAlerts = createMockAlerts(5);
  const mockOnRefresh = jest.fn();
  const mockOnStatusUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render list of alerts', () => {
    render(
      <AlertList 
        alerts={mockAlerts} 
        loading={false} 
        onRefresh={mockOnRefresh}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    // Check for the specific first alert
    expect(screen.getByText('Test Alert 1')).toBeInTheDocument();
    expect(screen.getByText('Multiple failed login attempts detected for user admin@example.com')).toBeInTheDocument();
    
    // Check total count
    expect(screen.getByText('Security Alerts (5)')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(
      <AlertList 
        alerts={[]} 
        loading={true} 
        onRefresh={mockOnRefresh}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should filter alerts by search term', async () => {
    render(
      <AlertList 
        alerts={mockAlerts} 
        loading={false} 
        onRefresh={mockOnRefresh}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search alerts/i);
    await userEvent.type(searchInput, mockAlerts[0].title.slice(0, 5));

    expect(searchInput).toHaveValue(mockAlerts[0].title.slice(0, 5));
  });

  it('should filter alerts by severity', async () => {
    render(
      <AlertList 
        alerts={mockAlerts} 
        loading={false} 
        onRefresh={mockOnRefresh}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    const severityFilter = screen.getByDisplayValue('');
    fireEvent.change(severityFilter, { target: { value: 'high' } });

    expect(severityFilter).toHaveValue('high');
  });

  it('should call onRefresh when refresh button is clicked', () => {
    render(
      <AlertList 
        alerts={mockAlerts} 
        loading={false} 
        onRefresh={mockOnRefresh}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('should display empty state when no alerts', () => {
    render(
      <AlertList 
        alerts={[]} 
        loading={false} 
        onRefresh={mockOnRefresh}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );

    expect(screen.getByText(/no alerts/i)).toBeInTheDocument();
  });
});
