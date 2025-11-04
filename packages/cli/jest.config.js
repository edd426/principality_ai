module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts', // Entry point, minimal logic
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // Coverage thresholds per requirements (95%+ CLI coverage)
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  // Setup file for console mocking and test utilities
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // Timeout for async operations (readline, user input simulation)
  testTimeout: 10000,
  // Clear mocks between tests to prevent interference
  clearMocks: true,
  // Verbose output for better debugging during development
  verbose: true,
};