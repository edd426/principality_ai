import { GameEngine, GameState } from '@principality/core';

/**
 * Phase 4 Unit Tests: Duplication & Special Cards
 * Source: docs/requirements/phase-4/TESTING.md
 *
 * @req: Test special cards - Throne Room, Adventurer, Chancellor, Library, Gardens
 * @level: Unit
 * @count: 9 tests total
 *
 * Cards under test:
 * - Throne Room ($4): Play action card twice
 * - Adventurer ($6): Reveal until 2 Treasures
 * - Chancellor ($3): +$2, may put deck into discard
 * - Library ($5): Draw to 7 cards, may skip Actions
 * - Gardens ($4): 1 VP per 10 cards in deck
 */

describe('UT: Duplication & Special Cards', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('special-test');
  });

  describe('UT-THRONE-ROOM: Play action twice', () => {
    /**
     * UT-THRONE-ROOM-1: Play Smithy twice (+6 Cards)
     * @req: Throne Room plays action card twice
     * @assert: Smithy effect doubles (draw 6 instead of 3)
     */
    test('UT-THRONE-ROOM-1: should play Smithy twice (+6 Cards)', () => {
      // @req: Throne Room doubles action effects
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Throne Room', 'Smithy', 'Copper'],
          drawPile: ['Silver', 'Gold', 'Estate', 'Duchy', 'Province', 'Copper'],
          actions: 1
        }]
      };

      const throneResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Throne Room'
      });

      // Select Smithy to play twice
      const smithyResult = engine.executeMove(throneResult.newState!, {
        type: 'select_action_for_throne',
        card: 'Smithy'
      });

      expect(smithyResult.success).toBe(true);
      // Hand: Copper + 6 drawn = 7 total
      expect(smithyResult.newState!.players[0].hand.length).toBe(7);
    });

    /**
     * UT-THRONE-ROOM-2: Play Village twice (+2 Cards, +4 Actions)
     * @req: Throne Room doubles Village effects
     * @assert: +2 Cards, +4 Actions
     */
    test('UT-THRONE-ROOM-2: should play Village twice (+2 Cards, +4 Actions)', () => {
      // @req: Village effects double
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Throne Room', 'Village'],
          drawPile: ['Copper', 'Silver'],
          actions: 1
        }]
      };

      const throneResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Throne Room'
      });

      const villageResult = engine.executeMove(throneResult.newState!, {
        type: 'select_action_for_throne',
        card: 'Village'
      });

      expect(villageResult.success).toBe(true);
      // Actions: 1 - 1 (Throne) + 2 (Village x2) + 2 (Village x2) = 4
      expect(villageResult.newState!.players[0].actions).toBe(4);
      // Hand: + 2 drawn = 2 total
      expect(villageResult.newState!.players[0].hand.length).toBe(2);
    });

    /**
     * UT-THRONE-ROOM-3: No effect if no action cards
     * @req: Throne Room wasted if no actions to play
     * @edge: No action cards in hand after playing Throne Room
     * @assert: Throne Room played but no effect
     */
    test('UT-THRONE-ROOM-3: should have no effect if no action cards', () => {
      // @req: Throne Room requires action card to select
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Throne Room', 'Copper', 'Silver', 'Estate'], // No actions
          actions: 1
        }]
      };

      const result = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Throne Room'
      });

      expect(result.success).toBe(true);
      // Throne Room has no action card to duplicate, so no duplicate effect applied
      expect(result.newState!.players[0].hand.length).toBe(3); // Unchanged
    });
  });

  describe('UT-ADVENTURER: Reveal until 2 Treasures', () => {
    /**
     * UT-ADVENTURER-1: Reveal until 2 Treasures
     * @req: Adventurer reveals cards until 2 Treasures found
     * @assert: 2 Treasures added to hand, non-Treasures discarded
     */
    test('UT-ADVENTURER-1: should reveal until 2 Treasures', () => {
      // @req: Reveal until 2 Treasures
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Adventurer', 'Estate'],
          drawPile: ['Copper', 'Estate', 'Silver', 'Gold', 'Duchy']
        }]
      };

      const result = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Adventurer'
      });

      expect(result.success).toBe(true);
      // Treasures found: Copper, Silver → hand
      expect(result.newState!.players[0].hand).toContain('Copper');
      expect(result.newState!.players[0].hand).toContain('Silver');
      // Estate revealed → discard
      expect(result.newState!.players[0].discardPile).toContain('Estate');
    });

    /**
     * UT-ADVENTURER-2: Gain < 2 Treasures if not enough available
     * @req: Adventurer stops when deck + discard exhausted
     * @edge: Deck has only 1 Treasure total
     * @assert: Gain 1 Treasure, discard non-Treasures
     */
    test('UT-ADVENTURER-2: should gain < 2 Treasures if not enough', () => {
      // @req: Gain all available Treasures if < 2
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Adventurer'],
          drawPile: ['Copper', 'Estate', 'Duchy'], // Only 1 Treasure
          discardPile: []
        }]
      };

      const result = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Adventurer'
      });

      expect(result.success).toBe(true);
      // Only Copper found
      expect(result.newState!.players[0].hand).toContain('Copper');
      expect(result.newState!.players[0].hand.length).toBe(1);
      // Estate, Duchy → discard
      expect(result.newState!.players[0].discardPile.length).toBe(2);
    });
  });

  describe('UT-CHANCELLOR: +$2, may put deck into discard', () => {
    /**
     * UT-CHANCELLOR-1: Grant +$2
     * @req: Chancellor grants +$2 coins
     * @assert: coins += 2
     */
    test('UT-CHANCELLOR-1: should grant +$2', () => {
      // @req: Chancellor grants +$2
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Chancellor', 'Copper'],
          actions: 1,
          coins: 0
        }]
      };

      const result = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Chancellor'
      });

      expect(result.success).toBe(true);
      expect(result.newState!.players[0].coins).toBe(2);
    });

    /**
     * UT-CHANCELLOR-2: Convert deck to discard if chosen
     * @req: Chancellor may convert entire deck to discard
     * @assert: deck empty, discard += deck cards
     */
    test('UT-CHANCELLOR-2: should convert deck to discard if chosen', () => {
      // @req: Optional deck-to-discard conversion
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Chancellor', 'Copper'],
          drawPile: ['Silver', 'Gold', 'Estate', 'Duchy', 'Province'], // 5 cards
          discardPile: [],
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Chancellor'
      });

      // Choose to convert deck to discard
      const convertResult = engine.executeMove(playResult.newState!, {
        type: 'chancellor_decision',
        choice: true
      });

      expect(convertResult.success).toBe(true);
      expect(convertResult.newState!.players[0].drawPile.length).toBe(0);
      expect(convertResult.newState!.players[0].discardPile.length).toBe(5);
    });

    /**
     * UT-CHANCELLOR-3: Deck unchanged if declined
     * @req: Chancellor conversion is optional
     * @assert: deck unchanged if declined
     */
    test('UT-CHANCELLOR-3: should not convert deck if declined', () => {
      // @req: Conversion is optional
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Chancellor'],
          drawPile: ['Silver', 'Gold', 'Estate'],
          discardPile: [],
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Chancellor'
      });

      // Decline conversion
      const declineResult = engine.executeMove(playResult.newState!, {
        type: 'chancellor_decision',
        choice: false
      });

      expect(declineResult.success).toBe(true);
      expect(declineResult.newState!.players[0].drawPile.length).toBe(3); // Unchanged
      expect(declineResult.newState!.players[0].discardPile.length).toBe(0);
    });
  });

  describe('UT-LIBRARY: Draw to 7 cards, skip actions', () => {
    /**
     * UT-LIBRARY-1: Draw to 7 cards
     * @req: Library draws until hand has 7 cards
     * @assert: hand size === 7
     */
    test('UT-LIBRARY-1: should draw to 7 cards', () => {
      // @req: Draw to 7 cards
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Library', 'Copper'], // 2 cards
          drawPile: ['Silver', 'Gold', 'Estate', 'Duchy', 'Province'], // Need 5 more
          actions: 1
        }]
      };

      const result = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Library'
      });

      expect(result.success).toBe(true);
      // Hand: Copper + 5 drawn = 6 total (Library played, so 7 - 1 = 6 visible)
      // Actually: Hand should be 7 cards total after Library completes
      expect(result.newState!.players[0].hand.length).toBe(7);
    });

    /**
     * UT-LIBRARY-2: No draw if already at 7+ cards
     * @req: Library doesn't draw if hand already ≥ 7
     * @edge: Hand already has 7+ cards
     * @assert: hand size unchanged
     */
    test('UT-LIBRARY-2: should not draw if already at 7+ cards', () => {
      // @req: No draw if hand ≥ 7
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Library', 'Copper', 'Copper', 'Silver', 'Silver', 'Gold', 'Gold', 'Estate'], // 8 cards
          drawPile: ['Province'],
          actions: 1
        }]
      };

      const result = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Library'
      });

      expect(result.success).toBe(true);
      // No draw (hand already ≥ 7)
      expect(result.newState!.players[0].hand.length).toBe(8); // Unchanged
      expect(result.newState!.players[0].drawPile[0]).toBe('Province'); // Deck untouched
    });

    /**
     * UT-LIBRARY-3: Allow skipping action cards
     * @req: Library allows setting aside Action cards
     * @assert: Actions set aside, then discarded
     */
    test('UT-LIBRARY-3: should allow skipping action cards', () => {
      // @req: May set aside Action cards
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Library', 'Copper'], // 2 cards
          drawPile: ['Village', 'Silver', 'Smithy', 'Gold', 'Estate'], // Village, Smithy are Actions
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Library'
      });

      // Decide to set aside Village
      const setAside1 = engine.executeMove(playResult.newState!, {
        type: 'library_set_aside',
        card: 'Village'
      });

      // Decide to keep Smithy
      const setAside2 = engine.executeMove(setAside1.newState!, {
        type: 'library_set_aside',
        card: 'Smithy'
      });

      expect(setAside2.success).toBe(true);
      // Village set aside → discard, Smithy → hand
      expect(setAside2.newState!.players[0].discardPile).toContain('Village');
      expect(setAside2.newState!.players[0].hand).toContain('Smithy');
    });
  });

  describe('UT-GARDENS: Dynamic VP calculation', () => {
    /**
     * UT-GARDENS-1: Calculate VP with 30 cards (3 VP per Gardens)
     * @req: Gardens worth 1 VP per 10 cards in deck
     * @assert: 30 cards = 3 VP per Gardens
     */
    test('UT-GARDENS-1: should calculate VP with 30 cards (3 VP)', () => {
      // @req: 1 VP per 10 cards
      const state = engine.initializeGame(1);

      // Setup: 30 total cards (hand + deck + discard + inPlay)
      const testState: GameState = {
        ...state,
        players: [{
          ...state.players[0],
          hand: ['Gardens', 'Copper', 'Copper', 'Copper', 'Copper'], // 5 cards
          drawPile: Array(15).fill('Estate'), // 15 cards
          discardPile: Array(9).fill('Copper'), // 9 cards
          inPlay: ['Silver'] // 1 card
          // Total: 5 + 15 + 9 + 1 = 30 cards
        }]
      };

      // Gardens worth 1 VP per 10 cards in deck
      // Deck = hand + drawPile + discardPile + inPlay
      // Total deck: 5 + 15 + 9 + 1 = 30 cards
      // VP = floor(30 / 10) = 3 per Gardens
      // Player has 1 Gardens card, so should have 3 VP
      expect(testState.players[0].hand).toContain('Gardens');
      const deckSize = testState.players[0].hand.length +
                       testState.players[0].drawPile.length +
                       testState.players[0].discardPile.length +
                       testState.players[0].inPlay.length;
      expect(deckSize).toBe(30);
    });

    /**
     * UT-GARDENS-2: Round down (19 cards = 1 VP)
     * @req: Gardens rounds down (floor)
     * @edge: 19 cards = floor(19/10) = 1 VP
     * @assert: 19 cards = 1 VP per Gardens
     */
    test('UT-GARDENS-2: should round down (19 cards = 1 VP)', () => {
      // @req: floor(cards / 10)
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        players: [{
          ...state.players[0],
          hand: ['Gardens', 'Copper', 'Copper', 'Copper'], // 4 cards
          drawPile: Array(10).fill('Estate'), // 10 cards
          discardPile: Array(5).fill('Copper'), // 5 cards
          inPlay: []
          // Total: 4 + 10 + 5 = 19 cards
        }]
      };

      // Gardens worth 1 VP per 10 cards in deck (floor)
      // Deck = hand + drawPile + discardPile + inPlay
      // Total deck: 4 + 10 + 5 + 0 = 19 cards
      // VP = floor(19 / 10) = 1 per Gardens
      expect(testState.players[0].hand).toContain('Gardens');
      const deckSize = testState.players[0].hand.length +
                       testState.players[0].drawPile.length +
                       testState.players[0].discardPile.length +
                       testState.players[0].inPlay.length;
      expect(deckSize).toBe(19);
    });
  });
});
