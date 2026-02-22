/**
 * @file Move Parser Card Name Tests
 * @status RED (tests will FAIL until parseMove() handles card name arguments)
 *
 * ROOT CAUSE:
 * - parseMove("play Village", state) fails because "play " handler only tries parseInt()
 * - When parseInt("Village") returns NaN, the handler returns an error
 * - Need to fall back to card name lookup when index parsing fails
 *
 * @req: parseMove() must handle card names in "play CARD" format
 * @impact: Web API sends "play Copper" / "play Village" but parser only handles "play 0"
 */

import { GameEngine, parseMove, GameState, ParseMoveResult } from '@principality/core';

describe('Move Parser: Card Name Arguments', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('parser-card-name-test');
  });

  const createTestState = (overrides?: Partial<GameState>): GameState => {
    const baseState = engine.initializeGame(1);
    return {
      ...baseState,
      phase: 'action',
      players: [{
        ...baseState.players[0],
        hand: ['Copper', 'Silver', 'Village', 'Smithy', 'Estate'],
        drawPile: ['Duchy'],
        discardPile: [],
        inPlay: [],
        actions: 1,
        buys: 1,
        coins: 0
      }],
      ...overrides
    };
  };

  describe('play CARD - treasure cards', () => {
    /**
     * @req: "play Copper" should resolve to play_treasure move
     * @edge: Case insensitive, card must be in hand
     */

    test('should parse "play Copper" as play_treasure', () => {
      const state = createTestState({ phase: 'buy' });
      const result: ParseMoveResult = parseMove('play Copper', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'play_treasure',
        card: 'Copper'
      });
    });

    test('should parse "play Silver" as play_treasure', () => {
      const state = createTestState({ phase: 'buy' });
      const result = parseMove('play Silver', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'play_treasure',
        card: 'Silver'
      });
    });
  });

  describe('play CARD - action cards', () => {
    /**
     * @req: "play Village" should resolve to play_action move
     * @edge: Only during action phase, card must be in hand
     */

    test('should parse "play Village" as play_action', () => {
      const state = createTestState();
      const result = parseMove('play Village', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'play_action',
        card: 'Village'
      });
    });

    test('should parse "play Smithy" as play_action', () => {
      const state = createTestState();
      const result = parseMove('play Smithy', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'play_action',
        card: 'Smithy'
      });
    });
  });

  describe('case insensitivity', () => {
    /**
     * @req: Card names should be case insensitive
     */

    test('should parse "play copper" (lowercase) correctly', () => {
      const state = createTestState({ phase: 'buy' });
      const result = parseMove('play copper', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'play_treasure',
        card: 'Copper'
      });
    });

    test('should parse "play village" (lowercase) correctly', () => {
      const state = createTestState();
      const result = parseMove('play village', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'play_action',
        card: 'Village'
      });
    });
  });

  describe('error cases', () => {
    /**
     * @req: Cards not in hand should fail
     * @edge: Non-playable cards (Victory) should fail
     */

    test('should reject card not in hand', () => {
      const state = createTestState({
        players: [{
          ...createTestState().players[0],
          hand: ['Copper']
        }]
      });
      const result = parseMove('play Village', state);

      expect(result.success).toBe(false);
    });

    test('should reject non-existent card name', () => {
      const state = createTestState();
      const result = parseMove('play Nonexistent', state);

      expect(result.success).toBe(false);
    });

    test('should reject victory card (not playable)', () => {
      const state = createTestState();
      const result = parseMove('play Estate', state);

      expect(result.success).toBe(false);
    });
  });
});
