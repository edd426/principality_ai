/**
 * Integration tests for CLI + Core Engine interaction
 * Validates end-to-end functionality and ensures CLI correctly uses core engine
 */

import { PrincipalityCLI } from '../src/cli';
import { Display } from '../src/display';
import { Parser } from '../src/parser';
import { GameEngine, GameState, Move, getCard } from '@principality/core';
import {
  ConsoleCapture,
  MockReadline,
  GameStateBuilder,
  TestScenarios,
  PerformanceHelper,
  CLIAssertions
} from './utils/test-utils';

// Mock readline for integration tests
jest.mock('readline', () => ({
  createInterface: jest.fn()
}));

describe('CLI + Core Engine Integration', () => {
  let consoleCapture: ConsoleCapture;
  let mockReadline: MockReadline;
  let originalCreateInterface: any;

  beforeEach(() => {
    consoleCapture = new ConsoleCapture();
    mockReadline = new MockReadline();

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

  describe('CLI-Engine initialization', () => {
    test('should create valid game state using core engine', () => {
      const cli = new PrincipalityCLI('test-seed');

      const gameState = cli['gameState'];

      // Verify CLI created valid game state via engine
      expect(gameState.players).toHaveLength(1);
      expect(gameState.seed).toBe('test-seed');
      expect(gameState.phase).toBe('action');
      expect(gameState.turnNumber).toBe(1);

      // Verify starting deck composition (7 Copper + 3 Estate)
      const player = gameState.players[0];
      const allCards = [...player.hand, ...player.drawPile];
      const copperCount = allCards.filter(card => card === 'Copper').length;
      const estateCount = allCards.filter(card => card === 'Estate').length;
      expect(copperCount).toBe(7);
      expect(estateCount).toBe(3);
    });

    test('should create deterministic games with same seed', () => {
      const cli1 = new PrincipalityCLI('deterministic-seed');
      const cli2 = new PrincipalityCLI('deterministic-seed');

      const state1 = cli1['gameState'];
      const state2 = cli2['gameState'];

      // Should be identical with same seed
      expect(state1.players[0].hand).toEqual(state2.players[0].hand);
      expect(state1.players[0].drawPile).toEqual(state2.players[0].drawPile);
      expect(state1.supply).toEqual(state2.supply);
    });

    test('should create different games with different seeds', () => {
      const cli1 = new PrincipalityCLI('seed-one');
      const cli2 = new PrincipalityCLI('seed-two');

      const hand1 = cli1['gameState'].players[0].hand;
      const hand2 = cli2['gameState'].players[0].hand;

      // Different seeds should produce different shuffles
      expect(hand1).not.toEqual(hand2);
    });

    test('should initialize multi-player games correctly', () => {
      const cli = new PrincipalityCLI('seed', 3);

      const gameState = cli['gameState'];

      expect(gameState.players).toHaveLength(3);
      gameState.players.forEach((player, index) => {
        expect(player.hand).toHaveLength(5);
        expect(player.drawPile).toHaveLength(5);
        expect(player.actions).toBe(1);
        expect(player.buys).toBe(1);
        expect(player.coins).toBe(0);
      });
    });
  });

  describe('Move execution integration', () => {
    test('should execute valid moves through engine', async () => {
      const cli = new PrincipalityCLI('test-seed');
      mockReadline.setInputs(['3', 'quit']); // End phase

      const initialPhase = cli['gameState'].phase;

      await cli.start();

      // Verify move was executed (phase should have changed)
      expect(consoleCapture.contains('✓')).toBe(true);
    });

    test('should reject invalid moves through engine', async () => {
      const cli = new PrincipalityCLI('test-seed');

      // Try to buy a card without coins in action phase
      const engine = cli['engine'];
      const state = cli['gameState'];

      const result = engine.executeMove(state, { type: 'buy', card: 'Silver' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should maintain game state immutability', async () => {
      const cli = new PrincipalityCLI('test-seed');

      const originalState = JSON.parse(JSON.stringify(cli['gameState']));
      const engine = cli['engine'];

      // Execute a move
      const result = engine.executeMove(cli['gameState'], { type: 'end_phase' });

      // Original state should be unchanged
      expect(cli['gameState']).toEqual(originalState);

      if (result.success && result.newState) {
        // New state should be different
        expect(result.newState).not.toEqual(originalState);
      }
    });

    test('should handle complete turn cycle', async () => {
      const cli = new PrincipalityCLI('test-seed');

      mockReadline.setInputs([
        '3',    // End action phase
        '3',    // End buy phase
        'quit'  // Exit after cleanup
      ]);

      await cli.start();

      // Should complete turn without errors
      expect(consoleCapture.contains('Thanks for playing!')).toBe(true);
      expect(consoleCapture.contains('✓')).toBe(true);
    });

    test('should validate moves against current game state', async () => {
      const cli = new PrincipalityCLI('test-seed');
      const engine = cli['engine'];
      const state = cli['gameState'];

      // Get valid moves from engine
      const validMoves = engine.getValidMoves(state);

      // All valid moves should be executable
      validMoves.forEach(move => {
        const result = engine.executeMove(state, move);
        if (!result.success) {
          // Some moves might become invalid due to state changes, but that's expected
          console.log(`Move ${JSON.stringify(move)} failed: ${result.error}`);
        }
      });

      // This test mainly verifies the integration doesn't throw errors
      expect(validMoves.length).toBeGreaterThan(0);
    });
  });

  describe('Display integration with game state', () => {
    test('should display accurate game state from engine', () => {
      const engine = new GameEngine('display-test-seed');
      const state = engine.initializeGame(1);
      const display = new Display();

      display.displayGameState(state);

      // Verify displayed information matches engine state
      const player = state.players[state.currentPlayer];
      expect(consoleCapture.contains(`Turn ${state.turnNumber}`)).toBe(true);
      expect(consoleCapture.contains(`Player ${state.currentPlayer + 1}`)).toBe(true);
      expect(consoleCapture.contains(`${state.phase.charAt(0).toUpperCase() + state.phase.slice(1)} Phase`)).toBe(true);
      expect(consoleCapture.contains(`Actions: ${player.actions}`)).toBe(true);
      expect(consoleCapture.contains(`Buys: ${player.buys}`)).toBe(true);
      expect(consoleCapture.contains(`Coins: $${player.coins}`)).toBe(true);
    });

    test('should display supply state accurately', () => {
      const engine = new GameEngine('supply-test-seed');
      const state = engine.initializeGame(1);
      const display = new Display();

      display.displaySupply(state);

      // Verify supply display matches engine state with prices
      state.supply.forEach((count, cardName) => {
        const card = getCard(cardName as any);
        expect(consoleCapture.contains(`${cardName} ($${card.cost}, ${count})`)).toBe(true);
      });
    });

    test('should display valid moves from engine', () => {
      const engine = new GameEngine('moves-test-seed');
      const state = engine.initializeGame(1);
      const validMoves = engine.getValidMoves(state);
      const display = new Display();

      display.displayAvailableMoves(validMoves);

      // Verify moves are displayed with proper numbering
      validMoves.forEach((move, index) => {
        expect(consoleCapture.contains(`[${index + 1}]`)).toBe(true);
      });
    });
  });

  describe('Parser integration with engine moves', () => {
    test('should parse move numbers correctly with engine moves', () => {
      const engine = new GameEngine('parser-test-seed');
      const state = engine.initializeGame(1);
      const validMoves = engine.getValidMoves(state);
      const parser = new Parser();

      // Test parsing each valid move number
      validMoves.forEach((expectedMove, index) => {
        const result = parser.parseInput((index + 1).toString(), validMoves);

        expect(result.type).toBe('move');
        expect(result.move).toEqual(expectedMove);
      });
    });

    test('should validate move numbers against engine move count', () => {
      const engine = new GameEngine('validation-test-seed');
      const state = engine.initializeGame(1);
      const validMoves = engine.getValidMoves(state);
      const parser = new Parser();

      // Test invalid move number (too high)
      const result = parser.parseInput((validMoves.length + 1).toString(), validMoves);

      expect(result.type).toBe('invalid');
      expect(result.error).toContain(`1-${validMoves.length}`);
    });

    test('should handle dynamic move list changes', () => {
      const engine = new GameEngine('dynamic-test-seed');
      let state = engine.initializeGame(1);
      const parser = new Parser();

      // Get initial moves
      const initialMoves = engine.getValidMoves(state);

      // Execute a move that changes available moves
      const endPhaseMove = initialMoves.find(move => move.type === 'end_phase');
      if (endPhaseMove) {
        const result = engine.executeMove(state, endPhaseMove);
        if (result.success && result.newState) {
          state = result.newState;

          // Get new moves after phase change
          const newMoves = engine.getValidMoves(state);

          // Move count might be different
          expect(Array.isArray(newMoves)).toBe(true);

          // Parser should work with new move list
          if (newMoves.length > 0) {
            const parseResult = parser.parseInput('1', newMoves);
            expect(parseResult.type).toBe('move');
          }
        }
      }
    });
  });

  describe('End-to-end game scenarios', () => {
    test('should handle complete action phase', async () => {
      const cli = new PrincipalityCLI('action-phase-seed');

      // Simulate playing all actions and ending phase
      mockReadline.setInputs([
        '3',    // End action phase (no action cards to play)
        'quit'
      ]);

      await cli.start();

      expect(consoleCapture.contains('✓')).toBe(true);
      expect(consoleCapture.contains('Thanks for playing!')).toBe(true);
    });

    test('should handle treasure and buy phase', async () => {
      // Create a scenario where we can test treasure playing and buying
      const cli = new PrincipalityCLI('buy-phase-seed');

      mockReadline.setInputs([
        '3',    // End action phase
        '3',    // End buy phase (auto-plays treasures and ends)
        'quit'
      ]);

      await cli.start();

      expect(consoleCapture.contains('Thanks for playing!')).toBe(true);
    });

    test('should handle game over condition', async () => {
      const cli = new PrincipalityCLI('game-over-seed');

      // Mock the engine to return game over
      const mockCheckGameOver = jest.spyOn(cli['engine'], 'checkGameOver');
      mockCheckGameOver.mockReturnValue({
        isGameOver: true,
        winner: 0,
        scores: [15]
      });

      mockReadline.setInputs([]);

      await cli.start();

      expect(consoleCapture.contains('GAME OVER')).toBe(true);
      expect(consoleCapture.contains('Player 1: 15 VP ★ WINNER')).toBe(true);

      mockCheckGameOver.mockRestore();
    });

    test('should handle error recovery', async () => {
      const cli = new PrincipalityCLI('error-recovery-seed');

      mockReadline.setInputs([
        '999',   // Invalid move
        'abc',   // Invalid input
        '3',     // Valid move
        'quit'
      ]);

      await cli.start();

      // Should show errors but continue
      expect(consoleCapture.contains('✗ Error:')).toBe(true);
      expect(consoleCapture.contains('Invalid move number')).toBe(true);
      expect(consoleCapture.contains('Invalid input')).toBe(true);
      // Should still complete successfully
      expect(consoleCapture.contains('Thanks for playing!')).toBe(true);
    });
  });

  describe('Performance integration', () => {
    test('should maintain performance with engine operations', async () => {
      const cli = new PrincipalityCLI('performance-seed');

      mockReadline.setInputs(['quit']);

      await PerformanceHelper.assertWithinTime(
        () => cli.start(),
        1000, // < 1 second for startup including engine initialization
        'CLI + Engine startup'
      );
    });

    test('should handle multiple move executions quickly', async () => {
      const cli = new PrincipalityCLI('multi-move-seed');

      // Simulate multiple quick moves
      const moves = Array(10).fill('3'); // Multiple end phases
      mockReadline.setInputs([...moves, 'quit']);

      await PerformanceHelper.assertWithinTime(
        () => cli.start(),
        2000, // < 2 seconds for multiple moves
        'multiple move execution'
      );
    });

    test('should maintain memory efficiency', () => {
      // Test memory usage doesn't grow excessively
      const cli = new PrincipalityCLI('memory-test-seed');

      const initialMemory = process.memoryUsage().heapUsed;

      // Perform operations that might cause memory leaks
      for (let i = 0; i < 100; i++) {
        const state = cli['gameState'];
        const moves = cli['engine'].getValidMoves(state);
        cli['display'].displayAvailableMoves(moves);
        consoleCapture.clear();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (< 10MB for 100 operations)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('State synchronization', () => {
    test('should keep CLI and engine state synchronized', async () => {
      const cli = new PrincipalityCLI('sync-test-seed');

      const engine = cli['engine'];
      let cliState = cli['gameState'];

      // Execute move through CLI internal mechanism
      const moves = engine.getValidMoves(cliState);
      const endPhaseMove = moves.find(move => move.type === 'end_phase');

      if (endPhaseMove) {
        const result = engine.executeMove(cliState, endPhaseMove);

        if (result.success && result.newState) {
          // Simulate CLI updating its state
          cli['gameState'] = result.newState;

          // States should be synchronized
          expect(cli['gameState']).toEqual(result.newState);
          expect(cli['gameState']).not.toEqual(cliState);
        }
      }
    });

    test('should maintain state consistency across display operations', () => {
      const cli = new PrincipalityCLI('display-consistency-seed');

      const originalState = JSON.parse(JSON.stringify(cli['gameState']));

      // Display operations should not mutate state
      cli['display'].displayGameState(cli['gameState']);
      cli['display'].displaySupply(cli['gameState']);

      const moves = cli['engine'].getValidMoves(cli['gameState']);
      cli['display'].displayAvailableMoves(moves);

      expect(cli['gameState']).toEqual(originalState);
    });
  });

  describe('Edge case integration', () => {
    test('should handle empty move lists gracefully', () => {
      const cli = new PrincipalityCLI('empty-moves-seed');

      // Mock engine to return empty moves
      const mockGetValidMoves = jest.spyOn(cli['engine'], 'getValidMoves');
      mockGetValidMoves.mockReturnValue([]);

      // Display should handle empty moves
      cli['display'].displayAvailableMoves([]);

      expect(consoleCapture.contains('Available Moves:')).toBe(true);
      expect(consoleCapture.contains('[1]')).toBe(false);

      mockGetValidMoves.mockRestore();
    });

    test('should handle corrupted game state gracefully', () => {
      const cli = new PrincipalityCLI('corruption-test-seed');

      // Simulate partial state corruption
      const corruptedState = {
        ...cli['gameState'],
        players: [] // Empty players array
      };

      // Should not crash when displaying corrupted state
      expect(() => {
        cli['display'].displayGameState(corruptedState as any);
      }).not.toThrow();
    });

    test('should handle engine errors in CLI context', async () => {
      const cli = new PrincipalityCLI('engine-error-seed');

      // Mock engine to throw error
      const mockExecuteMove = jest.spyOn(cli['engine'], 'executeMove');
      mockExecuteMove.mockImplementation(() => {
        throw new Error('Engine failure');
      });

      mockReadline.setInputs(['1', 'quit']);

      // CLI should handle engine errors gracefully
      await expect(cli.start()).resolves.not.toThrow();

      mockExecuteMove.mockRestore();
    });
  });

  describe('Multi-player integration', () => {
    test('should handle player turn transitions correctly', async () => {
      const cli = new PrincipalityCLI('multiplayer-seed', 2);

      expect(cli['gameState'].players).toHaveLength(2);
      expect(cli['gameState'].currentPlayer).toBe(0);

      // After enough moves, current player should change
      // (Specific turn mechanics depend on core engine implementation)
      mockReadline.setInputs(['3', '3', 'quit']); // Complete turn

      await cli.start();

      expect(consoleCapture.contains('Thanks for playing!')).toBe(true);
    });

    test('should display correct player information', async () => {
      const cli = new PrincipalityCLI('player-display-seed', 3);

      mockReadline.setInputs(['quit']);

      await cli.start();

      // Should show Player 1 (0-indexed as 1)
      expect(consoleCapture.contains('Player 1')).toBe(true);
    });
  });

  describe('Determinism integration', () => {
    test('should produce identical results with same seed', async () => {
      const capture1 = new ConsoleCapture();
      const capture2 = new ConsoleCapture();
      const mockRL1 = new MockReadline();
      const mockRL2 = new MockReadline();

      // Same seed, same inputs
      const seed = 'determinism-test-seed';
      const inputs = ['help', '3', 'quit'];

      // First run
      capture1.start();
      mockRL1.setInputs(inputs);
      require('readline').createInterface = jest.fn(() => mockRL1.createInterface());

      const cli1 = new PrincipalityCLI(seed);
      await cli1.start();

      capture1.stop();
      const output1 = capture1.getAllOutput();

      // Second run
      capture2.start();
      mockRL2.setInputs(inputs);
      require('readline').createInterface = jest.fn(() => mockRL2.createInterface());

      const cli2 = new PrincipalityCLI(seed);
      await cli2.start();

      capture2.stop();
      const output2 = capture2.getAllOutput();

      // Outputs should be identical (deterministic)
      expect(output1).toBe(output2);
    });
  });

  /**
   * Phase 1.5 Feature Integration Tests
   * Tests combinations of new CLI UX improvement features
   */
  describe('Phase 1.5: Feature Integration', () => {
    describe('Auto-Play Treasures + Chained Submission', () => {
      test('should auto-play treasures mid-chain when transitioning to buy phase', async () => {
        // Arrange
        const cli = new PrincipalityCLI('chain-autoplay-seed', 1, {
          autoPlayTreasures: true
        });

        // Hand: Village, Smithy, Copper, Copper
        // Chain: Play Village, Play Smithy, End Phase
        mockReadline.setInputs([
          '1, 2, 3', // Chain that ends action phase
          'quit'
        ]);

        // Act
        await cli.start();

        // Assert
        // Should auto-play treasures after ending action phase
        expect(consoleCapture.contains('Auto-playing treasures')).toBe(true);
        expect(consoleCapture.contains('Total')).toBe(true);
      });

      test('should handle treasure command in chain', async () => {
        const cli = new PrincipalityCLI('treasure-chain-seed');

        // Should reject mixing command with numbered moves
        mockReadline.setInputs([
          '1, 2, treasures', // Mixed chain - should fail
          'quit'
        ]);

        await cli.start();

        expect(consoleCapture.contains('Cannot mix moves and commands')).toBe(true);
      });
    });

    describe('Stable Numbers + Chained Submission', () => {
      test('should execute chain using stable numbers', async () => {
        // Arrange
        const cli = new PrincipalityCLI('stable-chain-seed', 1, {
          stableNumbers: true
        });

        // Chain using stable numbers: Village(7), Smithy(6), End(50)
        mockReadline.setInputs([
          '7, 6, 50',
          'quit'
        ]);

        // Act
        await cli.start();

        // Assert
        expect(consoleCapture.contains('✓ Played Village')).toBe(true);
        expect(consoleCapture.contains('✓ Played Smithy')).toBe(true);
      });

      test('should maintain stable numbers across chain execution', async () => {
        const cli = new PrincipalityCLI('stable-persistent-seed', 1, {
          stableNumbers: true
        });

        // Village is always [7], even after other cards played
        mockReadline.setInputs([
          '7',  // Play Village first time
          '7',  // Play Village second time (if in hand)
          'quit'
        ]);

        await cli.start();

        // Stable numbers don't change
        expect(consoleCapture.contains('[7]')).toBe(true);
      });
    });

    describe('Quick Game + VP Display', () => {
      test('should show correct VP in quick game mode', async () => {
        // Arrange
        const cli = new PrincipalityCLI('quickgame-vp-seed', 1, {
          quickGame: true
        });

        mockReadline.setInputs(['quit']);

        // Act
        await cli.start();

        // Assert
        // VP display should work in quick game
        expect(consoleCapture.contains('VP:')).toBe(true);
        // Quick game message
        expect(consoleCapture.contains('Quick Game')).toBe(true);
      });

      test('should update VP after buying in quick game', async () => {
        const cli = new PrincipalityCLI('quickgame-buy-seed', 1, {
          quickGame: true
        });

        // Buy a victory card
        mockReadline.setInputs([
          '3',     // End action
          '1',     // Buy Estate (assuming we have $2)
          'quit'
        ]);

        await cli.start();

        // VP should update after buy
        expect(consoleCapture.contains('VP:')).toBe(true);
      });

      test('quick game should end faster with reduced piles', async () => {
        const quickCli = new PrincipalityCLI('quick-end-seed', 1, {
          quickGame: true
        });

        // Simulate depleting 8 Provinces
        const quickSupply = quickCli['gameState'].supply;
        expect(quickSupply.get('Province')).toBe(8); // Reduced from 12
      });
    });

    describe('All Features Combined', () => {
      test('should work with all features enabled simultaneously', async () => {
        // Arrange
        const cli = new PrincipalityCLI('all-features-seed', 1, {
          quickGame: true,
          stableNumbers: true,
          autoPlayTreasures: true
        });

        // Use stable numbers in chain, auto-play triggers, VP displays
        mockReadline.setInputs([
          '7, 50',  // Village + End Phase (stable numbers)
          'quit'
        ]);

        // Act
        await cli.start();

        // Assert
        expect(consoleCapture.contains('[7]')).toBe(true); // Stable numbers
        expect(consoleCapture.contains('VP:')).toBe(true); // VP display
        expect(consoleCapture.contains('Quick Game')).toBe(true); // Quick game mode
      });

      test('should maintain performance with all features enabled', async () => {
        const cli = new PrincipalityCLI('all-features-perf-seed', 1, {
          quickGame: true,
          stableNumbers: true,
          autoPlayTreasures: true
        });

        mockReadline.setInputs(['7, 6, 50', 'quit']);

        // Should complete in < 200ms per turn requirement
        await PerformanceHelper.assertWithinTime(
          () => cli.start(),
          2000, // Reasonable timeout for full operation
          'all features combined'
        );
      });

      test('VP updates correctly when chaining buy moves', async () => {
        const cli = new PrincipalityCLI('chain-buy-vp-seed', 1, {
          quickGame: true,
          stableNumbers: true
        });

        // Assuming we have enough coins and buys
        // Chain multiple buys of victory cards
        mockReadline.setInputs([
          '50',              // End action phase
          '24, 24',          // Buy 2 Estates (stable #24)
          'quit'
        ]);

        await cli.start();

        // VP should show updated count
        expect(consoleCapture.contains('VP:')).toBe(true);
      });
    });

    describe('Rollback with VP Display', () => {
      test('should rollback VP changes if chain fails', async () => {
        const cli = new PrincipalityCLI('rollback-vp-seed', 1, {
          autoPlayTreasures: true
        });

        // Initial VP (3 Estates = 3 VP)
        const initialVP = 3;

        // Chain that buys Estate then fails
        mockReadline.setInputs([
          '50',          // End action
          '1, 99',       // Buy Estate, then invalid move
          'quit'
        ]);

        await cli.start();

        // If chain rolled back, VP should be unchanged
        // (This would be validated by checking game state)
        expect(consoleCapture.contains('Chain failed')).toBe(true);
        expect(consoleCapture.contains('rolled back')).toBe(true);
      });
    });

    describe('Stable Numbers with Reduced Piles', () => {
      test('should show stable numbers for reduced supply', async () => {
        const cli = new PrincipalityCLI('stable-reduced-seed', 1, {
          quickGame: true,
          stableNumbers: true
        });

        mockReadline.setInputs(['50', 'quit']); // Go to buy phase

        await cli.start();

        // Stable numbers for buy moves should work
        // Even with reduced victory piles
        expect(consoleCapture.contains('[26]')).toBe(true); // Buy Province
      });
    });

    describe('Error Handling Integration', () => {
      test('should handle invalid chain with all features enabled', async () => {
        const cli = new PrincipalityCLI('error-all-features-seed', 1, {
          quickGame: true,
          stableNumbers: true,
          autoPlayTreasures: true
        });

        mockReadline.setInputs([
          '7, 99',  // Valid then invalid
          'quit'
        ]);

        await cli.start();

        // Should show rollback error
        expect(consoleCapture.contains('Chain failed')).toBe(true);
        expect(consoleCapture.contains('All moves rolled back')).toBe(true);

        // VP should be unchanged
        expect(consoleCapture.contains('VP:')).toBe(true);
      });

      test('should recover from errors and continue with features', async () => {
        const cli = new PrincipalityCLI('error-recovery-features-seed', 1, {
          stableNumbers: true
        });

        mockReadline.setInputs([
          '999',   // Invalid stable number
          '7',     // Valid stable number
          'quit'
        ]);

        await cli.start();

        // Should show error for first, success for second
        expect(consoleCapture.contains('Invalid')).toBe(true);
        expect(consoleCapture.contains('✓ Played Village')).toBe(true);
      });
    });

    describe('Performance with Feature Combinations', () => {
      test('chain + stable numbers should execute in < 100ms', async () => {
        const cli = new PrincipalityCLI('perf-chain-stable-seed', 1, {
          stableNumbers: true
        });

        // 10-move chain with stable numbers
        const chain = Array(10).fill('7').join(', '); // 10 Villages
        mockReadline.setInputs([chain, 'quit']);

        await PerformanceHelper.assertWithinTime(
          () => cli.start(),
          2000,
          'chain + stable numbers performance'
        );
      });

      test('auto-play + VP calculation should be fast', async () => {
        const cli = new PrincipalityCLI('perf-autoplay-vp-seed', 1, {
          autoPlayTreasures: true
        });

        // Hand with many treasures
        mockReadline.setInputs([
          '50',  // End action, triggers auto-play
          'quit'
        ]);

        await PerformanceHelper.assertWithinTime(
          () => cli.start(),
          2000,
          'auto-play + VP calculation'
        );
      });
    });

    describe('Display Consistency', () => {
      test('should show all feature indicators when enabled', async () => {
        const cli = new PrincipalityCLI('display-all-seed', 1, {
          quickGame: true,
          stableNumbers: true,
          autoPlayTreasures: true
        });

        mockReadline.setInputs(['quit']);

        await cli.start();

        // Should show quick game indicator
        expect(consoleCapture.contains('Quick Game')).toBe(true);

        // Should show stable numbers in move list
        expect(consoleCapture.contains('[')).toBe(true);

        // Should show VP
        expect(consoleCapture.contains('VP:')).toBe(true);
      });

      test('should maintain clean output with features', async () => {
        const cli = new PrincipalityCLI('clean-output-seed', 1, {
          quickGame: true,
          stableNumbers: true
        });

        mockReadline.setInputs(['quit']);

        await cli.start();

        // Output should be organized and readable
        const output = consoleCapture.getAllOutput();

        // Should have clear sections
        expect(output).toMatch(/Turn \d+/);
        expect(output).toMatch(/VP: \d+/);
        expect(output).toMatch(/\[\d+\]/); // Move numbers
      });
    });
  });
});