/**
 * Test Suite: Phase 1.6 Integration Tests
 *
 * Status: DRAFT - Tests written first (TDD approach)
 * Created: 2025-10-21
 * Phase: 1.6
 *
 * Requirements Reference: docs/requirements/phase-1.6/TESTING.md
 *
 * Integration Tests validate Features 1 and 2 working together in a live game:
 * - Help and cards commands available during gameplay
 * - Commands don't interfere with each other or game flow
 * - Game state remains immutable after command execution
 * - Performance maintained in real game scenarios
 *
 * These tests verify the complete user experience from CLI perspective,
 * testing that both commands work seamlessly during actual gameplay.
 *
 * Test Count: 7 integration tests total
 */

import { GameEngine, GameState } from '@principality/core';
import { GameStateBuilder, ConsoleCapture, PerformanceHelper } from '../utils/test-utils';

/**
 * Mock functions to be replaced by actual CLI implementations
 * These provide a reference for expected behavior
 */
function executeCommand(game: GameState, command: string): string {
  // TODO: Implement command router in packages/cli/src/index.ts
  // For testing, return mock output
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const arg = parts.slice(1).join(' ');

  if (cmd === 'help' || cmd === 'h') {
    // Return help output
    return `Test Card | 0 | action | Test effect`;
  } else if (cmd === 'cards') {
    // Return cards table
    return `=== AVAILABLE CARDS ===\nName | Cost | Type | Effect`;
  }

  return 'Unknown command';
}

