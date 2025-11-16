import { GameEngine, GameState } from '@principality/core';

/**
 * Phase 4 Unit Tests: Council Room Other Player Draw
 * Related Issue: #6
 *
 * @req: Council Room should cause each other player to draw a card
 * @level: Unit
 * @count: 4 tests total
 *
 * Card under test:
 * - Council Room ($5): +4 Cards, +1 Buy. Each other player draws 1 card.
 */

describe('UT: Council Room - Other Player Draw Effect', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('council-room-test');
  });

  describe('UT-COUNCIL-ROOM: Other players draw 1 card', () => {
    /**
     * UT-COUNCIL-ROOM-1: Grant current player +4 Cards and +1 Buy
     * @req: Council Room grants +4 Cards and +1 Buy to current player
     * @assert: hand size increased by 4 (minus the played card = +3 net), buys += 1
     */
    test('UT-COUNCIL-ROOM-1: should grant current player +4 Cards and +1 Buy', () => {
      // @req: Council Room grants +4 Cards, +1 Buy to current player
      const state = engine.initializeGame(2);

      const testState: GameState = {
        ...state,
        phase: 'action',
        currentPlayer: 0,
        players: [
          {
            ...state.players[0],
            hand: ['Council Room', 'Copper'],
            drawPile: ['Silver', 'Gold', 'Estate', 'Duchy', 'Province'],
            actions: 1,
            buys: 1
          },
          state.players[1]
        ]
      };

      const result = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Council Room'
      });

      expect(result.success).toBe(true);
      // Hand: Started with 2, played 1, drew 4 = 5 total
      expect(result.newState!.players[0].hand.length).toBe(5);
      expect(result.newState!.players[0].buys).toBe(2); // 1 + 1
      expect(result.newState!.players[0].hand).toContain('Copper');
      expect(result.newState!.players[0].hand).toContain('Silver');
      expect(result.newState!.players[0].hand).toContain('Gold');
      expect(result.newState!.players[0].hand).toContain('Estate');
      expect(result.newState!.players[0].hand).toContain('Duchy');
    });

    /**
     * UT-COUNCIL-ROOM-2: Opponent draws 1 card in 2-player game
     * @req: Each other player draws 1 card
     * @assert: opponent hand size increased by 1
     */
    test('UT-COUNCIL-ROOM-2: should make opponent draw 1 card in 2-player game', () => {
      // @req: Each other player draws 1 card
      const state = engine.initializeGame(2);

      const testState: GameState = {
        ...state,
        phase: 'action',
        currentPlayer: 0,
        players: [
          {
            ...state.players[0],
            hand: ['Council Room'],
            drawPile: ['Copper', 'Copper', 'Copper', 'Copper'],
            actions: 1
          },
          {
            ...state.players[1],
            hand: ['Copper', 'Estate'],
            drawPile: ['Silver', 'Gold', 'Province']
          }
        ]
      };

      const result = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Council Room'
      });

      expect(result.success).toBe(true);
      // Opponent (Player 1) should have drawn 1 card
      expect(result.newState!.players[1].hand.length).toBe(3); // 2 + 1 = 3
      expect(result.newState!.players[1].hand).toContain('Silver'); // Top card from deck
    });

    /**
     * UT-COUNCIL-ROOM-3: All opponents draw 1 card in multiplayer game
     * @req: Each other player draws 1 card (applies to all opponents)
     * @assert: both opponents draw 1 card each
     */
    test('UT-COUNCIL-ROOM-3: should make all opponents draw 1 card in 3-player game', () => {
      // @req: Each other player draws 1 card
      const state = engine.initializeGame(3);

      const testState: GameState = {
        ...state,
        phase: 'action',
        currentPlayer: 0,
        players: [
          {
            ...state.players[0],
            hand: ['Council Room'],
            drawPile: ['Copper', 'Copper', 'Copper', 'Copper'],
            actions: 1
          },
          {
            ...state.players[1],
            hand: ['Copper'],
            drawPile: ['Silver', 'Estate']
          },
          {
            ...state.players[2],
            hand: ['Estate'],
            drawPile: ['Gold', 'Duchy']
          }
        ]
      };

      const result = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Council Room'
      });

      expect(result.success).toBe(true);
      // Player 1 should have drawn 1 card
      expect(result.newState!.players[1].hand.length).toBe(2); // 1 + 1 = 2
      expect(result.newState!.players[1].hand).toContain('Silver');

      // Player 2 should have drawn 1 card
      expect(result.newState!.players[2].hand.length).toBe(2); // 1 + 1 = 2
      expect(result.newState!.players[2].hand).toContain('Gold');
    });

    /**
     * UT-COUNCIL-ROOM-4: Opponents draw even if their deck is empty
     * @req: Opponent draws work with shuffling discard pile
     * @edge: Opponent has empty deck but cards in discard
     * @assert: opponent draws from shuffled discard pile
     */
    test('UT-COUNCIL-ROOM-4: should handle opponent drawing when deck is empty', () => {
      // @req: Draw mechanics work correctly with shuffle
      const state = engine.initializeGame(2);

      const testState: GameState = {
        ...state,
        phase: 'action',
        currentPlayer: 0,
        players: [
          {
            ...state.players[0],
            hand: ['Council Room'],
            drawPile: ['Copper', 'Copper', 'Copper', 'Copper'],
            actions: 1
          },
          {
            ...state.players[1],
            hand: ['Copper'],
            drawPile: [], // Empty deck
            discardPile: ['Silver', 'Gold', 'Estate'] // Cards in discard
          }
        ]
      };

      const result = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Council Room'
      });

      expect(result.success).toBe(true);
      // Opponent should have drawn 1 card from shuffled discard
      expect(result.newState!.players[1].hand.length).toBe(2); // 1 + 1 = 2
      // Discard should be shuffled into deck
      expect(result.newState!.players[1].drawPile.length).toBe(2); // 3 - 1 drawn = 2
      expect(result.newState!.players[1].discardPile.length).toBe(0); // All shuffled
    });
  });
});
