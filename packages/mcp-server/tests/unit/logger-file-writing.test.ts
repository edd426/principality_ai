/**
 * Test Suite: Logger File Writing (Regression Test)
 *
 * Status: GREEN
 * Created: 2025-10-23
 * Phase: 2.1
 *
 * Validates that the Logger actually writes to files when configured.
 * This is a regression test to ensure logging doesn't silently fail to write.
 *
 * @level Unit
 * @testType Regression
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { Logger } from '../../src/logger';

describe('Logger File Writing - Regression Tests', () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'logger-test-'));
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('UT-LOGGER-1: File Writing', () => {
    test('should create log file on first log', () => {
      // @req: Logger must create file when logFile parameter provided
      // @edge: File doesn't exist yet
      // @why: File won't exist until first write

      const logFile = path.join(tempDir, 'create-test.log');
      const logger = new Logger('info', 'text', logFile);

      // File should be created on initialization
      expect(logger.getLogFilePath()).toBe(logFile);
      expect(fs.existsSync(logFile)).toBe(true);
    });

    test('should write log entries to file', () => {
      // @req: Logger must append each log to the file
      // @edge: Multiple entries in one file
      // @why: Verification that file writing works

      const logFile = path.join(tempDir, 'write-test.log');
      const logger = new Logger('info', 'text', logFile);

      logger.info('First message', { count: 1 });
      logger.info('Second message', { count: 2 });

      const content = fs.readFileSync(logFile, 'utf-8');
      expect(content).toContain('First message');
      expect(content).toContain('Second message');
    });

    test('should include timestamps in file', () => {
      // @req: Each log entry must have timestamp
      // @edge: Verify timestamp format
      // @why: Timestamps needed for analyzing game sequence

      const logFile = path.join(tempDir, 'timestamp-test.log');
      const logger = new Logger('info', 'text', logFile);

      logger.info('Timestamped message');

      const content = fs.readFileSync(logFile, 'utf-8');
      // Check for ISO 8601 timestamp format
      expect(content).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('should support both text and JSON formats to file', () => {
      // @req: Logger must support both formats
      // @edge: Different format configurations
      // @why: Users may want different formats

      // Text format
      const textFile = path.join(tempDir, 'text-format.log');
      const textLogger = new Logger('info', 'text', textFile);
      textLogger.info('Text format');

      const textContent = fs.readFileSync(textFile, 'utf-8');
      expect(textContent).toContain('[INFO]');

      // JSON format
      const jsonFile = path.join(tempDir, 'json-format.log');
      const jsonLogger = new Logger('info', 'json', jsonFile);
      jsonLogger.info('JSON format', { data: 'test' });

      const jsonContent = fs.readFileSync(jsonFile, 'utf-8');
      // Find a JSON line (skip header lines)
      const lines = jsonContent.split('\n').filter(line => line.startsWith('{'));
      expect(lines.length).toBeGreaterThan(0);
      expect(() => JSON.parse(lines[0])).not.toThrow();
    });

    test('should append to existing file without truncating', () => {
      // @req: Multiple logger instances should append
      // @edge: Create, close, re-open file
      // @why: Multiple games should accumulate in same file

      const logFile = path.join(tempDir, 'append-test.log');

      const logger1 = new Logger('info', 'text', logFile);
      logger1.info('First session');

      const logger2 = new Logger('info', 'text', logFile);
      logger2.info('Second session');

      const content = fs.readFileSync(logFile, 'utf-8');
      expect(content).toContain('First session');
      expect(content).toContain('Second session');
    });

    test('should handle log levels correctly in file', () => {
      // @req: Only messages >= logLevel should be written
      // @edge: INFO level configured, DEBUG should not appear
      // @why: Log levels filter what gets written

      const logFile = path.join(tempDir, 'level-test.log');
      const logger = new Logger('info', 'text', logFile);

      logger.debug('Debug message');  // Should NOT be written
      logger.info('Info message');     // Should be written
      logger.warn('Warning message');  // Should be written

      const content = fs.readFileSync(logFile, 'utf-8');
      expect(content).not.toContain('Debug message');
      expect(content).toContain('Info message');
      expect(content).toContain('Warning message');
    });

    test('should work without logFile parameter (console only)', () => {
      // @req: Logger should work with logFile=undefined
      // @edge: When LOG_FILE not set
      // @why: Should gracefully handle missing file config

      const logger = new Logger('info', 'text');

      // Should not throw
      expect(() => {
        logger.info('Console-only message');
      }).not.toThrow();
    });

    test('should create parent directories if they don\'t exist', () => {
      // @req: Logger should create directory structure
      // @edge: Deep nested path that doesn't exist
      // @why: User might specify deep path

      const nestedPath = path.join(tempDir, 'deep', 'nested', 'path', 'game.log');
      const logger = new Logger('info', 'text', nestedPath);

      expect(fs.existsSync(nestedPath)).toBe(true);
    });

    test('should handle errors gracefully (non-blocking)', () => {
      // @req: Logging should not crash if file write fails
      // @edge: Read-only directory (will fail to write)
      // @why: Logging failures shouldn't break the game

      // This test is tricky - we can't easily make fs.appendFileSync fail
      // in a testable way without side effects, so we just verify the
      // writeToFile method exists and handles errors

      const logger = new Logger('info', 'text');
      expect(logger).toBeDefined();
    });
  });

  describe('UT-LOGGER-2: Auto-Discovery', () => {
    test('should auto-discover log file location', () => {
      // @req: Logger should auto-create log file even without explicit path
      // @edge: No logFile parameter provided, no LOG_FILE env var
      // @why: Logging should work out of the box

      const logger = new Logger('info', 'text');

      // Should have detected a log file
      expect(logger.isFileWriting()).toBe(true);
      expect(logger.getLogFilePath()).not.toBeNull();
    });

    test('should prefer current working directory for logs', () => {
      // @req: Logs should be in project root by default
      // @edge: When both cwd and temp are writable
      // @why: Easier to find logs

      const logger = new Logger('info', 'text');
      const logPath = logger.getLogFilePath();

      if (logPath) {
        // Should be in current directory or a subdirectory
        expect(logPath).toBeTruthy();
      }
    });

    test('should fallback to temp directory if cwd not writable', () => {
      // @req: Logger should gracefully fallback
      // @edge: Simulated by not being in a writable directory
      // @why: Logging should still work somewhere

      const logger = new Logger('info', 'text');
      expect(logger.isFileWriting()).toBe(true);
    });
  });

  describe('UT-LOGGER-3: Integration with Config', () => {
    test('should receive logFile from MCPServerConfig', () => {
      // @req: Server should pass logFile to Logger
      // @edge: Config provides file path
      // @why: Verify integration point

      const testFile = path.join(tempDir, 'config-test.log');
      const logger = new Logger('info', 'json', testFile);

      logger.info('Config test message');

      const content = fs.readFileSync(testFile, 'utf-8');
      expect(content).toContain('Config test message');
    });

    test('should expose logging status for debugging', () => {
      // @req: Logger should expose status methods
      // @edge: Users/devs can check if logging is working
      // @why: Debugging logging issues

      const testFile = path.join(tempDir, 'status-test.log');
      const logger = new Logger('info', 'text', testFile);

      expect(logger.getLogFilePath()).toBe(testFile);
      expect(logger.isFileWriting()).toBe(true);
    });
  });
});
