import { GameEngine, GameState } from '@principality/core';

/**
 * Phase 4 Unit Tests: Reaction System (Moat)
 * Source: docs/requirements/phase-4/TESTING.md
 *
 * @req: Test Moat as action and reaction
 * @level: Unit
 * @count: 6 tests total
 *
 * Card under test:
 * - Moat ($2): +2 Cards, reveal to block attacks
 */

describe('UT: Reaction System - Moat', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('moat-test');
  });

  describe('UT-MOAT: Action and Reaction', () => {
    /**
     * UT-MOAT-1: Grant +2 Cards when played as action
     * @req: Moat as action grants +2 Cards
     * @assert: hand size increases by 2
     */
    test('UT-MOAT-1: should grant +2 Cards when played', () => {
      // @req: Moat as action: +2 Cards
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Moat', 'Copper', 'Estate'],
          drawPile: ['Silver', 'Gold', 'Duchy'],
          actions: 1
        }]
      };

      const result = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Moat'
      });

      expect(result.success).toBe(true);
      // Hand: Copper, Estate + 2 drawn = 4 total
      expect(result.newState!.players[0].hand.length).toBe(4);
    });

    /**
     * UT-MOAT-2: Block Militia attack
     * @req: Revealing Moat blocks Militia's discard effect
     * @assert: Player hand unchanged (no discard)
     */
    test('UT-MOAT-2: should block Militia attack', () => {
      // @req: Moat auto-blocks Militia (no discard effect)
      const state = engine.initializeGame(2);

      const testState: GameState = {
        ...state,
        phase: 'action',
        currentPlayer: 0,
        players: [
          {
            ...state.players[0],
            hand: ['Militia'],
            actions: 1
          },
          {
            ...state.players[1],
            hand: ['Moat', 'Copper', 'Copper', 'Silver', 'Estate'] // 5 cards
          }
        ]
      };

      const militiaResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Militia'
      });

      expect(militiaResult.success).toBe(true);
      // If Moat in hand, attack is automatically blocked (no discard)
      // Hand size should remain unchanged
      expect(militiaResult.newState!.players[1].hand.length).toBe(5);
      expect(militiaResult.newState!.players[1].hand).toContain('Moat'); // Moat stays in hand
    });

    /**
     * UT-MOAT-3: Block Witch attack
     * @req: Revealing Moat blocks Witch's Curse effect
     * @assert: Player doesn't gain Curse
     */
    test('UT-MOAT-3: should block Witch attack', () => {
      // @req: Moat auto-blocks Witch (no Curse gained)
      const state = engine.initializeGame(2);

      const testState: GameState = {
        ...state,
        phase: 'action',
        currentPlayer: 0,
        supply: new Map([...state.supply, ['Curse', 10]]),
        players: [
          {
            ...state.players[0],
            hand: ['Witch'],
            actions: 1
          },
          {
            ...state.players[1],
            hand: ['Moat', 'Copper']
          }
        ]
      };

      const witchResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Witch'
      });

      expect(witchResult.success).toBe(true);
      // If Moat in hand, attack is automatically blocked (no Curse gained)
      expect(witchResult.newState!.players[1].discardPile).not.toContain('Curse');
      expect(witchResult.newState!.supply.get('Curse')).toBe(10); // Unchanged
    });

    /**
     * UT-MOAT-4: Block Bureaucrat attack
     * @req: Revealing Moat blocks Bureaucrat's topdeck effect
     * @assert: Player doesn't topdeck Victory card
     */
    test('UT-MOAT-4: should block Bureaucrat attack', () => {
      // @req: Moat auto-blocks Bureaucrat (no topdeck effect)
      const state = engine.initializeGame(2);

      const testState: GameState = {
        ...state,
        phase: 'action',
        currentPlayer: 0,
        players: [
          {
            ...state.players[0],
            hand: ['Bureaucrat'],
            actions: 1
          },
          {
            ...state.players[1],
            hand: ['Moat', 'Estate'],
            drawPile: ['Copper']
          }
        ]
      };

      const bureaucratResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Bureaucrat'
      });

      expect(bureaucratResult.success).toBe(true);
      // If Moat in hand, attack is automatically blocked (no topdeck)
      // Deck and hand unchanged
      expect(bureaucratResult.newState!.players[1].drawPile[0]).toBe('Copper');
      expect(bureaucratResult.newState!.players[1].hand).toContain('Estate');
      expect(bureaucratResult.newState!.players[1].hand).toContain('Moat');
    });

    /**
     * UT-MOAT-5: Block Spy attack
     * @req: Revealing Moat blocks Spy's reveal effect
     * @assert: Player doesn't reveal top card
     */
    test('UT-MOAT-5: should block Spy attack', () => {
      // @req: Moat auto-blocks Spy (no reveal effect)
      const state = engine.initializeGame(2);

      const testState: GameState = {
        ...state,
        phase: 'action',
        currentPlayer: 0,
        players: [
          {
            ...state.players[0],
            hand: ['Spy'],
            drawPile: ['Copper', 'Silver'],
            actions: 1
          },
          {
            ...state.players[1],
            hand: ['Moat'],
            drawPile: ['Gold']
          }
        ]
      };

      const spyResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Spy'
      });

      expect(spyResult.success).toBe(true);
      // If Moat in hand, attack is automatically blocked (no reveal)
      // Gold stays on top of deck (not revealed/moved)
      expect(spyResult.newState!.players[1].drawPile[0]).toBe('Gold');
      expect(spyResult.newState!.players[1].hand).toContain('Moat');
    });

    /**
     * UT-MOAT-6: Block Thief attack
     * @req: Revealing Moat blocks Thief's reveal effect
     * @assert: Player doesn't reveal 2 cards
     */
    test('UT-MOAT-6: should block Thief attack', () => {
      // @req: Moat auto-blocks Thief (no reveal effect)
      const state = engine.initializeGame(2);

      const testState: GameState = {
        ...state,
        phase: 'action',
        currentPlayer: 0,
        players: [
          {
            ...state.players[0],
            hand: ['Thief'],
            actions: 1
          },
          {
            ...state.players[1],
            hand: ['Moat'],
            drawPile: ['Silver', 'Gold', 'Copper']
          }
        ]
      };

      const thiefResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Thief'
      });

      expect(thiefResult.success).toBe(true);
      // If Moat in hand, attack is automatically blocked (no reveal)
      // Deck unchanged
      expect(thiefResult.newState!.players[1].drawPile.length).toBe(3);
      expect(thiefResult.newState!.trash.length).toBe(0); // No trash
      expect(thiefResult.newState!.players[1].hand).toContain('Moat');
    });
  });
});
