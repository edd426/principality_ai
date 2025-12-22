/**
 * Test Suite: Game-End Detection Bug
 *
 * Reproduces critical bug found in Oct 27 game session:
 * Game continues past turn 24 when Province pile becomes empty (quantity = 0)
 *
 * Expected behavior:
 * - When Province = 0, game should end immediately
 * - game_observe() should return gameOver = true
 * - Logger should warn "Game over detected"
 * - All subsequent moves should be blocked with game-over error
 * - Logger should warn "Move blocked - game over"
 *
 * Actual behavior (BUG):
 * - Game continues through turns 25-35+
 * - No "Game over detected" appears in logs
 * - Moves are NOT blocked after Province = 0
 * - Game never naturally terminates
 *
 * Root cause: Unknown (diagnosis needed)
 * Potential causes:
 * 1. Game loop doesn't check game-over after each move
 * 2. Logger not initialized/configured in MCP server
 * 3. isGameOver() logic incorrect
 * 4. game_observe() not actually checking for game-over
 *
 * @req: R2.0-NEW - Game end detection and move blocking
 */

import { GameObserveTool } from '../../src/tools/game-observe';
import { GameExecuteTool } from '../../src/tools/game-execute';
import { GameRegistryManager } from '../../src/game-registry';
import { GameEngine } from '@principality/core';

