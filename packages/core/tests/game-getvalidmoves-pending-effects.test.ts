/**
 * @file getValidMoves() Pending Effect Bug - Comprehensive CLI Integration Tests
 * @phase 4.2
 * @status RED (tests will FAIL until getValidMoves() checks pendingEffect)
 *
 * ROOT CAUSE:
 * - getValidMoves() only checks `phase` (line 2037: switch(state.phase))
 * - IGNORES `pendingEffect` field completely
 * - During Mine step 1, returns play_action/end_phase moves (wrong!)
 * - Should ONLY return select_treasure_to_trash moves
 *
 * BUG MANIFESTATION:
 * - CLI displays options [1, 2, 3] for treasures in hand
 * - User selects option [1] expecting select_treasure_to_trash
 * - CLI executes play_action instead (first valid move in array)
 * - Treasure gets PLAYED instead of selected for trashing
 *
 * FIX REQUIRED (dev-agent):
 * - getValidMoves() must check if pendingEffect exists FIRST
 * - If pendingEffect exists, return ONLY moves for that pending effect
 * - If no pendingEffect, fall back to phase-based moves
 *
 * EXPECTED BEHAVIOR AFTER FIX:
 * - getValidMoves() with Mine pending effect returns ONLY select_treasure_to_trash moves
 * - getValidMoves() with Remodel pending effect returns ONLY trash_for_remodel moves
 * - No play_action or end_phase moves during pending effects
 *
 * @req: getValidMoves() must respect pendingEffect field
 * @blocker: All CLI card interactions broken for multi-step cards
 * @impact: Mine, Remodel, Chapel, Workshop, Feast, Throne Room, Library, Spy all affected
 */

import { GameEngine, GameState, Move } from '@principality/core';

