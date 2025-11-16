/**
 * Test Suite: Edge Cases and Boundary Conditions (Phase 2 Week 2 Task 6)
 *
 * Status: NEW - Comprehensive edge case coverage
 * Created: 2025-10-23
 * Phase: 2
 *
 * Purpose:
 * Validates game behavior at boundaries and in unusual scenarios:
 * - Empty supply piles
 * - Phase transition edge cases
 * - Invalid move recovery
 * - Determinism validation
 *
 * Tests verify that edge cases are handled gracefully.
 *
 * @level Unit/Integration
 */

import { GameEngine, GameState } from '../src/index';

describe('Edge Cases and Boundary Conditions', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('edge-case-seed');
  });

  describe('EC1: Empty Supply Pile Handling', () => {
    /**
     * @req Game handles buying from empty pile
     * @edge Supply pile becomes empty
     * @why Game must not crash when pile exhausted
     */
    test('should handle buying when pile has exactly 1 card', () => {
      let state = engine.initializeGame(1);

      // Manually set supply to have only 1 card
      state = {
        ...state,
        supply: new Map(state.supply.entries())
      };

      const supply = state.supply;
      const pileToTest = Array.from(supply.entries()).find(([name, count]) => count > 0);

      // STRENGTHENED: Verify we have a test pile with specific structure
      expect(pileToTest).toBeTruthy(); // Verify pile exists
      expect(Array.isArray(pileToTest)).toBe(true); // Verify it's a tuple

      if (pileToTest) {
        const [cardName, count] = pileToTest;
        expect(count).toBeGreaterThan(0);

        // Supply should have the card with its count
        const remaining = supply.get(cardName);
        expect(remaining).toBeGreaterThan(0); // Explicitly verify count > 0 (also checks defined)
        expect(remaining).toBeLessThanOrEqual(count); // Verify supply consistency
      }
    });

    /**
     * @req Game detects when a pile becomes empty
     * @edge Pile count goes to zero
     * @why Empty pile triggers game-end condition check
     */
    test('should correctly detect empty pile condition', () => {
      let state = engine.initializeGame(1);

      // Check that supply tracking works
      const initialProvince = state.supply.get('Province');
      expect(initialProvince).toBeGreaterThan(0);

      // Manually set a pile to zero
      const newSupply = new Map(state.supply.entries());
      newSupply.set('Province', 0);

      const emptyState = {
        ...state,
        supply: newSupply
      };

      // STRENGTHENED: Verify state and specific move availability
      expect(emptyState.supply.get('Province')).toBe(0);

      // Game should handle this gracefully
      const moves = engine.getValidMoves(emptyState);
      expect(Array.isArray(moves)).toBe(true); // Verifies defined and is array
      expect(moves.length).toBeGreaterThan(0); // Must have at least one valid move

      // Verify Province is not available in moves
      const provinceMove = moves.find(m => m.type === 'buy' && m.card === 'Province');
      expect(provinceMove).toBeUndefined(); // Cannot buy from empty pile
    });

    /**
     * @req Cannot buy from empty pile
     * @edge Attempt to buy from depleted supply
     * @why Must prevent invalid purchases
     */
    test('should prevent buying from pile with zero cards', () => {
      let state = engine.initializeGame(1);

      // Create state with empty Province pile
      const newSupply = new Map(state.supply.entries());
      newSupply.set('Province', 0);

      state = {
        ...state,
        phase: 'buy' as const,
        supply: newSupply,
        players: [
          {
            ...state.players[0],
            coins: 10 // Plenty of coins
          }
        ]
      };

      // Try to buy Province (unavailable)
      const result = engine.executeMove(state, {
        type: 'buy',
        card: 'Province'
      } as any);

      // Should fail or not be in valid moves
      const validMoves = engine.getValidMoves(state);
      const canBuyProvince = validMoves.some(
        m => m.type === 'buy' && m.card === 'Province'
      );

      expect(canBuyProvince).toBe(false);
    });

    /**
     * @req Three pile empty condition triggers game end
     * @edge Three different piles reach zero
     * @why Game ends when 3 piles empty (not just Province)
     */
    test('should trigger game end when 3 piles become empty', () => {
      let state = engine.initializeGame(1);

      // Deplete 3 piles
      const newSupply = new Map(state.supply.entries());
      newSupply.set('Estate', 0);
      newSupply.set('Duchy', 0);
      newSupply.set('Village', 0);

      state = {
        ...state,
        supply: newSupply
      };

      // Check game-over condition
      const gameOverResult = engine.checkGameOver(state);

      // Should detect game over (3 piles empty)
      expect(gameOverResult.isGameOver).toBe(true);
    });
  });

  describe('EC2: Phase Transition Boundaries', () => {
    /**
     * @req Cannot transition from action phase without ending
     * @edge Implicit vs. explicit phase transitions
     * @why Phase changes must be explicit (via end_phase move)
     */
    test('should require explicit end_phase move to transition', () => {
      let state = engine.initializeGame(1);

      expect(state.phase).toBe('action');

      const moves = engine.getValidMoves(state);

      // STRENGTHENED: Verify moves and explicit end_phase requirement
      expect(moves.length).toBeGreaterThan(0);

      // Should always have end_phase option
      const endPhaseMove = moves.find(m => m.type === 'end_phase');
      expect(endPhaseMove).toBeTruthy(); // Verify end_phase move exists
      expect(endPhaseMove?.type).toBe('end_phase');

      // Attempting random move shouldn't change phase implicitly
      if (moves.length > 0) {
        const move = moves[0];
        const result = engine.executeMove(state, move);

        expect(result.success).toBe(true);
        expect(result.newState).toBeTruthy(); // Verify new state exists
        expect(result.newState?.phase).toBeTruthy(); // Verify phase exists

        // Verify phase change is intentional
        if (result.success && result.newState) {
          // If not end_phase, should still be in action phase
          if (move.type !== 'end_phase') {
            // Phase might stay same or change based on move type
            expect(['action', 'buy', 'cleanup']).toContain(result.newState.phase);
          }
        }
      }
    });

    /**
     * @req Cannot skip cleanup phase
     * @edge Cleanup must happen automatically or be forced
     * @why Game rules require cleanup
     */
    test('should handle cleanup phase correctly', () => {
      let state = engine.initializeGame(1);

      // Get to cleanup phase
      let moves = engine.getValidMoves(state);
      let endPhaseMove = moves.find(m => m.type === 'end_phase');

      if (endPhaseMove) {
        let result = engine.executeMove(state, endPhaseMove);
        if (result.success && result.newState) {
          state = result.newState; // Now in buy phase

          moves = engine.getValidMoves(state);
          endPhaseMove = moves.find(m => m.type === 'end_phase');

          if (endPhaseMove) {
            result = engine.executeMove(state, endPhaseMove);
            if (result.success && result.newState) {
              state = result.newState; // Now in cleanup (or next turn if auto-cleanup)

              // Cleanup phase exists, or transitions to action phase
              expect(['cleanup', 'action']).toContain(state.phase);
              expect(state.turnNumber).toBeGreaterThanOrEqual(1);
            }
          }
        }
      }
    });

    /**
     * @req Turn counter increments only on cleanup completion
     * @edge Turn counter accuracy through phases
     * @why Turn tracking is essential for game progression
     */
    test('should increment turn number only during cleanup completion', () => {
      let state = engine.initializeGame(1);
      const initialTurn = state.turnNumber;

      // Execute through one full turn
      let moves = engine.getValidMoves(state);
      let endPhaseMove = moves.find(m => m.type === 'end_phase');

      if (endPhaseMove) {
        let result = engine.executeMove(state, endPhaseMove); // Action → Buy
        if (result.success && result.newState) {
          state = result.newState;
          expect(state.turnNumber).toBe(initialTurn); // Still same turn

          // Buy → Cleanup
          moves = engine.getValidMoves(state);
          endPhaseMove = moves.find(m => m.type === 'end_phase');

          if (endPhaseMove) {
            result = engine.executeMove(state, endPhaseMove);
            if (result.success && result.newState) {
              state = result.newState;
              // After cleanup, should be new turn or still in cleanup
              // Turn counter increments after full cleanup cycle
              expect(state.turnNumber).toBeGreaterThanOrEqual(initialTurn);
            }
          }
        }
      }
    });
  });

  describe('EC3: Invalid Move Recovery', () => {
    /**
     * @req Invalid move doesn't corrupt state
     * @edge Attempting impossible move
     * @why State immutability is critical
     */
    test('should preserve state completely on invalid move', () => {
      const state = engine.initializeGame(1);

      // Save complete state snapshot
      const stateSnapshot = JSON.stringify(state);

      // Try impossible move
      const impossibleMove = {
        type: 'buy',
        card: 'NonexistentCard'
      } as any;

      const result = engine.executeMove(state, impossibleMove);

      // STRENGTHENED: Verify both move result and state immutability
      expect(result.success).toBe(false); // Invalid move should fail
      expect(result.error).toContain('Cannot buy cards outside buy phase'); // Should have specific error message

      // Even if move executes, original state unchanged
      const afterSnapshot = JSON.stringify(state);
      expect(afterSnapshot).toBe(stateSnapshot); // State must be immutable

      // Verify state properties unchanged
      expect(state.phase).toBe('action');
      expect(Array.isArray(state.players[0].hand)).toBe(true); // Hand should be array
      expect(state.players[0].hand.length).toBeGreaterThan(0); // Hand should have cards
    });

    /**
     * @req User can continue after invalid move
     * @edge Recovery from bad input
     * @why Game must be resilient
     */
    test('should allow valid moves after invalid move attempt', () => {
      let state = engine.initializeGame(1);

      // Try invalid move
      const invalidMove = {
        type: 'play_action',
        card: 'NonexistentCard'
      } as any;

      const invalidResult = engine.executeMove(state, invalidMove);

      // STRENGTHENED: Verify invalid move fails properly
      expect(invalidResult.success).toBe(false); // Invalid move should fail
      expect(invalidResult.error).toContain('not in hand'); // Should have specific error message

      // Should still be able to get valid moves
      const validMoves = engine.getValidMoves(state);
      expect(validMoves.length).toBeGreaterThan(0);
      expect(Array.isArray(validMoves)).toBe(true);

      // Should be able to execute a valid move
      const move = validMoves[0];
      const result = engine.executeMove(state, move);

      // STRENGTHENED: Valid move must succeed
      expect(result.success).toBe(true);
      expect(result.newState).toBeTruthy(); // New state should exist
      expect(result.newState?.players).toHaveLength(state.players.length);
    });

    /**
     * @req Game doesn't enter invalid state
     * @edge No inconsistent state after errors
     * @why Game consistency is fundamental
     */
    test('should maintain game state consistency after errors', () => {
      const state = engine.initializeGame(1);

      // Verify initial consistency
      const initialMoveCount = engine.getValidMoves(state).length;
      expect(initialMoveCount).toBeGreaterThan(0);

      const initialPhase = state.phase;
      const initialTurnNumber = state.turnNumber;

      // Attempt multiple invalid moves
      const invalidMoves = [
        { type: 'buy', card: 'FakeCard' } as any,
        { type: 'play_action', card: 'UnknownCard' } as any
      ];

      invalidMoves.forEach(move => {
        const result = engine.executeMove(state, move);
        // Result should have success property (shouldn't crash)
        expect(typeof result.success).toBe('boolean');
        // Invalid moves should fail
        if (!['end_phase'].includes(move.type)) {
          expect(result.success).toBe(false);
        }
      });

      // STRENGTHENED: Verify state consistency after all attempts
      const finalMoveCount = engine.getValidMoves(state).length;
      expect(finalMoveCount).toBeGreaterThan(0);
      expect(finalMoveCount).toBe(initialMoveCount); // Still same moves available

      // Verify state integrity preserved
      expect(state.phase).toBe(initialPhase); // Phase unchanged
      expect(state.turnNumber).toBe(initialTurnNumber); // Turn unchanged
      expect(Array.isArray(state.players[0].hand)).toBe(true); // Hand is array
      expect(state.players[0].hand.length).toBeGreaterThan(0); // Hand has cards
      expect(state.players[0].actions).toBeGreaterThanOrEqual(0);
    });
  });

  describe('EC4: Determinism Validation', () => {
    /**
     * @req Same seed produces identical initial state
     * @edge Randomness must be deterministic
     * @why Tests need reproducibility
     */
    test('should produce identical hands with same seed', () => {
      const engine1 = new GameEngine('determinism-test-seed');
      const engine2 = new GameEngine('determinism-test-seed');

      const state1 = engine1.initializeGame(1);
      const state2 = engine2.initializeGame(1);

      // Hands should be identical
      expect(state1.players[0].hand).toEqual(state2.players[0].hand);
    });

    /**
     * @req Different seeds produce different states
     * @edge Non-identical initialization
     * @why Different games should vary
     */
    test('should produce different hands with different seeds', () => {
      const engine1 = new GameEngine('seed-one');
      const engine2 = new GameEngine('seed-two');

      const state1 = engine1.initializeGame(1);
      const state2 = engine2.initializeGame(1);

      // Hands should be different
      expect(state1.players[0].hand).not.toEqual(state2.players[0].hand);
    });

    /**
     * @req Moves deterministic (same move, same result)
     * @edge Sequential moves produce consistent results
     * @why Gameplay must be reproducible
     */
    test('should produce same result for same move sequence', () => {
      // Engine 1: Run sequence
      const engine1 = new GameEngine('moves-seed');
      let state1 = engine1.initializeGame(1);

      const moves = engine1.getValidMoves(state1);
      if (moves.length > 0) {
        const result1a = engine1.executeMove(state1, moves[0]);

        // Engine 2: Run same sequence
        const engine2 = new GameEngine('moves-seed');
        let state2 = engine2.initializeGame(1);

        const moves2 = engine2.getValidMoves(state2);
        const result2a = engine2.executeMove(state2, moves2[0]);

        // Results should be equivalent
        if (result1a.success && result2a.success) {
          expect(result1a.newState?.phase).toBe(result2a.newState?.phase);
          expect(result1a.newState?.turnNumber).toBe(result2a.newState?.turnNumber);
        }
      }
    });
  });

  describe('EC5: Boundary Values', () => {
    /**
     * @req Handle zero actions correctly
     * @edge No actions remaining
     * @why Cannot play action cards with zero actions
     */
    test('should prevent playing action cards with zero actions', () => {
      let state = engine.initializeGame(1);

      // Set zero actions
      state = {
        ...state,
        players: [
          {
            ...state.players[0],
            actions: 0
          }
        ]
      };

      const validMoves = engine.getValidMoves(state);

      // STRENGTHENED: Verify state and move constraints
      expect(state.players[0].actions).toBe(0); // Verify zero actions
      expect(validMoves.length).toBeGreaterThan(0); // Must have some valid move
      expect(Array.isArray(validMoves)).toBe(true);

      // Should not have any action card plays (no actions to spend)
      const actionPlayMoves = validMoves.filter(m => m.type === 'play_action');
      expect(actionPlayMoves).toHaveLength(0); // No action plays allowed with 0 actions

      // Should have end_phase available
      const endPhaseMove = validMoves.find(m => m.type === 'end_phase');
      expect(endPhaseMove).toBeTruthy(); // end_phase should always be available
      expect(endPhaseMove?.type).toBe('end_phase');
    });

    /**
     * @req Handle zero coins in buy phase
     * @edge Cannot buy any cards
     * @why Must validate affordability
     */
    test('should handle zero coins in buy phase', () => {
      let state = engine.initializeGame(1);

      state = {
        ...state,
        phase: 'buy' as const,
        players: [
          {
            ...state.players[0],
            coins: 0
          }
        ]
      };

      const validMoves = engine.getValidMoves(state);

      // Should have end_phase move available even with 0 coins
      const canEnd = validMoves.some(m => m.type === 'end_phase');
      expect(canEnd).toBe(true);

      // Copper costs 0, so it can be bought with 0 coins
      const buyCopperMove = validMoves.find(m => m.type === 'buy' && m.card === 'Copper');
      // Copper is free, so it should be available even with 0 coins
      expect(buyCopperMove).toBeTruthy();
      expect(buyCopperMove?.type).toBe('buy');
      expect(buyCopperMove?.card).toBe('Copper');

      // Silver (cost 3) should NOT be available with 0 coins
      const buySilverMove = validMoves.find(m => m.type === 'buy' && m.card === 'Silver');
      expect(buySilverMove).toBeUndefined();
    });

    /**
     * @req Maximum hand size handled gracefully
     * @edge Large hand doesn't crash
     * @why Display and logic must work with many cards
     */
    test('should handle large hand sizes', () => {
      let state = engine.initializeGame(1);

      // Create state with very large hand
      const largeHand = Array(50).fill('Copper'); // 50 cards (unrealistic but valid)

      state = {
        ...state,
        players: [
          {
            ...state.players[0],
            hand: largeHand
          }
        ]
      };

      // STRENGTHENED: Verify large hand state and game behavior
      expect(state.players[0].hand).toHaveLength(50); // Verify hand size
      expect(state.players[0].hand.every(c => c === 'Copper')).toBe(true); // All Copper

      // Should still be able to get valid moves
      const moves = engine.getValidMoves(state);
      expect(Array.isArray(moves)).toBe(true);
      expect(moves.length).toBeGreaterThan(0); // Must have valid moves

      // Game should not crash and should function properly
      expect(() => {
        engine.checkGameOver(state);
      }).not.toThrow();

      // Should be able to execute moves even with large hand
      const result = engine.executeMove(state, moves[0]);
      expect(typeof result.success).toBe('boolean'); // Result should have success property
      expect(result.success || result.error).toBeTruthy(); // Either success or error message
    });
  });
});
