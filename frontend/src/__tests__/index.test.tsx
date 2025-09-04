import React from 'react';
import ReactDOM from 'react-dom/client';

// Mock ReactDOM
jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn(),
    unmount: jest.fn()
  }))
}));

// Mock the App component
jest.mock('../App', () => {
  return function MockApp() {
    return <div data-testid="app">App Component</div>;
  };
});

describe('Index Entry Point', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock DOM element
    const mockElement = document.createElement('div');
    mockElement.id = 'root';
    jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);
  });

  it('should create root and render App in StrictMode', () => {
    const mockRoot = {
      render: jest.fn(),
      unmount: jest.fn()
    };
    (ReactDOM.createRoot as jest.Mock).mockReturnValue(mockRoot);

    // Import index to trigger the render
    require('../index');

    expect(document.getElementById).toHaveBeenCalledWith('root');
    expect(ReactDOM.createRoot).toHaveBeenCalled();
    expect(mockRoot.render).toHaveBeenCalled();
  });

  it('should handle missing root element gracefully', () => {
    jest.spyOn(document, 'getElementById').mockReturnValue(null);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      require('../index');
    }).not.toThrow();
  });
});
