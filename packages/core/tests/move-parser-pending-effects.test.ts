/**
 * @file Move Parser Pending Effect Tests
 * @phase 4.2
 * @status RED (tests will FAIL until parseMove() handles pending effect commands)
 *
 * ROOT CAUSE:
 * - parseMove() in packages/core/src/presentation/move-parser.ts does NOT handle pending effect commands
 * - formatMoveCommand() in packages/core/src/presentation/move-options.ts correctly generates commands like:
 *   - "select_treasure_to_trash Silver"
 *   - "gain_card Gold"
 *   - "trash_cards Copper,Estate"
 * - But parseMove() has no handlers for these - returns "Cannot parse move" error
 *
 * SECONDARY BUG:
 * - formatValidMovesForAutoReturn() in packages/mcp-server/src/tools/game-execute.ts (line 697)
 *   only returns move.type for pending effects, not the full command
 * - Should use formatMoveCommand() instead
 *
 * FIX REQUIRED (dev-agent):
 * 1. Add parsers for all pending effect command types to parseMove()
 * 2. Parse card names/card lists from command strings
 * 3. Validate against game state (card in hand, card in supply, etc.)
 * 4. Fix formatValidMovesForAutoReturn() to use formatMoveCommand()
 *
 * PENDING EFFECT COMMANDS TO SUPPORT:
 * 1. select_treasure_to_trash CARD - Mine step 1
 * 2. gain_card CARD - Mine/Remodel/Workshop/Feast step 2
 * 3. trash_cards CARD1,CARD2,... - Chapel
 * 4. discard_for_cellar CARD1,CARD2,... - Cellar
 * 5. select_action_for_throne CARD - Throne Room
 * 6. chancellor_decision yes|no - Chancellor
 * 7. spy_decision yes|no - Spy
 * 8. library_set_aside CARD - Library
 * 9. reveal_and_topdeck CARD - Bureaucrat response
 *
 * @req: parseMove() must parse all pending effect command formats
 * @blocker: MCP server cannot parse pending effect commands from formatMoveCommand()
 * @impact: All interactive cards broken in MCP server
 * @why: parseMove is used by both CLI and MCP - must support all command formats
 */

import { GameEngine, parseMove, GameState, Move, ParseMoveResult } from '@principality/core';

