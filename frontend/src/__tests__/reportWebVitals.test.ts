import reportWebVitals from '../reportWebVitals';

describe('reportWebVitals', () => {
  it('should be a function', () => {
    expect(typeof reportWebVitals).toBe('function');
  });

  it('should accept a callback parameter', () => {
    const mockCallback = jest.fn();
    expect(() => reportWebVitals(mockCallback)).not.toThrow();
  });

  it('should not throw when called without callback', () => {
    expect(() => reportWebVitals()).not.toThrow();
  });

  it('should not throw when called with undefined', () => {
    expect(() => reportWebVitals(undefined)).not.toThrow();
  });
});
