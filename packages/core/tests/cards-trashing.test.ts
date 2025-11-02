import { GameEngine, GameState } from '@principality/core';

/**
 * Phase 4 Unit Tests: Trashing System Cards
 * Source: docs/requirements/phase-4/TESTING.md
 *
 * @req: Test all trashing cards - Chapel, Remodel, Mine, Moneylender
 * @level: Unit
 * @count: 12 tests total
 *
 * Cards under test:
 * - Chapel ($2): Trash up to 4 cards
 * - Remodel ($4): Trash 1, gain card +$2 cost
 * - Mine ($5): Trash Treasure, gain Treasure +$3 to hand
 * - Moneylender ($4): Trash Copper for +$3
 */

describe('UT: Trashing System Cards', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('trashing-test');
  });

  describe('UT-CHAPEL: Trash up to 4 cards', () => {
    /**
     * UT-CHAPEL-1: Trash 0 cards (optional trashing)
     * @req: Chapel must allow trashing 0 cards (skip)
     * @edge: Trashing is optional, not mandatory
     * @why: Chapel's "up to 4" means 0-4 range
     * @assert: trash.length === 0, no error thrown
     */
    test('UT-CHAPEL-1: should trash 0 cards (skip trashing)', () => {
      // @req: Trashing is optional
      const state = engine.initializeGame(1);

      // Setup: Player has Chapel in hand
      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Chapel', 'Copper', 'Copper', 'Estate'],
          actions: 1
        }]
      };

      // Play Chapel
      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Chapel'
      });

      expect(playResult.success).toBe(true);

      // Player chooses to trash 0 cards
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'trash_cards',
        cards: []
      });

      expect(trashResult.success).toBe(true);
      expect(trashResult.newState!.trash.length).toBe(0);
      expect(trashResult.newState!.players[0].hand.length).toBe(3); // Copper, Copper, Estate
    });

    /**
     * UT-CHAPEL-2: Trash 1-3 cards
     * @req: Chapel can trash any amount from 0-4
     * @assert: trash pile contains exactly trashed cards
     */
    test('UT-CHAPEL-2: should trash 1-3 cards', () => {
      // @req: Flexible trashing amount
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Chapel', 'Copper', 'Copper', 'Estate', 'Estate'],
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Chapel'
      });

      // Trash 2 cards: [Copper, Estate]
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'trash_cards',
        cards: ['Copper', 'Estate']
      });

      expect(trashResult.success).toBe(true);
      expect(trashResult.newState!.trash).toEqual(['Copper', 'Estate']);
      expect(trashResult.newState!.players[0].hand.length).toBe(2); // Copper, Estate remaining
    });

    /**
     * UT-CHAPEL-3: Trash exactly 4 cards
     * @req: Chapel maximum is 4 cards
     * @edge: Boundary condition (maximum trashing)
     * @assert: trash pile has 4 cards
     */
    test('UT-CHAPEL-3: should trash exactly 4 cards', () => {
      // @req: Maximum 4 cards
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Chapel', 'Copper', 'Copper', 'Estate', 'Estate', 'Duchy'],
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Chapel'
      });

      // Trash 4 cards (maximum)
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'trash_cards',
        cards: ['Copper', 'Copper', 'Estate', 'Estate']
      });

      expect(trashResult.success).toBe(true);
      expect(trashResult.newState!.trash.length).toBe(4);
      expect(trashResult.newState!.players[0].hand).toEqual(['Duchy']);
    });

    /**
     * UT-CHAPEL-4: Error when trashing > 4 cards
     * @req: Chapel cannot trash more than 4 cards
     * @edge: Exceeding maximum limit
     * @assert: Error with message "Chapel can only trash up to 4 cards"
     */
    test('UT-CHAPEL-4: should error when trashing > 4 cards', () => {
      // @req: Maximum limit enforcement
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Chapel', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Estate'],
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Chapel'
      });

      // Attempt to trash 5 cards (exceeds maximum)
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'trash_cards',
        cards: ['Copper', 'Copper', 'Copper', 'Copper', 'Copper']
      });

      expect(trashResult.success).toBe(false);
      expect(trashResult.error).toContain('Chapel can only trash up to 4 cards');
    });
  });

  describe('UT-REMODEL: Trash and gain upgrade', () => {
    /**
     * UT-REMODEL-1: Upgrade Estate to Smithy
     * @req: Remodel trashes 1 card, gains card costing up to (trashed + $2)
     * @assert: Estate trashed, Smithy gained to discard
     */
    test('UT-REMODEL-1: should upgrade Estate to Smithy', () => {
      // @req: Trash Estate ($2), gain up to $4 (Smithy)
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Remodel', 'Estate', 'Copper', 'Silver'],
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Remodel'
      });

      // Trash Estate ($2)
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'trash_cards',
        cards: ['Estate']
      });

      // Gain Smithy ($4 = $2 + $2)
      const gainResult = engine.executeMove(trashResult.newState!, {
        type: 'gain_card',
        card: 'Smithy'
      });

      expect(gainResult.success).toBe(true);
      expect(gainResult.newState!.trash).toContain('Estate');
      expect(gainResult.newState!.players[0].discard).toContain('Smithy');
    });

    /**
     * UT-REMODEL-2: Upgrade Silver to Gold
     * @req: Silver ($3) + $2 = $5 max, Gold costs $6 (too expensive)
     * @edge: Attempting to exceed cost limit
     * @assert: Error or require valid card selection
     */
    test('UT-REMODEL-2: should upgrade Silver to card up to $5', () => {
      // @req: Remodel Silver ($3) allows gain up to $5
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Remodel', 'Silver', 'Copper'],
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Remodel'
      });

      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'trash_cards',
        cards: ['Silver']
      });

      // Attempt Gold ($6) - should fail
      const invalidGain = engine.executeMove(trashResult.newState!, {
        type: 'gain_card',
        card: 'Gold'
      });

      expect(invalidGain.success).toBe(false);
      expect(invalidGain.error).toContain('Card costs more than allowed');

      // Gain Duchy ($5) - should succeed
      const validGain = engine.executeMove(trashResult.newState!, {
        type: 'gain_card',
        card: 'Duchy'
      });

      expect(validGain.success).toBe(true);
      expect(validGain.newState!.players[0].discard).toContain('Duchy');
    });

    /**
     * UT-REMODEL-3: Error when trashing nothing
     * @req: Remodel requires trashing exactly 1 card
     * @edge: Empty hand after playing Remodel
     * @assert: Error "Must trash a card"
     */
    test('UT-REMODEL-3: should error when trashing nothing', () => {
      // @req: Must trash exactly 1 card
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Remodel'], // Only Remodel, no other cards
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Remodel'
      });

      // Hand is now empty, cannot trash anything
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'trash_cards',
        cards: []
      });

      expect(trashResult.success).toBe(false);
      expect(trashResult.error).toContain('Must trash a card');
    });
  });

  describe('UT-MINE: Trash treasure, gain treasure to hand', () => {
    /**
     * UT-MINE-1: Upgrade Copper to Silver (to hand)
     * @req: Mine trashes Treasure, gains Treasure +$3 to hand (not discard)
     * @assert: Silver in hand, Copper in trash
     */
    test('UT-MINE-1: should upgrade Copper to Silver (to hand)', () => {
      // @req: Gain Treasure to hand, not discard
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Copper', 'Estate'],
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'trash_cards',
        cards: ['Copper']
      });

      // Gain Silver to hand (not discard)
      const gainResult = engine.executeMove(trashResult.newState!, {
        type: 'gain_card',
        card: 'Silver',
        destination: 'hand'
      });

      expect(gainResult.success).toBe(true);
      expect(gainResult.newState!.trash).toContain('Copper');
      expect(gainResult.newState!.players[0].hand).toContain('Silver');
      expect(gainResult.newState!.players[0].discard).not.toContain('Silver');
    });

    /**
     * UT-MINE-2: Error when no treasures in hand
     * @req: Mine requires trashing a Treasure
     * @edge: Hand has no Treasures (only Victory/Action cards)
     * @assert: Error "Must trash a Treasure"
     */
    test('UT-MINE-2: should error when no treasures in hand', () => {
      // @req: Must trash a Treasure
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Estate', 'Duchy'], // No Treasures
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      // Attempt to trash Estate (not a Treasure)
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'trash_cards',
        cards: ['Estate']
      });

      expect(trashResult.success).toBe(false);
      expect(trashResult.error).toContain('Must trash a Treasure');
    });

    /**
     * UT-MINE-3: Error when gaining non-treasure
     * @req: Mine must gain a Treasure card
     * @edge: Attempt to gain non-Treasure (Estate, Smithy)
     * @assert: Error "Must gain a Treasure"
     */
    test('UT-MINE-3: should error when gaining non-treasure', () => {
      // @req: Must gain a Treasure
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Copper'],
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'trash_cards',
        cards: ['Copper']
      });

      // Attempt to gain Estate (not a Treasure)
      const gainResult = engine.executeMove(trashResult.newState!, {
        type: 'gain_card',
        card: 'Estate',
        destination: 'hand'
      });

      expect(gainResult.success).toBe(false);
      expect(gainResult.error).toContain('Must gain a Treasure');
    });
  });

  describe('UT-MONEYLENDER: Trash Copper for +$3', () => {
    /**
     * UT-MONEYLENDER-1: Trash Copper and gain +$3
     * @req: Moneylender trashes Copper, grants +$3 coins
     * @assert: Copper in trash, coins += 3
     */
    test('UT-MONEYLENDER-1: should trash Copper and gain +$3', () => {
      // @req: Trash Copper for +$3
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Moneylender', 'Copper', 'Silver'],
          actions: 1,
          coins: 0
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Moneylender'
      });

      // Trash Copper
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'trash_cards',
        cards: ['Copper']
      });

      expect(trashResult.success).toBe(true);
      expect(trashResult.newState!.trash).toContain('Copper');
      expect(trashResult.newState!.players[0].coins).toBe(3);
      expect(trashResult.newState!.players[0].hand).toEqual(['Silver']);
    });

    /**
     * UT-MONEYLENDER-2: No effect when no Copper
     * @req: Moneylender has no effect if no Copper in hand
     * @edge: Hand has no Copper
     * @assert: No coins gained, no trash, message "No Copper to trash"
     */
    test('UT-MONEYLENDER-2: should have no effect when no Copper', () => {
      // @req: No Copper = no effect
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Moneylender', 'Silver', 'Gold'],
          actions: 1,
          coins: 0
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Moneylender'
      });

      expect(playResult.success).toBe(true);
      expect(playResult.newState!.trash.length).toBe(0);
      expect(playResult.newState!.players[0].coins).toBe(0);
      expect(playResult.message).toContain('No Copper to trash');
    });

    /**
     * UT-MONEYLENDER-3: Trash only 1 Copper (if multiple)
     * @req: Moneylender trashes only 1 Copper
     * @edge: Multiple Coppers in hand
     * @assert: trash has 1 Copper, hand retains remaining Coppers
     */
    test('UT-MONEYLENDER-3: should trash only 1 Copper (if multiple)', () => {
      // @req: Only 1 Copper trashed
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Moneylender', 'Copper', 'Copper', 'Copper'],
          actions: 1,
          coins: 0
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Moneylender'
      });

      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'trash_cards',
        cards: ['Copper'] // Select first Copper
      });

      expect(trashResult.success).toBe(true);
      expect(trashResult.newState!.trash.length).toBe(1);
      expect(trashResult.newState!.trash).toEqual(['Copper']);
      expect(trashResult.newState!.players[0].hand.filter(c => c === 'Copper').length).toBe(2);
      expect(trashResult.newState!.players[0].coins).toBe(3);
    });
  });
});
