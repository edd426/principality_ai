/**
 * Jest setup file for CLI testing
 * Configures mocks and test utilities for console I/O and readline testing
 */

// Mock console methods to capture output for testing
const originalConsole = { ...console };

beforeEach(() => {
  // Reset console mocks before each test
  jest.clearAllMocks();

  // Restore original console methods
  Object.assign(console, originalConsole);
});

// Global test timeout warning
jest.setTimeout(10000);

// Suppress console.clear during tests (it interferes with test output)
global.console.clear = jest.fn();

// Export for use in tests
export { originalConsole };