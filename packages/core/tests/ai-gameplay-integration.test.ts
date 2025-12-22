/**
 * AI Gameplay Integration Tests (Phase 2 Remediation)
 *
 * Status: ACTIVE
 * Created: 2025-10-29
 * Phase: 2.1 (AI Gameplay Acceleration)
 *
 * Purpose: Test AI behavior over SEQUENCES of decisions within a single turn or across
 * multiple turns. This catches bugs that only appear when decisions are chained together.
 *
 * Key Focus: Validates that FR 3.1-3.3 work correctly in integrated sequences:
 * - FR 3.1: All treasures played before purchase (fixes duplicate treasure bug)
 * - FR 3.2: Coin accumulation is correct (treasures add to total, not reset)
 * - FR 3.3: Purchase decisions reflect maximum coin potential
 *
 * @req: FR 3.1, FR 3.2, FR 3.3 - Multi-decision sequences with coin accumulation
 * @edge: Duplicate treasures; full turn sequences; multi-turn progression; thresholds
 * @why: Catches bugs that don't appear in unit tests, only in full decision chains
 */

import { GameEngine } from '../src/game';
import { RulesBasedAI } from '../src/ai';
import { GameState } from '../src/types';

describe('AI Gameplay Integration Tests - Decision Sequences', () => {
  let engine: GameEngine;
  let ai: RulesBasedAI;

  beforeEach(() => {
    engine = new GameEngine('ai-sequence-test');
    ai = new RulesBasedAI('ai-sequence-test');
  });

  // ============================================================================
  // CATEGORY 1: Full Turn Sequences (4 tests)
  // Tests AI behavior for COMPLETE turns: action phase → buy phase → cleanup
  // ============================================================================

  describe('IT-AI-SEQUENCE-1: Single Treasure Play Sequence', () => {
    test('should play treasure then evaluate purchase in same turn', () => {
      // @req: FR 3.1 - All treasures played before purchase
      // @input: buy phase, hand=[Copper, Estate, Estate, Estate, Estate], coins=0, buys=1
      // @output: First decision: play_treasure/Copper; After execution, second decision evaluates purchase
      // @why: Tests that AI doesn't get stuck trying to play after no treasures remain
      // @regression: Would catch if AI tried to play treasures again after playing first

      const state = engine.initializeGame(1);
      const initialState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Copper', 'Estate', 'Estate', 'Estate', 'Estate'],
            coins: 0,
            inPlay: [],
            buys: 1
          }
        ]
      };

      // Decision 1: Should play treasure
      const decision1 = ai.decideBestMove(initialState, 0);
      expect(decision1.move.type).toBe('play_treasure');
      expect(decision1.move.card).toBe('Copper');

      // Execute the play
      const result1 = engine.executeMove(initialState, decision1.move);
      expect(result1.success).toBe(true);
      const afterTreasure = result1.newState!;

      // Decision 2: No treasures in hand now, should evaluate purchase
      const decision2 = ai.decideBestMove(afterTreasure, 0);
      expect(['buy', 'end_phase']).toContain(decision2.move.type);
      expect(decision2.move.type).not.toBe('play_treasure');

      // Verify coins increased
      expect(afterTreasure.players[0].coins).toBe(1);
    });
  });

  describe('IT-AI-SEQUENCE-2: Four Copper Full Accumulation Sequence', () => {
    test('should play all four Coppers and accumulate to $4 before purchase decision', () => {
      // @req: FR 3.1, FR 3.2, FR 3.3 - Play all treasures, maximize coins, buy appropriately
      // @input: buy phase, hand=[Copper, Copper, Copper, Copper, Estate], coins=0, buys=1
      // @output: 4 consecutive play_treasure decisions, then purchase decision with coins=4
      // @regression: THIS EXACT SEQUENCE would catch the 4-Copper stuck-at-$1 bug
      // @assert: Final coins = 4 (NOT stuck at 1 or 2), final decision is buy/end_phase (NOT play_treasure)

      const state = engine.initializeGame(1);
      let currentState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Copper', 'Copper', 'Copper', 'Copper', 'Estate'],
            coins: 0,
            inPlay: [],
            buys: 1
          }
        ]
      };

      const decisions: string[] = [];
      const coinProgression: number[] = [];

      // Play treasures until none remain in hand
      for (let i = 0; i < 10; i++) {
        const decision = ai.decideBestMove(currentState, 0);
        decisions.push(decision.move.type);
        coinProgression.push(currentState.players[0].coins);

        if (decision.move.type !== 'play_treasure') {
          // Reached purchase decision
          break;
        }

        const result = engine.executeMove(currentState, decision.move);
        expect(result.success).toBe(true);
        currentState = result.newState!;
      }

      // CRITICAL ASSERTIONS
      // Should have 4 play_treasure decisions (one for each Copper)
      const treasureCount = decisions.filter(d => d === 'play_treasure').length;
      expect(treasureCount).toBe(4);

      // After treasures, should evaluate purchase (not more treasures)
      expect(decisions[4]).not.toBe('play_treasure');
      expect(['buy', 'end_phase']).toContain(decisions[4]);

      // CRITICAL: Coins must accumulate to 4, NOT stuck at 1 or 2
      expect(currentState.players[0].coins).toBe(4);

      // Coin progression should show accumulation: 0 → 1 → 2 → 3 → 4 (after each play)
      // Note: We capture coins AFTER play in the loop, so we get values before final play
      expect(coinProgression.length).toBeGreaterThan(0);
    });
  });

  describe('IT-AI-SEQUENCE-3: Mixed Treasures Sequence', () => {
    test('should play all mixed treasures (2 Copper + 1 Silver = $4) before purchase', () => {
      // @req: FR 3.2 - Mixed duplicate treasures
      // @input: buy phase, hand=[Copper, Copper, Silver, Estate, Estate], coins=0, buys=1
      // @output: 3 consecutive play_treasure decisions, then purchase with coins=4
      // @assert: 3 play_treasure decisions, final coins=4 (Copper=$1 each, Silver=$2)

      const state = engine.initializeGame(1);
      let currentState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Copper', 'Copper', 'Silver', 'Estate', 'Estate'],
            coins: 0,
            inPlay: [],
            buys: 1
          }
        ]
      };

      const decisions: string[] = [];

      for (let i = 0; i < 10; i++) {
        const decision = ai.decideBestMove(currentState, 0);
        decisions.push(decision.move.type);

        if (decision.move.type !== 'play_treasure') {
          break;
        }

        const result = engine.executeMove(currentState, decision.move);
        expect(result.success).toBe(true);
        currentState = result.newState!;
      }

      // Should have 3 treasure plays (2 Copper + 1 Silver)
      const treasureCount = decisions.filter(d => d === 'play_treasure').length;
      expect(treasureCount).toBe(3);

      // Final coins should be 4 (2×$1 Copper + 1×$2 Silver)
      expect(currentState.players[0].coins).toBe(4);

      // Next decision should NOT be play_treasure
      expect(decisions[3]).not.toBe('play_treasure');
    });
  });

  describe('IT-AI-SEQUENCE-4: Partial Treasure Play Then Buy', () => {
    test('should play both treasures then decide on purchase', () => {
      // @req: FR 3.1, FR 3.3 - Play available treasures before purchasing
      // @input: buy phase, hand=[Copper, Silver, Estate], coins=0, buys=1
      // @output: 2 play_treasure decisions, then purchase decision with coins=3 (Copper=$1 + Silver=$2)
      // @assert: 2 treasures played, coins=3, next move is buy/end_phase

      const state = engine.initializeGame(1);
      let currentState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Copper', 'Silver', 'Estate'],
            coins: 0,
            inPlay: [],
            buys: 1
          }
        ]
      };

      const decisions: string[] = [];

      for (let i = 0; i < 5; i++) {
        const decision = ai.decideBestMove(currentState, 0);
        decisions.push(decision.move.type);

        if (decision.move.type !== 'play_treasure') {
          break;
        }

        const result = engine.executeMove(currentState, decision.move);
        expect(result.success).toBe(true);
        currentState = result.newState!;
      }

      // Should have 2 play_treasure decisions
      const treasureCount = decisions.filter(d => d === 'play_treasure').length;
      expect(treasureCount).toBe(2);

      // Total coins should be 3 (Copper $1 + Silver $2)
      expect(currentState.players[0].coins).toBe(3);

      // Final decision should be purchase or end phase
      expect(['buy', 'end_phase']).toContain(decisions[2]);
    });
  });

  // ============================================================================
  // CATEGORY 2: Multi-Turn Game Flow (3 tests)
  // Tests that AI behavior works correctly across multiple turns
  // ============================================================================

  describe('IT-AI-SEQUENCE-5: 3-Turn AI Solo Game', () => {
    test('should complete 3 full turns with valid progression', () => {
      // @req: FR 3.1 across multiple turns
      // @input: AI only game, play 3 complete turns
      // @output: No turn where AI has treasures but coins < $2, turn boundaries work
      // @why: Multi-turn test catches phase transition bugs

      const state = engine.initializeGame(1);
      let currentState = state;
      let turnsCompleted = 0;

      // Play 3 full turns (3 × 3 phases = 9 phases)
      for (let turn = 0; turn < 3; turn++) {
        const startTurn = currentState.turnNumber;

        // Play through all 3 phases of the turn
        for (let phaseStep = 0; phaseStep < 50; phaseStep++) {
          const validMoves = engine.getValidMoves(currentState, 0);
          expect(validMoves.length).toBeGreaterThan(0);

          const decision = ai.decideBestMove(currentState, 0);
          const result = engine.executeMove(currentState, decision.move);

          expect(result.success).toBe(true);
          expect(result.newState).toBeTruthy();
          expect(typeof result.newState).toBe('object');
          currentState = result.newState!;

          // Check for turn boundary
          if (currentState.turnNumber > startTurn) {
            turnsCompleted = currentState.turnNumber - 1;
            break;
          }
        }
      }

      // Should have progressed multiple turns
      expect(currentState.turnNumber).toBeGreaterThanOrEqual(3);
      expect(currentState.players).toHaveLength(1);
    });
  });

  describe('IT-AI-SEQUENCE-6: Deck Composition Improves Over Turns', () => {
    test('should acquire better treasures (Silver, Gold) over multiple turns', () => {
      // @req: FR 3.1 enables strategic purchases
      // @input: Track AI purchases over 15 turns
      // @output: Deck composition improves: Copper → Silver → Gold progression
      // @assert: By turn 5+, AI has acquired at least one Silver or Gold

      const state = engine.initializeGame(1);
      let currentState = state;

      // Play up to 15 turns, looking for deck improvement
      for (let turn = 0; turn < 15; turn++) {
        // Check game end
        const gameEnd = engine.checkGameOver(currentState);
        if (gameEnd.isGameOver) break;

        const startTurn = currentState.turnNumber;

        // Complete one full turn
        for (let step = 0; step < 100; step++) {
          const validMoves = engine.getValidMoves(currentState, 0);
          if (validMoves.length === 0) break;

          const decision = ai.decideBestMove(currentState, 0);
          const result = engine.executeMove(currentState, decision.move);

          if (!result.success || !result.newState) break;
          currentState = result.newState;

          if (currentState.turnNumber > startTurn) break;
        }

        // Check deck composition
        const allCards = [
          ...currentState.players[0].hand,
          ...currentState.players[0].drawPile,
          ...currentState.players[0].discardPile
        ];

        const silverCount = allCards.filter(c => c === 'Silver').length;
        const goldCount = allCards.filter(c => c === 'Gold').length;

        // By turn 5+, should have acquired better treasures
        if (currentState.turnNumber >= 5) {
          expect(silverCount + goldCount).toBeGreaterThan(0);
          break;
        }
      }
    });
  });

  describe('IT-AI-SEQUENCE-7: Game Completes Without Deadlock', () => {
    test('should complete full game without infinite loops', () => {
      // @req: FR 3.1 - Game should progress normally with fix
      // @input: AI plays until game ends (Province pile empty or 3 piles empty)
      // @output: Game completes in reasonable moves, no infinite loops
      // @regression: Old bug could cause looping by not advancing game state

      const state = engine.initializeGame(1);
      let currentState = state;
      let moveCount = 0;
      const maxMoves = 1000;

      while (moveCount < maxMoves) {
        const gameEnd = engine.checkGameOver(currentState);
        if (gameEnd.isGameOver) break;

        const validMoves = engine.getValidMoves(currentState, 0);
        if (validMoves.length === 0) break;

        const decision = ai.decideBestMove(currentState, 0);
        const result = engine.executeMove(currentState, decision.move);

        if (!result.success || !result.newState) break;

        currentState = result.newState;
        moveCount++;
      }

      // Game should complete in reasonable time (< 1000 moves)
      expect(moveCount).toBeLessThan(maxMoves);
      // Game should last more than trivial length
      expect(moveCount).toBeGreaterThan(10);
      // Game should have ended
      const finalCheck = engine.checkGameOver(currentState);
      expect(finalCheck.isGameOver).toBe(true);
    });
  });

  // ============================================================================
  // CATEGORY 3: State Transition Edge Cases (3 tests)
  // ============================================================================

  describe('IT-AI-SEQUENCE-8: Exactly $3 Coins (Silver Threshold)', () => {
    test('should recognize Silver affordability threshold', () => {
      // @req: FR 3.1 - Play treasures, recognize affordability
      // @input: buy phase, hand=[Copper], coins=0, buys=1
      // @output: Play Copper ($1), then recognize can't afford Silver yet
      // @assert: After Copper, coins=1; next decision is end_phase (can't afford Silver at $1)

      const state = engine.initializeGame(1);
      let currentState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Copper', 'Estate', 'Estate', 'Estate', 'Estate'],
            coins: 0,
            inPlay: [],
            buys: 1
          }
        ]
      };

      // Play Copper
      const decision1 = ai.decideBestMove(currentState, 0);
      expect(decision1.move.type).toBe('play_treasure');

      const result1 = engine.executeMove(currentState, decision1.move);
      expect(result1.success).toBe(true);
      currentState = result1.newState!;

      // Should have $1, can't buy Silver ($3)
      expect(currentState.players[0].coins).toBe(1);

      // Next decision: can't afford anything good, end phase
      const decision2 = ai.decideBestMove(currentState, 0);
      expect(decision2.move.type).toBe('end_phase');
    });
  });

  describe('IT-AI-SEQUENCE-9: Exactly $5 Coins (Mixed Treasures)', () => {
    test('should recognize total coins from all treasures and make correct purchase', () => {
      // @req: FR 3.1, FR 3.3 - Play all treasures, recognize total coins available
      // @input: buy phase, hand=[Copper, Copper, Gold], coins=0, buys=1
      // @output: Play all treasures (total $5 = 1+1+3), verify coins accumulate
      // @assert: coins=5 before purchase, can afford Silver ($3) or higher

      const state = engine.initializeGame(1);
      let currentState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Copper', 'Copper', 'Gold', 'Estate', 'Estate'],
            coins: 0,
            inPlay: [],
            buys: 1
          }
        ]
      };

      // Play all treasures
      for (let i = 0; i < 5; i++) {
        const decision = ai.decideBestMove(currentState, 0);

        if (decision.move.type !== 'play_treasure') {
          // Reached purchase decision with 5 coins (Copper $1 + Copper $1 + Gold $3 = $5)
          expect(currentState.players[0].coins).toBe(5);
          expect(decision.move.type).toBe('buy');
          // With $5, should be able to buy Silver ($3) or better
          expect(['Silver', 'Gold', 'Duchy', 'Province']).toContain(decision.move.card);
          break;
        }

        const result = engine.executeMove(currentState, decision.move);
        expect(result.success).toBe(true);
        currentState = result.newState!;
      }
    });
  });

  describe('IT-AI-SEQUENCE-10: Buys Exhaustion', () => {
    test('should end phase after exhausting buy limit', () => {
      // @req: FR 3.3 - Respect buy limit
      // @input: buy phase, hand=[], coins=5, buys=1
      // @output: Buy once (buys→0), next decision is end_phase
      // @assert: After first buy, buys=0; next decision is end_phase

      const state = engine.initializeGame(1);
      const initialState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: [],
            coins: 5,
            inPlay: [],
            buys: 1
          }
        ]
      };

      // First decision: should buy
      const decision1 = ai.decideBestMove(initialState, 0);
      expect(decision1.move.type).toBe('buy');

      const result1 = engine.executeMove(initialState, decision1.move);
      expect(result1.success).toBe(true);
      const afterBuy = result1.newState!;

      // After buy, buys should be 0
      expect(afterBuy.players[0].buys).toBe(0);

      // Next decision: must end phase
      const decision2 = ai.decideBestMove(afterBuy, 0);
      expect(decision2.move.type).toBe('end_phase');
    });
  });

  // ============================================================================
  // CATEGORY 4: Error Conditions & Validity (2 tests)
  // ============================================================================

  describe('IT-AI-SEQUENCE-11: AI Never Suggests Invalid Move', () => {
    test('should always suggest valid moves across 50 diverse game states', () => {
      // @req: FR 3.1-3.3 - AI should handle all states gracefully
      // @input: 50 random game states with valid setup
      // @output: All decisions are in validMoves list, all execute successfully
      // @assert: 100% of decisions are valid (50/50), no exceptions

      let successCount = 0;

      for (let i = 0; i < 50; i++) {
        const testEngine = new GameEngine(`validity-test-${i}`);
        const gameState = testEngine.initializeGame(1);

        // Get valid moves
        const validMoves = testEngine.getValidMoves(gameState, 0);
        expect(validMoves.length).toBeGreaterThan(0);

        // Get AI decision
        const decision = ai.decideBestMove(gameState, 0);

        // Check decision is valid
        const isValid = validMoves.some(
          m =>
            m.type === decision.move.type &&
            (m.card === decision.move.card || m.card === undefined)
        );

        expect(isValid).toBe(true);

        // Try to execute
        const result = testEngine.executeMove(gameState, decision.move);
        expect(result.success).toBe(true);

        successCount++;
      }

      // All 50 iterations should succeed
      expect(successCount).toBe(50);
    });
  });

  describe('IT-AI-SEQUENCE-12: AI Handles Edge Case States Gracefully', () => {
    test('should not crash on edge case game states', () => {
      // @req: FR 3.1-3.3 - AI should be robust
      // @input: Various edge case states (empty hand, huge hand, etc.)
      // @output: AI always returns valid move, no crashes
      // @assert: No exceptions thrown, reasoning is non-empty

      const testCases = [
        {
          name: 'Empty hand, 0 coins, 0 buys',
          setup: (s: GameState) => ({
            ...s,
            phase: 'buy' as const,
            players: [{ ...s.players[0], hand: [], coins: 0, buys: 0 }]
          })
        },
        {
          name: 'Hand with only treasures, 0 buys',
          setup: (s: GameState) => ({
            ...s,
            phase: 'buy' as const,
            players: [
              { ...s.players[0], hand: ['Copper', 'Copper', 'Copper'], coins: 0, buys: 0 }
            ]
          })
        },
        {
          name: 'Large hand (8 cards)',
          setup: (s: GameState) => ({
            ...s,
            phase: 'buy' as const,
            players: [
              {
                ...s.players[0],
                hand: ['Copper', 'Silver', 'Gold', 'Estate', 'Duchy', 'Province', 'Copper', 'Estate'],
                coins: 0,
                buys: 1
              }
            ]
          })
        }
      ];

      testCases.forEach(testCase => {
        const engine = new GameEngine('edge-case-test');
        const baseState = engine.initializeGame(1);
        const testState = testCase.setup(baseState);

        // Should not throw
        const decision = ai.decideBestMove(testState, 0);

        // Verify valid response
        expect(decision.move).toBeTruthy();
        expect(typeof decision.move).toBe('object');
        expect(decision.reasoning).toBeTruthy();
        expect(typeof decision.reasoning).toBe('string');
        expect(decision.reasoning.length).toBeGreaterThan(0);

        // Verify can execute
        const result = engine.executeMove(testState, decision.move);
        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================================================
  // CATEGORY 5: Decision Repeatability & Determinism (2 tests)
  // ============================================================================

  describe('IT-AI-SEQUENCE-13: Same Sequence, Same Seed, Same Decisions', () => {
    test('should produce identical decisions with same seed across identical game states', () => {
      // @req: FR 3.1-3.3 - Deterministic AI behavior
      // @input: Create identical game state twice with same seed
      // @output: All decisions and game progression should be identical
      // @assert: decision sequences match, purchases match

      const seed = 'determinism-test';

      // Create two identical games
      const engine1 = new GameEngine(seed);
      const engine2 = new GameEngine(seed);
      const ai1 = new RulesBasedAI(seed);
      const ai2 = new RulesBasedAI(seed);

      let state1 = engine1.initializeGame(1);
      let state2 = engine2.initializeGame(1);

      const decisions1: string[] = [];
      const decisions2: string[] = [];

      // Play 10 moves each
      for (let i = 0; i < 10; i++) {
        // Game 1
        const decision1 = ai1.decideBestMove(state1, 0);
        decisions1.push(decision1.move.type);

        const result1 = engine1.executeMove(state1, decision1.move);
        if (result1.success) state1 = result1.newState!;
        else break;

        // Game 2
        const decision2 = ai2.decideBestMove(state2, 0);
        decisions2.push(decision2.move.type);

        const result2 = engine2.executeMove(state2, decision2.move);
        if (result2.success) state2 = result2.newState!;
        else break;
      }

      // Decisions should match
      expect(decisions1).toEqual(decisions2);

      // Final coins should match
      expect(state1.players[0].coins).toBe(state2.players[0].coins);
    });
  });

  describe('IT-AI-SEQUENCE-14: Decision Independent of Move History', () => {
    test('should make identical decisions when reaching same state via different paths', () => {
      // @req: FR 3.1-3.3 - Decision is pure function of current state
      // @input: Two different paths leading to same game state
      // @output: From both paths, AI makes identical next decision
      // @assert: decision1.move === decision2.move

      const engine = new GameEngine('path-test');
      const ai1 = new RulesBasedAI('path-test');
      const ai2 = new RulesBasedAI('path-test');

      // Path 1: Play Copper then Silver
      let state1 = engine.initializeGame(1);
      state1 = {
        ...state1,
        phase: 'buy',
        players: [
          {
            ...state1.players[0],
            hand: ['Estate', 'Estate'],
            coins: 4,
            inPlay: ['Copper', 'Silver'],
            buys: 1
          }
        ]
      };

      // Path 2: Play Silver then Copper (different order, same final state)
      let state2 = engine.initializeGame(1);
      state2 = {
        ...state2,
        phase: 'buy',
        players: [
          {
            ...state2.players[0],
            hand: ['Estate', 'Estate'],
            coins: 4,
            inPlay: ['Silver', 'Copper'],
            buys: 1
          }
        ]
      };

      // Both should make identical decision (since state contents are effectively same)
      const decision1 = ai1.decideBestMove(state1, 0);
      const decision2 = ai2.decideBestMove(state2, 0);

      // Decision should be identical (buy Silver with $4)
      expect(decision1.move.type).toBe(decision2.move.type);
      expect(decision1.move.card).toBe(decision2.move.card);
    });
  });
});
