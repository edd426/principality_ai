import { GameEngine, GameState } from '@principality/core';

/**
 * Mine Card Regression Tests - Bug Fix Validation ✓ FIXED
 *
 * @phase 4.2
 * @status GREEN (all tests passing - bug is fixed)
 * @bug: select_treasure_to_trash incorrectly routed to handleThiefTrashTreasure() ✓ FIXED
 * @location: packages/core/src/game.ts:368-373 (fixed routing)
 *
 * ROOT CAUSE (now resolved):
 * - Previously: Line 367 called handleThiefTrashTreasure() for select_treasure_to_trash
 * - handleThiefTrashTreasure() is Thief-specific (removes from opponent's revealed cards)
 * - Should trash from current player's HAND (not opponent's revealed cards)
 *
 * FIX APPLIED:
 * - game.ts:368-373 now routes select_treasure_to_trash → handleTrashCards()
 * - handleTrashCards() correctly removes treasure from player's hand
 * - Pending effect properly advances to 'gain_treasure' step
 *
 * CORRECT BEHAVIOR (Mine card workflow):
 * 1. Play Mine → pendingEffect: { effect: 'select_treasure_to_trash' }
 * 2. Select treasure → TRASH from hand via handleTrashCards(), pendingEffect: { effect: 'gain_treasure' }
 * 3. Gain treasure → Add to hand, clear pendingEffect
 *
 * These tests now validate the fix is working correctly.
 */