describe('Game-End Detection Bug (Critical)', () => {
  let gameEngine: GameEngine;
  let observeTool: GameObserveTool;
  let executeTool: GameExecuteTool;
  let registry: GameRegistryManager;
  let gameId: string;
  let mockLogger: any;

  beforeEach(() => {
    // Initialize game engine with seed
    gameEngine = new GameEngine('test-seed');

    // Mock logger to capture warnings
    mockLogger = {
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn()
    };

    // Create registry and tools
    registry = new GameRegistryManager(10, 3600000, mockLogger);
    observeTool = new GameObserveTool(registry, mockLogger);
    executeTool = new GameExecuteTool(registry, mockLogger);
    const game = registry.createGame('test-seed');
    gameId = game.id;
  });

  afterEach(() => {
    registry.stop();
  });

  describe('Bug Reproduction: Province Depletion', () => {
    test('BUG: game should end when Province quantity becomes 0', async () => {
      // @req: R2.0-NEW - Game detects win when Province depleted
      // @edge: Reproduces Oct 27 bug where game continued past Province depletion
      // @why: This is the critical bug found in logs

      // Setup: Simulate game state with all 8 Provinces purchased (in quick-game mode)
      // This is what happened at turn 24 in Oct 27 session
      const state = registry.getState(gameId)!;
      const newSupply = new Map(state.supply);
      newSupply.set('Province', 0);  // ← Province pile is now EMPTY
      newSupply.set('Copper', 5);
      newSupply.set('Silver', 5);
      newSupply.set('Gold', 5);
      newSupply.set('Estate', 8);
      newSupply.set('Duchy', 8);
      const newState = {
        ...state,
        supply: newSupply as ReadonlyMap<string, number>,
        turnNumber: 24,
        phase: 'action' as const,
        currentPlayer: 0
      };
      registry.setState(gameId, newState);

      // TEST 1: game_observe() should report gameOver = true
      const observeResponse = await observeTool.execute({
        detail_level: 'full',
        gameId
      });

      console.log('Observe Response:', {
        success: observeResponse.success,
        gameOver: observeResponse.gameOver,
        loggerWarns: mockLogger.warn.mock.calls.length
      });

      // FAILING ASSERTIONS (expected to fail with current code)
      expect(observeResponse.success).toBe(true);
      expect(observeResponse.gameOver).toBe(true);  // ← EXPECTED: true, ACTUAL: false (BUG)

      // TEST 2: Logger should have warned about game-over detection
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Game over detected'),
        expect.any(Object)
      );

      // TEST 3: Verify game-over reason is captured
      const gameOverLog = mockLogger.warn.mock.calls.find(
        (call: any[]) => call[0]?.includes?.('Game over detected')
      );
      expect(gameOverLog).toBeDefined();
      if (gameOverLog) {
        expect(gameOverLog[1]).toHaveProperty('gameOverReason');
        expect(gameOverLog[1].gameOverReason).toBe('Province pile is empty');
        expect(gameOverLog[1].provinceCount).toBe(0);
      }
    });

    test('BUG: moves should be blocked after Province = 0', async () => {
      // @req: R2.0-NEW - All moves blocked when game over
      // @edge: Reproduces turn 25+ moves that should have been blocked

      // Setup: Same state as above - Province = 0
      const state = registry.getState(gameId)!;
      const newSupply = new Map(state.supply);
      newSupply.set('Province', 0);
      const newPlayers = state.players.map((p, i) => i === 0 ? {
        ...p,
        hand: ['Copper', 'Gold'],
        coins: 5,
        buys: 1
      } : p);
      const newState = {
        ...state,
        supply: newSupply as ReadonlyMap<string, number>,
        turnNumber: 25,
        phase: 'buy' as const,
        currentPlayer: 0,
        players: newPlayers
      };
      registry.setState(gameId, newState);

      // Clear previous log calls
      mockLogger.warn.mockClear();

      // Attempt to execute a move (should be blocked)
      const moveResponse = await executeTool.execute({
        move: 'buy Gold',
        reasoning: 'This should be blocked because game is over',
        gameId
      });

      console.log('Move Response:', {
        success: moveResponse.success,
        error: moveResponse.error?.message,
        loggerWarns: mockLogger.warn.mock.calls.length
      });

      // FAILING ASSERTIONS
      expect(moveResponse.success).toBe(false);  // ← EXPECTED: false, ACTUAL: true (BUG)

      // Verify error is about game being over
      expect(moveResponse.error).toBeDefined();
      expect(moveResponse.error?.message).toContain('Game is over');

      // TEST 2: Logger should have warned about move being blocked
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Move blocked - game over'),
        expect.any(Object)
      );

      // TEST 3: Error details should include why game ended
      expect(moveResponse.error?.details?.gameOverReason).toBe('Province pile is empty');
    });

    test('BUG: multiple moves should be blocked after Province = 0', async () => {
      // @req: R2.0-NEW - Consistent blocking of all move types
      // @edge: Turn 25-35 were attempted in logs; all should have failed
      // @why: Demonstrates the bug wasn't one-time but systematic

      const state = registry.getState(gameId)!;
      const newSupply = new Map(state.supply);
      newSupply.set('Province', 0);
      const newState = {
        ...state,
        supply: newSupply as ReadonlyMap<string, number>,
        turnNumber: 25,
        phase: 'buy' as const
      };
      registry.setState(gameId, newState);

      // Try different move types - all should fail
      const moves = [
        'play_treasure Gold',
        'buy Gold',
        'end'
      ];

      for (const move of moves) {
        mockLogger.warn.mockClear();

        const response = await executeTool.execute({ move, gameId });

        expect(response.success).toBe(false);
        expect(response.error?.message).toContain('Game is over');
        expect(mockLogger.warn).toHaveBeenCalled();
      }
    });
  });

  describe('Edge Case: 3+ Piles Depletion', () => {
    test('should detect game over when 3+ supply piles are empty', async () => {
      // @req: R2.0-NEW - Game detects end with 3+ empty piles
      // @edge: Secondary game-end condition
      // @why: Ensure both conditions work when Province pile not empty

      // Setup: 3 piles empty but Province > 0
      const state = registry.getState(gameId)!;
      const newSupply = new Map(state.supply);
      newSupply.set('Village', 0);
      newSupply.set('Smithy', 0);
      newSupply.set('Copper', 0);
      newSupply.set('Province', 2);
      const newState = {
        ...state,
        supply: newSupply as ReadonlyMap<string, number>,
        turnNumber: 28,
        phase: 'action' as const
      };
      registry.setState(gameId, newState);

      const observeResponse = await observeTool.execute({
        detail_level: 'standard',
        gameId
      });

      // These should also fail (BUG affects both conditions)
      expect(observeResponse.gameOver).toBe(true);

      // Verify error message mentions the 3 empty piles
      const gameOverLog = mockLogger.warn.mock.calls.find(
        (call: any[]) => call[0]?.includes?.('Game over detected')
      );
      expect(gameOverLog).toBeDefined();
      if (gameOverLog) {
        expect(gameOverLog[1].gameOverReason).toContain('3 supply piles are empty');
      }
    });
  });

  describe('Bug Analysis Helpers', () => {
    test('should help diagnose: is Province quantity actually being tracked?', () => {
      // @why: Verify game state correctly reflects Province purchases

      // Simulate buying a Province
      let state = registry.getState(gameId)!;
      let newSupply = new Map(state.supply);
      newSupply.set('Province', 7);  // Start with 8, buy 1
      let newState = { ...state, supply: newSupply as ReadonlyMap<string, number> };
      registry.setState(gameId, newState);

      const initialCount = newState.supply.get('Province');

      // Verify count is readable
      expect(initialCount).toBe(7);

      // Now set to 0 (all purchased)
      state = registry.getState(gameId)!;
      newSupply = new Map(state.supply);
      newSupply.set('Province', 0);
      newState = { ...state, supply: newSupply as ReadonlyMap<string, number> };
      registry.setState(gameId, newState);

      const finalCount = newState.supply.get('Province');

      expect(finalCount).toBe(0);
      console.log(`✓ Province tracking works: 7 → 0`);
    });

    test('should help diagnose: is gameOver flag being set in responses?', async () => {
      // @why: Verify response structure includes gameOver field

      const state = registry.getState(gameId)!;
      const newSupply = new Map(state.supply);
      newSupply.set('Province', 0);
      const newState = { ...state, supply: newSupply as ReadonlyMap<string, number> };
      registry.setState(gameId, newState);

      const response = await observeTool.execute({
        detail_level: 'standard',
        gameId
      });

      expect(response).toHaveProperty('gameOver');
      console.log(`✓ gameOver field present in response:`, response.gameOver);

      // Check all detail levels include gameOver
      for (const level of ['minimal', 'standard', 'full'] as const) {
        const resp = await observeTool.execute({ detail_level: level, gameId });
        expect(resp).toHaveProperty('gameOver');
        console.log(`✓ gameOver present in ${level} detail:`, resp.gameOver);
      }
    });

    test('should help diagnose: is logger being called?', async () => {
      // @why: Verify logging infrastructure is working

      const state = registry.getState(gameId)!;
      const newSupply = new Map(state.supply);
      newSupply.set('Province', 0);
      const newState = { ...state, supply: newSupply as ReadonlyMap<string, number> };
      registry.setState(gameId, newState);

      mockLogger.warn.mockClear();

      await observeTool.execute({ detail_level: 'full', gameId });

      const warnCallCount = mockLogger.warn.mock.calls.length;
      console.log(`✓ Logger.warn called ${warnCallCount} times`);

      if (warnCallCount > 0) {
        console.log(`✓ Sample warn call:`, mockLogger.warn.mock.calls[0]);
      } else {
        console.log(`✗ WARNING: logger.warn was never called!`);
      }

      expect(mockLogger.warn.mock.calls.length).toBeGreaterThan(0);
    });
  });
});
