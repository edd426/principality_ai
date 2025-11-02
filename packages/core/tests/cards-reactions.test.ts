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
          deck: ['Silver', 'Gold', 'Duchy'],
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
      // @req: Moat blocks Militia
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

      // Player 1 reveals Moat to block
      const moatResult = engine.executeMove(militiaResult.newState!, {
        type: 'reveal_reaction',
        card: 'Moat'
      });

      expect(moatResult.success).toBe(true);
      // Hand unchanged (attack blocked)
      expect(moatResult.newState!.players[1].hand.length).toBe(5);
      expect(moatResult.newState!.players[1].hand).toContain('Moat'); // Moat stays in hand
    });

    /**
     * UT-MOAT-3: Block Witch attack
     * @req: Revealing Moat blocks Witch's Curse effect
     * @assert: Player doesn't gain Curse
     */
    test('UT-MOAT-3: should block Witch attack', () => {
      // @req: Moat blocks Witch
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

      // Player 1 reveals Moat to block
      const moatResult = engine.executeMove(witchResult.newState!, {
        type: 'reveal_reaction',
        card: 'Moat'
      });

      expect(moatResult.success).toBe(true);
      // No Curse gained (attack blocked)
      expect(moatResult.newState!.players[1].discardPile).not.toContain('Curse');
      expect(moatResult.newState!.supply.get('Curse')).toBe(10); // Unchanged
    });

    /**
     * UT-MOAT-4: Block Bureaucrat attack
     * @req: Revealing Moat blocks Bureaucrat's topdeck effect
     * @assert: Player doesn't topdeck Victory card
     */
    test('UT-MOAT-4: should block Bureaucrat attack', () => {
      // @req: Moat blocks Bureaucrat
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
            deck: ['Copper']
          }
        ]
      };

      const bureaucratResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Bureaucrat'
      });

      // Player 1 reveals Moat to block
      const moatResult = engine.executeMove(bureaucratResult.newState!, {
        type: 'reveal_reaction',
        card: 'Moat'
      });

      expect(moatResult.success).toBe(true);
      // Deck unchanged (no topdeck)
      expect(moatResult.newState!.players[1].deck[0]).toBe('Copper');
      expect(moatResult.newState!.players[1].hand).toContain('Estate');
    });

    /**
     * UT-MOAT-5: Block Spy attack
     * @req: Revealing Moat blocks Spy's reveal effect
     * @assert: Player doesn't reveal top card
     */
    test('UT-MOAT-5: should block Spy attack', () => {
      // @req: Moat blocks Spy
      const state = engine.initializeGame(2);

      const testState: GameState = {
        ...state,
        phase: 'action',
        currentPlayer: 0,
        players: [
          {
            ...state.players[0],
            hand: ['Spy'],
            deck: ['Copper'],
            actions: 1
          },
          {
            ...state.players[1],
            hand: ['Moat'],
            deck: ['Gold']
          }
        ]
      };

      const spyResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Spy'
      });

      // Player 1 reveals Moat to block
      const moatResult = engine.executeMove(spyResult.newState!, {
        type: 'reveal_reaction',
        card: 'Moat'
      });

      expect(moatResult.success).toBe(true);
      // Gold stays on top of deck (not revealed)
      expect(moatResult.newState!.players[1].deck[0]).toBe('Gold');
    });

    /**
     * UT-MOAT-6: Block Thief attack
     * @req: Revealing Moat blocks Thief's reveal effect
     * @assert: Player doesn't reveal 2 cards
     */
    test('UT-MOAT-6: should block Thief attack', () => {
      // @req: Moat blocks Thief
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
            deck: ['Silver', 'Gold', 'Copper']
          }
        ]
      };

      const thiefResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Thief'
      });

      // Player 1 reveals Moat to block
      const moatResult = engine.executeMove(thiefResult.newState!, {
        type: 'reveal_reaction',
        card: 'Moat'
      });

      expect(moatResult.success).toBe(true);
      // Deck unchanged (no reveal)
      expect(moatResult.newState!.players[1].deck.length).toBe(3);
      expect(moatResult.newState!.trash.length).toBe(0); // No trash
    });
  });
});
