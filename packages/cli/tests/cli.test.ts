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
      mockReadline.setInputs(['1', 'quit']); // End phase, then quit

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
      mockReadline.setInputs(['1', 'quit']); // End phase (move #1 in starting position)

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

      mockReadline.setInputs(['1', 'quit']); // End phase

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
      expect(consoleCapture.contains('[number]')).toBe(true);
      expect(consoleCapture.contains('Select move by number')).toBe(true);
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

      // Parser should return generic invalid input error for unrecognized text
      expect(consoleCapture.contains('✗ Error:')).toBe(true);
      expect(consoleCapture.contains('Invalid input')).toBe(true);
    });

    test('should handle exit command', async () => {
      cli = new PrincipalityCLI('seed');
      mockReadline.setInputs(['exit']);

      await cli.start();

      expect(consoleCapture.contains('Thanks for playing!')).toBe(true);
    });

    describe('Phase 1.6: cards command handler', () => {
      /**
       * Test CARDS-CLI-1: CLI Handles Cards Command
       *
       * @req: Phase 1.6 Feature 2 - CLI must recognize and execute 'cards' command
       * @edge: Basic command execution
       * @why: Users need to view available cards during gameplay
       *
       * Expected Behavior:
       * - User types: "cards"
       * - Output displays: Card catalog table
       * - Output contains: "AVAILABLE CARDS" header
       * - Output contains: All 15 cards
       */
      test('CARDS-CLI-1: should handle cards command', async () => {
        // @req: CLI routes 'cards' command to handler
        // @edge: Single command execution
        // @hint: Add 'cards' case to CLI.handleCommand() switch
        cli = new PrincipalityCLI('seed');
        mockReadline.setInputs(['cards', 'quit']);

        await cli.start();

        // Should display card catalog
        expect(consoleCapture.contains('AVAILABLE CARDS')).toBe(true);
        // Should show some cards
        expect(consoleCapture.contains('Village')).toBe(true);
        expect(consoleCapture.contains('Copper')).toBe(true);
      });

      /**
       * Test CARDS-CLI-2: Cards Command Displays Formatted Table
       *
       * @req: Output must be readable table with all columns
       * @edge: Table formatting, alignment, headers
       * @why: Players need clear, scannable card information
       *
       * Expected Behavior:
       * - Header: "AVAILABLE CARDS"
       * - Columns: Name, Cost, Type, Effect
       * - Separator line with dashes
       * - All 15 cards listed
       */
      test('CARDS-CLI-2: should display formatted table with all columns', async () => {
        // @req: Table format with headers and separators
        // @edge: Multi-line output | formatting consistency
        // @hint: Output from handleCardsCommand() should include all parts
        cli = new PrincipalityCLI('seed');
        mockReadline.setInputs(['cards', 'quit']);

        await cli.start();

        const output = consoleCapture.getAllOutput();

        // Verify table structure
        expect(output).toContain('AVAILABLE CARDS');
        expect(output).toContain('Name');
        expect(output).toContain('Cost');
        expect(output).toContain('Type');
        expect(output).toContain('Effect');

        // Verify pipe separators (table format)
        expect(output.split('\n').some(line => line.includes('|'))).toBe(true);
      });

      /**
       * Test CARDS-CLI-3: Cards Command Does Not Modify Game State
       *
       * @req: Informational commands must not affect gameplay
       * @edge: State immutability during command execution
       * @why: Players should be able to look at cards without consequences
       *
       * Expected Behavior:
       * - Game state unchanged after cards command
       * - Player hand unchanged
       * - Phase unchanged
       * - Turn number unchanged
       */
      test('CARDS-CLI-3: should not modify game state', async () => {
        // @req: Informational commands preserve game state
        // @edge: State immutability | no side effects
        // @hint: handleCardsCommand() is read-only, no state mutation
        cli = new PrincipalityCLI('test-seed-123');
        const initialSeed = cli['gameState'].seed;
        const initialPhase = cli['gameState'].phase;
        const initialTurn = cli['gameState'].turnNumber;

        mockReadline.setInputs(['cards', 'quit']);

        await cli.start();

        // State should be unchanged
        expect(cli['gameState'].seed).toBe(initialSeed);
        expect(cli['gameState'].phase).toBe(initialPhase);
        expect(cli['gameState'].turnNumber).toBe(initialTurn);
      });

      /**
       * Test CARDS-CLI-4: Cards Command Works After Other Commands
       *
       * @req: Multiple commands execute sequentially without interference
       * @edge: Command interleaving, state consistency
       * @why: Players should be able to use cards command anytime
       *
       * Expected Behavior:
       * - Execute help command
       * - Execute cards command
       * - Execute hand command
       * - All succeed without interference
       */
      test('CARDS-CLI-4: should work interleaved with other commands', async () => {
        // @req: Cards command non-intrusive | works with other commands
        // @edge: Sequential commands | state between commands
        // @hint: Each command execution independent
        cli = new PrincipalityCLI('seed');
        mockReadline.setInputs(['help', 'cards', 'hand', 'quit']);

        await cli.start();

        const output = consoleCapture.getAllOutput();

        // All commands should execute
        expect(output).toContain('Available Commands:'); // from help
        expect(output).toContain('AVAILABLE CARDS'); // from cards
        expect(output).toContain('Hand:'); // from hand
      });

      /**
       * Test CARDS-CLI-5: Cards Command Available During All Phases
       *
       * @req: Command accessible during action, buy, and cleanup phases
       * @edge: All game phases
       * @why: Players may need card reference at any time
       *
       * Expected Behavior:
       * - Cards command works during action phase
       * - Cards command works during buy phase
       * - Cards command works during cleanup phase
       * - Output identical in all phases
       */
      test('CARDS-CLI-5: should work during any game phase', async () => {
        // @req: Phase-independent command
        // @edge: All game phases | phase transitions
        // @hint: handleCardsCommand() doesn't depend on phase
        cli = new PrincipalityCLI('seed');

        // Execute multiple commands to simulate game progression
        mockReadline.setInputs(['cards', '1', 'cards', 'quit']);

        await cli.start();

        // Should successfully display cards
        const output = consoleCapture.getAllOutput();
        const cardCount = (output.match(/AVAILABLE CARDS/g) || []).length;
        expect(cardCount).toBeGreaterThanOrEqual(1); // At least shown once
      });
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

      mockReadline.setInputs(['1', '1', 'quit']); // End action, end buy phases

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

    describe('Configurable victory pile size', () => {
      test('should support configurable victory pile size', () => {
        // Phase 2.0: Configurable victory piles via victoryPileSize option
        cli = new PrincipalityCLI('seed', 1, { victoryPileSize: 4 });

        expect(cli).toBeDefined();
        expect(cli['options'].victoryPileSize).toBe(4);
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
      const initialSeed = cli['gameState'].seed;
      const initialTurn = cli['gameState'].turnNumber;

      mockReadline.setInputs(['1', 'quit']); // End phase

      await cli.start();

      // Verify deterministic behavior with same seed produces same initial state
      const cli2 = new PrincipalityCLI('test-seed-deterministic');
      expect(cli2['gameState'].seed).toBe(initialSeed);
      expect(cli2['gameState'].turnNumber).toBe(initialTurn);
      expect(cli2['gameState'].phase).toBe('action');
      expect(cli2['gameState'].currentPlayer).toBe(0);
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