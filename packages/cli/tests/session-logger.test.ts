/**
 * Test Suite: Session Logger for Turn-Based CLI
 *
 * Requirements: SL-* (Session Logging)
 * Validates automatic CLI invocation logging for audit trails
 *
 * @req: SL-1 - Automatic logging without additional flags
 * @req: SL-2 - Derive log filename from state file
 * @req: SL-3 - Capture both command input and CLI output
 * @req: SL-4 - Human-readable format for debugging
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

import {
  deriveLogPath,
  formatLogEntry,
  appendToSessionLog,
  createSessionStartEntry,
  createMoveEntry,
  createOutputEntry,
  createErrorEntry,
  logInvocation,
  SessionLogEntry
} from '../src/session-logger';

describe('Session Logger - Path Derivation', () => {
  describe('SL-2: Log filename from state file', () => {
    test('should derive .session.log from .json path', () => {
      // @req: SL-2 - Log filename derived from state file
      expect(deriveLogPath('/tmp/game.json')).toBe('/tmp/game.session.log');
    });

    test('should handle complex filenames', () => {
      // @req: SL-2 - Handle various filename patterns
      expect(deriveLogPath('/tmp/test-001.json')).toBe('/tmp/test-001.session.log');
      expect(deriveLogPath('/var/data/my-game-state.json')).toBe('/var/data/my-game-state.session.log');
    });

    test('should handle nested paths', () => {
      // @req: SL-2 - Handle deeply nested directories
      expect(deriveLogPath('/home/user/games/session-1/state.json'))
        .toBe('/home/user/games/session-1/state.session.log');
    });

    test('should handle relative paths', () => {
      // @req: SL-2 - Handle relative path formats
      expect(deriveLogPath('./game.json')).toBe('game.session.log');
      expect(deriveLogPath('../games/state.json')).toBe('../games/state.session.log');
    });
  });
});

describe('Session Logger - Entry Creation', () => {
  describe('createSessionStartEntry', () => {
    test('should create entry with all fields', () => {
      const entry = createSessionStartEntry(
        'node cli.js --init --seed test',
        'test',
        { edition: '2E', victoryPileSize: 4 }
      );

      expect(entry.type).toBe('SESSION_START');
      expect(entry.command).toBe('node cli.js --init --seed test');
      expect(entry.options).toEqual({ seed: 'test', edition: '2E', victoryPileSize: 4 });
      expect(entry.timestamp).toBeDefined();
    });

    test('should generate valid ISO timestamp', () => {
      const entry = createSessionStartEntry('cmd', 'seed', {});
      expect(() => new Date(entry.timestamp)).not.toThrow();
    });
  });

  describe('createMoveEntry', () => {
    test('should create move execution entry', () => {
      const entry = createMoveEntry(
        'node cli.js --move "buy Silver"',
        'buy Silver'
      );

      expect(entry.type).toBe('MOVE_EXECUTION');
      expect(entry.command).toBe('node cli.js --move "buy Silver"');
      expect(entry.move).toBe('buy Silver');
    });
  });

  describe('createOutputEntry', () => {
    test('should create output entry with success', () => {
      const entry = createOutputEntry('Game output here', 0, true);

      expect(entry.type).toBe('OUTPUT');
      expect(entry.output).toBe('Game output here');
      expect(entry.exitCode).toBe(0);
      expect(entry.success).toBe(true);
    });

    test('should handle failure exit code', () => {
      const entry = createOutputEntry('Error output', 1, false);

      expect(entry.exitCode).toBe(1);
      expect(entry.success).toBe(false);
    });
  });

  describe('createErrorEntry', () => {
    test('should create error entry', () => {
      const entry = createErrorEntry('State file not found', 1);

      expect(entry.type).toBe('ERROR');
      expect(entry.error).toBe('State file not found');
      expect(entry.exitCode).toBe(1);
    });
  });
});

describe('Session Logger - Entry Formatting', () => {
  describe('SL-4: Human-readable format', () => {
    test('should format session start entry with separator lines', () => {
      const entry = createSessionStartEntry(
        'node cli.js --init --seed test',
        'test',
        { edition: '2E' }
      );

      const formatted = formatLogEntry(entry);

      expect(formatted).toContain('SESSION_START');
      expect(formatted).toContain('node cli.js --init --seed test');
      expect(formatted).toContain('"edition":"2E"');
      expect(formatted).toContain('='.repeat(80)); // Separator line
    });

    test('should format move execution entry', () => {
      const entry = createMoveEntry(
        'node cli.js --move "buy Silver"',
        'buy Silver'
      );

      const formatted = formatLogEntry(entry);

      expect(formatted).toContain('MOVE_EXECUTION');
      expect(formatted).toContain('Move: buy Silver');
      expect(formatted).toContain('Command:');
    });

    test('should format output entry with delimiters', () => {
      const entry = createOutputEntry(
        'Turn 1 | Player 1 | Action Phase\nHand: Copper, Estate',
        0,
        true
      );

      const formatted = formatLogEntry(entry);

      expect(formatted).toContain('OUTPUT');
      expect(formatted).toContain('---'); // Output delimiter
      expect(formatted).toContain('Turn 1 | Player 1 | Action Phase');
      expect(formatted).toContain('Exit Code: 0');
      expect(formatted).toContain('Success: true');
    });

    test('should format error entry', () => {
      const entry = createErrorEntry('State file not found', 1);

      const formatted = formatLogEntry(entry);

      expect(formatted).toContain('ERROR');
      expect(formatted).toContain('Error: State file not found');
      expect(formatted).toContain('Exit Code: 1');
    });

    test('should include timestamp in formatted entry', () => {
      const entry = createSessionStartEntry('cmd', 'seed', {});
      const formatted = formatLogEntry(entry);

      // Should contain ISO timestamp pattern
      expect(formatted).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});

describe('Session Logger - File I/O', () => {
  let tempDir: string;
  let logPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'session-log-test-'));
    logPath = path.join(tempDir, 'game.session.log');
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('SL-1: Automatic logging', () => {
    test('should create log file on first write', async () => {
      // @req: SL-1 - Creates file if needed
      const entry = createSessionStartEntry('cmd', 'seed', {});

      await appendToSessionLog(logPath, entry);

      const exists = await fs.access(logPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    test('should append multiple entries to same file', async () => {
      // @req: SL-1 - Appends to existing file
      const entry1 = createSessionStartEntry('cmd1', 'seed', {});
      const entry2 = createMoveEntry('cmd2', 'buy Silver');

      await appendToSessionLog(logPath, entry1);
      await appendToSessionLog(logPath, entry2);

      const content = await fs.readFile(logPath, 'utf-8');
      expect(content).toContain('SESSION_START');
      expect(content).toContain('MOVE_EXECUTION');
    });

    test('should preserve entry order', async () => {
      const entry1 = createSessionStartEntry('cmd1', 'seed', {});
      const entry2 = createMoveEntry('cmd2', 'move1');
      const entry3 = createMoveEntry('cmd3', 'move2');

      await appendToSessionLog(logPath, entry1);
      await appendToSessionLog(logPath, entry2);
      await appendToSessionLog(logPath, entry3);

      const content = await fs.readFile(logPath, 'utf-8');
      const startIndex = content.indexOf('SESSION_START');
      const move1Index = content.indexOf('move1');
      const move2Index = content.indexOf('move2');

      expect(startIndex).toBeLessThan(move1Index);
      expect(move1Index).toBeLessThan(move2Index);
    });
  });

  describe('SL-3: Capture command and output', () => {
    test('should log complete init invocation with logInvocation', async () => {
      // @req: SL-3 - Capture both command and output
      const stateFilePath = path.join(tempDir, 'game.json');

      await logInvocation(stateFilePath, {
        type: 'init',
        command: 'node cli.js --init --seed test',
        seed: 'test',
        options: { edition: '2E' },
        output: 'Turn 1 | Player 1',
        exitCode: 0,
        success: true
      });

      const logContent = await fs.readFile(
        deriveLogPath(stateFilePath),
        'utf-8'
      );

      expect(logContent).toContain('SESSION_START');
      expect(logContent).toContain('node cli.js --init --seed test');
      expect(logContent).toContain('OUTPUT');
      expect(logContent).toContain('Turn 1 | Player 1');
      expect(logContent).toContain('Exit Code: 0');
    });

    test('should log move invocation', async () => {
      const stateFilePath = path.join(tempDir, 'game.json');

      await logInvocation(stateFilePath, {
        type: 'move',
        command: 'node cli.js --move "buy Silver"',
        move: 'buy Silver',
        output: 'Bought Silver',
        exitCode: 0,
        success: true
      });

      const logContent = await fs.readFile(
        deriveLogPath(stateFilePath),
        'utf-8'
      );

      expect(logContent).toContain('MOVE_EXECUTION');
      expect(logContent).toContain('Move: buy Silver');
      expect(logContent).toContain('Bought Silver');
      expect(logContent).toContain('Success: true');
    });

    test('should log errors', async () => {
      const stateFilePath = path.join(tempDir, 'game.json');

      await logInvocation(stateFilePath, {
        type: 'move',
        command: 'node cli.js --move "invalid"',
        move: 'invalid',
        output: '',
        exitCode: 1,
        error: 'Invalid move command'
      });

      const logContent = await fs.readFile(
        deriveLogPath(stateFilePath),
        'utf-8'
      );

      expect(logContent).toContain('MOVE_EXECUTION');
      expect(logContent).toContain('ERROR');
      expect(logContent).toContain('Invalid move command');
      expect(logContent).toContain('Exit Code: 1');
    });

    test('should log sequence of moves correctly', async () => {
      const stateFilePath = path.join(tempDir, 'game.json');

      // Initialize
      await logInvocation(stateFilePath, {
        type: 'init',
        command: 'node cli.js --init --seed test',
        seed: 'test',
        output: 'Turn 1 started',
        exitCode: 0,
        success: true
      });

      // Move 1
      await logInvocation(stateFilePath, {
        type: 'move',
        command: 'node cli.js --move "end"',
        move: 'end',
        output: 'Ended action phase',
        exitCode: 0,
        success: true
      });

      // Move 2
      await logInvocation(stateFilePath, {
        type: 'move',
        command: 'node cli.js --move "buy Silver"',
        move: 'buy Silver',
        output: 'Bought Silver',
        exitCode: 0,
        success: true
      });

      const logContent = await fs.readFile(
        deriveLogPath(stateFilePath),
        'utf-8'
      );

      // All entries should be present
      expect(logContent).toContain('SESSION_START');
      expect((logContent.match(/MOVE_EXECUTION/g) || []).length).toBe(2);
      expect((logContent.match(/OUTPUT/g) || []).length).toBe(3);
    });
  });
});

describe('Session Logger - Error Handling', () => {
  test('should not throw when log directory does not exist', async () => {
    // @req: SL-1 - Silent failure for logging errors
    const invalidPath = '/nonexistent/directory/game.json';

    // logInvocation should silently fail, not throw
    await expect(
      logInvocation(invalidPath, {
        type: 'init',
        command: 'cmd',
        output: 'output',
        exitCode: 0
      })
    ).resolves.not.toThrow();
  });

  test('should not throw for permission errors', async () => {
    // @req: SL-1 - Silent failure for logging errors
    // Note: This test may not work on all systems, but the behavior is consistent
    const invalidPath = '/root/protected/game.json';

    await expect(
      logInvocation(invalidPath, {
        type: 'move',
        command: 'cmd',
        move: 'test',
        output: 'output',
        exitCode: 0
      })
    ).resolves.not.toThrow();
  });
});

describe('Session Logger - Log Format Verification', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'session-log-format-'));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  test('should produce parseable log format', async () => {
    // @req: SL-4 - Format should be parseable
    const stateFilePath = path.join(tempDir, 'game.json');

    await logInvocation(stateFilePath, {
      type: 'init',
      command: 'node cli.js --init --seed test',
      seed: 'test',
      options: { edition: '2E' },
      output: 'Game initialized',
      exitCode: 0,
      success: true
    });

    const logContent = await fs.readFile(
      deriveLogPath(stateFilePath),
      'utf-8'
    );

    // Verify structure
    const lines = logContent.split('\n');

    // Should have separator lines
    const separatorCount = lines.filter(l => l === '='.repeat(80)).length;
    expect(separatorCount).toBeGreaterThanOrEqual(2);

    // Should have timestamp bracketed entries
    const timestampLines = lines.filter(l => l.match(/^\[\d{4}-\d{2}-\d{2}T/));
    expect(timestampLines.length).toBeGreaterThanOrEqual(1);

    // Should have output delimiters
    const delimiterCount = lines.filter(l => l === '---').length;
    expect(delimiterCount).toBe(2); // Opening and closing
  });

  test('should handle multi-line output correctly', async () => {
    const stateFilePath = path.join(tempDir, 'game.json');
    const multiLineOutput = `Turn 1 | Player 1 | Action Phase
============================================================
Hand: Copper, Copper, Copper, Estate, Estate
Actions: 1  Buys: 1  Coins: $0

Available Moves:
  [1] End Action Phase`;

    await logInvocation(stateFilePath, {
      type: 'move',
      command: 'node cli.js --move "1"',
      move: '1',
      output: multiLineOutput,
      exitCode: 0,
      success: true
    });

    const logContent = await fs.readFile(
      deriveLogPath(stateFilePath),
      'utf-8'
    );

    // Multi-line output should be preserved
    expect(logContent).toContain('Turn 1 | Player 1 | Action Phase');
    expect(logContent).toContain('Hand: Copper');
    expect(logContent).toContain('[1] End Action Phase');
  });
});
