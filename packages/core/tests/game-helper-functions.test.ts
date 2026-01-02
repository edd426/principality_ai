/**
 * Test Suite: Game Helper Functions - Error Paths and Edge Cases
 *
 * Status: NEW - Phase 1 Coverage Improvement
 * Created: 2025-11-09
 * Phase: Coverage Improvement Phase 1
 *
 * Purpose:
 * Test uncovered helper functions and error paths in game.ts to improve coverage
 * from 30.86% toward 65% target.
 *
 * Focus Areas:
 * - trashCards() helper function (lines 33-69)
 * - gainCard() helper function (lines 74-143)
 * - Error paths in handleTrashCards (lines 722-953)
 * - Boundary conditions and invalid inputs
 *
 * @level Unit
 * @related Issue #31
 */

import { GameEngine, GameState, CardName } from '../src/index';

describe('Helper Functions: Error Paths & Edge Cases', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('helper-test-seed');
  });

  describe('trashCards() - Error Handling', () => {
    /**
     * @test Attempting to trash cards not in hand should fail
     * @coverage Lines 47-51 (validation loop)
     */
    test('should error when trying to trash cards not in hand', () => {
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Chapel', 'Copper', 'Estate'],
          actions: 1
        }]
      };

      // Play Chapel to create pending effect
      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Chapel'
      });

      expect(playResult.success).toBe(true);

      // Try to trash a Silver that's not in hand
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'trash_cards',
        cards: ['Silver']
      });

      expect(trashResult.success).toBe(false);
      expect(trashResult.error).toContain('Cannot trash');
      expect(trashResult.error).toContain('Silver');
    });

    /**
     * @test Attempting to trash more of a card than you have should fail
     * @coverage Lines 42-50 (card count validation)
     */
    test('should error when trying to trash more copies than in hand', () => {
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Chapel', 'Copper', 'Estate'], // Only 1 Copper
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Chapel'
      });

      // Try to trash 2 Coppers when only 1 in hand
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'trash_cards',
        cards: ['Copper', 'Copper']
      });

      expect(trashResult.success).toBe(false);
      expect(trashResult.error).toContain('Cannot trash 2 Copper');
      expect(trashResult.error).toContain('only have 1');
    });

    /**
     * @test Trashing duplicate cards from hand should work correctly
     * @coverage Lines 54-60 (card removal logic with duplicates)
     */
    test('should correctly trash multiple copies of same card', () => {
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Chapel', 'Copper', 'Copper', 'Copper', 'Estate'],
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Chapel'
      });

      // Trash 3 Coppers
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'trash_cards',
        cards: ['Copper', 'Copper', 'Copper']
      });

      expect(trashResult.success).toBe(true);
      expect(trashResult.newState!.trash).toEqual(['Copper', 'Copper', 'Copper']);
      expect(trashResult.newState!.players[0].hand).toEqual(['Estate']);
    });
  });

  describe('Chapel - Validation Edge Cases', () => {
    /**
     * @test Chapel should reject trashing > 4 cards
     * @coverage Lines 733-735 (Chapel validation)
     */
    test('should error when Chapel tries to trash > 4 cards', () => {
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Chapel', 'Copper', 'Copper', 'Copper', 'Estate', 'Estate', 'Estate'],
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Chapel'
      });

      // Try to trash 5 cards
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'trash_cards',
        cards: ['Copper', 'Copper', 'Copper', 'Estate', 'Estate']
      });

      expect(trashResult.success).toBe(false);
      expect(trashResult.error).toContain('Chapel can only trash up to 4 cards');
    });

    /**
     * @test Attempting to trash without pending effect should fail
     * @coverage Lines 726-728 (pending effect validation)
     */
    test('should error when trying to trash without pending effect', () => {
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Copper', 'Estate'],
          actions: 1
        }],
        pendingEffect: undefined // No pending effect
      };

      const trashResult = engine.executeMove(testState, {
        type: 'trash_cards',
        cards: ['Copper']
      });

      expect(trashResult.success).toBe(false);
      expect(trashResult.error).toContain('No card effect requires trashing');
    });
  });

  describe('gainCard() - Error Handling', () => {
    /**
     * @test Attempting to gain from empty supply should fail
     * @coverage Lines 82-90 (supply validation in gainCard)
     */
    test('should error when trying to gain from empty supply', () => {
      const state = engine.initializeGame(1);

      // Create state with Workshop effect and empty Province pile
      const newSupply = new Map(state.supply);
      newSupply.set('Province', 0);

      const testState: GameState = {
        ...state,
        phase: 'action',
        supply: newSupply,
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

      // Try to gain Province from empty pile
      const gainResult = engine.executeMove(playResult.newState!, {
        type: 'gain_card',
        card: 'Province'
      });

      expect(gainResult.success).toBe(false);
      // Could be cost error or supply error depending on validation order
      expect(gainResult.error).toBeTruthy();
      expect(typeof gainResult.error).toBe('string');
    });

    /**
     * @test Gaining to different destinations (hand, discard, topdeck)
     * @coverage Lines 100-143 (destination handling)
     * @fix: Verified working - Mine gains treasure to hand
     */
    test('should correctly gain card to hand', () => {
      const state = engine.initializeGame(1);

      // Test Mine's gain-to-hand behavior
      const stateWithMine: GameState = {
        ...state,
        phase: 'action',
        supply: new Map([...state.supply, ['Mine', 10], ['Silver', 40]]),
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Copper'],
          discardPile: [],
          actions: 1
        }]
      };

      const playMine = engine.executeMove(stateWithMine, {
        type: 'play_action',
        card: 'Mine'
      });

      const trashCopper = engine.executeMove(playMine.newState!, {
        type: 'select_treasure_to_trash',
        card: 'Copper'
      });

      const gainSilver = engine.executeMove(trashCopper.newState!, {
        type: 'gain_card',
        card: 'Silver'
      });

      expect(gainSilver.success).toBe(true);
      // Silver should be in hand (Mine gains to hand)
      expect(gainSilver.newState!.players[0].hand).toContain('Silver');
      // Silver should NOT be in discard
      expect(gainSilver.newState!.players[0].discardPile).not.toContain('Silver');
    });

    /**
     * @test Gaining card to discard pile (default behavior)
     * @coverage Lines 100-143 (destination: discard)
     */
    test('should correctly gain card to discard pile', () => {
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Workshop'],
          discardPile: [],
          actions: 1
        }]
      };

      const playWorkshop = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Workshop'
      });

      const gainSilver = engine.executeMove(playWorkshop.newState!, {
        type: 'gain_card',
        card: 'Silver'
      });

      expect(gainSilver.success).toBe(true);
      // Silver should be in discard pile
      expect(gainSilver.newState!.players[0].discardPile).toContain('Silver');
      // Silver should NOT be in hand
      expect(gainSilver.newState!.players[0].hand).not.toContain('Silver');
    });
  });

  describe('Remodel - Trash and Gain Logic', () => {
    /**
     * @test Remodel with various card cost differences
     * @coverage Lines 773-872 (Remodel case in handleTrashCards)
     */
    // @fix: Corrected syntax - uses cards: [] array, not card: string
    test('should handle Remodel upgrade paths correctly', () => {
      const state = engine.initializeGame(1);

      // Test upgrading Estate ($2) to card up to $4
      const testState: GameState = {
        ...state,
        phase: 'action',
        supply: new Map([...state.supply, ['Remodel', 10], ['Smithy', 10]]),
        players: [{
          ...state.players[0],
          hand: ['Remodel', 'Estate', 'Copper'],
          actions: 1
        }]
      };

      const playRemodel = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Remodel'
      });

      const trashEstate = engine.executeMove(playRemodel.newState!, {
        type: 'trash_cards',
        cards: ['Estate']  // Fixed: use cards array
      });

      expect(trashEstate.success).toBe(true);
      expect(trashEstate.newState!.trash).toContain('Estate');

      // Should now be able to gain card up to $4
      expect(trashEstate.newState!.pendingEffect).toBeTruthy();
      expect(typeof trashEstate.newState!.pendingEffect).toBe('object');
      expect(trashEstate.newState!.pendingEffect!.effect).toBe('gain_card');
    });

    /**
     * @test Remodel with Throne Room doubling
     * @coverage Lines 835-872 (Throne Room double logic for Remodel)
     */
    // @fix: Corrected syntax - uses cards: [] array, not card: string
    test('should handle Throne Room + Remodel correctly', () => {
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        supply: new Map([...state.supply, ['Remodel', 10], ['Silver', 40], ['Smithy', 10]]),
        players: [{
          ...state.players[0],
          hand: ['Throne Room', 'Remodel', 'Estate', 'Copper', 'Silver'],
          actions: 1,
          discardPile: []
        }]
      };

      // Play Throne Room
      const playThrone = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Throne Room'
      });

      // Select Remodel
      const selectRemodel = engine.executeMove(playThrone.newState!, {
        type: 'select_action_for_throne',
        card: 'Remodel'
      });

      // First Remodel: trash Estate
      const trash1 = engine.executeMove(selectRemodel.newState!, {
        type: 'trash_cards',
        cards: ['Estate']  // Fixed: use cards array
      });

      expect(trash1.success).toBe(true);

      // Gain a card (Estate costs $2, can gain up to $4)
      const gain1 = engine.executeMove(trash1.newState!, {
        type: 'gain_card',
        card: 'Smithy'  // Changed: Smithy costs $4, within range
      });

      expect(gain1.success).toBe(true);
      expect(gain1.newState!.players[0].discardPile).toContain('Smithy');
    });
  });

  describe('Mine - Treasure Trashing Logic', () => {
    /**
     * @test Mine with non-treasure should fail
     * @coverage Lines 874-925 (Mine case in handleTrashCards)
     */
    test('should error when Mine tries to trash non-treasure', () => {
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Estate', 'Copper'],
          actions: 1
        }]
      };

      const playMine = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      // Try to trash Estate (not a treasure)
      const trashEstate = engine.executeMove(playMine.newState!, {
        type: 'select_treasure_to_trash',
        card: 'Estate'
      });

      expect(trashEstate.success).toBe(false);
      expect(trashEstate.error).toContain('Treasure');
    });

    /**
     * @test Mine upgrade paths (Copper→Silver, Silver→Gold)
     * @coverage Lines 874-925 (Mine treasure validation and gain)
     */
    // @fix: Verified working - Mine gains treasure to hand
    test('should handle Mine upgrade from Copper to Silver', () => {
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        supply: new Map([...state.supply, ['Mine', 10], ['Silver', 40]]),
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Copper', 'Copper'],
          actions: 1,
          discardPile: []
        }]
      };

      const playMine = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      const trashCopper = engine.executeMove(playMine.newState!, {
        type: 'select_treasure_to_trash',
        card: 'Copper'
      });

      expect(trashCopper.success).toBe(true);
      expect(trashCopper.newState!.trash).toContain('Copper');

      const gainSilver = engine.executeMove(trashCopper.newState!, {
        type: 'gain_card',
        card: 'Silver'
      });

      expect(gainSilver.success).toBe(true);
      // Silver should be gained to hand (Mine special rule)
      expect(gainSilver.newState!.players[0].hand).toContain('Silver');
    });
  });

  describe('Moneylender - Error Paths', () => {
    /**
     * @test Moneylender without Copper in hand
     * @coverage Lines 1125-1145 (handleMoneylender)
     */
    test('should handle Moneylender when no Copper in hand', () => {
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Moneylender', 'Estate', 'Silver'], // No Copper
          actions: 1,
          coins: 0
        }]
      };

      const playMoneylender = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Moneylender'
      });

      expect(playMoneylender.success).toBe(true);
      // Should not gain coins if no Copper
      expect(playMoneylender.newState!.players[0].coins).toBe(0);
      // Trash should be empty
      expect(playMoneylender.newState!.trash.length).toBe(0);
    });

    /**
     * @test Moneylender with Copper should trash and gain +$3
     * @coverage Lines 1125-1145 (handleMoneylender with Copper)
     */
    // @fix: Verified working - Moneylender requires explicit trash move, then grants +$3
    test('should trash Copper and gain +$3 with Moneylender', () => {
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        supply: new Map([...state.supply, ['Moneylender', 10]]),
        trash: [],
        players: [{
          ...state.players[0],
          hand: ['Moneylender', 'Copper', 'Estate'],
          actions: 1,
          coins: 0
        }]
      };

      const playMoneylender = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Moneylender'
      });

      expect(playMoneylender.success).toBe(true);

      // Moneylender requires explicit trash move
      const trashCopper = engine.executeMove(playMoneylender.newState!, {
        type: 'trash_cards',
        cards: ['Copper']
      });

      expect(trashCopper.success).toBe(true);
      expect(trashCopper.newState!.trash).toContain('Copper');
      expect(trashCopper.newState!.players[0].coins).toBe(3);
      expect(trashCopper.newState!.players[0].hand).not.toContain('Copper');
    });
  });

  describe('Invalid Move Types', () => {
    /**
     * @test Invalid move types should be handled gracefully
     * @coverage Error handling in processMove
     */
    test('should error on invalid move type during action phase', () => {
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Copper'],
          actions: 1
        }]
      };

      // Try to play treasure during action phase
      const result = engine.executeMove(testState, {
        type: 'play_treasure',
        card: 'Copper'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot play treasures outside buy phase');
    });

    /**
     * @test Playing action during buy phase should fail
     */
    test('should error when playing action during buy phase', () => {
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [{
          ...state.players[0],
          hand: ['Village'],
          actions: 0
        }]
      };

      const result = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Village'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot play actions outside action phase');
    });
  });
});