describe('Move Parser: Pending Effect Commands', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('parser-pending-test');
  });

  // Helper to create test state
  const createTestState = (overrides?: Partial<GameState>): GameState => {
    const baseState = engine.initializeGame(1);
    return {
      ...baseState,
      phase: 'action',
      players: [{
        ...baseState.players[0],
        hand: ['Copper', 'Silver', 'Gold', 'Estate', 'Village'],
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

  describe('select_treasure_to_trash CARD - Mine step 1', () => {
    /**
     * @req: Parse "select_treasure_to_trash CARD" command
     * @edge: Case-insensitive card name, multi-word cards
     * @why: Mine card needs to trash a treasure
     * @assert: Returns Move with type='select_treasure_to_trash' and card field
     * @level: Unit
     */

    test('should parse "select_treasure_to_trash Silver" correctly', () => {
      const state = createTestState();
      const result: ParseMoveResult = parseMove('select_treasure_to_trash Silver', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'select_treasure_to_trash',
        card: 'Silver'
      });
    });

    test('should parse "select_treasure_to_trash copper" (lowercase) correctly', () => {
      const state = createTestState();
      const result = parseMove('select_treasure_to_trash copper', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'select_treasure_to_trash',
        card: 'Copper'
      });
    });

    test('should parse "select_treasure_to_trash Gold" with whitespace', () => {
      const state = createTestState();
      const result = parseMove('  select_treasure_to_trash   Gold  ', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'select_treasure_to_trash',
        card: 'Gold'
      });
    });

    test('should reject invalid card name', () => {
      const state = createTestState();
      const result = parseMove('select_treasure_to_trash InvalidCard', state);

      expect(result.success).toBe(false);
      expect(result.error).toContain('InvalidCard');
    });

    test('should reject empty card name', () => {
      const state = createTestState();
      const result = parseMove('select_treasure_to_trash', state);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('gain_card CARD - Remodel/Mine/Workshop/Feast step 2', () => {
    /**
     * @req: Parse "gain_card CARD" command
     * @edge: Card not in hand but in supply
     * @why: Multiple cards use gain_card for different effects
     * @assert: Returns Move with type='gain_card' and card field
     * @level: Unit
     */

    test('should parse "gain_card Province" correctly', () => {
      const state = createTestState();
      const result = parseMove('gain_card Province', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'gain_card',
        card: 'Province'
      });
    });

    test('should parse "gain_card duchy" (lowercase) correctly', () => {
      const state = createTestState();
      const result = parseMove('gain_card duchy', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'gain_card',
        card: 'Duchy'
      });
    });

    test('should parse multi-word card "gain_card Throne Room"', () => {
      const state = createTestState();
      const result = parseMove('gain_card throne room', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'gain_card',
        card: 'Throne Room'
      });
    });

    test('should reject card not in supply', () => {
      const state = createTestState({
        supply: new Map([
          ['Copper', 60],
          ['Silver', 0] // Empty pile
        ])
      });
      const result = parseMove('gain_card Silver', state);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not in supply');
    });

    test('should allow gaining card not currently in hand', () => {
      const state = createTestState({
        players: [{
          ...createTestState().players[0],
          hand: ['Copper'] // Only Copper in hand
        }]
      });
      const result = parseMove('gain_card Silver', state);

      // Should succeed - gain_card doesn't require card in hand
      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'gain_card',
        card: 'Silver'
      });
    });
  });

  describe('trash_cards CARD1,CARD2,... - Chapel', () => {
    /**
     * @req: Parse "trash_cards CARD1,CARD2,..." command with comma-separated list
     * @edge: Empty list (trash nothing), single card, multiple cards
     * @why: Chapel allows trashing 0-4 cards
     * @assert: Returns Move with type='trash_cards' and cards array
     * @level: Unit
     */

    test('should parse "trash_cards Copper,Estate" correctly', () => {
      const state = createTestState();
      const result = parseMove('trash_cards Copper,Estate', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'trash_cards',
        cards: ['Copper', 'Estate']
      });
    });

    test('should parse single card "trash_cards Copper"', () => {
      const state = createTestState();
      const result = parseMove('trash_cards Copper', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'trash_cards',
        cards: ['Copper']
      });
    });

    test('should parse empty trash "trash_cards" (no cards)', () => {
      const state = createTestState();
      const result = parseMove('trash_cards', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'trash_cards',
        cards: []
      });
    });

    test('should parse 4 cards "trash_cards Copper,Copper,Estate,Estate"', () => {
      const state = createTestState({
        players: [{
          ...createTestState().players[0],
          hand: ['Copper', 'Copper', 'Estate', 'Estate', 'Silver']
        }]
      });
      const result = parseMove('trash_cards Copper,Copper,Estate,Estate', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'trash_cards',
        cards: ['Copper', 'Copper', 'Estate', 'Estate']
      });
    });

    test('should handle lowercase and whitespace "trash_cards copper, estate"', () => {
      const state = createTestState();
      const result = parseMove('trash_cards copper, estate', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'trash_cards',
        cards: ['Copper', 'Estate']
      });
    });

    test('should reject card not in hand', () => {
      const state = createTestState({
        players: [{
          ...createTestState().players[0],
          hand: ['Copper', 'Silver']
        }]
      });
      const result = parseMove('trash_cards Province', state);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not in hand');
    });
  });

  describe('discard_for_cellar CARD1,CARD2,... - Cellar', () => {
    /**
     * @req: Parse "discard_for_cellar CARD1,CARD2,..." command
     * @edge: Empty list (discard nothing), multiple cards
     * @why: Cellar allows discarding any number of cards
     * @assert: Returns Move with type='discard_for_cellar' and cards array
     * @level: Unit
     */

    test('should parse "discard_for_cellar Copper,Estate,Silver"', () => {
      const state = createTestState();
      const result = parseMove('discard_for_cellar Copper,Estate,Silver', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'discard_for_cellar',
        cards: ['Copper', 'Estate', 'Silver']
      });
    });

    test('should parse empty discard "discard_for_cellar"', () => {
      const state = createTestState();
      const result = parseMove('discard_for_cellar', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'discard_for_cellar',
        cards: []
      });
    });

    test('should handle whitespace "discard_for_cellar copper, silver"', () => {
      const state = createTestState();
      const result = parseMove('discard_for_cellar copper, silver', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'discard_for_cellar',
        cards: ['Copper', 'Silver']
      });
    });

    test('should reject card not in hand', () => {
      const state = createTestState({
        players: [{
          ...createTestState().players[0],
          hand: ['Copper']
        }]
      });
      const result = parseMove('discard_for_cellar Province', state);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not in hand');
    });
  });

  describe('select_action_for_throne CARD - Throne Room', () => {
    /**
     * @req: Parse "select_action_for_throne CARD" command
     * @edge: Multi-word action cards, skip option (null)
     * @why: Throne Room doubles an action card's effect
     * @assert: Returns Move with type='select_action_for_throne' and card field
     * @level: Unit
     */

    test('should parse "select_action_for_throne Village"', () => {
      const state = createTestState();
      const result = parseMove('select_action_for_throne Village', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'select_action_for_throne',
        card: 'Village'
      });
    });

    test('should parse multi-word action "select_action_for_throne throne room"', () => {
      const state = createTestState();
      const result = parseMove('select_action_for_throne throne room', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'select_action_for_throne',
        card: 'Throne Room'
      });
    });

    test('should parse skip option "select_action_for_throne" (empty)', () => {
      const state = createTestState();
      const result = parseMove('select_action_for_throne', state);

      expect(result.success).toBe(true);
      expect(result.move?.type).toBe('select_action_for_throne');
      // Card field should be undefined or null for skip
      expect(result.move?.card).toBeUndefined();
    });

    test('should reject non-action card', () => {
      const state = createTestState();
      const result = parseMove('select_action_for_throne Copper', state);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not an action');
    });
  });

  describe('chancellor_decision yes|no - Chancellor', () => {
    /**
     * @req: Parse "chancellor_decision yes" or "chancellor_decision no"
     * @edge: Case-insensitive yes/no
     * @why: Chancellor asks whether to put deck into discard
     * @assert: Returns Move with type='chancellor_decision' and choice boolean
     * @level: Unit
     */

    test('should parse "chancellor_decision yes" as choice=true', () => {
      const state = createTestState();
      const result = parseMove('chancellor_decision yes', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'chancellor_decision',
        choice: true
      });
    });

    test('should parse "chancellor_decision no" as choice=false', () => {
      const state = createTestState();
      const result = parseMove('chancellor_decision no', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'chancellor_decision',
        choice: false
      });
    });

    test('should handle uppercase "chancellor_decision YES"', () => {
      const state = createTestState();
      const result = parseMove('chancellor_decision YES', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'chancellor_decision',
        choice: true
      });
    });

    test('should reject invalid choice "chancellor_decision maybe"', () => {
      const state = createTestState();
      const result = parseMove('chancellor_decision maybe', state);

      expect(result.success).toBe(false);
      expect(result.error).toContain('yes or no');
    });

    test('should reject missing choice "chancellor_decision"', () => {
      const state = createTestState();
      const result = parseMove('chancellor_decision', state);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('spy_decision yes|no - Spy', () => {
    /**
     * @req: Parse "spy_decision yes" or "spy_decision no"
     * @edge: Case-insensitive yes/no
     * @why: Spy asks whether to discard revealed card
     * @assert: Returns Move with type='spy_decision' and choice boolean
     * @level: Unit
     */

    test('should parse "spy_decision yes" as choice=true', () => {
      const state = createTestState();
      const result = parseMove('spy_decision yes', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'spy_decision',
        choice: true
      });
    });

    test('should parse "spy_decision no" as choice=false', () => {
      const state = createTestState();
      const result = parseMove('spy_decision no', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'spy_decision',
        choice: false
      });
    });

    test('should handle lowercase "spy_decision NO"', () => {
      const state = createTestState();
      const result = parseMove('spy_decision NO', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'spy_decision',
        choice: false
      });
    });

    test('should reject invalid choice', () => {
      const state = createTestState();
      const result = parseMove('spy_decision skip', state);

      expect(result.success).toBe(false);
      expect(result.error).toContain('yes or no');
    });
  });

  describe('library_set_aside CARD - Library', () => {
    /**
     * @req: Parse "library_set_aside CARD" command
     * @edge: Action cards only (Library only asks about actions)
     * @why: Library allows setting aside action cards drawn
     * @assert: Returns Move with type='library_set_aside' and cards array
     * @level: Unit
     */

    test('should parse "library_set_aside Village"', () => {
      const state = createTestState();
      const result = parseMove('library_set_aside Village', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'library_set_aside',
        card: 'Village'
      });
    });

    test('should parse multi-word action "library_set_aside throne room"', () => {
      const state = createTestState();
      const result = parseMove('library_set_aside throne room', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'library_set_aside',
        card: 'Throne Room'
      });
    });

    test('should reject empty card name', () => {
      const state = createTestState();
      const result = parseMove('library_set_aside', state);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should reject non-action card', () => {
      const state = createTestState();
      const result = parseMove('library_set_aside Copper', state);

      expect(result.success).toBe(false);
      expect(result.error).toContain('action');
    });
  });

  describe('reveal_and_topdeck CARD - Bureaucrat response', () => {
    /**
     * @req: Parse "reveal_and_topdeck CARD" command
     * @edge: Victory cards only (Bureaucrat only affects victory cards)
     * @why: Opponent must reveal victory card to topdeck
     * @assert: Returns Move with type='reveal_and_topdeck' and card field
     * @level: Unit
     */

    test('should parse "reveal_and_topdeck Estate"', () => {
      const state = createTestState();
      const result = parseMove('reveal_and_topdeck Estate', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'reveal_and_topdeck',
        card: 'Estate'
      });
    });

    test('should parse "reveal_and_topdeck Province"', () => {
      const state = createTestState();
      const result = parseMove('reveal_and_topdeck Province', state);

      expect(result.success).toBe(true);
      expect(result.move).toEqual({
        type: 'reveal_and_topdeck',
        card: 'Province'
      });
    });

    test('should allow skip (no victory cards)', () => {
      const state = createTestState();
      const result = parseMove('reveal_and_topdeck', state);

      expect(result.success).toBe(true);
      expect(result.move?.type).toBe('reveal_and_topdeck');
      expect(result.move?.card).toBeUndefined();
    });

    test('should reject non-victory card', () => {
      const state = createTestState();
      const result = parseMove('reveal_and_topdeck Copper', state);

      expect(result.success).toBe(false);
      expect(result.error).toContain('victory');
    });
  });

  describe('Integration: Parsed moves should validate against getValidMoves()', () => {
    /**
     * @req: Parsed pending effect moves must match getValidMoves() output
     * @edge: Round-trip test - formatMoveCommand → parseMove → validates against getValidMoves
     * @why: Ensures parseMove and getValidMoves are in sync
     * @assert: Parsed move is in validMoves list
     * @level: Integration
     */

    test('Mine step 1: parsed move validates against getValidMoves', () => {
      const state = createTestState({
        players: [{
          ...createTestState().players[0],
          hand: ['Mine', 'Copper', 'Silver'],
          actions: 1
        }]
      });

      // Play Mine
      const playResult = engine.executeMove(state, {
        type: 'play_action',
        card: 'Mine'
      });

      expect(playResult.success).toBe(true);
      expect(playResult.newState!.pendingEffect?.effect).toBe('select_treasure_to_trash');

      // Get valid moves during pending effect
      const validMoves = engine.getValidMoves(playResult.newState!);

      // Parse command for Copper
      const parseResult = parseMove('select_treasure_to_trash Copper', playResult.newState!);
      expect(parseResult.success).toBe(true);

      // Parsed move should be in validMoves
      expect(validMoves).toContainEqual(parseResult.move);
    });

    test('Chapel: parsed move validates against getValidMoves', () => {
      const state = createTestState({
        players: [{
          ...createTestState().players[0],
          hand: ['Chapel', 'Copper', 'Estate'],
          actions: 1
        }]
      });

      // Play Chapel
      const playResult = engine.executeMove(state, {
        type: 'play_action',
        card: 'Chapel'
      });

      expect(playResult.success).toBe(true);
      expect(playResult.newState!.pendingEffect?.effect).toBe('trash_cards');

      // Parse "trash_cards Copper,Estate"
      const parseResult = parseMove('trash_cards Copper,Estate', playResult.newState!);
      expect(parseResult.success).toBe(true);

      // Should be executable
      const trashResult = engine.executeMove(playResult.newState!, parseResult.move!);
      expect(trashResult.success).toBe(true);
    });

    test('Cellar: parsed move validates against getValidMoves', () => {
      const state = createTestState({
        players: [{
          ...createTestState().players[0],
          hand: ['Cellar', 'Copper', 'Estate'],
          actions: 1
        }]
      });

      // Play Cellar
      const playResult = engine.executeMove(state, {
        type: 'play_action',
        card: 'Cellar'
      });

      expect(playResult.success).toBe(true);
      expect(playResult.newState!.pendingEffect?.effect).toBe('discard_for_cellar');

      // Parse "discard_for_cellar Copper"
      const parseResult = parseMove('discard_for_cellar Copper', playResult.newState!);
      expect(parseResult.success).toBe(true);

      // Should be executable
      const discardResult = engine.executeMove(playResult.newState!, parseResult.move!);
      expect(discardResult.success).toBe(true);
    });

    test('Throne Room: parsed move validates against getValidMoves', () => {
      const state = createTestState({
        players: [{
          ...createTestState().players[0],
          hand: ['Throne Room', 'Village', 'Smithy'],
          actions: 1
        }]
      });

      // Play Throne Room
      const playResult = engine.executeMove(state, {
        type: 'play_action',
        card: 'Throne Room'
      });

      expect(playResult.success).toBe(true);
      expect(playResult.newState!.pendingEffect?.effect).toBe('select_action_for_throne');

      // Parse "select_action_for_throne Village"
      const parseResult = parseMove('select_action_for_throne Village', playResult.newState!);
      expect(parseResult.success).toBe(true);

      // Should be executable
      const selectResult = engine.executeMove(playResult.newState!, parseResult.move!);
      expect(selectResult.success).toBe(true);
    });

    test('Chancellor: parsed move validates against getValidMoves', () => {
      const state = createTestState({
        players: [{
          ...createTestState().players[0],
          hand: ['Chancellor', 'Copper'],
          drawPile: ['Estate', 'Duchy', 'Province'],
          actions: 1
        }]
      });

      // Play Chancellor
      const playResult = engine.executeMove(state, {
        type: 'play_action',
        card: 'Chancellor'
      });

      expect(playResult.success).toBe(true);
      expect(playResult.newState!.pendingEffect?.effect).toBe('chancellor_decision');

      // Parse "chancellor_decision yes"
      const parseResult = parseMove('chancellor_decision yes', playResult.newState!);
      expect(parseResult.success).toBe(true);

      // Should be executable
      const decisionResult = engine.executeMove(playResult.newState!, parseResult.move!);
      expect(decisionResult.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    /**
     * @req: Handle edge cases gracefully
     * @edge: Extra whitespace, case variations, malformed commands
     * @why: User input may vary in CLI/MCP
     * @level: Edge Case
     */

    test('should handle extra whitespace in card lists', () => {
      const state = createTestState();
      const result = parseMove('trash_cards  Copper ,  Estate  ', state);

      expect(result.success).toBe(true);
      expect(result.move?.cards).toEqual(['Copper', 'Estate']);
    });

    test('should handle trailing commas in card lists', () => {
      const state = createTestState();
      const result = parseMove('trash_cards Copper,', state);

      expect(result.success).toBe(true);
      // Should either handle gracefully or reject - document behavior
      // Assuming graceful handling: ignores trailing comma
      expect(result.move?.cards).toEqual(['Copper']);
    });

    test('should reject completely invalid command format', () => {
      const state = createTestState();
      const result = parseMove('foobar baz qux', state);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot parse move');
    });

    test('should reject pending effect command with wrong structure', () => {
      const state = createTestState();
      const result = parseMove('select_treasure_to_trash Copper Estate', state);

      // Should fail - select_treasure_to_trash takes single card, not multiple
      expect(result.success).toBe(false);
    });
  });
});
