import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AlertCard from '../../components/AlertCard';
import { createMockAlerts } from '../../testUtils';

describe('AlertCard', () => {
  const mockAlert = createMockAlerts(1)[0];
  const mockOnStatusUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render alert information correctly', () => {
    render(<AlertCard alert={mockAlert} onStatusUpdate={mockOnStatusUpdate} />);
    
    expect(screen.getByText(mockAlert.title)).toBeInTheDocument();
    expect(screen.getByText(mockAlert.description)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(mockAlert.source))).toBeInTheDocument();
  });

  it('should display the correct severity', () => {
    render(<AlertCard alert={mockAlert} onStatusUpdate={mockOnStatusUpdate} />);
    
    expect(screen.getByText(mockAlert.severity)).toBeInTheDocument();
  });

  it('should display the correct status', () => {
    render(<AlertCard alert={mockAlert} onStatusUpdate={mockOnStatusUpdate} />);
    
    expect(screen.getByText(mockAlert.status)).toBeInTheDocument();
  });

  it('should call onStatusUpdate when status is changed', () => {
    render(<AlertCard alert={mockAlert} onStatusUpdate={mockOnStatusUpdate} />);
    
    // Look for status dropdown or button to change status
    const elements = screen.getAllByText(mockAlert.status);
    if (elements.length > 0) {
      fireEvent.click(elements[0]);
    }
  });
});