describe('REGRESSION: Mine Card Bug - Treasure Selection', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('mine-regression-test');
  });

  describe('BUG-MINE-1: Treasure gets played instead of trashed', () => {
    /**
     * @req: Mine Step 1 - Selecting treasure should TRASH it, not PLAY it
     * @edge: Core bug - treasure incorrectly routed to Thief handler
     * @why: handleThiefTrashTreasure plays treasure from opponent, not player's hand
     * @assert: Hand size decreases by 1 (treasure removed, not played)
     * @assert: Coins remain 0 (treasure trashed, NOT played)
     * @level: Regression
     */
    test('should TRASH Copper (not play it) when selecting for Mine', () => {
      // @req: Trash from hand, don't play treasure
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Copper', 'Silver', 'Estate'],
          actions: 1,
          coins: 0
        }]
      };

      // Step 1: Play Mine
      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      expect(playResult.success).toBe(true);
      expect(playResult.newState!.pendingEffect).toBeTruthy();
      expect(typeof playResult.newState!.pendingEffect).toBe('object');
      expect(playResult.newState!.pendingEffect?.card).toBe('Mine');

      // Initial state before selecting treasure to trash
      const handBeforeTrash = playResult.newState!.players[0].hand;
      const coinsBeforeTrash = playResult.newState!.players[0].coins;

      expect(handBeforeTrash).toContain('Copper');
      expect(handBeforeTrash.length).toBe(3); // Copper, Silver, Estate (Mine was played)
      expect(coinsBeforeTrash).toBe(0);

      // Step 2: Select Copper to trash (BUG OCCURS HERE)
      // @assert: This should TRASH Copper from hand, NOT play it
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'select_treasure_to_trash',
        card: 'Copper'
      });

      // CRITICAL ASSERTIONS (will FAIL with bug):
      // Bug causes move to fail with "opponent" error
      expect(trashResult.success).toBe(true);
      expect(trashResult.newState).toBeTruthy();
      expect(typeof trashResult.newState).toBe('object');

      // 1. Copper should be REMOVED from hand (trashed, not played)
      expect(trashResult.newState!.players[0].hand).not.toContain('Copper');
      expect(trashResult.newState!.players[0].hand.length).toBe(2); // Silver, Estate

      // 2. Coins should NOT increase (treasure trashed, not played)
      expect(trashResult.newState!.players[0].coins).toBe(0); // NOT 1!

      // 3. Copper should be in TRASH pile
      expect(trashResult.newState!.trash).toContain('Copper');

      // 4. pendingEffect should advance to step 2 (gain treasure)
      expect(trashResult.newState!.pendingEffect).toBeTruthy();
      expect(typeof trashResult.newState!.pendingEffect).toBe('object');
      expect(trashResult.newState!.pendingEffect?.effect).toBe('gain_treasure');
    });

    /**
     * @req: Mine Step 1 - Multiple Coppers should only trash ONE
     * @edge: Multiple identical treasures in hand
     * @why: Ensure exact count trashing (not all copies)
     * @assert: Exactly 1 Copper trashed, others remain in hand
     * @level: Regression
     */
    test('should trash only ONE Copper when multiple exist', () => {
      // @req: Trash exactly 1 treasure, not all copies
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Copper', 'Copper', 'Copper', 'Estate'],
          actions: 1,
          coins: 0
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      expect(playResult.success).toBe(true);

      // Select first Copper to trash
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'select_treasure_to_trash',
        card: 'Copper'
      });

      // ASSERTIONS (will FAIL with bug):
      expect(trashResult.success).toBe(true);

      // 1. Exactly 1 Copper trashed
      expect(trashResult.newState!.trash.filter(c => c === 'Copper').length).toBe(1);

      // 2. Remaining 2 Coppers still in hand
      expect(trashResult.newState!.players[0].hand.filter(c => c === 'Copper').length).toBe(2);

      // 3. Hand size is 3 (2 Copper + 1 Estate, Mine played, 1 Copper trashed)
      expect(trashResult.newState!.players[0].hand.length).toBe(3);

      // 4. Coins still 0 (NO treasure was played)
      expect(trashResult.newState!.players[0].coins).toBe(0);
    });

    /**
     * @req: Mine Step 1 - Trashing Silver ($3 treasure)
     * @edge: Higher value treasure (not Copper)
     * @why: Bug may manifest differently with different treasure values
     * @assert: Silver trashed (not played), coins remain 0
     * @level: Regression
     */
    test('should TRASH Silver (not play it) when selecting for Mine', () => {
      // @req: Any treasure can be trashed, not just Copper
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Silver', 'Copper'],
          actions: 1,
          coins: 0
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      // Select Silver to trash
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'select_treasure_to_trash',
        card: 'Silver'
      });

      // ASSERTIONS (will FAIL with bug):
      expect(trashResult.success).toBe(true);

      // 1. Silver removed from hand
      expect(trashResult.newState!.players[0].hand).not.toContain('Silver');
      expect(trashResult.newState!.players[0].hand).toEqual(['Copper']);

      // 2. Coins remain 0 (Silver was NOT played, its $3 value ignored)
      expect(trashResult.newState!.players[0].coins).toBe(0); // NOT 3!

      // 3. Silver in trash pile
      expect(trashResult.newState!.trash).toContain('Silver');

      // 4. pendingEffect advances to gain treasure (max $6 = $3 + $3)
      expect(trashResult.newState!.pendingEffect?.effect).toBe('gain_treasure');
      expect(trashResult.newState!.pendingEffect?.maxGainCost).toBe(6); // 3 + 3
    });

    /**
     * @req: Mine Step 1 - Trashing Gold ($6 treasure)
     * @edge: Maximum cost treasure
     * @why: Highest value treasure - bug impact should be most visible
     * @assert: Gold trashed, coins remain 0 (NOT +6)
     * @level: Regression
     */
    test('should TRASH Gold (not play it) when selecting for Mine', () => {
      // @req: Even expensive treasures are trashed, not played
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Gold', 'Copper'],
          actions: 1,
          coins: 0
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      // Select Gold to trash
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'select_treasure_to_trash',
        card: 'Gold'
      });

      // ASSERTIONS (will FAIL with bug):
      expect(trashResult.success).toBe(true);

      // 1. Gold removed from hand
      expect(trashResult.newState!.players[0].hand).not.toContain('Gold');
      expect(trashResult.newState!.players[0].hand).toEqual(['Copper']);

      // 2. Coins remain 0 (Gold was NOT played - would have given +6)
      expect(trashResult.newState!.players[0].coins).toBe(0); // NOT 6!

      // 3. Gold in trash pile
      expect(trashResult.newState!.trash).toContain('Gold');

      // 4. pendingEffect maxGainCost = $9 (Gold cost $6 + $3)
      expect(trashResult.newState!.pendingEffect?.maxGainCost).toBe(9); // 6 + 3
    });
  });

  describe('BUG-MINE-2: Hand size validation', () => {
    /**
     * @req: Hand size must decrease by exactly 1 when trashing treasure
     * @edge: Core mechanic - trashing removes from hand
     * @why: If treasure is played instead of trashed, hand size behavior differs
     * @assert: hand.length decreases by 1
     * @level: Regression
     */
    test('should decrease hand size by exactly 1 after trashing', () => {
      // @req: Trashing removes card from hand permanently
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Copper', 'Silver', 'Gold', 'Estate', 'Estate'],
          actions: 1
        }]
      };

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      const handSizeAfterPlay = playResult.newState!.players[0].hand.length;
      expect(handSizeAfterPlay).toBe(5); // Mine moved to inPlay

      // Select treasure to trash
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'select_treasure_to_trash',
        card: 'Silver'
      });

      // ASSERTION (will FAIL with bug):
      expect(trashResult.success).toBe(true);

      // Hand size should be 4 (5 - 1 trashed Silver)
      expect(trashResult.newState!.players[0].hand.length).toBe(4);

      // Verify Silver is gone
      expect(trashResult.newState!.players[0].hand).toEqual([
        'Copper', 'Gold', 'Estate', 'Estate'
      ]);
    });
  });

  describe('BUG-MINE-3: Pending effect workflow', () => {
    /**
     * @req: Mine workflow has 2 steps - trash treasure → gain treasure
     * @edge: Multi-step pending effect
     * @why: Incorrect handler might not advance pending effect correctly
     * @assert: pendingEffect.effect changes from initial to 'gain_treasure'
     * @level: Regression
     */
    test('should advance pendingEffect from step 1 to step 2', () => {
      // @req: Step 1 (trash) → Step 2 (gain)
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Copper', 'Silver'],
          actions: 1
        }]
      };

      // Step 1: Play Mine
      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      const initialPendingEffect = playResult.newState!.pendingEffect;
      expect(initialPendingEffect?.card).toBe('Mine');

      // Step 2: Select treasure to trash
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'select_treasure_to_trash',
        card: 'Copper'
      });

      // ASSERTIONS (will FAIL with bug):
      expect(trashResult.success).toBe(true);

      const afterTrashPendingEffect = trashResult.newState!.pendingEffect;

      // 1. pendingEffect still exists (not cleared yet)
      expect(afterTrashPendingEffect).toBeTruthy();
      expect(typeof afterTrashPendingEffect).toBe('object');

      // 2. pendingEffect.effect changed to 'gain_treasure'
      expect(afterTrashPendingEffect?.effect).toBe('gain_treasure');

      // 3. pendingEffect includes maxGainCost ($3 = Copper $0 + $3)
      expect(afterTrashPendingEffect?.maxGainCost).toBe(3);

      // 4. pendingEffect includes trashedCard
      expect(afterTrashPendingEffect?.trashedCard).toBe('Copper');
    });

    /**
     * @req: Mine Step 2 - Gain treasure to HAND (not discard)
     * @edge: Destination validation
     * @why: Mine unique feature - gained card goes to hand
     * @assert: Gained treasure appears in hand, NOT discard pile
     * @level: Regression
     */
    test('should gain treasure to HAND after trashing', () => {
      // @req: Gained treasure goes to hand (Mine's unique mechanic)
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

      // Step 1: Play Mine
      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      // Step 2: Trash Copper
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'select_treasure_to_trash',
        card: 'Copper'
      });

      // ASSERTIONS (will FAIL with bug):
      expect(trashResult.success).toBe(true);

      // Step 3: Gain Silver to hand
      const gainResult = engine.executeMove(trashResult.newState!, {
        type: 'gain_card',
        card: 'Silver',
        destination: 'hand'
      });

      // ASSERTIONS (will FAIL if step 2 fails):
      expect(gainResult.success).toBe(true);

      // 1. Silver in hand
      expect(gainResult.newState!.players[0].hand).toContain('Silver');

      // 2. Silver NOT in discard pile
      expect(gainResult.newState!.players[0].discardPile).not.toContain('Silver');

      // 3. Copper in trash
      expect(gainResult.newState!.trash).toContain('Copper');

      // 4. pendingEffect cleared
      expect(gainResult.newState!.pendingEffect).toBeUndefined();
    });
  });

  describe('BUG-MINE-4: Full workflow validation', () => {
    /**
     * @req: Complete Mine workflow - Copper → Silver
     * @edge: End-to-end workflow
     * @why: Validates entire card behavior from start to finish
     * @assert: Copper trashed, Silver in hand, workflow completes
     * @level: Regression
     */
    test('should complete full Mine workflow: Copper → Silver', () => {
      // @req: Full workflow test
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Copper', 'Estate'],
          actions: 1,
          coins: 0
        }]
      };

      // Step 1: Play Mine
      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });
      expect(playResult.success).toBe(true);

      // Step 2: Trash Copper (BUG OCCURS HERE)
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'select_treasure_to_trash',
        card: 'Copper'
      });

      // ASSERTION (will FAIL with bug):
      expect(trashResult.success).toBe(true);

      // Step 3: Gain Silver to hand
      const gainResult = engine.executeMove(trashResult.newState!, {
        type: 'gain_card',
        card: 'Silver',
        destination: 'hand'
      });
      expect(gainResult.success).toBe(true);

      const finalState = gainResult.newState!;

      // FINAL ASSERTIONS:
      // 1. Hand contains Silver and Estate (not Copper)
      expect(finalState.players[0].hand).toContain('Silver');
      expect(finalState.players[0].hand).toContain('Estate');
      expect(finalState.players[0].hand).not.toContain('Copper');
      expect(finalState.players[0].hand.length).toBe(2);

      // 2. Copper in trash
      expect(finalState.trash).toEqual(['Copper']);

      // 3. Coins remain 0 (no treasures played)
      expect(finalState.players[0].coins).toBe(0);

      // 4. No pending effect
      expect(finalState.pendingEffect).toBeUndefined();
    });

    /**
     * @req: Complete Mine workflow - Silver → Gold
     * @edge: Higher value upgrade
     * @why: Test with non-Copper treasures
     * @assert: Silver trashed, Gold in hand, max cost enforced
     * @level: Regression
     */
    test('should complete full Mine workflow: Silver → Gold', () => {
      // @req: Test higher value treasure upgrade
      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [{
          ...state.players[0],
          hand: ['Mine', 'Silver', 'Copper'],
          actions: 1,
          coins: 0
        }]
      };

      // Play Mine
      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      // Trash Silver ($3)
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'select_treasure_to_trash',
        card: 'Silver'
      });

      // ASSERTION (will FAIL with bug):
      expect(trashResult.success).toBe(true);

      // Gain Gold ($6 = $3 + $3, within limit)
      const gainResult = engine.executeMove(trashResult.newState!, {
        type: 'gain_card',
        card: 'Gold',
        destination: 'hand'
      });

      const finalState = gainResult.newState!;

      // ASSERTIONS:
      expect(finalState.players[0].hand).toContain('Gold');
      expect(finalState.players[0].hand).toContain('Copper');
      expect(finalState.players[0].hand).not.toContain('Silver');
      expect(finalState.trash).toContain('Silver');
      expect(finalState.players[0].coins).toBe(0); // No treasure played
    });

    /**
     * @req: Mine max cost enforcement
     * @edge: Cost limit boundary
     * @why: Ensure +$3 cost limit is enforced
     * @assert: Cannot gain treasure costing > (trashed + $3)
     * @level: Regression
     */
    test('should enforce max cost limit when gaining treasure', () => {
      // @req: Gained treasure must cost ≤ (trashed treasure cost + $3)
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

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      // Trash Copper ($0) → max gain cost = $3
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'select_treasure_to_trash',
        card: 'Copper'
      });

      // ASSERTION (will FAIL with bug):
      expect(trashResult.success).toBe(true);
      expect(trashResult.newState!.pendingEffect?.maxGainCost).toBe(3);

      // Attempt to gain Gold ($6) - should fail
      const invalidGainResult = engine.executeMove(trashResult.newState!, {
        type: 'gain_card',
        card: 'Gold',
        destination: 'hand'
      });

      expect(invalidGainResult.success).toBe(false);
      expect(invalidGainResult.error).toContain('Card costs more than allowed');

      // Gain Silver ($3) - should succeed
      const validGainResult = engine.executeMove(trashResult.newState!, {
        type: 'gain_card',
        card: 'Silver',
        destination: 'hand'
      });

      expect(validGainResult.success).toBe(true);
      expect(validGainResult.newState!.players[0].hand).toContain('Silver');
    });
  });

  describe('BUG-MINE-5: Error message validation', () => {
    /**
     * @req: select_treasure_to_trash routes to handleTrashCards (Mine handler) ✓ FIXED
     * @edge: Bug fix validation
     * @why: Previously routed to handleThiefTrashTreasure (Thief handler), causing "opponent" errors
     * @assert: Move succeeds, Copper trashed from hand, pending effect advances
     * @level: Regression
     */
    test('POST-FIX: select_treasure_to_trash routes to correct handler (Mine, not Thief)', () => {
      // @req: This test validates the bug fix
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

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      expect(playResult.success).toBe(true);

      // Select Copper to trash (NOW FIXED: routes to handleTrashCards)
      const trashResult = engine.executeMove(playResult.newState!, {
        type: 'select_treasure_to_trash',
        card: 'Copper'
      });

      // POST-FIX ASSERTIONS: Move should succeed
      // (Original bug assertion commented for historical documentation:)
      // expect(trashResult.success).toBe(false);
      // expect(trashResult.error?.toLowerCase()).toContain('opponent');

      // 1. Move succeeds (no longer fails with "opponent" error)
      expect(trashResult.success).toBe(true);

      // 2. Copper removed from hand and trashed
      expect(trashResult.newState!.players[0].hand).not.toContain('Copper');
      expect(trashResult.newState!.trash).toContain('Copper');

      // 3. Pending effect advances to step 2 (gain_treasure)
      expect(trashResult.newState!.pendingEffect).toBeTruthy();
      expect(typeof trashResult.newState!.pendingEffect).toBe('object');
      expect(trashResult.newState!.pendingEffect?.effect).toBe('gain_treasure');
      expect(trashResult.newState!.pendingEffect?.maxGainCost).toBe(3); // $0 + $3
    });

    /**
     * @req: After fix, error for non-existent card should be about hand/treasure ✓ FIXED
     * @edge: Post-fix validation
     * @why: Ensure proper error messaging after bug is fixed
     * @assert: Error should mention hand or treasure (not opponent)
     * @level: Regression
     */
    test('POST-FIX: should provide clear error if selecting non-existent treasure', () => {
      // @req: Error messages should be Mine-specific (not Thief-specific)
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

      const playResult = engine.executeMove(testState, {
        type: 'play_action',
        card: 'Mine'
      });

      // Attempt to select non-existent treasure
      const errorResult = engine.executeMove(playResult.newState!, {
        type: 'select_treasure_to_trash',
        card: 'Silver' // Not in hand
      });

      // ASSERTION: Error should be about hand/treasure, NOT about "opponent"
      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toBeTruthy();
      expect(typeof errorResult.error).toBe('string');

      // Error should NOT mention opponent or revealed cards
      expect(errorResult.error?.toLowerCase()).not.toContain('opponent');
      expect(errorResult.error?.toLowerCase()).not.toContain('revealed');
    });
  });
});