describe('Phase 1.6 Integration Tests', () => {
  let engine: GameEngine;
  let capture: ConsoleCapture;

  beforeEach(() => {
    engine = new GameEngine('integration-test-seed');
    capture = new ConsoleCapture();
  });

  afterEach(() => {
    capture.stop();
  });

  describe('Help Command Integration (IT-1.9 to IT-1.13)', () => {
    /**
     * Test IT-1.9: Help During Action Phase
     *
     * Requirement: Help command works during action phase (FR1.4, AC1.5)
     *
     * Setup:
     * - Initialize game (starts in action phase)
     * - Execute help command for Village
     *
     * Expected Result:
     * - Output contains "Village" and card info
     * - Game phase unchanged (still 'action')
     * - Turn number unchanged (still 1)
     * - Player stats unchanged
     * - Can execute next move
     */
    test('IT-1.9: help command works during action phase', () => {
      const game = GameStateBuilder.create()
        .withPhase('action')
        .withTurnNumber(1)
        .withPlayerStats(0, { actions: 1, buys: 1, coins: 0 })
        .build();

      const originalPhase = game.phase;
      const originalTurn = game.turnNumber;
      const originalActions = game.players[0].actions;

      capture.start();
      const output = executeCommand(game, 'help Village');
      capture.stop();

      expect(output).toContain('Village');

      // Verify game state unchanged
      expect(game.phase).toBe(originalPhase);
      expect(game.turnNumber).toBe(originalTurn);
      expect(game.players[0].actions).toBe(originalActions);
    });

    /**
     * Test IT-1.10: Help During Buy Phase
     *
     * Requirement: Help works during buy phase (FR1.4)
     *
     * Setup:
     * - Game in buy phase after action phase complete
     * - Execute help command for Province
     *
     * Expected Result:
     * - Output contains "Province" and cost "8"
     * - Game phase unchanged (still 'buy')
     * - Player coins unchanged
     */
    test('IT-1.10: help command works during buy phase', () => {
      const game = GameStateBuilder.create()
        .withPhase('buy')
        .withPlayerStats(0, { actions: 0, buys: 1, coins: 10 })
        .build();

      const originalPhase = game.phase;
      const originalCoins = game.players[0].coins;

      capture.start();
      const output = executeCommand(game, 'help Province');
      capture.stop();

      expect(output).toContain('Province');
      expect(output).toContain('8');

      // Verify state unchanged
      expect(game.phase).toBe(originalPhase);
      expect(game.players[0].coins).toBe(originalCoins);
    });

    /**
     * Test IT-1.11: Help Between Turns
     *
     * Requirement: Help works between turns (FR1.4)
     *
     * Setup:
     * - Game after cleanup phase (waiting for next player)
     *
     * Expected Result:
     * - Help displays correctly
     * - Game state unchanged
     */
    test('IT-1.11: help command works between turns', () => {
      const game = GameStateBuilder.create()
        .withPhase('cleanup')
        .withTurnNumber(2)
        .build();

      const originalState = JSON.stringify(game);

      capture.start();
      const output = executeCommand(game, 'help Smithy');
      capture.stop();

      expect(output).toContain('Smithy');
      expect(JSON.stringify(game)).toBe(originalState);
    });

    /**
     * Test IT-1.12: Multiple Help Commands Don't Interrupt
     *
     * Requirement: Multiple help calls don't affect gameplay (AC1.1)
     *
     * Setup:
     * - Initial game state (action phase, turn 1)
     *
     * Execution:
     * - Call help 3 times with different cards
     * - Verify state unchanged after each
     *
     * Expected Result:
     * - All help calls succeed
     * - Hand unchanged
     * - Phase unchanged
     * - Turn number unchanged
     * - No interference between calls
     */
    test('IT-1.12: help command does not interrupt gameplay', () => {
      const game = GameStateBuilder.create()
        .withPhase('action')
        .withTurnNumber(1)
        .withPlayerHand(0, ['Village', 'Copper'])
        .build();

      const originalHand = [...game.players[0].hand];
      const originalPhase = game.phase;
      const originalTurn = game.turnNumber;

      capture.start();

      const output1 = executeCommand(game, 'help Village');
      const output2 = executeCommand(game, 'help Copper');
      const output3 = executeCommand(game, 'help Province');

      capture.stop();

      expect(output1).toContain('Village');
      expect(output2).toContain('Copper');
      expect(output3).toContain('Province');

      // Verify no state change
      expect(game.players[0].hand).toEqual(originalHand);
      expect(game.phase).toBe(originalPhase);
      expect(game.turnNumber).toBe(originalTurn);
    });

    /**
     * Test IT-1.13: Help After Error Still Works
     *
     * Requirement: Errors don't break subsequent help commands
     *
     * Execution:
     * - Call help with unknown card (error)
     * - Call help with known card (success)
     * - Call help again (success)
     *
     * Expected Result:
     * - All three commands execute
     * - Error doesn't prevent future help calls
     */
    test('IT-1.13: help works after encountering error', () => {
      const game = engine.initializeGame(1);

      capture.start();

      const errorOutput = executeCommand(game, 'help UnknownCard');
      expect(errorOutput).toContain('Unknown card');

      const successOutput1 = executeCommand(game, 'help Village');
      expect(successOutput1).toContain('Village');

      const successOutput2 = executeCommand(game, 'help Smithy');
      expect(successOutput2).toContain('Smithy');

      capture.stop();

      // Verify game state unchanged
      expect(game.phase).toBe('action');
      expect(game.turnNumber).toBe(1);
    });
  });

  describe('Cards Command Integration (IT-2.6 to IT-2.8)', () => {
    /**
     * Test IT-2.6: Cards Command During Gameplay
     *
     * Requirement: Cards works during active game (FR2.5)
     *
     * Setup:
     * - Active game (action phase, turn 1)
     *
     * Execution:
     * - Execute cards command
     * - Capture output
     *
     * Expected Result:
     * - Table displayed with all cards
     * - Game state completely unchanged
     */
    test('IT-2.6: cards command works during active game', () => {
      const game = GameStateBuilder.create()
        .withPhase('action')
        .withPlayerStats(0, { actions: 1, buys: 1, coins: 0 })
        .build();

      const originalState = JSON.stringify(game);

      capture.start();
      const output = executeCommand(game, 'cards');
      capture.stop();

      expect(output).toContain('AVAILABLE CARDS');
      expect(JSON.stringify(game)).toBe(originalState);
    });

    /**
     * Test IT-2.7: Cards Command at Game Start
     *
     * Requirement: Cards available before first turn (FR2.5)
     *
     * Setup:
     * - New game (turn 1, action phase)
     *
     * Expected Result:
     * - Catalog displayed
     * - Contains all 15 cards
     * - Player can learn about cards before acting
     * - Turn number still 1
     */
    test('IT-2.7: cards command works before first turn', () => {
      const game = engine.initializeGame(1);
      expect(game.turnNumber).toBe(1);

      capture.start();
      const output = executeCommand(game, 'cards');
      capture.stop();

      expect(output).toContain('AVAILABLE CARDS');
      expect(game.turnNumber).toBe(1); // Unchanged
    });

    /**
     * Test IT-2.8: Cards Command Non-Intrusive
     *
     * Requirement: Multiple cards commands don't interrupt (FR2.5)
     *
     * Execution:
     * - Call cards multiple times
     * - Verify no state change
     *
     * Expected Result:
     * - All calls succeed
     * - Game state unchanged
     * - Game can continue normally
     */
    test('IT-2.8: cards command does not interrupt game', () => {
      const game = GameStateBuilder.create()
        .withPhase('action')
        .withTurnNumber(1)
        .build();

      const originalPhase = game.phase;
      const originalTurn = game.turnNumber;

      capture.start();

      const output1 = executeCommand(game, 'cards');
      const output2 = executeCommand(game, 'cards');

      capture.stop();

      expect(output1).toContain('AVAILABLE CARDS');
      expect(output2).toContain('AVAILABLE CARDS');

      expect(game.phase).toBe(originalPhase);
      expect(game.turnNumber).toBe(originalTurn);
    });
  });

  describe('Commands Working Together', () => {
    /**
     * Test CWT-1: Help and Cards Commands Can Be Used Sequentially
     *
     * Setup:
     * - Game in action phase
     *
     * Execution:
     * - Execute cards command
     * - Execute help command
     * - Execute help with different card
     *
     * Expected Result:
     * - All succeed
     * - Can mix usage patterns
     * - Game state unchanged throughout
     */
    test('CWT-1: help and cards commands work sequentially', () => {
      const game = GameStateBuilder.create()
        .withPhase('action')
        .build();

      const originalState = JSON.stringify(game);

      capture.start();

      const cardsOutput = executeCommand(game, 'cards');
      const help1Output = executeCommand(game, 'help Village');
      const help2Output = executeCommand(game, 'help Market');

      capture.stop();

      expect(cardsOutput).toContain('AVAILABLE CARDS');
      expect(help1Output).toContain('Village');
      expect(help2Output).toContain('Market');

      expect(JSON.stringify(game)).toBe(originalState);
    });

    /**
     * Test CWT-2: Multiple Commands Throughout Game
     *
     * Scenario: Simulate looking up cards during a game
     *
     * Execution:
     * - Action phase: lookup Village effect
     * - Buy phase: browse cards, lookup Province
     * - Between turns: check card effects
     *
     * Expected Result:
     * - All lookups succeed
     * - No state corruption
     * - Game can continue normally
     */
    test('CWT-2: commands work across game phases', () => {
      let game = GameStateBuilder.create()
        .withPhase('action')
        .withTurnNumber(1)
        .build();

      const actionOutput = executeCommand(game, 'help Village');
      expect(actionOutput).toContain('Village');

      // Simulate phase change
      game = GameStateBuilder.create()
        .withPhase('buy')
        .withTurnNumber(1)
        .build();

      const buyOutput = executeCommand(game, 'help Province');
      expect(buyOutput).toContain('Province');

      // Simulate between turns
      game = GameStateBuilder.create()
        .withPhase('action')
        .withTurnNumber(2)
        .build();

      const cleanupOutput = executeCommand(game, 'cards');
      expect(cleanupOutput).toContain('AVAILABLE CARDS');
    });
  });

  describe('Performance Under Game Conditions', () => {
    /**
     * Test PERF-1: Help Performance During Gameplay
     *
     * Requirement: PT-1.14 - Help < 5ms
     *
     * Execution:
     * - Multiple help lookups during simulated gameplay
     *
     * Expected Result:
     * - All under 5ms
     * - No performance degradation
     */
    test('PERF-1: help maintains performance during gameplay', async () => {
      const game = engine.initializeGame(1);

      await PerformanceHelper.assertWithinTime(
        () => {
          executeCommand(game, 'help Village');
          executeCommand(game, 'help Smithy');
          executeCommand(game, 'help Copper');
        },
        15, // 3 commands at < 5ms each = < 15ms total
        'three help commands'
      );
    });

    /**
     * Test PERF-2: Cards Performance During Gameplay
     *
     * Requirement: PT-2.1 - Cards < 10ms
     *
     * Execution:
     * - Cards lookup during active game
     *
     * Expected Result:
     * - Under 10ms
     */
    test('PERF-2: cards maintains performance during gameplay', async () => {
      const game = engine.initializeGame(1);

      await PerformanceHelper.assertWithinTime(
        () => executeCommand(game, 'cards'),
        10,
        'cards command'
      );
    });

    /**
     * Test PERF-3: Mixed Commands Performance
     *
     * Execution:
     * - Mix of help and cards commands
     *
     * Expected Result:
     * - Consistent performance
     * - No interference
     */
    test('PERF-3: mixed commands maintain performance', async () => {
      const game = engine.initializeGame(1);

      await PerformanceHelper.assertWithinTime(
        () => {
          executeCommand(game, 'cards');
          executeCommand(game, 'help Village');
          executeCommand(game, 'cards');
          executeCommand(game, 'help Smithy');
        },
        40, // 2x cards (10ms) + 2x help (5ms)
        'mixed commands'
      );
    });
  });

  describe('State Immutability During Commands', () => {
    /**
     * Test IM-1: Game State Truly Immutable After Help
     *
     * Requirement: Immutable state pattern (CLAUDE.md)
     *
     * Setup:
     * - Capture all game state properties
     * - Execute help
     * - Verify each property unchanged
     */
    test('IM-1: game state immutable after help command', () => {
      const game = GameStateBuilder.create()
        .withPhase('action')
        .withTurnNumber(1)
        .withPlayerStats(0, { actions: 1, buys: 1, coins: 5 })
        .withPlayerHand(0, ['Village', 'Copper'])
        .build();

      // Snapshot all properties
      const snapshot = {
        phase: game.phase,
        turnNumber: game.turnNumber,
        actions: game.players[0].actions,
        buys: game.players[0].buys,
        coins: game.players[0].coins,
        handLength: game.players[0].hand.length,
        handString: JSON.stringify(game.players[0].hand)
      };

      // Execute help
      executeCommand(game, 'help Village');

      // Verify every property unchanged
      expect(game.phase).toBe(snapshot.phase);
      expect(game.turnNumber).toBe(snapshot.turnNumber);
      expect(game.players[0].actions).toBe(snapshot.actions);
      expect(game.players[0].buys).toBe(snapshot.buys);
      expect(game.players[0].coins).toBe(snapshot.coins);
      expect(game.players[0].hand).toHaveLength(snapshot.handLength);
      expect(JSON.stringify(game.players[0].hand)).toBe(snapshot.handString);
    });

    /**
     * Test IM-2: Game State Truly Immutable After Cards
     *
     * Requirement: Immutable state pattern
     *
     * Setup:
     * - Capture all game state properties
     * - Execute cards
     * - Verify each property unchanged
     */
    test('IM-2: game state immutable after cards command', () => {
      const game = engine.initializeGame(1);

      const snapshot = {
        phase: game.phase,
        turnNumber: game.turnNumber,
        currentPlayer: game.currentPlayer,
        playerCount: game.players.length
      };

      // Execute cards
      executeCommand(game, 'cards');

      // Verify unchanged
      expect(game.phase).toBe(snapshot.phase);
      expect(game.turnNumber).toBe(snapshot.turnNumber);
      expect(game.currentPlayer).toBe(snapshot.currentPlayer);
      expect(game.players).toHaveLength(snapshot.playerCount);
    });
  });

  describe('Acceptance Criteria Integration', () => {
    /**
     * AC-INT-1: Commands work seamlessly during full turn
     *
     * Scenario: Player uses help/cards during a complete turn
     *
     * Setup:
     * - Action phase → execute help → continue playing
     * - Buy phase → execute cards → continue playing
     * - End turn → execute help → continue
     *
     * Expected Result:
     * - All commands work
     * - Game progresses normally
     */
    test('AC-INT-1: commands work seamlessly during full game turn', () => {
      let game = GameStateBuilder.create()
        .withPhase('action')
        .build();

      // Action phase - get help on Village
      let helpOutput = executeCommand(game, 'help Village');
      expect(helpOutput).toContain('Village');

      // Simulate action phase completion
      game = GameStateBuilder.create()
        .withPhase('buy')
        .build();

      // Buy phase - browse cards
      let cardsOutput = executeCommand(game, 'cards');
      expect(cardsOutput).toContain('AVAILABLE CARDS');

      // Get help on Province
      helpOutput = executeCommand(game, 'help Province');
      expect(helpOutput).toContain('Province');

      // Turn complete
      expect(game.phase).toBe('buy');
    });

    /**
     * AC-INT-2: Multiple players can use commands
     *
     * Scenario: Simulate multiple players using commands
     *
     * Expected Result:
     * - Commands work for different players
     * - No interference between players
     */
    test('AC-INT-2: commands work for multiple players', () => {
      // Player 1
      let game1 = GameStateBuilder.create()
        .withCurrentPlayer(0)
        .withPhase('action')
        .build();

      const p1Help = executeCommand(game1, 'help Village');
      expect(p1Help).toContain('Village');

      // Player 2
      let game2 = GameStateBuilder.create()
        .withCurrentPlayer(1)
        .withPhase('action')
        .build();

      const p2Cards = executeCommand(game2, 'cards');
      expect(p2Cards).toContain('AVAILABLE CARDS');

      // Verify both games unchanged
      expect(game1.currentPlayer).toBe(0);
      expect(game2.currentPlayer).toBe(1);
    });
  });
});
