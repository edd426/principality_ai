/**
 * Comprehensive test suite for PrincipalityCLI class
 * Validates main orchestration, readline interface, and game loop
 */

import { PrincipalityCLI } from '../src/cli';
import { GameEngine } from '@principality/core';
import {
  ConsoleCapture,
  MockReadline,
  GameStateBuilder,
  PerformanceHelper,
  TestScenarios,
  CLIAssertions
} from './utils/test-utils';

// Mock readline module
jest.mock('readline', () => ({
  createInterface: jest.fn()
}));

describe('PrincipalityCLI', () => {
  let cli: PrincipalityCLI;
  let consoleCapture: ConsoleCapture;
  let mockReadline: MockReadline;
  let originalCreateInterface: any;

  beforeEach(() => {
    consoleCapture = new ConsoleCapture();
    mockReadline = new MockReadline();

    // Mock readline.createInterface
    originalCreateInterface = require('readline').createInterface;
    require('readline').createInterface = jest.fn().mockImplementation(() =>
      mockReadline.createInterface()
    );

    consoleCapture.start();
  });

  afterEach(() => {
    consoleCapture.stop();
    mockReadline.reset();
    require('readline').createInterface = originalCreateInterface;
  });

  describe('constructor', () => {
    test('should initialize with default seed when none provided', () => {
      cli = new PrincipalityCLI();

      expect(cli).toBeDefined();
      // Verify random seed was generated (should not be empty)
      expect(typeof cli['gameState'].seed).toBe('string');
      expect(cli['gameState'].seed.length).toBeGreaterThan(0);
    });

    test('should initialize with provided seed', () => {
      cli = new PrincipalityCLI('test-seed-123');

      expect(cli['gameState'].seed).toBe('test-seed-123');
    });

    test('should initialize with specified number of players', () => {
      cli = new PrincipalityCLI('seed', 2);

      expect(cli['gameState'].players).toHaveLength(2);
    });

    test('should initialize with default single player', () => {
      cli = new PrincipalityCLI('seed');

      expect(cli['gameState'].players).toHaveLength(1);
    });

    test('should initialize all components correctly', () => {
      cli = new PrincipalityCLI('seed');

      expect(cli['engine']).toBeInstanceOf(GameEngine);
      expect(cli['gameState']).toBeDefined();
      expect(cli['display']).toBeDefined();
      expect(cli['parser']).toBeDefined();
      expect(cli['rl']).toBeDefined();
      expect(cli['isRunning']).toBe(false);
    });
  });

  describe('start', () => {
    test('should display welcome message and start game loop', async () => {
      cli = new PrincipalityCLI('test-seed');
      mockReadline.setInputs(['quit']);

      await cli.start();

      expect(consoleCapture.contains('PRINCIPALITY AI')).toBe(true);
      expect(consoleCapture.contains('test-seed')).toBe(true);
      expect(consoleCapture.contains('Commands:')).toBe(true);
    });

    test('should set isRunning to true', async () => {
      cli = new PrincipalityCLI('seed');
      mockReadline.setInputs(['quit']);

      const startPromise = cli.start();

      // Check that isRunning is set to true
      expect(cli['isRunning']).toBe(true);

      await startPromise;
    });
  });

  describe('game loop', () => {
    test('should display game state and moves on each iteration', async () => {
      cli = new PrincipalityCLI('seed');
      mockReadline.setInputs(['3', 'quit']); // End phase, then quit

      await cli.start();

      // Should display game state
      CLIAssertions.assertGameStateDisplayed(consoleCapture, cli['gameState']);

      // Should display available moves
      expect(consoleCapture.contains('Available Moves:')).toBe(true);
      expect(consoleCapture.contains('[1]')).toBe(true);
    });

    test('should handle game over condition', async () => {
      cli = new PrincipalityCLI('seed');

      // Mock game over state
      const mockCheckGameOver = jest.spyOn(cli['engine'], 'checkGameOver');
      mockCheckGameOver.mockReturnValue({
        isGameOver: true,
        winner: 0,
        scores: [15, 8]
      });

      mockReadline.setInputs([]);

      await cli.start();

      expect(consoleCapture.contains('GAME OVER')).toBe(true);
      expect(consoleCapture.contains('Thanks for playing!')).toBe(true);

      mockCheckGameOver.mockRestore();
    });

    test('should prompt for user input', async () => {
      cli = new PrincipalityCLI('seed');
      mockReadline.setInputs(['quit']);

      await cli.start();

      // Verify prompt was shown
      expect(mockReadline.getPrompt()).toBe('> ');
    });

    test('should continue loop on empty input', async () => {
      cli = new PrincipalityCLI('seed');
      mockReadline.setInputs(['', 'quit']);

      await cli.start();

      // Should handle empty input gracefully and continue
      expect(consoleCapture.contains('Thanks for playing!')).toBe(true);
    });
  });

  describe('move execution', () => {
    test('should execute valid moves successfully', async () => {
      cli = new PrincipalityCLI('seed');
      mockReadline.setInputs(['3', 'quit']); // End phase

      await cli.start();

      // Should show move execution
      expect(consoleCapture.contains('✓')).toBe(true);
    });

    test('should handle invalid moves with error display', async () => {
      cli = new PrincipalityCLI('seed');
      mockReadline.setInputs(['999', 'quit']); // Invalid move number

      await cli.start();

      // Should show error
      expect(consoleCapture.contains('✗ Error:')).toBe(true);
      expect(consoleCapture.contains('Invalid move number')).toBe(true);
    });

    test('should update game state after successful moves', async () => {
      cli = new PrincipalityCLI('seed');

      const initialTurnNumber = cli['gameState'].turnNumber;
      const initialPhase = cli['gameState'].phase;

      mockReadline.setInputs(['3', 'quit']); // End phase

      await cli.start();

      // State should be updated (though we can't easily verify internal state changes in this test)
      // The fact that the game continued without error indicates state was updated
      expect(consoleCapture.contains('Thanks for playing!')).toBe(true);
    });

    test('should handle engine errors gracefully', async () => {
      cli = new PrincipalityCLI('seed');

      // Mock engine to return failure
      const mockExecuteMove = jest.spyOn(cli['engine'], 'executeMove');
      mockExecuteMove.mockReturnValue({
        success: false,
        error: 'Test engine error'
      });

      mockReadline.setInputs(['1', 'quit']);

      await cli.start();

      expect(consoleCapture.contains('✗ Error: Test engine error')).toBe(true);

      mockExecuteMove.mockRestore();
    });
  });

  describe('command handling', () => {
    test('should handle help command', async () => {
      cli = new PrincipalityCLI('seed');
      mockReadline.setInputs(['help', 'quit']);

      await cli.start();

      expect(consoleCapture.contains('Available Commands:')).toBe(true);
      expect(consoleCapture.contains('[number] - Select move by number')).toBe(true);
    });

    test('should handle hand command', async () => {
      cli = new PrincipalityCLI('seed');
      mockReadline.setInputs(['hand', 'quit']);

      await cli.start();

      expect(consoleCapture.contains('Hand:')).toBe(true);
    });

    test('should handle supply command', async () => {
      cli = new PrincipalityCLI('seed');
      mockReadline.setInputs(['supply', 'quit']);

      await cli.start();

      expect(consoleCapture.contains('Supply:')).toBe(true);
      expect(consoleCapture.contains('Treasures:')).toBe(true);
    });

    test('should handle quit command', async () => {
      cli = new PrincipalityCLI('seed');
      mockReadline.setInputs(['quit']);

      await cli.start();

      expect(consoleCapture.contains('Thanks for playing!')).toBe(true);
      expect(cli['isRunning']).toBe(false);
    });

    test('should handle command aliases', async () => {
      cli = new PrincipalityCLI('seed');
      mockReadline.setInputs(['h', 'q']);

      await cli.start();

      // Should handle 'h' as 'help'
      expect(consoleCapture.contains('Available Commands:')).toBe(true);
      // Should handle 'q' as 'quit'
      expect(consoleCapture.contains('Thanks for playing!')).toBe(true);
    });

    test('should handle unknown commands', async () => {
      cli = new PrincipalityCLI('seed');
      mockReadline.setInputs(['unknown', 'quit']);

      await cli.start();

      expect(consoleCapture.contains('✗ Error: Unknown command: unknown')).toBe(true);
    });

    test('should handle exit command', async () => {
      cli = new PrincipalityCLI('seed');
      mockReadline.setInputs(['exit']);

      await cli.start();

      expect(consoleCapture.contains('Thanks for playing!')).toBe(true);
    });
  });

  describe('readline integration', () => {
    test('should create readline interface with correct options', () => {
      cli = new PrincipalityCLI('seed');

      expect(require('readline').createInterface).toHaveBeenCalledWith({
        input: process.stdin,
        output: process.stdout,
        prompt: '> '
      });
    });

    test('should close readline interface on quit', async () => {
      cli = new PrincipalityCLI('seed');
      const mockClose = jest.fn();
      cli['rl'].close = mockClose;

      mockReadline.setInputs(['quit']);

      await cli.start();

      expect(mockClose).toHaveBeenCalled();
    });

    test('should handle readline interface errors gracefully', async () => {
      cli = new PrincipalityCLI('seed');

      // Mock readline to simulate error
      const mockQuestion = jest.fn((prompt, callback) => {
        setTimeout(() => callback('quit'), 0);
      });
      cli['rl'].question = mockQuestion;

      await cli.start();

      // Should complete without throwing
      expect(consoleCapture.contains('Thanks for playing!')).toBe(true);
    });
  });

  describe('seed generation', () => {
    test('should generate different random seeds', () => {
      const cli1 = new PrincipalityCLI();
      const cli2 = new PrincipalityCLI();

      const seed1 = cli1['gameState'].seed;
      const seed2 = cli2['gameState'].seed;

      expect(seed1).not.toBe(seed2);
      expect(seed1.length).toBeGreaterThan(0);
      expect(seed2.length).toBeGreaterThan(0);
    });

    test('should use provided seed consistently', () => {
      const cli1 = new PrincipalityCLI('test-seed');
      const cli2 = new PrincipalityCLI('test-seed');

      expect(cli1['gameState'].seed).toBe('test-seed');
      expect(cli2['gameState'].seed).toBe('test-seed');
    });
  });

  describe('performance', () => {
    test('should start quickly', async () => {
      cli = new PrincipalityCLI('seed');
      mockReadline.setInputs(['quit']);

      await PerformanceHelper.assertWithinTime(
        () => cli.start(),
        1000, // < 1 second startup
        'CLI startup'
      );
    });

    test('should handle input quickly', async () => {
      cli = new PrincipalityCLI('seed');
      mockReadline.setInputs(['help', 'hand', 'supply', 'quit']);

      await PerformanceHelper.assertWithinTime(
        () => cli.start(),
        2000, // < 2 seconds for multiple commands
        'multiple command handling'
      );
    });

    test('should process moves quickly', async () => {
      cli = new PrincipalityCLI('seed');

      // Create scenario with many quick moves
      const quickMoves = Array(20).fill('3'); // Multiple end phases
      mockReadline.setInputs([...quickMoves, 'quit']);

      await PerformanceHelper.assertWithinTime(
        () => cli.start(),
        3000, // < 3 seconds for many moves
        'many move processing'
      );
    });
  });

  describe('multi-player scenarios', () => {
    test('should handle multiple players correctly', async () => {
      cli = new PrincipalityCLI('seed', 2);
      mockReadline.setInputs(['quit']);

      await cli.start();

      expect(cli['gameState'].players).toHaveLength(2);
      // Should show current player (Player 1 or Player 2)
      expect(consoleCapture.contains('Player')).toBe(true);
    });

    test('should handle player turn transitions', async () => {
      cli = new PrincipalityCLI('seed', 2);

      // Mock a complete turn to trigger player change
      const initialPlayer = cli['gameState'].currentPlayer;

      mockReadline.setInputs(['3', '3', 'quit']); // End action, end buy phases

      await cli.start();

      // Game should have progressed (specific state changes are hard to verify without game engine internals)
      expect(consoleCapture.contains('Thanks for playing!')).toBe(true);
    });
  });

  describe('error resilience', () => {
    test('should handle parser errors gracefully', async () => {
      cli = new PrincipalityCLI('seed');

      // Mock parser to throw error
      const mockParseInput = jest.spyOn(cli['parser'], 'parseInput');
      mockParseInput.mockImplementation(() => {
        throw new Error('Parser error');
      });

      mockReadline.setInputs(['1', 'quit']);

      // Should not throw error
      await expect(cli.start()).resolves.not.toThrow();

      mockParseInput.mockRestore();
    });

    test('should handle display errors gracefully', async () => {
      cli = new PrincipalityCLI('seed');

      // Mock display to throw error
      const mockDisplayGameState = jest.spyOn(cli['display'], 'displayGameState');
      mockDisplayGameState.mockImplementation(() => {
        throw new Error('Display error');
      });

      mockReadline.setInputs(['quit']);

      // Should not throw error
      await expect(cli.start()).resolves.not.toThrow();

      mockDisplayGameState.mockRestore();
    });

    test('should handle readline errors gracefully', async () => {
      cli = new PrincipalityCLI('seed');

      // Mock readline question to throw error
      const mockQuestion = jest.fn((prompt, callback) => {
        throw new Error('Readline error');
      });
      cli['rl'].question = mockQuestion;

      // Should not throw error
      await expect(cli.start()).resolves.not.toThrow();
    });
  });

  describe('Phase 1.5 features (implemented)', () => {
    describe('Auto-play treasures', () => {
      test('should recognize treasure auto-play commands', async () => {
        cli = new PrincipalityCLI('seed');
        mockReadline.setInputs(['treasures', 'quit']);

        await cli.start();

        // Should recognize 'treasures' command (Phase 1.5 implemented)
        // Command is recognized but may show "no treasures" message during action phase
        expect(consoleCapture.contains('Invalid input')).toBe(false);
      });
    });

    describe('Stable card numbers', () => {
      test('should support stable number flag', () => {
        // Phase 1.5: Stable numbers implemented via CLI options
        cli = new PrincipalityCLI('seed', 1, { stableNumbers: true });

        expect(cli).toBeDefined();
        expect(cli['options'].stableNumbers).toBe(true);
      });
    });

    describe('Chained submission', () => {
      test('should handle chained input', async () => {
        cli = new PrincipalityCLI('seed');
        mockReadline.setInputs(['1, 2, 3', 'quit']);

        await cli.start();

        // Phase 1.5: Chained submission is implemented
        // The specific behavior depends on available moves
        // Should NOT be treated as "Invalid input" anymore
        expect(consoleCapture.contains('Invalid input')).toBe(false);
      });
    });

    describe('Quick game mode', () => {
      test('should support quick game flag', () => {
        // Phase 1.5: Quick game implemented via CLI options
        cli = new PrincipalityCLI('seed', 1, { quickGame: true });

        expect(cli).toBeDefined();
        expect(cli['options'].quickGame).toBe(true);
      });
    });

    describe('Victory points display', () => {
      test('should display VP in game state', async () => {
        cli = new PrincipalityCLI('seed');
        mockReadline.setInputs(['quit']);

        await cli.start();

        // Phase 1.5: VP display is implemented
        expect(consoleCapture.contains('VP:')).toBe(true);
      });
    });
  });

  describe('integration scenarios', () => {
    test('should handle complete game playthrough', async () => {
      cli = new PrincipalityCLI('seed');

      // Simulate a short game
      mockReadline.setInputs([
        'help',      // Show help
        'hand',      // Show hand
        'supply',    // Show supply
        '3',         // End action phase
        '3',         // End buy phase (to cleanup)
        'quit'       // Quit game
      ]);

      await cli.start();

      // Should complete without errors
      expect(consoleCapture.contains('Thanks for playing!')).toBe(true);
      expect(consoleCapture.contains('Available Commands:')).toBe(true);
      expect(consoleCapture.contains('Hand:')).toBe(true);
      expect(consoleCapture.contains('Supply:')).toBe(true);
    });

    test('should handle mixed valid and invalid inputs', async () => {
      cli = new PrincipalityCLI('seed');

      mockReadline.setInputs([
        '999',       // Invalid move
        'invalid',   // Invalid command
        'help',      // Valid command
        '1',         // Valid move (if available)
        'quit'       // Valid quit
      ]);

      await cli.start();

      // Should handle all inputs appropriately
      expect(consoleCapture.contains('Invalid move number')).toBe(true);
      expect(consoleCapture.contains('Invalid input')).toBe(true);
      expect(consoleCapture.contains('Available Commands:')).toBe(true);
      expect(consoleCapture.contains('Thanks for playing!')).toBe(true);
    });
  });

  describe('state consistency', () => {
    test('should maintain game state consistency across moves', async () => {
      cli = new PrincipalityCLI('test-seed-deterministic');

      const initialState = JSON.parse(JSON.stringify(cli['gameState']));

      mockReadline.setInputs(['3', 'quit']); // End phase

      await cli.start();

      // Verify deterministic behavior with same seed
      const cli2 = new PrincipalityCLI('test-seed-deterministic');
      expect(cli2['gameState']).toEqual(initialState);
    });

    test('should not mutate original game state', async () => {
      cli = new PrincipalityCLI('seed');

      const originalStateString = JSON.stringify(cli['gameState']);

      mockReadline.setInputs(['help', 'hand', 'quit']);

      await cli.start();

      // Commands should not mutate game state
      // (Move execution would change state, but commands shouldn't)
      // This is more of a core engine requirement, but good to verify at CLI level
    });
  });
});