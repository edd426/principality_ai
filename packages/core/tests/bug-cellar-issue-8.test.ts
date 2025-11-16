/**
 * @file bug-cellar-issue-8.test.ts
 * @description Reproduce bugs reported in GitHub Issue #8
 *
 * Bug 1: getValidMoves returns empty array for discard_for_cellar pendingEffect
 * Bug 2: getCombinations generates duplicate options for hands with duplicate cards
 *
 * These tests should FAIL before the fix and PASS after the fix.
 */

import { GameEngine } from '../src/game';
import { GameState, CardName } from '../src/types';
import { generateCellarOptions } from '../src/presentation/move-options';

describe('GitHub Issue #8: Cellar Card Bugs', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('test-seed');
  });

  describe('Bug 1: getValidMoves missing discard_for_cellar case', () => {
    // @bug: GH-8-BUG-1 - getValidMoves returns [] when pendingEffect.effect === 'discard_for_cellar'
    // @assert: getValidMoves should return discard options when Cellar creates pendingEffect

    test('GH-8-BUG-1: getValidMoves returns empty for discard_for_cellar pendingEffect', () => {
      // Setup: Create a state with Cellar pendingEffect
      const state: GameState = {
        ...engine.initializeGame(),
        phase: 'action',
        players: [{
          ...engine.initializeGame().players[0],
          hand: ['Copper', 'Silver', 'Estate'],
          actions: 1,
          inPlay: []
        }],
        pendingEffect: {
          card: 'Cellar',
          effect: 'discard_for_cellar'
        }
      };

      // Execute: Get valid moves
      const moves = engine.getValidMoves(state);

      // Assert: Should return discard options, NOT empty array
      expect(moves.length).toBeGreaterThan(0);
      expect(moves[0].type).toBe('discard_for_cellar');
    });

    test('GH-8-BUG-1: Playing Cellar creates pendingEffect that getValidMoves can handle', () => {
      // Setup: State with Cellar in hand
      let state: GameState = {
        ...engine.initializeGame(),
        phase: 'action',
        players: [{
          ...engine.initializeGame().players[0],
          hand: ['Cellar', 'Copper', 'Silver', 'Estate'],
          actions: 1,
          inPlay: []
        }]
      };

      // Execute: Play Cellar
      const result = engine.executeMove(state, { type: 'play_action', card: 'Cellar' });
      expect(result.success).toBe(true);

      state = result.newState!;

      // Assert: pendingEffect should be created
      expect(state.pendingEffect).toBeTruthy();
      expect(typeof state.pendingEffect).toBe('object');
      expect(state.pendingEffect?.card).toBe('Cellar');
      expect(state.pendingEffect?.effect).toBe('discard_for_cellar');

      // Execute: Get valid moves for the pendingEffect
      const moves = engine.getValidMoves(state);

      // Assert: Should return discard options (at least 1 for "discard nothing")
      expect(moves.length).toBeGreaterThan(0);
      expect(moves.every(m => m.type === 'discard_for_cellar')).toBe(true);
    });

    test('GH-8-BUG-1: Cellar effect resolves correctly when move is executed', () => {
      // Setup: State with Cellar pendingEffect
      let state: GameState = {
        ...engine.initializeGame(),
        phase: 'action',
        players: [{
          ...engine.initializeGame().players[0],
          hand: ['Copper', 'Silver', 'Estate'],
          drawPile: ['Gold', 'Province'],
          actions: 1,
          inPlay: []
        }],
        pendingEffect: {
          card: 'Cellar',
          effect: 'discard_for_cellar'
        }
      };

      // Execute: Discard 1 card (Silver)
      const result = engine.executeMove(state, {
        type: 'discard_for_cellar',
        cards: ['Silver']
      });

      // Assert: Move succeeds
      expect(result.success).toBe(true);

      state = result.newState!;

      // Assert: pendingEffect is cleared
      expect(state.pendingEffect).toBeUndefined();

      // Assert: Silver discarded, drew 1 card (Gold from deck)
      expect(state.players[0].hand).toContain('Gold');
      expect(state.players[0].hand).not.toContain('Silver');
      expect(state.players[0].discardPile).toContain('Silver');
    });
  });

  describe('Bug 2: generateCellarOptions creates duplicates', () => {
    // @bug: GH-8-BUG-2 - getCombinations treats array positions as unique, creating duplicates
    // @assert: Options should not have duplicates when hand has duplicate cards

    test('GH-8-BUG-2: Hand with 2 Silvers should not create duplicate options', () => {
      const hand: CardName[] = ['Copper', 'Silver', 'Estate', 'Silver'];
      const options = generateCellarOptions(hand);

      // Create a set of normalized option strings to check for duplicates
      const normalizedOptions = options.map(opt => {
        // Sort cards alphabetically to normalize ["Copper", "Silver"] vs ["Silver", "Copper"]
        const sortedCards = [...(opt.move.cards || [])].sort().join(',');
        return sortedCards;
      });

      // Check for duplicates
      const uniqueOptions = new Set(normalizedOptions);

      // Assert: No duplicates should exist
      expect(uniqueOptions.size).toBe(normalizedOptions.length);
    });

    test('GH-8-BUG-2: Hand with 2 Coppers should not have duplicate single-card options', () => {
      const hand: CardName[] = ['Copper', 'Silver', 'Copper'];
      const options = generateCellarOptions(hand);

      // Find all options that discard exactly 1 Copper
      const singleCopperOptions = options.filter(opt =>
        opt.move.cards?.length === 1 && opt.move.cards[0] === 'Copper'
      );

      // Assert: Should have exactly 1 option for discarding a single Copper
      expect(singleCopperOptions.length).toBe(1);
    });

    test('GH-8-BUG-2: Hand with 3 identical cards should not create permutations', () => {
      const hand: CardName[] = ['Estate', 'Estate', 'Estate'];
      const options = generateCellarOptions(hand);

      // For 3 identical cards, there should be exactly 4 unique options:
      // 1. Discard nothing (0 cards)
      // 2. Discard 1 Estate
      // 3. Discard 2 Estates
      // 4. Discard 3 Estates

      // Group by number of cards discarded
      const byCount = new Map<number, number>();
      options.forEach(opt => {
        const count = opt.move.cards?.length || 0;
        byCount.set(count, (byCount.get(count) || 0) + 1);
      });

      // Assert: Exactly 1 option for each count
      expect(byCount.get(0)).toBe(1); // Discard nothing
      expect(byCount.get(1)).toBe(1); // Discard 1
      expect(byCount.get(2)).toBe(1); // Discard 2
      expect(byCount.get(3)).toBe(1); // Discard 3
      expect(options.length).toBe(4);
    });

    test('GH-8-BUG-2: Real-world example from issue - no duplicate "Copper, Silver"', () => {
      // From issue: hand: [Copper, Silver, Estate, Silver]
      const hand: CardName[] = ['Copper', 'Silver', 'Estate', 'Silver'];
      const options = generateCellarOptions(hand);

      // Find options that discard exactly Copper + Silver (any order)
      const copperSilverOptions = options.filter(opt => {
        const cards = [...(opt.move.cards || [])].sort();
        return cards.length === 2 &&
               cards[0] === 'Copper' &&
               cards[1] === 'Silver';
      });

      // Assert: Should have exactly 1 option for "Copper, Silver"
      expect(copperSilverOptions.length).toBe(1);
    });

    test('GH-8-BUG-2: Real-world example from issue - no duplicate single Silver', () => {
      // From issue: hand: [Copper, Silver, Estate, Silver]
      const hand: CardName[] = ['Copper', 'Silver', 'Estate', 'Silver'];
      const options = generateCellarOptions(hand);

      // Find options that discard exactly 1 Silver
      const singleSilverOptions = options.filter(opt =>
        opt.move.cards?.length === 1 && opt.move.cards[0] === 'Silver'
      );

      // Assert: Should have exactly 1 option for discarding a Silver
      expect(singleSilverOptions.length).toBe(1);
    });
  });

  describe('Cellar Integration - Full workflow', () => {
    // @integration: GH-8-INTEGRATION
    // @assert: Complete Cellar workflow from play to resolution without infinite loop

    test('GH-8-INTEGRATION: Full Cellar workflow - play, discard, draw, continue', () => {
      // Setup: Initialize game and set up hand with Cellar
      let state = engine.initializeGame();
      state = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Cellar', 'Copper', 'Copper', 'Estate'],
          drawPile: ['Silver', 'Gold', 'Province'],
          actions: 1
        }]
      };

      // Step 1: Play Cellar
      let result = engine.executeMove(state, { type: 'play_action', card: 'Cellar' });
      expect(result.success).toBe(true);
      state = result.newState!;

      // Assert: Cellar is in play, actions increased by 1
      expect(state.players[0].inPlay).toContain('Cellar');
      expect(state.players[0].actions).toBe(1); // Started with 1, Cellar gives +1
      expect(state.pendingEffect?.effect).toBe('discard_for_cellar');

      // Step 2: Get valid moves (should not be empty!)
      const moves = engine.getValidMoves(state);
      expect(moves.length).toBeGreaterThan(0);
      expect(moves.every(m => m.type === 'discard_for_cellar')).toBe(true);

      // Step 3: Discard 2 Coppers
      result = engine.executeMove(state, {
        type: 'discard_for_cellar',
        cards: ['Copper', 'Copper']
      });
      expect(result.success).toBe(true);
      state = result.newState!;

      // Assert: Coppers discarded, drew 2 cards
      expect(state.players[0].hand).toContain('Estate'); // Still have Estate
      expect(state.players[0].hand).toContain('Silver'); // Drew Silver
      expect(state.players[0].hand).toContain('Gold');   // Drew Gold
      expect(state.players[0].hand).not.toContain('Copper');
      expect(state.players[0].discardPile.filter(c => c === 'Copper').length).toBe(2);
      expect(state.pendingEffect).toBeUndefined();

      // Step 4: Verify game continues normally (no infinite loop)
      const nextMoves = engine.getValidMoves(state);

      // Should get action phase moves (not Cellar discard again!)
      expect(nextMoves.every(m => m.type !== 'discard_for_cellar')).toBe(true);
      expect(nextMoves.some(m => m.type === 'end_phase')).toBe(true);
    });
  });
});
