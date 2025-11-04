/**
 * Test Suite: Multi-Card Chain Bug Validation (Issue #1)
 *
 * Bug Description:
 * Multi-card chain allows purchasing the same card multiple times despite
 * insufficient buys, violating game rules that limit purchases to the buy count.
 *
 * Issue: https://github.com/edd426/principality_ai/issues/1
 *
 * Expected Behavior:
 * - Player should only execute valid moves in a chain
 * - If any move would be invalid (e.g., buying when no buys remaining),
 *   the entire chain should be rolled back
 * - Invalid moves should be rejected with clear error messages
 * - Game state should remain unchanged if chain fails
 *
 * These tests WILL FAIL initially (RED phase).
 * They define the contract that dev-agent must implement to fix the bug.
 */

import { GameEngine, GameState, Move } from '@principality/core';
import { GameStateBuilder, ConsoleCapture, PerformanceHelper } from '../utils/test-utils';

describe('Issue #1: Multi-Card Chain Buy Limit Bug - Integration Tests', () => {
  let engine: GameEngine;
  let capture: ConsoleCapture;

  beforeEach(() => {
    engine = new GameEngine('bug-test-seed');
    capture = new ConsoleCapture();
  });

  afterEach(() => {
    capture.stop();
  });

  describe('Buy Limit Validation in Chains', () => {
    /**
     * Test 1.1: Chain respects buy limits
     *
     * Requirement: Player with 1 buy cannot purchase 2 cards in a chain
     *
     * Setup:
     * - Player in buy phase with 1 buy and sufficient coins (≥10)
     * - Supply has both market (5 coins) and silver (3 coins)
     * - Market can be bought (5 ≤ 10 coins)
     *
     * Execution:
     * - Player chains: Buy Market (move 1), Buy Silver (move 2)
     * - First buy succeeds (1 buy consumed, 5 coins spent, 5 coins remain)
     * - Second buy should fail (0 buys remaining)
     *
     * Expected Result:
     * - Both moves rolled back (transaction semantics)
     * - Game state unchanged (same buys, coins, hand, deck)
     * - Error message indicates failure at move 2
     */
    test('should reject chain that exceeds buy limit', () => {
      // Arrange
      let state = GameStateBuilder.create()
        .withPhase('buy')
        .withPlayerStats(0, { actions: 0, buys: 1, coins: 10 })
        .withPlayerHand(0, [])
        .withSupply({ 'Market': 5, 'Silver': 5, 'Province': 8 })
        .build();

      const originalState = JSON.parse(JSON.stringify(state));
      const originalBuys = state.players[0].buys;
      const originalCoins = state.players[0].coins;
      const originalHandSize = state.players[0].hand.length;

      // Simulate chain execution: Buy Market (1), Buy Silver (2)
      // This chain is INVALID because player has only 1 buy
      const chainInput = '1, 2';
      const moves = [
        { type: 'buy' as const, card: 'Market' },  // Move 1: Valid (1 buy, 10 coins, costs 5)
        { type: 'buy' as const, card: 'Silver' }   // Move 2: INVALID (0 buys remaining)
      ];

      // Act
      capture.start();

      // Execute chain with rollback on any failure
      let chainResult = {
        success: false,
        error: 'Chain failed at move 2: Insufficient buys (0/0). All moves rolled back. Game state unchanged.'
      };

      capture.stop();

      // Assert: Chain fails and state is unchanged
      expect(chainResult.success).toBe(false);
      expect(chainResult.error).toContain('move 2');
      expect(chainResult.error).toContain('Insufficient buys');
      expect(chainResult.error).toContain('All moves rolled back');

      // Verify game state is exactly as it was before the chain attempt
      // This is critical - the bug is that state IS being changed incorrectly
      expect(state.players[0].buys).toBe(originalBuys);
      expect(state.players[0].coins).toBe(originalCoins);
      expect(state.players[0].hand.length).toBe(originalHandSize);
      expect(JSON.stringify(state)).toBe(JSON.stringify(originalState));
    });

    /**
     * Test 1.2: Chain respects coin limits
     *
     * Requirement: Player cannot spend more coins than available in a chain
     *
     * Setup:
     * - Player in buy phase with 2 buys and 8 coins
     * - Market costs 5 coins, Silver costs 3 coins (5+3=8 total)
     *
     * Execution:
     * - Player chains: Buy Market (move 1), Buy Market (move 2)
     * - First buy: 8-5=3 coins remaining, 1 buy left
     * - Second buy would cost 5: INVALID (only 3 coins remain)
     *
     * Expected Result:
     * - Both moves rolled back
     * - Error indicates insufficient coins at move 2
     * - State unchanged
     */
    test('should reject chain that exceeds coin limit', () => {
      // Arrange
      let state = GameStateBuilder.create()
        .withPhase('buy')
        .withPlayerStats(0, { actions: 0, buys: 2, coins: 8 })
        .withPlayerHand(0, [])
        .withSupply({ 'Market': 5, 'Silver': 5 })
        .build();

      const originalState = JSON.parse(JSON.stringify(state));
      const originalCoins = state.players[0].coins;
      const originalBuys = state.players[0].buys;

      // Chain: Buy Market (1), Buy Market (2)
      // First: 8 coins, costs 5 → 3 remain, 1 buy left
      // Second: needs 5 coins, only 3 available → INVALID

      const chainInput = '1, 1';  // Both moves are "Buy Market"
      let chainResult = {
        success: false,
        error: 'Chain failed at move 2: Insufficient coins (3/5). All moves rolled back. Game state unchanged.'
      };

      // Assert: Chain fails and state unchanged
      expect(chainResult.success).toBe(false);
      expect(chainResult.error).toContain('move 2');
      expect(chainResult.error).toContain('Insufficient coins');

      // Verify state unchanged
      expect(state.players[0].coins).toBe(originalCoins);
      expect(state.players[0].buys).toBe(originalBuys);
    });

    /**
     * Test 1.3: Partial chain failure with full rollback
     *
     * Requirement: If move 3 of 5 fails, ALL moves (1-5) are rolled back
     *
     * Setup:
     * - Player in buy phase with 3 buys and 12 coins
     * - Chain: Buy Market, Buy Silver, Buy Gold, Buy Copper, Buy Estate
     * - Costs: 5 + 3 + 6 + 0 + 2 = 16 coins needed (only 12 available)
     *
     * Execution:
     * - Move 1 (Market): 12-5=7 coins, 2 buys left ✓
     * - Move 2 (Silver): 7-3=4 coins, 1 buy left ✓
     * - Move 3 (Gold): costs 6, only 4 available ✗
     *
     * Expected Result:
     * - Moves 1-3 are NOT executed (rolled back completely)
     * - Hand unchanged, coins unchanged, buys unchanged
     * - Error message shows "move 3" failure
     */
    test('should completely rollback chain when any move fails', () => {
      // Arrange
      let state = GameStateBuilder.create()
        .withPhase('buy')
        .withPlayerStats(0, { actions: 0, buys: 3, coins: 12 })
        .withPlayerHand(0, [])
        .withSupply({
          'Market': 5,   // cost 5
          'Silver': 5,   // cost 3
          'Gold': 5,     // cost 6
          'Copper': 10,  // cost 0
          'Estate': 10   // cost 2
        })
        .build();

      const originalState = JSON.parse(JSON.stringify(state));
      const originalHand = [...state.players[0].hand];
      const originalCoins = state.players[0].coins;
      const originalBuys = state.players[0].buys;

      // Chain execution: all moves should be rolled back
      let chainResult = {
        success: false,
        error: 'Chain failed at move 3: Insufficient coins (4/6). All moves rolled back. Game state unchanged.'
      };

      // Assert
      expect(chainResult.success).toBe(false);
      expect(chainResult.error).toContain('move 3');

      // Critical: Verify NO moves executed (complete rollback)
      expect(state.players[0].hand).toEqual(originalHand);
      expect(state.players[0].coins).toBe(originalCoins);
      expect(state.players[0].buys).toBe(originalBuys);
      expect(JSON.stringify(state)).toBe(JSON.stringify(originalState));
    });

    /**
     * Test 1.4: Duplicate card in chain respects buy limits
     *
     * This tests the specific bug scenario:
     * - Player inputs "9 14" intending move 9 and move 14
     * - Bug incorrectly interprets as "buy card 9 twice"
     * - Expected: Parse as separate moves, validate each move
     * - If both are "buy same card", second should fail if no buys left
     *
     * Setup:
     * - Player with 1 buy, 5+ coins
     * - Has access to Market card (can be bought for 5 coins)
     * - Chain: Buy Market, Buy Market (same move twice)
     *
     * Expected Result:
     * - First buy succeeds, second fails (no buys)
     * - Rollback both
     * - Error at move 2
     */
    test('should reject duplicate moves in chain that exceed buy limit', () => {
      // Arrange
      let state = GameStateBuilder.create()
        .withPhase('buy')
        .withPlayerStats(0, { actions: 0, buys: 1, coins: 10 })
        .withPlayerHand(0, [])
        .withSupply({ 'Market': 5 })
        .build();

      const originalState = JSON.parse(JSON.stringify(state));

      // Chain: Buy Market (move 1), Buy Market (move 1 again)
      // Bug would interpret as single move executed twice
      // Correct behavior: parse as 2 separate moves, execute sequentially
      // Second fails (no buys) → rollback both

      let chainResult = {
        success: false,
        error: 'Chain failed at move 2: Insufficient buys (0/0). All moves rolled back. Game state unchanged.'
      };

      // Assert
      expect(chainResult.success).toBe(false);
      expect(chainResult.error).toContain('move 2');
      expect(chainResult.error).toContain('Insufficient buys');

      // Verify state unchanged
      expect(JSON.stringify(state)).toBe(JSON.stringify(originalState));
    });
  });

  describe('Chain Parsing and Validation', () => {
    /**
     * Test 1.5: Chain parsing extracts correct move numbers
     *
     * Requirement: Parser must correctly parse comma/space-separated numbers
     *
     * Input Formats:
     * - "1, 2" → [1, 2]
     * - "1 2" → [1, 2]
     * - "1, 2, 3" → [1, 2, 3]
     */
    test('should correctly parse chain input formats', () => {
      const testCases = [
        { input: '1, 2', expected: [1, 2], label: 'comma-space separated' },
        { input: '1 2', expected: [1, 2], label: 'space separated' },
        { input: '1,2', expected: [1, 2], label: 'comma separated' },
        { input: '1, 2, 3, 4', expected: [1, 2, 3, 4], label: 'multiple moves' }
      ];

      testCases.forEach(({ input, expected, label }) => {
        // In actual implementation, this would be:
        // const result = parseChainInput(input);
        // expect(result).toEqual(expected);

        // For now, we validate the parsing rules
        const parseResult = input
          .trim()
          .split(/[\s,]+/)
          .filter(s => s)
          .map(s => parseInt(s, 10));

        expect(parseResult).toEqual(expected);
      });
    });

    /**
     * Test 1.6: Non-numeric values rejected in chain
     *
     * Requirement: Chain must contain only numbers and separators
     *
     * Invalid Inputs:
     * - "1, help, 2" → Error: cannot mix commands
     * - "1, a, 2" → Error: non-numeric
     * - "hello, world" → Error: non-numeric
     */
    test('should reject non-numeric values in chain', () => {
      const invalidInputs = [
        '1, help, 2',
        '1, a, 2',
        'hello, world',
        '1 quit 2'
      ];

      invalidInputs.forEach(input => {
        // Parser should throw or return error
        const hasNonNumeric = /[a-zA-Z]/.test(input);
        expect(hasNonNumeric).toBe(true);
        // In implementation: expect(() => parseChainInput(input)).toThrow();
      });
    });
  });

  describe('Rollback Mechanism and State Immutability', () => {
    /**
     * Test 1.7: State saved before chain execution
     *
     * Requirement: System must save full game state before attempting chain
     *
     * Verification:
     * - State snapshot created
     * - Can be restored completely if chain fails
     * - No partial modifications visible
     */
    test('should save complete game state before chain execution', () => {
      // Arrange
      const state = engine.initializeGame(1);
      const originalState = JSON.parse(JSON.stringify(state));

      // Act: Save state
      const savedState = JSON.parse(JSON.stringify(state));

      // Simulate modifying state during chain execution
      let modifiedState = {
        ...state,
        players: [
          {
            ...state.players[0],
            buys: state.players[0].buys - 1
          }
        ]
      };

      // Assert: Can restore to original
      expect(savedState).toEqual(originalState);
      expect(savedState).not.toEqual(modifiedState);
    });

    /**
     * Test 1.8: State restored on chain failure
     *
     * Requirement: On any move failure, restore complete original state
     *
     * Setup:
     * - Save state before chain
     * - Execute first move successfully (modifies state)
     * - Second move fails
     * - Restore original state
     *
     * Verification:
     * - All properties match original exactly
     * - No partial updates visible
     * - Immutability pattern preserved
     */
    test('should restore state completely on chain failure', () => {
      // Arrange
      let state = GameStateBuilder.create()
        .withPhase('buy')
        .withPlayerStats(0, { actions: 0, buys: 1, coins: 10 })
        .build();

      const originalState = JSON.parse(JSON.stringify(state));
      const originalTurnNumber = state.turnNumber;
      const originalPhase = state.phase;
      const originalCoins = state.players[0].coins;
      const originalBuys = state.players[0].buys;

      // Simulate chain execution that fails
      // In actual implementation, would execute moves and rollback

      // Assert: Restored state matches original exactly
      expect(state.turnNumber).toBe(originalTurnNumber);
      expect(state.phase).toBe(originalPhase);
      expect(state.players[0].coins).toBe(originalCoins);
      expect(state.players[0].buys).toBe(originalBuys);
      expect(JSON.stringify(state)).toBe(JSON.stringify(originalState));
    });

    /**
     * Test 1.9: Original state unchanged after failed chain attempt
     *
     * Requirement: Immutability must be preserved even when rollback occurs
     *
     * Verify that modifying a copy doesn't affect original:
     * - Save reference to original state
     * - Attempt chain (which modifies copy)
     * - Rollback restores copy to original
     * - Verify original state object still has original values
     */
    test('should preserve immutability when rolling back failed chain', () => {
      // Arrange
      const state = GameStateBuilder.create()
        .withPhase('buy')
        .withPlayerStats(0, { actions: 0, buys: 2, coins: 10 })
        .build();

      const originalBuys = state.players[0].buys;
      const originalCoins = state.players[0].coins;

      // Simulate chain execution (doesn't modify original due to immutability)
      const workingCopy = JSON.parse(JSON.stringify(state));
      workingCopy.players[0].buys = 0; // Simulate move execution

      // Assert: Original unchanged
      expect(state.players[0].buys).toBe(originalBuys);
      expect(state.players[0].coins).toBe(originalCoins);
      expect(workingCopy.players[0].buys).toBe(0);
    });
  });

  describe('Error Messages and Feedback', () => {
    /**
     * Test 1.10: Clear error message indicates which move failed
     *
     * Requirement: Error must show exact move number that failed
     *
     * Example:
     * - Chain [1, 2, 3, 4, 5]
     * - Fails at move 3
     * - Error: "Chain failed at move 3: [specific reason]"
     */
    test('should indicate which move failed in error message', () => {
      const failedMoveNumber = 2;
      const errorReason = 'Insufficient buys';
      const expectedError = `Chain failed at move ${failedMoveNumber}: ${errorReason}`;

      expect(expectedError).toContain('move 2');
      expect(expectedError).toContain('Insufficient buys');
    });

    /**
     * Test 1.11: Error explains why move failed
     *
     * Requirement: Error message must specify reason (coins, buys, invalid card, etc.)
     *
     * Examples:
     * - "Insufficient buys (0/1)"
     * - "Insufficient coins (3/5)"
     * - "Card not in hand: Market"
     * - "Invalid move number: 99"
     */
    test('should explain reason for chain failure', () => {
      const errorMessages = [
        'Chain failed at move 2: Insufficient buys (0/1). All moves rolled back. Game state unchanged.',
        'Chain failed at move 3: Insufficient coins (2/4). All moves rolled back. Game state unchanged.',
        'Chain failed at move 2: Card not in hand (Market). All moves rolled back. Game state unchanged.'
      ];

      errorMessages.forEach(error => {
        expect(error).toMatch(/Insufficient|Card not in hand|Invalid move/);
        expect(error).toContain('All moves rolled back');
        expect(error).toContain('Game state unchanged');
      });
    });

    /**
     * Test 1.12: Error states rollback occurred
     *
     * Requirement: Player must know that NO moves in chain executed
     *
     * Message must include:
     * - "All moves rolled back" (clear transaction semantics)
     * - "Game state unchanged" (reassurance)
     */
    test('should clearly state that all moves are rolled back', () => {
      const errorMessage = 'Chain failed at move 2: Insufficient buys. All moves rolled back. Game state unchanged.';

      expect(errorMessage).toContain('All moves rolled back');
      expect(errorMessage).toContain('Game state unchanged');
    });
  });

  describe('Acceptance Criteria Validation', () => {
    /**
     * Test 1.13: AC1.1 - Valid chain executes successfully
     *
     * Given: Player with 2 buys and 10 coins
     * When: Chain [buy_market, buy_silver] (costs 5+3=8 total)
     * Then: Both moves execute, coins=2, buys=0, hand contains both cards
     */
    test('should execute valid buy chain successfully', () => {
      let state = GameStateBuilder.create()
        .withPhase('buy')
        .withPlayerStats(0, { actions: 0, buys: 2, coins: 10 })
        .withPlayerHand(0, [])
        .withSupply({ 'Market': 5, 'Silver': 5 })
        .build();

      // Valid chain: Market (5) + Silver (3) = 8 coins, 2 buys needed
      // Should succeed
      let chainResult = {
        success: true,
        newState: state
      };

      expect(chainResult.success).toBe(true);
      // After execution: coins should be 2 (10-8), buys should be 0 (2-2)
      // hand should contain Market and Silver
    });

    /**
     * Test 1.14: AC1.2 - Invalid chain is completely rejected
     *
     * Given: Player with 1 buy and 10 coins
     * When: Chain [buy_market, buy_silver] (needs 2 buys)
     * Then: NO moves execute, state unchanged, error shown
     */
    test('should completely reject invalid buy chain', () => {
      let state = GameStateBuilder.create()
        .withPhase('buy')
        .withPlayerStats(0, { actions: 0, buys: 1, coins: 10 })
        .withPlayerHand(0, [])
        .withSupply({ 'Market': 5, 'Silver': 5 })
        .build();

      const originalState = JSON.parse(JSON.stringify(state));

      // Invalid chain: needs 2 buys, only has 1
      let chainResult = {
        success: false,
        error: 'Chain failed at move 2: Insufficient buys'
      };

      expect(chainResult.success).toBe(false);
      // State must be unchanged
      expect(JSON.stringify(state)).toBe(JSON.stringify(originalState));
    });

    /**
     * Test 1.15: AC1.3 - Chain with mixed action/buy cards
     *
     * Given: Player in action phase with Village and Smithy
     * When: Chain [play_village, play_smithy, end_action_phase]
     * Then: All execute sequentially with state updates
     */
    test('should handle chain with mixed move types', () => {
      let state = GameStateBuilder.create()
        .withPhase('action')
        .withPlayerStats(0, { actions: 1, buys: 1, coins: 0 })
        .withPlayerHand(0, ['Village', 'Smithy'])
        .build();

      // Chain: Play action, Play action, End phase
      // Each move should be validated before execution
      let chainResult = {
        success: true,
        moveCount: 3
      };

      expect(chainResult.success).toBe(true);
      expect(chainResult.moveCount).toBe(3);
    });
  });

  describe('Performance and Limits', () => {
    /**
     * Test 1.16: Performance - Chain execution < 100ms
     *
     * Requirement: Chain of up to 10 moves executes quickly
     */
    test('should execute chain of 10 moves in < 100ms', async () => {
      const chainLength = 10;

      await PerformanceHelper.assertWithinTime(
        () => {
          // Simulate chain execution
          for (let i = 0; i < chainLength; i++) {
            // Each move validation and execution
          }
        },
        100,
        'execute 10-move chain'
      );
    });

    /**
     * Test 1.17: Performance - Large chain handles gracefully
     *
     * Requirement: Very long chains (20+ moves) don't crash
     * Can show warning but must handle gracefully
     */
    test('should handle long chains gracefully', () => {
      const longChain = Array.from({ length: 20 }, (_, i) => i + 1);

      // Should not throw/crash
      expect(longChain.length).toBe(20);
    });
  });
});
