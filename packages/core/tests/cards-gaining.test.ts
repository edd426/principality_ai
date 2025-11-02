import { GameEngine, GameState } from '@principality/core';

/**
 * Phase 4 Unit Tests: Gaining System Cards
 * Source: docs/requirements/phase-4/TESTING.md
 *
 * @req: Test gaining cards without buying - Workshop, Feast
 * @level: Unit
 * @count: 6 tests total
 *
 * Cards under test:
 * - Workshop ($3): Gain card costing up to $4
 * - Feast ($4): Trash self, gain card up to $5
 */

describe('UT: Gaining System Cards', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('gaining-test');
  });

  describe('UT-WORKSHOP: Gain card up to $4', () => {
    /**
     * UT-WORKSHOP-1: Gain Smithy ($4)
     * @req: Workshop gains card costing up to $4
     * @assert: Smithy moved from supply to discard
     */
    test('UT-WORKSHOP-1: should gain Smithy ($4)', () => {
      // @req: Gain card up to $4
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Workshop', 'Copper', 'Estate'],
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Workshop'
      });

      const initialSmithyCount = playResult.newState!.supply.get('Smithy')!;

      // Gain Smithy ($4)
      const gainResult = engine.executeMove(playResult.newState!, {
        type: 'gain_card',
        card: 'Smithy'
      });

      expect(gainResult.success).toBe(true);
      expect(gainResult.newState!.players[0].discard).toContain('Smithy');
      expect(gainResult.newState!.supply.get('Smithy')).toBe(initialSmithyCount - 1);
    });

    /**
     * UT-WORKSHOP-2: Error when gaining card > $4
     * @req: Workshop cannot gain cards costing more than $4
     * @edge: Attempt to gain Market ($5)
     * @assert: Error "Card too expensive"
     */
    test('UT-WORKSHOP-2: should error when gaining card > $4', () => {
      // @req: Maximum $4 cost limit
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Workshop'],
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Workshop'
      });

      // Attempt to gain Market ($5) - exceeds $4 limit
      const gainResult = engine.executeMove(playResult.newState!, {
        type: 'gain_card',
        card: 'Market'
      });

      expect(gainResult.success).toBe(false);
      expect(gainResult.error).toContain('Card too expensive');
    });

    /**
     * UT-WORKSHOP-3: Error when supply empty
     * @req: Cannot gain card from empty supply pile
     * @edge: Supply pile exhausted
     * @assert: Error "Supply exhausted"
     */
    test('UT-WORKSHOP-3: should error when supply empty', () => {
      // @req: Cannot gain from empty pile
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        supply: new Map([...state.supply, ['Smithy', 0]]), // Smithy exhausted
        players: [{
          ...state.players[0],
          hand: ['Workshop'],
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Workshop'
      });

      // Attempt to gain Smithy (supply = 0)
      const gainResult = engine.executeMove(playResult.newState!, {
        type: 'gain_card',
        card: 'Smithy'
      });

      expect(gainResult.success).toBe(false);
      expect(gainResult.error).toContain('Supply exhausted');
    });
  });

  describe('UT-FEAST: Trash self, gain card up to $5', () => {
    /**
     * UT-FEAST-1: Trash Feast and gain Duchy
     * @req: Feast trashes itself, gains card up to $5
     * @assert: Feast in trash, Duchy in discard
     */
    test('UT-FEAST-1: should trash Feast and gain Duchy', () => {
      // @req: Feast trashes itself automatically
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Feast', 'Copper'],
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Feast'
      });

      // Feast should be automatically trashed
      expect(playResult.newState!.trash).toContain('Feast');

      // Gain Duchy ($5)
      const gainResult = engine.executeMove(playResult.newState!, {
        type: 'gain_card',
        card: 'Duchy'
      });

      expect(gainResult.success).toBe(true);
      expect(gainResult.newState!.players[0].discard).toContain('Duchy');
    });

    /**
     * UT-FEAST-2: Error when gaining card > $5
     * @req: Feast cannot gain cards costing more than $5
     * @edge: Attempt to gain Gold ($6)
     * @assert: Error "Card too expensive"
     */
    test('UT-FEAST-2: should error when gaining card > $5', () => {
      // @req: Maximum $5 cost limit
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Feast'],
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Feast'
      });

      // Attempt to gain Gold ($6) - exceeds $5 limit
      const gainResult = engine.executeMove(playResult.newState!, {
        type: 'gain_card',
        card: 'Gold'
      });

      expect(gainResult.success).toBe(false);
      expect(gainResult.error).toContain('Card too expensive');
    });

    /**
     * UT-FEAST-3: Feast not in discard after cleanup
     * @req: Feast trashes itself, not discarded during cleanup
     * @edge: Cleanup phase should not move Feast to discard
     * @assert: Feast remains in trash, not in discard
     */
    test('UT-FEAST-3: Feast should not be in discard after cleanup', () => {
      // @req: Feast trashes itself (not discarded)
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Feast', 'Copper'],
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Feast'
      });

      const gainResult = engine.executeMove(playResult.newState!, {
        type: 'gain_card',
        card: 'Duchy'
      });

      // Move to cleanup phase
      const cleanupState: GameState = {
        ...gainResult.newState!,
        phase: 'cleanup'
      };

      const cleanupResult = engine.executeMove(cleanupState, {
        type: 'end_turn'
      });

      // Feast should be in trash, NOT in discard
      expect(cleanupResult.newState!.trash).toContain('Feast');
      expect(cleanupResult.newState!.players[0].discard).not.toContain('Feast');
    });
  });
});