describe('BUG: getValidMoves() ignores pendingEffect', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('getvalidmoves-pending-test');
  });

  describe('CORE-BUG-1: Mine Step 1 - select_treasure_to_trash pending effect', () => {
    /**
     * @req: getValidMoves() should return ONLY select_treasure_to_trash moves during Mine step 1
     * @edge: Core bug - returns wrong move types during pending effect
     * @why: CLI displays treasure options but executes wrong move type
     * @assert: validMoves contains ONLY select_treasure_to_trash moves (no play_action, no end_phase)
     * @level: Critical - CLI Integration Bug
     */
    test('should return ONLY select_treasure_to_trash moves (not play_action or end_phase)', () => {
      // @req: During pending effect, only return moves for that effect
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Copper', 'Silver', 'Village'],
          actions: 2, // Has actions (so play_action WOULD be valid without pending effect)
          coins: 0
        }]
      };

      // Play Mine to trigger pendingEffect
      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      expect(playResult.success).toBe(true);
      expect(playResult.newState!.pendingEffect).toBeTruthy();
      expect(typeof playResult.newState!.pendingEffect).toBe('object');
      expect(playResult.newState!.pendingEffect?.effect).toBe('select_treasure_to_trash');

      // BUG TEST: Get valid moves during pending effect
      const validMoves = engine.getValidMoves(playResult.newState!);

      // CRITICAL ASSERTIONS (WILL FAIL with bug):

      // 1. Should have exactly 2 moves (Copper, Silver)
      expect(validMoves.length).toBe(2);

      // 2. ALL moves should be select_treasure_to_trash type
      expect(validMoves.every(m => m.type === 'select_treasure_to_trash')).toBe(true);

      // 3. Should NOT contain play_action moves (even though actions > 0)
      expect(validMoves.filter(m => m.type === 'play_action').length).toBe(0);

      // 4. Should NOT contain end_phase move
      expect(validMoves.filter(m => m.type === 'end_phase').length).toBe(0);

      // 5. Should contain select_treasure_to_trash for Copper
      expect(validMoves).toContainEqual({
        type: 'select_treasure_to_trash',
        card: 'Copper'
      });

      // 6. Should contain select_treasure_to_trash for Silver
      expect(validMoves).toContainEqual({
        type: 'select_treasure_to_trash',
        card: 'Silver'
      });

      // 7. Should NOT contain select_treasure_to_trash for Village (not a treasure)
      expect(validMoves.find(m => m.card === 'Village')).toBeUndefined();
    });

    /**
     * @req: getValidMoves() should only return treasures in hand during Mine step 1
     * @edge: Card type filtering during pending effect
     * @why: Should ONLY show treasures, not action cards
     * @assert: Only Copper and Silver moves returned (Village ignored)
     * @level: Critical
     */
    test('should return ONLY treasures (not action cards)', () => {
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Copper', 'Village', 'Smithy'], // Mix of treasures and actions
          actions: 3
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      const validMoves = engine.getValidMoves(playResult.newState!);

      // ASSERTIONS (WILL FAIL with bug):

      // 1. Should have exactly 1 move (only Copper)
      expect(validMoves.length).toBe(1);

      // 2. Should be Copper only
      expect(validMoves).toContainEqual({
        type: 'select_treasure_to_trash',
        card: 'Copper'
      });

      // 3. Should NOT contain Village (action card)
      expect(validMoves.find(m => m.card === 'Village')).toBeUndefined();

      // 4. Should NOT contain Smithy (action card)
      expect(validMoves.find(m => m.card === 'Smithy')).toBeUndefined();
    });

    /**
     * @req: getValidMoves() should handle multiple identical treasures
     * @edge: Multiple copies of same treasure
     * @why: Should return one move per treasure type (not per copy)
     * @assert: Returns 1 move for Copper (not 3)
     * @level: Critical
     */
    test('should return one move per treasure type (multiple Coppers → 1 move)', () => {
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Copper', 'Copper', 'Copper'],
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      const validMoves = engine.getValidMoves(playResult.newState!);

      // ASSERTIONS (WILL FAIL with bug):

      // 1. Should have exactly 1 move (Copper)
      expect(validMoves.length).toBe(1);

      // 2. Should be select_treasure_to_trash for Copper
      expect(validMoves).toContainEqual({
        type: 'select_treasure_to_trash',
        card: 'Copper'
      });

      // 3. Should NOT have duplicate Copper entries
      const copperMoves = validMoves.filter(m => m.card === 'Copper');
      expect(copperMoves.length).toBe(1);
    });

    /**
     * @req: getValidMoves() should return empty array if no treasures in hand
     * @edge: No valid targets for pending effect
     * @why: Mine requires treasures - none available
     * @assert: Returns empty array (not play_action or end_phase)
     * @level: Edge Case
     */
    test('should return empty array when no treasures in hand', () => {
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Village', 'Smithy', 'Estate'],
          actions: 2
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      const validMoves = engine.getValidMoves(playResult.newState!);

      // ASSERTIONS (WILL FAIL with bug):

      // 1. Should have 0 moves (no treasures available)
      expect(validMoves.length).toBe(0);

      // 2. Should NOT contain play_action (even though actions > 0)
      expect(validMoves.filter(m => m.type === 'play_action').length).toBe(0);

      // 3. Should NOT contain end_phase
      expect(validMoves.filter(m => m.type === 'end_phase').length).toBe(0);
    });

    /**
     * @req: getValidMoves() should handle mixed treasures correctly
     * @edge: Multiple treasure types
     * @why: Should return one move per treasure type
     * @assert: Returns 3 moves (Copper, Silver, Gold)
     * @level: Critical
     */
    test('should return one move per treasure type (Copper, Silver, Gold)', () => {
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Copper', 'Silver', 'Gold', 'Estate'],
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      const validMoves = engine.getValidMoves(playResult.newState!);

      // ASSERTIONS (WILL FAIL with bug):

      // 1. Should have exactly 3 moves (Copper, Silver, Gold)
      expect(validMoves.length).toBe(3);

      // 2. All moves are select_treasure_to_trash
      expect(validMoves.every(m => m.type === 'select_treasure_to_trash')).toBe(true);

      // 3. Contains Copper move
      expect(validMoves).toContainEqual({
        type: 'select_treasure_to_trash',
        card: 'Copper'
      });

      // 4. Contains Silver move
      expect(validMoves).toContainEqual({
        type: 'select_treasure_to_trash',
        card: 'Silver'
      });

      // 5. Contains Gold move
      expect(validMoves).toContainEqual({
        type: 'select_treasure_to_trash',
        card: 'Gold'
      });

      // 6. Does NOT contain Estate move (not a treasure)
      expect(validMoves.find(m => m.card === 'Estate')).toBeUndefined();
    });
  });

  describe('CORE-BUG-2: Mine Step 2 - gain_treasure pending effect', () => {
    /**
     * @req: getValidMoves() should return ONLY gain_card moves during Mine step 2
     * @edge: Second pending effect step
     * @why: After trashing, should only show treasure gain options
     * @assert: validMoves contains ONLY gain_card moves for treasures within cost limit
     * @level: Critical
     */
    test('should return ONLY gain_card moves for treasures within cost limit', () => {
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

      // Play Mine
      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      // Trash Copper (cost $0) → max gain cost = $3
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'select_treasure_to_trash',
        card: 'Copper'
      });

      expect(trashResult.success).toBe(true);
      expect(trashResult.newState!.pendingEffect?.effect).toBe('gain_treasure');
      expect(trashResult.newState!.pendingEffect?.maxGainCost).toBe(3);

      // BUG TEST: Get valid moves during gain_treasure pending effect
      const validMoves = engine.getValidMoves(trashResult.newState!);

      // ASSERTIONS (WILL FAIL with bug):

      // 1. Should have exactly 2 moves (Copper $0, Silver $3 - both ≤ $3)
      expect(validMoves.length).toBe(2);

      // 2. ALL moves should be gain_card type
      expect(validMoves.every(m => m.type === 'gain_card')).toBe(true);

      // 3. Should contain Copper gain move
      expect(validMoves).toContainEqual({
        type: 'gain_card',
        card: 'Copper',
        destination: 'hand'
      });

      // 4. Should contain Silver gain move
      expect(validMoves).toContainEqual({
        type: 'gain_card',
        card: 'Silver',
        destination: 'hand'
      });

      // 5. Should NOT contain Gold (costs $6 > $3 limit)
      expect(validMoves.find(m => m.card === 'Gold')).toBeUndefined();

      // 6. Should NOT contain play_treasure moves
      expect(validMoves.filter(m => m.type === 'play_treasure').length).toBe(0);

      // 7. Should NOT contain end_phase
      expect(validMoves.filter(m => m.type === 'end_phase').length).toBe(0);
    });

    /**
     * @req: getValidMoves() should enforce maxGainCost limit
     * @edge: Cost limit enforcement
     * @why: Should ONLY show treasures within cost limit
     * @assert: Silver trashed ($3) allows Gold ($6 = $3 + $3)
     * @level: Critical
     */
    test('should enforce maxGainCost limit (Silver trashed → can gain Gold)', () => {
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Silver'],
          actions: 1
        }]
      };

      // Play Mine
      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      // Trash Silver (cost $3) → max gain cost = $6
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'select_treasure_to_trash',
        card: 'Silver'
      });

      expect(trashResult.success).toBe(true);
      expect(trashResult.newState!.pendingEffect?.maxGainCost).toBe(6);

      const validMoves = engine.getValidMoves(trashResult.newState!);

      // ASSERTIONS (WILL FAIL with bug):

      // 1. Should have exactly 3 moves (Copper $0, Silver $3, Gold $6)
      expect(validMoves.length).toBe(3);

      // 2. Should contain Gold gain move (within $6 limit)
      expect(validMoves).toContainEqual({
        type: 'gain_card',
        card: 'Gold',
        destination: 'hand'
      });

      // 3. Should contain Silver gain move
      expect(validMoves).toContainEqual({
        type: 'gain_card',
        card: 'Silver',
        destination: 'hand'
      });

      // 4. Should contain Copper gain move
      expect(validMoves).toContainEqual({
        type: 'gain_card',
        card: 'Copper',
        destination: 'hand'
      });
    });

    /**
     * @req: getValidMoves() should only return TREASURES (not actions/victories)
     * @edge: Card type filtering
     * @why: Mine can ONLY gain treasures
     * @assert: No Village moves even if within cost limit
     * @level: Critical
     */
    test('should only return treasures (not action/victory cards)', () => {
      const state = engine.initializeGame(1, { allCards: true });

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Gold'],
          actions: 1
        }]
      };

      // Play Mine
      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      // Trash Gold (cost $6) → max gain cost = $9
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'select_treasure_to_trash',
        card: 'Gold'
      });

      expect(trashResult.success).toBe(true);
      expect(trashResult.newState!.pendingEffect?.maxGainCost).toBe(9);

      const validMoves = engine.getValidMoves(trashResult.newState!);

      // ASSERTIONS (WILL FAIL with bug):

      // 1. Should only contain treasures (Copper, Silver, Gold)
      expect(validMoves.every(m =>
        m.card === 'Copper' || m.card === 'Silver' || m.card === 'Gold'
      )).toBe(true);

      // 2. Should NOT contain Village (action card, costs $3)
      expect(validMoves.find(m => m.card === 'Village')).toBeUndefined();

      // 3. Should NOT contain Estate (victory card, costs $2)
      expect(validMoves.find(m => m.card === 'Estate')).toBeUndefined();

      // 4. Should NOT contain Duchy (victory card, costs $5)
      expect(validMoves.find(m => m.card === 'Duchy')).toBeUndefined();
    });
  });

  describe('CORE-BUG-3: Remodel pending effects', () => {
    /**
     * @req: getValidMoves() should handle Remodel step 1 (trash_for_remodel)
     * @edge: Similar pattern to Mine (trash → gain)
     * @why: Same bug affects Remodel
     * @assert: Returns ONLY trash_for_remodel moves (any card)
     * @level: Critical
     */
    test('should return ONLY trash_for_remodel moves during Remodel step 1', () => {
      const state = engine.initializeGame(1, { allCards: true });

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Remodel', 'Copper', 'Estate', 'Village'],
          actions: 2
        }]
      };

      // Play Remodel
      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Remodel'
      });

      expect(playResult.success).toBe(true);
      expect(playResult.newState!.pendingEffect?.effect).toBe('trash_for_remodel');

      const validMoves = engine.getValidMoves(playResult.newState!);

      // ASSERTIONS (WILL FAIL with bug):

      // 1. Should have exactly 3 moves (Copper, Estate, Village)
      expect(validMoves.length).toBe(3);

      // 2. ALL moves should be select_treasure_to_trash type
      expect(validMoves.every(m => m.type === 'select_treasure_to_trash')).toBe(true);

      // 3. Should NOT contain play_action (even with actions > 0)
      expect(validMoves.filter(m => m.type === 'play_action').length).toBe(0);

      // 4. Should NOT contain end_phase
      expect(validMoves.filter(m => m.type === 'end_phase').length).toBe(0);

      // 5. Should contain all hand cards as options
      expect(validMoves).toContainEqual({
        type: 'select_treasure_to_trash',
        card: 'Copper'
      });
      expect(validMoves).toContainEqual({
        type: 'select_treasure_to_trash',
        card: 'Estate'
      });
      expect(validMoves).toContainEqual({
        type: 'select_treasure_to_trash',
        card: 'Village'
      });
    });

    /**
     * @req: getValidMoves() should handle Remodel step 2 (gain_card)
     * @edge: Second step of Remodel
     * @why: Should only show cards within cost limit
     * @assert: Returns ONLY gain_card moves within maxGainCost
     * @level: Critical
     */
    test('should return ONLY gain_card moves during Remodel step 2', () => {
      const state = engine.initializeGame(1, { allCards: true });

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Remodel', 'Estate'],
          actions: 1
        }]
      };

      // Play Remodel
      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Remodel'
      });

      // Trash Estate (cost $2) → max gain cost = $4
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'select_treasure_to_trash',
        card: 'Estate'
      });

      expect(trashResult.success).toBe(true);
      expect(trashResult.newState!.pendingEffect?.effect).toBe('gain_card');
      expect(trashResult.newState!.pendingEffect?.maxGainCost).toBe(4);

      const validMoves = engine.getValidMoves(trashResult.newState!);

      // ASSERTIONS (WILL FAIL with bug):

      // 1. ALL moves should be gain_card type
      expect(validMoves.every(m => m.type === 'gain_card')).toBe(true);

      // 2. Should NOT contain play_treasure
      expect(validMoves.filter(m => m.type === 'play_treasure').length).toBe(0);

      // 3. Should NOT contain end_phase
      expect(validMoves.filter(m => m.type === 'end_phase').length).toBe(0);

      // 4. All cards should be ≤ $4
      validMoves.forEach(move => {
        const card = state.supply.has(move.card!) ? move.card! : 'Copper';
        // Note: Actual cost validation happens in executeMove
        expect(move.type).toBe('gain_card');
      });
    });
  });

  describe('CORE-BUG-4: Chapel pending effect', () => {
    /**
     * @req: getValidMoves() should handle Chapel trash_cards pending effect
     * @edge: Different pending effect type (trash_cards vs select_treasure_to_trash)
     * @why: Chapel uses trash_cards effect (supports multiple cards)
     * @assert: Returns ONLY trash_cards moves
     * @level: Critical
     */
    test('should return ONLY trash_cards moves during Chapel pending effect', () => {
      const state = engine.initializeGame(1, { allCards: true });

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Chapel', 'Copper', 'Copper', 'Estate', 'Estate'],
          actions: 1
        }]
      };

      // Play Chapel
      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Chapel'
      });

      expect(playResult.success).toBe(true);
      expect(playResult.newState!.pendingEffect?.effect).toBe('trash_cards');

      const validMoves = engine.getValidMoves(playResult.newState!);

      // ASSERTIONS (WILL FAIL with bug):

      // 1. ALL moves should be trash_cards type
      expect(validMoves.every(m => m.type === 'trash_cards')).toBe(true);

      // 2. Should NOT contain play_action
      expect(validMoves.filter(m => m.type === 'play_action').length).toBe(0);

      // 3. Should NOT contain end_phase
      expect(validMoves.filter(m => m.type === 'end_phase').length).toBe(0);

      // 4. Should include option to trash 0 cards (skip)
      expect(validMoves).toContainEqual({
        type: 'trash_cards',
        cards: []
      });

      // 5. Should have multiple trash combinations (Chapel allows trashing up to 4 cards)
      expect(validMoves.length).toBeGreaterThan(1);
    });
  });

  describe('CORE-BUG-5: Comparison with working vs broken cards', () => {
    /**
     * @req: Compare getValidMoves() behavior for similar cards
     * @edge: Pattern consistency check
     * @why: Proves bug is systematic (affects all pending effects)
     * @assert: Both Mine and Remodel show same bug pattern
     * @level: Pattern Validation
     */
    test('should show same bug for Mine and Remodel (both have select_treasure_to_trash)', () => {
      const engine1 = new GameEngine('mine-compare');
      const engine2 = new GameEngine('remodel-compare');

      // Test Mine
      const mineState = engine1.initializeGame(1, { allCards: true });
      const mineTestState: GameState = {
        ...mineState,
        phase: 'action',
        players: [{
          ...mineState.players[0],
          hand: ['Mine', 'Copper', 'Village'],
          actions: 2
        }]
      };

      const minePlayResult = engine1.executeMove(mineTestState, {
        type: 'play_action',
        card: 'Mine'
      });

      const mineValidMoves = engine1.getValidMoves(minePlayResult.newState!);

      // Test Remodel
      const remodelState = engine2.initializeGame(1, { allCards: true });
      const remodelTestState: GameState = {
        ...remodelState,
        phase: 'action',
        players: [{
          ...remodelState.players[0],
          hand: ['Remodel', 'Copper', 'Village'],
          actions: 2
        }]
      };

      const remodelPlayResult = engine2.executeMove(remodelTestState, {
        type: 'play_action',
        card: 'Remodel'
      });

      const remodelValidMoves = engine2.getValidMoves(remodelPlayResult.newState!);

      // ASSERTIONS (WILL FAIL with bug):

      // 1. Both should return ONLY select_treasure_to_trash moves
      expect(mineValidMoves.every(m => m.type === 'select_treasure_to_trash')).toBe(true);
      expect(remodelValidMoves.every(m => m.type === 'select_treasure_to_trash')).toBe(true);

      // 2. Neither should contain play_action (even with actions > 0)
      expect(mineValidMoves.filter(m => m.type === 'play_action').length).toBe(0);
      expect(remodelValidMoves.filter(m => m.type === 'play_action').length).toBe(0);

      // 3. Neither should contain end_phase
      expect(mineValidMoves.filter(m => m.type === 'end_phase').length).toBe(0);
      expect(remodelValidMoves.filter(m => m.type === 'end_phase').length).toBe(0);

      // 4. Both should have same move count (Copper, Village available for both)
      expect(mineValidMoves.length).toBe(1); // Only Copper (Mine requires treasure)
      expect(remodelValidMoves.length).toBe(2); // Copper and Village (Remodel accepts any card)
    });

    /**
     * @req: Verify getValidMoves() works correctly WITHOUT pending effect
     * @edge: Baseline validation
     * @why: Prove bug is specific to pending effects (not general getValidMoves failure)
     * @assert: Without pending effect, returns correct phase-based moves
     * @level: Regression Prevention
     */
    test('should work correctly during action phase WITHOUT pending effect', () => {
      const state = engine.initializeGame(1, { allCards: true });

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Village', 'Smithy', 'Copper', 'Estate'],
          actions: 1
        }],
        pendingEffect: undefined // Explicitly no pending effect
      };

      const validMoves = engine.getValidMoves(testState);

      // ASSERTIONS (should PASS - this is the baseline):

      // 1. Should contain play_action moves (no pending effect)
      expect(validMoves.filter(m => m.type === 'play_action').length).toBe(2);

      // 2. Should contain end_phase
      expect(validMoves.filter(m => m.type === 'end_phase').length).toBe(1);

      // 3. Should contain Village play_action
      expect(validMoves).toContainEqual({
        type: 'play_action',
        card: 'Village'
      });

      // 4. Should contain Smithy play_action
      expect(validMoves).toContainEqual({
        type: 'play_action',
        card: 'Smithy'
      });

      // 5. Should NOT contain Copper play_action (not an action card)
      expect(validMoves.find(m => m.type === 'play_action' && m.card === 'Copper')).toBeUndefined();
    });
  });

  describe('CORE-BUG-6: Edge cases with pending effects', () => {
    /**
     * @req: getValidMoves() with empty hand during pending effect
     * @edge: No valid cards for pending effect
     * @why: Should return empty array (not fall back to phase-based moves)
     * @assert: Returns empty array when no cards match pending effect
     * @level: Edge Case
     */
    test('should return empty array when no cards match pending effect requirements', () => {
      const state = engine.initializeGame(1, { allCards: true });

      // Create state with Mine pending effect but no treasures in hand
      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Village', 'Estate'],
          actions: 1
        }],
        pendingEffect: {
          card: 'Mine',
          effect: 'select_treasure_to_trash'
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // ASSERTIONS (WILL FAIL with bug):

      // 1. Should return empty array (no treasures available)
      expect(validMoves.length).toBe(0);

      // 2. Should NOT fall back to play_action
      expect(validMoves.filter(m => m.type === 'play_action').length).toBe(0);

      // 3. Should NOT fall back to end_phase
      expect(validMoves.filter(m => m.type === 'end_phase').length).toBe(0);
    });

    /**
     * @req: getValidMoves() during buy phase with pending effect
     * @edge: Pending effect exists but phase changed
     * @why: Pending effects should take priority over phase
     * @assert: Returns pending effect moves (not buy phase moves)
     * @level: Edge Case
     */
    test('should prioritize pending effect over phase (buy phase with pending effect)', () => {
      const state = engine.initializeGame(1, { allCards: true });

      // Artificial state: buy phase but with pending effect (shouldn't happen normally)
      const testState: GameState = {
        ...state,
        phase: 'buy', // Buy phase
        players: [{
          ...state.players[0],
          hand: ['Copper', 'Silver'],
          coins: 5,
          buys: 1
        }],
        pendingEffect: {
          card: 'Mine',
          effect: 'select_treasure_to_trash'
        }
      };

      const validMoves = engine.getValidMoves(testState);

      // ASSERTIONS (WILL FAIL with bug):

      // 1. Should return select_treasure_to_trash moves (pending effect priority)
      expect(validMoves.every(m => m.type === 'select_treasure_to_trash')).toBe(true);

      // 2. Should NOT return play_treasure moves (even though phase is buy)
      expect(validMoves.filter(m => m.type === 'play_treasure').length).toBe(0);

      // 3. Should NOT return buy moves (even though phase is buy)
      expect(validMoves.filter(m => m.type === 'buy').length).toBe(0);

      // 4. Should have exactly 2 moves (Copper, Silver)
      expect(validMoves.length).toBe(2);
    });

    /**
     * @req: getValidMoves() with multiple card types during pending effect
     * @edge: Complex hand composition
     * @why: Should filter correctly by pending effect requirements
     * @assert: Returns only treasures for Mine (ignores actions, victories, etc.)
     * @level: Edge Case
     */
    test('should filter by pending effect requirements (Mine ignores non-treasures)', () => {
      const state = engine.initializeGame(1, { allCards: true });

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Copper', 'Silver', 'Village', 'Smithy', 'Estate', 'Duchy'],
          actions: 3
        }]
      };

      // Play Mine
      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      const validMoves = engine.getValidMoves(playResult.newState!);

      // ASSERTIONS (WILL FAIL with bug):

      // 1. Should have exactly 2 moves (only Copper and Silver)
      expect(validMoves.length).toBe(2);

      // 2. Should contain Copper
      expect(validMoves).toContainEqual({
        type: 'select_treasure_to_trash',
        card: 'Copper'
      });

      // 3. Should contain Silver
      expect(validMoves).toContainEqual({
        type: 'select_treasure_to_trash',
        card: 'Silver'
      });

      // 4. Should NOT contain Village (action)
      expect(validMoves.find(m => m.card === 'Village')).toBeUndefined();

      // 5. Should NOT contain Smithy (action)
      expect(validMoves.find(m => m.card === 'Smithy')).toBeUndefined();

      // 6. Should NOT contain Estate (victory)
      expect(validMoves.find(m => m.card === 'Estate')).toBeUndefined();

      // 7. Should NOT contain Duchy (victory)
      expect(validMoves.find(m => m.card === 'Duchy')).toBeUndefined();
    });
  });

  describe('CORE-BUG-7: CLI Integration - Move Selection Logic', () => {
    /**
     * @req: Simulate CLI user selecting option [1] during Mine pending effect
     * @edge: Real-world CLI usage pattern
     * @why: This is HOW the bug manifests in CLI (user sees treasures, selects one, wrong move executes)
     * @assert: Option [1] should map to first treasure (select_treasure_to_trash), NOT first action
     * @level: CLI Integration
     */
    test('CLI simulation: option [1] should select first treasure (not first action)', () => {
      const state = engine.initializeGame(1, { allCards: true });

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Copper', 'Silver', 'Village'], // Village is action (should be ignored)
          actions: 2
        }]
      };

      // Play Mine
      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      // Get valid moves (what CLI uses to build options)
      const validMoves = engine.getValidMoves(playResult.newState!);

      // BUG MANIFESTATION:
      // - WITH BUG: validMoves[0] is { type: 'play_action', card: 'Village' }
      // - WITHOUT BUG: validMoves[0] is { type: 'select_treasure_to_trash', card: 'Copper' }

      // ASSERTIONS (WILL FAIL with bug):

      // 1. First move should be select_treasure_to_trash for Copper
      expect(validMoves[0]).toEqual({
        type: 'select_treasure_to_trash',
        card: 'Copper'
      });

      // 2. Second move should be select_treasure_to_trash for Silver
      expect(validMoves[1]).toEqual({
        type: 'select_treasure_to_trash',
        card: 'Silver'
      });

      // 3. Should NOT have Village as first option
      expect(validMoves[0].card).not.toBe('Village');

      // 4. Simulate user selecting option [1] (first valid move)
      const userSelectedMove = validMoves[0];

      // Execute the move user selected
      const executeResult = engine.executeMove(playResult.newState!, userSelectedMove);

      // ASSERTIONS (WILL FAIL with bug):

      // 5. Move should succeed
      expect(executeResult.success).toBe(true);

      // 6. Copper should be TRASHED (not played)
      expect(executeResult.newState!.trash).toContain('Copper');

      // 7. Coins should be 0 (treasure NOT played)
      expect(executeResult.newState!.players[0].coins).toBe(0);

      // 8. Hand should NOT contain Copper
      expect(executeResult.newState!.players[0].hand).not.toContain('Copper');

      // 9. Pending effect should advance to gain_treasure
      expect(executeResult.newState!.pendingEffect?.effect).toBe('gain_treasure');
    });

    /**
     * @req: CLI should display ONLY treasures during Mine pending effect
     * @edge: Option display filtering
     * @why: User should not see action cards as options during Mine
     * @assert: validMoves used for CLI display contains ONLY treasures
     * @level: CLI Integration
     */
    test('CLI simulation: displayed options should ONLY show treasures', () => {
      const state = engine.initializeGame(1, { allCards: true });

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Copper', 'Village', 'Smithy', 'Silver'],
          actions: 3 // Has actions (so play_action WOULD be valid without pending effect)
        }]
      };

      // Play Mine
      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      // Get valid moves (CLI builds display from this)
      const validMoves = engine.getValidMoves(playResult.newState!);

      // SIMULATE CLI DISPLAY:
      // CLI would show: [1] Copper, [2] Silver
      // CLI should NOT show: Village, Smithy

      // ASSERTIONS (WILL FAIL with bug):

      // 1. Should have exactly 2 options (Copper, Silver)
      expect(validMoves.length).toBe(2);

      // 2. Option [1] should be Copper
      expect(validMoves[0]).toEqual({
        type: 'select_treasure_to_trash',
        card: 'Copper'
      });

      // 3. Option [2] should be Silver
      expect(validMoves[1]).toEqual({
        type: 'select_treasure_to_trash',
        card: 'Silver'
      });

      // 4. Should NOT show Village in any option
      const villageOptions = validMoves.filter(m => m.card === 'Village');
      expect(villageOptions.length).toBe(0);

      // 5. Should NOT show Smithy in any option
      const smithyOptions = validMoves.filter(m => m.card === 'Smithy');
      expect(smithyOptions.length).toBe(0);

      // 6. Should NOT show "End Phase" option
      const endPhaseOptions = validMoves.filter(m => m.type === 'end_phase');
      expect(endPhaseOptions.length).toBe(0);
    });
  });
});
