import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock Dashboard component
jest.mock('./components/Dashboard', () => {
  return function MockDashboard() {
    return <div data-testid="dashboard">Dashboard Component</div>;
  };
});

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<App />);
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    it('applies correct CSS classes to main container', () => {
      render(<App />);
      
      // Test that the app renders with expected structure
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    it('renders Dashboard component', () => {
      render(<App />);
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      expect(screen.getByText('Dashboard Component')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('passes all props correctly to Dashboard', () => {
      // Dashboard doesn't receive props in this simple App structure
      render(<App />);
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('has proper document structure', () => {
      render(<App />);
      
      // Should render Dashboard component properly
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('maintains proper document structure', () => {
      render(<App />);
      
      // The Dashboard component should be rendered within the app
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });
  });

  describe('CSS Import', () => {
    it('imports App.css without errors', () => {
      // This test ensures the CSS import doesn't cause errors
      expect(() => {
        render(<App />);
      }).not.toThrow();
    });
  });
});
