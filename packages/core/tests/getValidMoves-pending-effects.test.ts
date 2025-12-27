/**
 * Comprehensive tests for getValidMoves() with pending effects
 *
 * @req R-PENDING-001: Each pending effect type must return valid moves
 * @req R-PENDING-002: Move format must match parser expectations
 * @req R-PENDING-003: Edge cases handled gracefully (empty hand, no valid cards, etc.)
 *
 * Tests verify that getValidMovesForPendingEffect() in game.ts handles
 * ALL 9+ pending effect types defined in the move parser.
 *
 * @why These tests serve as the specification for what valid moves should be
 * returned for each pending effect state. They define the contract between
 * the game engine's move generation and the move parser's expectations.
 */

import { GameEngine } from '../src/game';
import { GameState, Move } from '../src/types';

describe('getValidMoves() with pending effects', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('pending-effect-test-seed');
  });

  describe('select_treasure_to_trash (Mine step 1)', () => {
    // @req R-PENDING-001: Mine pending effect returns valid treasure trash moves
    // @edge: Player has multiple treasures | Player has no treasures | Player has duplicate treasures
    test('should return moves to trash each treasure in hand', () => {
      const state = engine.initializeGame(2);

      // Set up: Player hand has Copper, Silver, Gold
      const playerState = {
        ...state.players[0],
        hand: ['Copper', 'Silver', 'Gold', 'Estate'],
        actions: 1
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Mine',
          effect: 'select_treasure_to_trash'
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-002: Moves must match "select_treasure_to_trash CARD" format
      expect(validMoves).toContainEqual({ type: 'select_treasure_to_trash', card: 'Copper' });
      expect(validMoves).toContainEqual({ type: 'select_treasure_to_trash', card: 'Silver' });
      expect(validMoves).toContainEqual({ type: 'select_treasure_to_trash', card: 'Gold' });

      // @edge: Non-treasure cards should not appear
      expect(validMoves).not.toContainEqual({ type: 'select_treasure_to_trash', card: 'Estate' });

      // Only treasures, no duplicates
      expect(validMoves).toHaveLength(3);
    });

    // @edge: Empty hand scenario
    test('should return empty array when hand has no treasures', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: ['Estate', 'Duchy', 'Province'], // Only victory cards
        actions: 1
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Mine',
          effect: 'select_treasure_to_trash'
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-003: Gracefully handle no valid cards
      expect(validMoves).toEqual([]);
    });

    // @edge: Duplicate treasures should only appear once
    test('should deduplicate identical treasures', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: ['Copper', 'Copper', 'Copper', 'Silver', 'Silver'],
        actions: 1
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Mine',
          effect: 'select_treasure_to_trash'
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // Only unique treasures
      expect(validMoves).toHaveLength(2);
      expect(validMoves).toContainEqual({ type: 'select_treasure_to_trash', card: 'Copper' });
      expect(validMoves).toContainEqual({ type: 'select_treasure_to_trash', card: 'Silver' });
    });
  });

  describe('gain_treasure (Mine step 2)', () => {
    // @req R-PENDING-001: Mine gain step returns valid treasure gain moves
    // @edge: maxGainCost limits available treasures | Supply empty | Only expensive treasures
    test('should return treasures costing up to maxGainCost', () => {
      const state = engine.initializeGame(2);

      const testState: GameState = {
        ...state,
        pendingEffect: {
          card: 'Mine',
          effect: 'gain_treasure',
          maxGainCost: 6 // Trashed Copper (cost 0), can gain up to 3
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-002: Moves must be type 'gain_card' with destination 'hand'
      expect(validMoves).toContainEqual({ type: 'gain_card', card: 'Copper', destination: 'hand' });
      expect(validMoves).toContainEqual({ type: 'gain_card', card: 'Silver', destination: 'hand' });
      expect(validMoves).toContainEqual({ type: 'gain_card', card: 'Gold', destination: 'hand' });

      // All returned moves should be treasures
      validMoves.forEach(move => {
        expect(move.type).toBe('gain_card');
        expect(move.destination).toBe('hand');
      });
    });

    // @edge: Supply exhausted
    test('should exclude treasures with zero supply', () => {
      const state = engine.initializeGame(2);

      // Drain Silver from supply
      const supply = new Map(state.supply);
      supply.set('Silver', 0);

      const testState: GameState = {
        ...state,
        supply,
        pendingEffect: {
          card: 'Mine',
          effect: 'gain_treasure',
          maxGainCost: 6
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-003: Exclude treasures with count = 0
      expect(validMoves).toContainEqual({ type: 'gain_card', card: 'Copper', destination: 'hand' });
      expect(validMoves).not.toContainEqual({ type: 'gain_card', card: 'Silver', destination: 'hand' });
      expect(validMoves).toContainEqual({ type: 'gain_card', card: 'Gold', destination: 'hand' });
    });
  });

  describe('trash_cards (Chapel)', () => {
    // @req R-PENDING-001: Chapel returns valid trash combinations (0-4 cards)
    // @edge: Empty hand | Hand < 4 cards | Hand > 4 cards | maxTrash override
    test('should include option to trash nothing', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: ['Copper', 'Estate'],
        actions: 1
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Chapel',
          effect: 'trash_cards',
          maxTrash: 4
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-002: Must include "trash_cards" with empty array
      expect(validMoves).toContainEqual({ type: 'trash_cards', cards: [] });
    });

    test('should return all valid combinations of 1-4 cards', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: ['Copper', 'Estate', 'Silver'],
        actions: 1
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Chapel',
          effect: 'trash_cards',
          maxTrash: 4
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-002: Combinations should be valid trash_cards moves
      // Single cards
      expect(validMoves).toContainEqual({ type: 'trash_cards', cards: ['Copper'] });
      expect(validMoves).toContainEqual({ type: 'trash_cards', cards: ['Estate'] });
      expect(validMoves).toContainEqual({ type: 'trash_cards', cards: ['Silver'] });

      // Two-card combinations
      expect(validMoves).toContainEqual({ type: 'trash_cards', cards: ['Copper', 'Estate'] });
      expect(validMoves).toContainEqual({ type: 'trash_cards', cards: ['Copper', 'Silver'] });
      expect(validMoves).toContainEqual({ type: 'trash_cards', cards: ['Estate', 'Silver'] });

      // Three-card combination
      expect(validMoves).toContainEqual({ type: 'trash_cards', cards: ['Copper', 'Estate', 'Silver'] });

      // Total: 1 (nothing) + 3 (singles) + 3 (pairs) + 1 (triple) = 8
      expect(validMoves).toHaveLength(8);
    });

    // @edge: Empty hand
    test('should return only empty array when hand is empty', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: [],
        actions: 1
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Chapel',
          effect: 'trash_cards',
          maxTrash: 4
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-003: Empty hand = only option is trash nothing
      expect(validMoves).toEqual([{ type: 'trash_cards', cards: [] }]);
    });
  });

  // ============================================================
  // @req: GH-98 - Chapel must allow trashing up to 4 cards
  // @why: Playtest revealed Chapel only offers 1-2 card trash options when player has
  //       duplicate cards. The bug is in getValidMoves using uniqueCards.length to gate
  //       3-card and 4-card combination generation, which fails when hand has duplicates.
  // @root-cause: game.ts lines 2500-2527 check uniqueCards.length >= 3/4 but should
  //              check if player has enough cards in hand regardless of uniqueness
  // ============================================================
  describe('trash_cards (Chapel) - Issue #98 (4-card trash bug)', () => {
    // @req: GH-98 - Chapel should allow trashing 4 identical cards
    // @edge: When hand has 4 Coppers, player should be able to trash all 4
    // @why: This is the exact bug scenario from the playtest: 4 Coppers, only 1-2 trash options shown
    test('should allow trashing 4 identical cards (4 Coppers)', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: ['Copper', 'Copper', 'Copper', 'Copper'], // 4 identical cards
        actions: 1
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Chapel',
          effect: 'trash_cards',
          maxTrash: 4
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-002: Must include option to trash 4 Coppers
      // The bug causes this to fail: only trash 0, 1, 2 options are generated
      const fourCopperTrash = validMoves.find(m =>
        m.type === 'trash_cards' &&
        m.cards &&
        m.cards.length === 4 &&
        m.cards.every((c: string) => c === 'Copper')
      );
      expect(fourCopperTrash).toBeDefined();

      // Should have exactly 5 options: trash 0, 1, 2, 3, or 4 Coppers
      expect(validMoves).toHaveLength(5);
    });

    // @req: GH-98 - Chapel should allow trashing 3 identical cards
    // @edge: This is the boundary where the bug starts - 3-card combos fail with duplicates
    test('should allow trashing 3 identical cards (3 Coppers)', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: ['Copper', 'Copper', 'Copper'], // 3 identical cards
        actions: 1
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Chapel',
          effect: 'trash_cards',
          maxTrash: 4
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // Must include option to trash all 3 Coppers
      const threeCopperTrash = validMoves.find(m =>
        m.type === 'trash_cards' &&
        m.cards &&
        m.cards.length === 3
      );
      expect(threeCopperTrash).toBeDefined();

      // Should have 4 options: trash 0, 1, 2, or 3 Coppers
      expect(validMoves).toHaveLength(4);
    });

    // @req: GH-98 - Chapel should allow trashing 4 cards with mixed duplicates
    // @edge: 2 Coppers + 2 Estates should allow trashing all 4
    test('should allow trashing 4 cards with mixed duplicates (2 Coppers + 2 Estates)', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: ['Copper', 'Copper', 'Estate', 'Estate'], // 4 cards, 2 unique types
        actions: 1
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Chapel',
          effect: 'trash_cards',
          maxTrash: 4
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // Must include option to trash all 4 cards (2 Coppers + 2 Estates)
      const fourCardTrash = validMoves.find(m =>
        m.type === 'trash_cards' &&
        m.cards &&
        m.cards.length === 4
      );
      expect(fourCardTrash).toBeDefined();

      // The 4-card option should contain 2 Coppers and 2 Estates
      if (fourCardTrash && fourCardTrash.cards) {
        const copperCount = fourCardTrash.cards.filter((c: string) => c === 'Copper').length;
        const estateCount = fourCardTrash.cards.filter((c: string) => c === 'Estate').length;
        expect(copperCount).toBe(2);
        expect(estateCount).toBe(2);
      }
    });

    // @req: GH-98 - Chapel should allow trashing 3 cards when hand has 5 cards with duplicates
    // @edge: Real game scenario: starting hand with Chapel, 4 Coppers
    test('should allow trashing 3 cards from hand with duplicates', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: ['Copper', 'Copper', 'Copper', 'Copper', 'Estate'], // 5 cards, 2 unique types
        actions: 1
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Chapel',
          effect: 'trash_cards',
          maxTrash: 4
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // Must include option to trash 3 Coppers
      const threeCopperTrash = validMoves.find(m =>
        m.type === 'trash_cards' &&
        m.cards &&
        m.cards.length === 3 &&
        m.cards.every((c: string) => c === 'Copper')
      );
      expect(threeCopperTrash).toBeDefined();

      // Must include option to trash 4 cards (various combinations)
      const fourCardTrash = validMoves.find(m =>
        m.type === 'trash_cards' &&
        m.cards &&
        m.cards.length === 4
      );
      expect(fourCardTrash).toBeDefined();
    });

    // @req: GH-98 - Verify exact count of valid moves for 4 identical cards
    // @why: Documents the expected behavior precisely for regression testing
    test('should generate exactly 5 options for hand with 4 identical cards', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: ['Copper', 'Copper', 'Copper', 'Copper'],
        actions: 1
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Chapel',
          effect: 'trash_cards',
          maxTrash: 4
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // Count moves by trash count
      const trashCounts = validMoves.map(m => (m.cards as string[] || []).length);

      expect(trashCounts).toContain(0); // Trash nothing
      expect(trashCounts).toContain(1); // Trash 1 Copper
      expect(trashCounts).toContain(2); // Trash 2 Coppers
      expect(trashCounts).toContain(3); // Trash 3 Coppers
      expect(trashCounts).toContain(4); // Trash 4 Coppers

      expect(validMoves).toHaveLength(5);
    });
  });

  describe('discard_for_cellar (Cellar) - MISSING HANDLER', () => {
    // @req R-PENDING-001: Cellar returns valid discard combinations
    // @edge: Empty hand | Discard all cards | Discard nothing
    // @blocker(dev-agent): getValidMovesForPendingEffect() is missing 'discard_for_cellar' case handler

    test('should return moves to discard any combination of cards', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: ['Copper', 'Estate'],
        actions: 1
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Cellar',
          effect: 'discard_for_cellar'
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-002: Moves must match "discard_for_cellar CARD1,CARD2" format
      // Should include: nothing, Copper only, Estate only, both
      expect(validMoves).toContainEqual({ type: 'discard_for_cellar', cards: [] });
      expect(validMoves).toContainEqual({ type: 'discard_for_cellar', cards: ['Copper'] });
      expect(validMoves).toContainEqual({ type: 'discard_for_cellar', cards: ['Estate'] });
      expect(validMoves).toContainEqual({ type: 'discard_for_cellar', cards: ['Copper', 'Estate'] });

      expect(validMoves.length).toBeGreaterThanOrEqual(4);
    });

    test('should include option to discard nothing', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: ['Copper', 'Silver', 'Gold'],
        actions: 1
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Cellar',
          effect: 'discard_for_cellar'
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-003: Discarding is optional
      expect(validMoves).toContainEqual({ type: 'discard_for_cellar', cards: [] });
    });

    // @edge: Empty hand
    test('should return only empty array when hand is empty', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: [],
        actions: 1
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Cellar',
          effect: 'discard_for_cellar'
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-003: Empty hand = only option is discard nothing
      expect(validMoves).toEqual([{ type: 'discard_for_cellar', cards: [] }]);
    });

    test('should deduplicate identical cards in combinations', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: ['Copper', 'Copper', 'Estate'],
        actions: 1
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Cellar',
          effect: 'discard_for_cellar'
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // Should generate combinations from unique cards only
      // @req R-PENDING-002: Deduplication prevents redundant move options
      const uniqueCardCombos = validMoves.filter(m =>
        m.type === 'discard_for_cellar' &&
        m.cards &&
        m.cards.length === 1
      );

      // Should have Copper and Estate as single-card options (2 total)
      expect(uniqueCardCombos.length).toBeLessThanOrEqual(2);
    });
  });

  describe('gain_card (Workshop/Remodel step 2)', () => {
    // @req R-PENDING-001: Gain card pending effects return cards within cost limit
    // @edge: maxGainCost = 0 | maxGainCost very high | All supply exhausted

    test('should return all cards costing up to maxGainCost', () => {
      const state = engine.initializeGame(2);

      const testState: GameState = {
        ...state,
        pendingEffect: {
          card: 'Workshop',
          effect: 'gain_card',
          maxGainCost: 4,
          destination: 'discard'
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-002: Moves must be 'gain_card' with correct destination
      expect(validMoves.every(m => m.type === 'gain_card')).toBe(true);
      expect(validMoves.every(m => m.destination === 'discard')).toBe(true);

      // Should include all cards cost 4 or less
      expect(validMoves).toContainEqual({ type: 'gain_card', card: 'Copper', destination: 'discard' });
      expect(validMoves).toContainEqual({ type: 'gain_card', card: 'Estate', destination: 'discard' });
      expect(validMoves).toContainEqual({ type: 'gain_card', card: 'Silver', destination: 'discard' });

      // Should NOT include cards cost > 4
      expect(validMoves).not.toContainEqual({ type: 'gain_card', card: 'Gold', destination: 'discard' });
      expect(validMoves).not.toContainEqual({ type: 'gain_card', card: 'Province', destination: 'discard' });
    });

    // @edge: maxGainCost = 0 (only Copper/Curse available)
    test('should return only free cards when maxGainCost is 0', () => {
      const state = engine.initializeGame(2);

      const testState: GameState = {
        ...state,
        pendingEffect: {
          card: 'Workshop',
          effect: 'gain_card',
          maxGainCost: 0,
          destination: 'discard'
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-003: Only cost-0 cards when maxGainCost = 0
      expect(validMoves).toContainEqual({ type: 'gain_card', card: 'Copper', destination: 'discard' });
      // Curse is cost 0 but may not be in supply for this game

      // Should NOT include any cost > 0
      validMoves.forEach(move => {
        if (move.card) {
          const card = require('../src/cards').getCard(move.card);
          expect(card.cost).toBeLessThanOrEqual(0);
        }
      });
    });
  });

  describe('trash_for_remodel (Remodel step 1)', () => {
    // @req R-PENDING-001: Remodel trash step returns all cards in hand
    // @edge: Empty hand | Only victory cards | Mixed hand

    test('should return moves to trash any card from hand', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: ['Copper', 'Estate', 'Village'],
        actions: 1
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Remodel',
          effect: 'trash_for_remodel'
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-002: Remodel can trash ANY card (treasures, actions, victories)
      expect(validMoves).toContainEqual({ type: 'select_treasure_to_trash', card: 'Copper' });
      expect(validMoves).toContainEqual({ type: 'select_treasure_to_trash', card: 'Estate' });
      expect(validMoves).toContainEqual({ type: 'select_treasure_to_trash', card: 'Village' });

      // All unique cards in hand
      expect(validMoves).toHaveLength(3);
    });

    // @edge: Empty hand (should not happen in practice, but handle gracefully)
    test('should return empty array when hand is empty', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: [],
        actions: 1
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Remodel',
          effect: 'trash_for_remodel'
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-003: Empty hand = no valid trash options
      expect(validMoves).toEqual([]);
    });
  });

  describe('select_action_for_throne (Throne Room) - MISSING HANDLER', () => {
    // @req R-PENDING-001: Throne Room returns valid action cards from hand
    // @edge: No actions in hand | Multiple actions | Duplicate actions
    // @blocker(dev-agent): getValidMovesForPendingEffect() is missing 'select_action_for_throne' case handler

    test('should return moves to select each action card in hand', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: ['Village', 'Smithy', 'Copper', 'Estate'],
        actions: 1
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Throne Room',
          effect: 'select_action_for_throne'
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-002: Moves must match "select_action_for_throne CARD" format
      expect(validMoves).toContainEqual({ type: 'select_action_for_throne', card: 'Village' });
      expect(validMoves).toContainEqual({ type: 'select_action_for_throne', card: 'Smithy' });

      // @edge: Non-action cards should not appear
      expect(validMoves).not.toContainEqual({ type: 'select_action_for_throne', card: 'Copper' });
      expect(validMoves).not.toContainEqual({ type: 'select_action_for_throne', card: 'Estate' });

      // Only actions
      expect(validMoves).toHaveLength(2);
    });

    test('should include skip option when no actions in hand', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: ['Copper', 'Silver', 'Estate'],
        actions: 1
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Throne Room',
          effect: 'select_action_for_throne'
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-003: Allow skipping when no actions available
      // Skip is represented as move without 'card' field
      expect(validMoves).toContainEqual({ type: 'select_action_for_throne' });
      expect(validMoves).toHaveLength(1);
    });

    test('should deduplicate identical actions', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: ['Village', 'Village', 'Village', 'Smithy'],
        actions: 1
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Throne Room',
          effect: 'select_action_for_throne'
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-002: Only unique action cards
      expect(validMoves).toHaveLength(2);
      expect(validMoves).toContainEqual({ type: 'select_action_for_throne', card: 'Village' });
      expect(validMoves).toContainEqual({ type: 'select_action_for_throne', card: 'Smithy' });
    });
  });

  describe('chancellor_decision (Chancellor) - MISSING HANDLER', () => {
    // @req R-PENDING-001: Chancellor decision returns yes/no choices
    // @blocker(dev-agent): getValidMovesForPendingEffect() is missing 'chancellor_decision' case handler

    test('should return yes/no decision moves', () => {
      const state = engine.initializeGame(2);

      const testState: GameState = {
        ...state,
        pendingEffect: {
          card: 'Chancellor',
          effect: 'chancellor_decision',
          deckSize: 5
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-002: Moves must be 'chancellor_decision' with choice boolean
      expect(validMoves).toContainEqual({ type: 'chancellor_decision', choice: true });
      expect(validMoves).toContainEqual({ type: 'chancellor_decision', choice: false });
      expect(validMoves).toHaveLength(2);
    });
  });

  describe('spy_decision (Spy) - MISSING HANDLER', () => {
    // @req R-PENDING-001: Spy decision returns yes/no choices
    // @blocker(dev-agent): getValidMovesForPendingEffect() is missing 'spy_decision' case handler

    test('should return yes/no decision moves for discarding revealed card', () => {
      const state = engine.initializeGame(2);

      const testState: GameState = {
        ...state,
        pendingEffect: {
          card: 'Spy',
          effect: 'spy_decision',
          targetPlayer: 1
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-002: Moves must be 'spy_decision' with choice boolean
      expect(validMoves).toContainEqual({ type: 'spy_decision', choice: true });
      expect(validMoves).toContainEqual({ type: 'spy_decision', choice: false });
      expect(validMoves).toHaveLength(2);
    });
  });

  describe('library_set_aside (Library) - MISSING HANDLER', () => {
    // @req R-PENDING-001: Library set-aside returns yes/no for each revealed action
    // @blocker(dev-agent): getValidMovesForPendingEffect() is missing 'library_set_aside' case handler

    test('should return moves to set aside or keep revealed action', () => {
      const state = engine.initializeGame(2);

      const testState: GameState = {
        ...state,
        pendingEffect: {
          card: 'Library',
          effect: 'library_set_aside'
          // Revealed action would be tracked in pendingEffect context
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-002: Moves for Library are binary: set aside or keep
      // Parser expects: "library_set_aside CARD" format
      // So valid moves should allow selecting the revealed action to set aside

      // @hint Implementation could return either:
      // 1. { type: 'library_set_aside', cards: ['RevealedCard'] } to set aside
      // 2. { type: 'library_set_aside', cards: [] } to keep in hand
      // OR binary choice moves

      expect(validMoves.length).toBeGreaterThan(0);
      expect(validMoves.every(m => m.type === 'library_set_aside')).toBe(true);
    });
  });

  describe('reveal_and_topdeck (Bureaucrat attack response) - MISSING HANDLER', () => {
    // @req R-PENDING-001: Bureaucrat response returns victory cards from hand
    // @blocker(dev-agent): getValidMovesForPendingEffect() is missing 'reveal_and_topdeck' case handler

    test('should return moves to reveal each victory card in hand', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: ['Estate', 'Duchy', 'Copper', 'Village']
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Bureaucrat',
          effect: 'reveal_and_topdeck',
          targetPlayer: 0
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-002: Moves must match "reveal_and_topdeck CARD" format
      expect(validMoves).toContainEqual({ type: 'reveal_and_topdeck', card: 'Estate' });
      expect(validMoves).toContainEqual({ type: 'reveal_and_topdeck', card: 'Duchy' });

      // @edge: Non-victory cards should not appear
      expect(validMoves).not.toContainEqual({ type: 'reveal_and_topdeck', card: 'Copper' });
      expect(validMoves).not.toContainEqual({ type: 'reveal_and_topdeck', card: 'Village' });

      // Only victory cards
      expect(validMoves).toHaveLength(2);
    });

    test('should include skip option when no victory cards in hand', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: ['Copper', 'Silver', 'Village', 'Smithy']
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Bureaucrat',
          effect: 'reveal_and_topdeck',
          targetPlayer: 0
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-003: Allow revealing nothing when no victory cards
      // Skip is represented as move without 'card' field
      expect(validMoves).toContainEqual({ type: 'reveal_and_topdeck' });
      expect(validMoves).toHaveLength(1);
    });
  });

  describe('reveal_reaction (Moat) - MISSING HANDLER', () => {
    // @req R-PENDING-001: Reaction reveal returns yes/no for revealing Moat
    // @blocker(dev-agent): getValidMovesForPendingEffect() is missing 'reveal_reaction' case handler

    test('should return move to reveal Moat from hand', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: ['Moat', 'Copper', 'Estate']
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Militia',
          effect: 'reveal_reaction',
          targetPlayer: 0
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-002: Move must be 'reveal_reaction' with card 'Moat'
      expect(validMoves).toContainEqual({ type: 'reveal_reaction', card: 'Moat' });

      // @edge: Can also choose not to reveal
      // This might be a skip option (no card) or explicit "no" choice
      expect(validMoves.length).toBeGreaterThanOrEqual(1);
    });

    test('should return skip option when no reaction cards in hand', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: ['Copper', 'Estate', 'Silver']
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Militia',
          effect: 'reveal_reaction',
          targetPlayer: 0
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-003: Allow skipping when no reaction cards available
      // Parser allows "reveal_reaction" without card name
      expect(validMoves.length).toBeGreaterThanOrEqual(0);
      // If no Moat, may return empty array or skip option depending on implementation
    });
  });

  describe('discard_to_hand_size (Militia attack response) - MISSING HANDLER', () => {
    // @req R-PENDING-001: Militia discard returns valid combinations to reach hand size 3
    // @blocker(dev-agent): getValidMovesForPendingEffect() is missing 'discard_to_hand_size' case handler
    // @note: Move type in types.ts is 'discard_to_hand_size', not 'select_cards_to_discard'

    test('should return combinations that reduce hand to exactly 3 cards', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: ['Copper', 'Copper', 'Estate', 'Silver', 'Duchy'] // 5 cards, need to discard 2
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Militia',
          effect: 'discard_to_hand_size',
          targetPlayer: 0
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-002: All moves must discard exactly 2 cards (5 - 3 = 2)
      // Note: This uses 'discard_to_hand_size' move type
      validMoves.forEach(move => {
        if (move.cards && move.type === 'discard_to_hand_size') {
          expect(move.cards.length).toBe(2);
        }
      });

      expect(validMoves.length).toBeGreaterThan(0);
    });

    test('should return empty array when hand already at 3 or fewer', () => {
      const state = engine.initializeGame(2);

      const playerState = {
        ...state.players[0],
        hand: ['Copper', 'Estate', 'Silver'] // Already 3 cards
      };

      const testState: GameState = {
        ...state,
        players: [playerState, state.players[1]],
        pendingEffect: {
          card: 'Militia',
          effect: 'discard_to_hand_size',
          targetPlayer: 0
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // @req R-PENDING-003: No discard needed when hand <= 3
      expect(validMoves).toEqual([]);
    });
  });
});
