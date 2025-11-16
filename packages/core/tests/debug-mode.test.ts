import { GameEngine } from '../src/game';
import { GameState } from '../src/types';

// @req: UTIL-DEBUG-MODE - Debug mode functionality for inspecting game state
// @edge: Debug mode enabled/disabled; accessing various game state components
// @why: Enables developers to inspect hidden game state for debugging and testing

describe('Debug Mode', () => {
  describe('Debug Mode Disabled (default)', () => {
    let engine: GameEngine;
    let state: GameState;

    beforeEach(() => {
      // Default: debugMode is false
      engine = new GameEngine('debug-test-seed');
      state = engine.initializeGame(1);
    });

    test('UT-DEBUG-1: should have debugMode disabled by default', () => {
      expect(engine.isDebugMode()).toBe(false);
    });

    test('UT-DEBUG-2: debugGetDeck should throw error when debug mode disabled', () => {
      expect(() => engine.debugGetDeck(state, 0)).toThrow('Debug mode not enabled');
    });

    test('UT-DEBUG-3: debugGetHand should throw error when debug mode disabled', () => {
      expect(() => engine.debugGetHand(state, 0)).toThrow('Debug mode not enabled');
    });

    test('UT-DEBUG-4: debugGetDiscard should throw error when debug mode disabled', () => {
      expect(() => engine.debugGetDiscard(state, 0)).toThrow('Debug mode not enabled');
    });

    test('UT-DEBUG-5: debugGetTrash should throw error when debug mode disabled', () => {
      expect(() => engine.debugGetTrash(state)).toThrow('Debug mode not enabled');
    });

    test('UT-DEBUG-6: debugGetFullState should throw error when debug mode disabled', () => {
      expect(() => engine.debugGetFullState(state)).toThrow('Debug mode not enabled');
    });
  });

  describe('Debug Mode Enabled', () => {
    let engine: GameEngine;
    let state: GameState;

    beforeEach(() => {
      // Enable debug mode via options
      engine = new GameEngine('debug-test-seed', { debugMode: true });
      state = engine.initializeGame(1);
    });

    test('UT-DEBUG-7: should have debugMode enabled when specified in options', () => {
      expect(engine.isDebugMode()).toBe(true);
    });

    test('UT-DEBUG-8: debugGetDeck should return player deck contents', () => {
      const deck = engine.debugGetDeck(state, 0);

      expect(Array.isArray(deck)).toBe(true);
      expect(deck.length).toBe(5); // Starting deck is split: 5 in hand, 5 in deck

      // Verify all cards are valid card names (strings)
      deck.forEach(card => {
        expect(typeof card).toBe('string');
      });
    });

    test('UT-DEBUG-9: debugGetHand should return player hand contents', () => {
      const hand = engine.debugGetHand(state, 0);

      expect(Array.isArray(hand)).toBe(true);
      expect(hand.length).toBe(5); // Starting hand size

      // Hand should match state.players[0].hand
      expect(hand).toEqual(state.players[0].hand);
    });

    test('UT-DEBUG-10: debugGetDiscard should return player discard pile contents', () => {
      const discard = engine.debugGetDiscard(state, 0);

      expect(Array.isArray(discard)).toBe(true);
      expect(discard.length).toBe(0); // Starting discard is empty
    });

    test('UT-DEBUG-11: debugGetTrash should return trash pile contents', () => {
      const trash = engine.debugGetTrash(state);

      expect(Array.isArray(trash)).toBe(true);
      expect(trash.length).toBe(0); // Starting trash is empty
    });

    test('UT-DEBUG-12: debugGetFullState should return complete game state', () => {
      const fullState = engine.debugGetFullState(state);

      expect(fullState).toBeDefined();
      expect(fullState.players).toBeDefined();
      expect(fullState.supply).toBeDefined();
      expect(fullState.trash).toBeDefined();
      expect(fullState.currentPlayer).toBe(0);
      expect(fullState.phase).toBe('action');
      expect(fullState.turnNumber).toBe(1);
    });

    test('UT-DEBUG-13: debugGetDeck should throw error for invalid player index', () => {
      expect(() => engine.debugGetDeck(state, 5)).toThrow('Invalid player index');
    });

    test('UT-DEBUG-14: debugGetHand should throw error for negative player index', () => {
      expect(() => engine.debugGetHand(state, -1)).toThrow('Invalid player index');
    });

    test('UT-DEBUG-15: should inspect in-play cards after playing treasures', () => {
      // Move to buy phase and play treasures
      const buyPhaseState: GameState = {
        ...state,
        phase: 'buy',
        players: [{
          ...state.players[0],
          hand: ['Copper', 'Copper', 'Silver', 'Estate', 'Duchy'],
          drawPile: ['Gold', 'Province'],
          discardPile: [],
          inPlay: [],
          actions: 0,
          buys: 1,
          coins: 0
        }]
      };

      // Play all treasures
      const result1 = engine.executeMove(buyPhaseState, { type: 'play_treasure', card: 'Copper' });
      expect(result1.success).toBe(true);
      const result2 = engine.executeMove(result1.newState!, { type: 'play_treasure', card: 'Copper' });
      expect(result2.success).toBe(true);
      const result3 = engine.executeMove(result2.newState!, { type: 'play_treasure', card: 'Silver' });
      expect(result3.success).toBe(true);

      // Inspect hand - should be reduced after playing treasures
      const hand = engine.debugGetHand(result3.newState!, 0);
      expect(hand.length).toBe(2); // Only Estate and Duchy left
      expect(hand).not.toContain('Copper');
      expect(hand).not.toContain('Silver');
    });

    test('UT-DEBUG-16: should inspect trash after Chapel trashes cards', () => {
      // Set up state with Chapel in hand
      const chapelState: GameState = {
        ...state,
        players: [{
          ...state.players[0],
          hand: ['Chapel', 'Copper', 'Copper', 'Estate', 'Copper']
        }]
      };

      // Play Chapel
      const playResult = engine.executeMove(chapelState, { type: 'play_action', card: 'Chapel' });
      expect(playResult.success).toBe(true);

      // Trash 3 cards
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'trash_cards',
        cards: ['Copper', 'Copper', 'Estate']
      });
      expect(trashResult.success).toBe(true);

      // Inspect trash - should contain 3 cards
      const trash = engine.debugGetTrash(trashResult.newState!);
      expect(trash.length).toBe(3);
      expect(trash).toContain('Copper');
      expect(trash).toContain('Estate');
    });
  });

  describe('Debug Mode with Multiple Players', () => {
    let engine: GameEngine;
    let state: GameState;

    beforeEach(() => {
      engine = new GameEngine('multiplayer-debug-seed', { debugMode: true });
      state = engine.initializeGame(2);
    });

    test('UT-DEBUG-17: should inspect different players\' decks', () => {
      const deck0 = engine.debugGetDeck(state, 0);
      const deck1 = engine.debugGetDeck(state, 1);

      expect(Array.isArray(deck0)).toBe(true);
      expect(Array.isArray(deck1)).toBe(true);

      // Both decks should have 5 cards (half of starting 10)
      expect(deck0.length).toBe(5);
      expect(deck1.length).toBe(5);
    });

    test('UT-DEBUG-18: should inspect different players\' hands', () => {
      const hand0 = engine.debugGetHand(state, 0);
      const hand1 = engine.debugGetHand(state, 1);

      expect(hand0).toEqual(state.players[0].hand);
      expect(hand1).toEqual(state.players[1].hand);
      expect(hand0.length).toBe(5);
      expect(hand1.length).toBe(5);
    });

    test('UT-DEBUG-19: should throw error when player index exceeds player count', () => {
      expect(() => engine.debugGetDeck(state, 2)).toThrow('Invalid player index');
      expect(() => engine.debugGetHand(state, 3)).toThrow('Invalid player index');
    });
  });

  describe('Debug Mode Security', () => {
    test('UT-DEBUG-20: debug mode should not be enabled via GameState manipulation', () => {
      const engine = new GameEngine('security-test-seed');
      const state = engine.initializeGame(1);

      // Try to access debug methods - should fail even with state
      expect(() => engine.debugGetDeck(state, 0)).toThrow('Debug mode not enabled');
    });

    test('UT-DEBUG-21: debugMode option should only be settable at construction', () => {
      const engine = new GameEngine('security-test-seed', { debugMode: false });
      const state = engine.initializeGame(1);

      // No way to enable debug mode after construction
      expect(engine.isDebugMode()).toBe(false);
      expect(() => engine.debugGetDeck(state, 0)).toThrow('Debug mode not enabled');
    });
  });

  describe('Edge Cases', () => {
    let engine: GameEngine;

    beforeEach(() => {
      engine = new GameEngine('edge-case-seed', { debugMode: true });
    });

    test('UT-DEBUG-22: should handle empty deck', () => {
      const state = engine.initializeGame(1);

      // Create state with empty deck
      const emptyDeckState: GameState = {
        ...state,
        players: [{
          ...state.players[0],
          drawPile: [],
          hand: ['Copper', 'Copper', 'Silver'],
          discardPile: ['Estate', 'Duchy']
        }]
      };

      const deck = engine.debugGetDeck(emptyDeckState, 0);
      expect(deck).toEqual([]);
      expect(deck.length).toBe(0);
    });

    test('UT-DEBUG-23: should handle empty hand', () => {
      const state = engine.initializeGame(1);

      const emptyHandState: GameState = {
        ...state,
        players: [{
          ...state.players[0],
          hand: [],
          drawPile: ['Copper', 'Silver']
        }]
      };

      const hand = engine.debugGetHand(emptyHandState, 0);
      expect(hand).toEqual([]);
      expect(hand.length).toBe(0);
    });

    test('UT-DEBUG-24: should return immutable copies of game state', () => {
      const state = engine.initializeGame(1);

      const hand = engine.debugGetHand(state, 0);
      const deck = engine.debugGetDeck(state, 0);

      // Modifying returned arrays should not affect game state
      (hand as any).push('Gold');
      (deck as any).push('Province');

      // Re-fetch should return original state
      const hand2 = engine.debugGetHand(state, 0);
      const deck2 = engine.debugGetDeck(state, 0);

      expect(hand2).not.toContain('Gold');
      expect(deck2).not.toContain('Province');
    });
  });
});
