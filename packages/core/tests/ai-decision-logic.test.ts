import { GameEngine } from '../src/game';
import { RulesBasedAI } from '../src/ai';
import { GameState } from '../src/types';

// @req: AI Decision Logic - Direct Unit Tests
// @edge: Treasure playing decisions; coin accumulation; purchase logic; immutability; determinism
// @why: Catch obvious AI bugs like treasure accumulation bug; ensure state immutability; validate decision logic

describe('AI Decision Logic - Direct Unit Tests', () => {
  let engine: GameEngine;
  let ai: RulesBasedAI;

  beforeEach(() => {
    engine = new GameEngine('ai-decision-test');
    ai = new RulesBasedAI('ai-decision-test');
  });

  // ============================================================================
  // CATEGORY 1: Treasure Playing Decisions (UT-AI-DECISION-1 to 8)
  // ============================================================================

  describe('Treasure Playing Decisions (UT-AI-DECISION-1 to 8)', () => {
    test('UT-AI-DECISION-1: Single Copper Test', () => {
      // @req: FR 3.1 - AI plays treasures to accumulate coins
      // @input: buy phase, hand=[Copper, Estate, Estate, Estate, Estate], coins=0, inPlay=[]
      // @output: decide to play Copper treasure
      // @edge: Single treasure in hand
      // @assert: move.type === 'play_treasure' and move.card === 'Copper'

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Copper', 'Estate', 'Estate', 'Estate', 'Estate'],
            coins: 0,
            inPlay: []
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      expect(decision.move.type).toBe('play_treasure');
      expect(decision.move.card).toBe('Copper');

      // Verify move is valid
      const result = engine.executeMove(testState, decision.move);
      expect(result.success).toBe(true);
    });

    test('UT-AI-DECISION-2: Four Coppers Test - REGRESSION TEST FOR TREASURE ACCUMULATION BUG', () => {
      // @req: FR 3.1 - AI plays ALL treasures in hand (not stuck on first one)
      // @input: buy phase, hand=[Copper, Copper, Copper, Copper, Estate], coins=0, inPlay=[]
      // @output: decide to play a Copper treasure (will be called repeatedly)
      // @edge: Multiple duplicate treasures (catches bug where AI only accumulates first treasure)
      // @assert: move.type MUST be 'play_treasure', NOT 'buy' (this test catches the accumulation bug)
      // @why: This test would immediately catch if AI got stuck playing only first Copper

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Copper', 'Copper', 'Copper', 'Copper', 'Estate'],
            coins: 0,
            inPlay: []
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      // CRITICAL: Must expect play_treasure, not buy
      // If bug exists, AI would try to buy something with $0
      expect(decision.move.type).toBe('play_treasure');
      expect(decision.move.card).toBe('Copper');

      // Verify move is valid
      const result = engine.executeMove(testState, decision.move);
      expect(result.success).toBe(true);
    });

    test('UT-AI-DECISION-3: Silver Treasure Test', () => {
      // @req: FR 3.1 - AI plays Silver treasures
      // @input: buy phase, hand=[Silver, Estate, Estate, Estate, Estate], coins=0
      // @output: decide to play Silver
      // @edge: Higher-value treasure card
      // @assert: move.type === 'play_treasure' and move.card === 'Silver'

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Silver', 'Estate', 'Estate', 'Estate', 'Estate'],
            coins: 0
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      expect(decision.move.type).toBe('play_treasure');
      expect(decision.move.card).toBe('Silver');

      const result = engine.executeMove(testState, decision.move);
      expect(result.success).toBe(true);
    });

    test('UT-AI-DECISION-4: Mixed Treasures Test', () => {
      // @req: FR 3.1 - AI plays treasures when multiple types available
      // @input: buy phase, hand=[Copper, Silver, Estate, Estate, Estate], coins=0
      // @output: decide to play either Copper or Silver
      // @edge: Mixed treasure types
      // @assert: move.type === 'play_treasure' and move.card is Copper OR Silver

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Copper', 'Silver', 'Estate', 'Estate', 'Estate'],
            coins: 0
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      expect(decision.move.type).toBe('play_treasure');
      expect(['Copper', 'Silver']).toContain(decision.move.card);

      const result = engine.executeMove(testState, decision.move);
      expect(result.success).toBe(true);
    });

    test('UT-AI-DECISION-5: No Treasures in Hand Test', () => {
      // @req: FR 3.1 - AI does NOT play treasures if none in hand
      // @input: buy phase, hand=[Estate, Duchy, Province], coins=0
      // @output: decide to NOT play treasure (either 'buy' or 'end_phase')
      // @edge: No treasures available
      // @assert: move.type !== 'play_treasure'

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Estate', 'Duchy', 'Province'],
            coins: 0,
            buys: 1
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      expect(decision.move.type).not.toBe('play_treasure');
      expect(['buy', 'end_phase']).toContain(decision.move.type);

      const result = engine.executeMove(testState, decision.move);
      expect(result.success).toBe(true);
    });

    test('UT-AI-DECISION-6: Treasures in inPlay Already Test - CRITICAL IMMUTABILITY', () => {
      // @req: FR 3.1 - AI plays remaining Copper in hand, not confused by inPlay
      // @input: buy phase, hand=[Copper, Estate], coins=3, inPlay=[Copper, Copper, Copper]
      // @output: decide to play the Copper in hand
      // @edge: Treasures already in play should not confuse decision logic
      // @assert: move.type === 'play_treasure' and move.card === 'Copper'
      // @why: Validates that AI checks hand, not inPlay

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Copper', 'Estate'],
            coins: 3,
            inPlay: ['Copper', 'Copper', 'Copper'] as any
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      expect(decision.move.type).toBe('play_treasure');
      expect(decision.move.card).toBe('Copper');

      const result = engine.executeMove(testState, decision.move);
      expect(result.success).toBe(true);
    });

    test('UT-AI-DECISION-7: After Playing Some Treasures Test', () => {
      // @req: FR 3.1 - AI continues playing remaining treasures
      // @input: buy phase, hand=[Copper, Estate], coins=1, inPlay=[Copper, Copper]
      // @output: decide to play the remaining Copper in hand
      // @edge: Some treasures already played in this phase
      // @assert: move.type === 'play_treasure' and move.card === 'Copper'

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Copper', 'Estate'],
            coins: 1,
            inPlay: ['Copper', 'Copper'] as any
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      expect(decision.move.type).toBe('play_treasure');
      expect(decision.move.card).toBe('Copper');

      const result = engine.executeMove(testState, decision.move);
      expect(result.success).toBe(true);
    });

    test('UT-AI-DECISION-8: Treasure with Empty Estate Hand Test', () => {
      // @req: FR 3.1 - AI plays single treasure card
      // @input: buy phase, hand=[Copper], coins=0
      // @output: decide to play Copper
      // @edge: Only one card in hand
      // @assert: move.type === 'play_treasure' and move.card === 'Copper'

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Copper'],
            coins: 0
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      expect(decision.move.type).toBe('play_treasure');
      expect(decision.move.card).toBe('Copper');

      const result = engine.executeMove(testState, decision.move);
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // CATEGORY 2: Coin Accumulation Validation (UT-AI-DECISION-9 to 14)
  // ============================================================================

  describe('Coin Accumulation Validation (UT-AI-DECISION-9 to 14)', () => {
    test('UT-AI-DECISION-9: Copper Coin Value Test', () => {
      // @req: FR 3.2 - Playing Copper increases coins by 1
      // @input: Play Copper in buy phase
      // @output: newState.players[0].coins should be previous + 1
      // @edge: Basic treasure coin value
      // @assert: Direct assertion on coin value, not just "move succeeded"

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Copper', 'Estate'],
            coins: 0
          }
        ]
      };

      const initialCoins = testState.players[0].coins;
      const result = engine.executeMove(testState, { type: 'play_treasure', card: 'Copper' });

      expect(result.success).toBe(true);
      expect(result.newState!.players[0].coins).toBe(initialCoins + 1);
      expect(result.newState!.players[0].coins).toBe(1);
    });

    test('UT-AI-DECISION-10: Silver Coin Value Test', () => {
      // @req: FR 3.2 - Playing Silver increases coins by 2
      // @input: Play Silver in buy phase
      // @output: newState.players[0].coins should be previous + 2
      // @edge: Mid-tier treasure value
      // @assert: Direct assertion on coin value

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Silver', 'Estate'],
            coins: 0
          }
        ]
      };

      const initialCoins = testState.players[0].coins;
      const result = engine.executeMove(testState, { type: 'play_treasure', card: 'Silver' });

      expect(result.success).toBe(true);
      expect(result.newState!.players[0].coins).toBe(initialCoins + 2);
      expect(result.newState!.players[0].coins).toBe(2);
    });

    test('UT-AI-DECISION-11: Two Treasures Accumulation Test', () => {
      // @req: FR 3.2 - Playing multiple treasures accumulates coins correctly
      // @input: Play Copper ($1), then play Silver ($2)
      // @output: After both: total coins = $3 (NOT stuck at $1)
      // @edge: Sequential treasure plays
      // @assert: Each play increases total, coins don't reset
      // @why: Catches bug where second treasure doesn't add to coins

      const state = engine.initializeGame(1);
      let testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Copper', 'Silver', 'Estate'],
            coins: 0
          }
        ]
      };

      // Play first treasure
      let result = engine.executeMove(testState, { type: 'play_treasure', card: 'Copper' });
      expect(result.success).toBe(true);
      testState = result.newState!;
      expect(testState.players[0].coins).toBe(1);

      // Play second treasure
      result = engine.executeMove(testState, { type: 'play_treasure', card: 'Silver' });
      expect(result.success).toBe(true);
      testState = result.newState!;

      // CRITICAL: Must be 3, not 2 (not "just Silver") and not 1 (not "stuck")
      expect(testState.players[0].coins).toBe(3);
    });

    test('UT-AI-DECISION-12: Four Coppers Accumulation Test - CRITICAL BUG TEST', () => {
      // @req: FR 3.2 - Playing four Coppers accumulates to $4
      // @input: Play Copper four times in sequence
      // @output: After each play: $1, $2, $3, $4
      // @edge: Multiple identical treasure plays (CATCHES ACCUMULATION BUG)
      // @assert: Verify $4 final, NOT stuck at $1, NOT at $2 or $3
      // @why: This test would catch the 4-Copper stuck-at-$1 bug IMMEDIATELY

      const state = engine.initializeGame(1);
      let testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Copper', 'Copper', 'Copper', 'Copper', 'Estate'],
            coins: 0
          }
        ]
      };

      // Play first Copper
      let result = engine.executeMove(testState, { type: 'play_treasure', card: 'Copper' });
      expect(result.success).toBe(true);
      testState = result.newState!;
      expect(testState.players[0].coins).toBe(1);

      // Play second Copper
      result = engine.executeMove(testState, { type: 'play_treasure', card: 'Copper' });
      expect(result.success).toBe(true);
      testState = result.newState!;
      expect(testState.players[0].coins).toBe(2);

      // Play third Copper
      result = engine.executeMove(testState, { type: 'play_treasure', card: 'Copper' });
      expect(result.success).toBe(true);
      testState = result.newState!;
      expect(testState.players[0].coins).toBe(3);

      // Play fourth Copper
      result = engine.executeMove(testState, { type: 'play_treasure', card: 'Copper' });
      expect(result.success).toBe(true);
      testState = result.newState!;

      // THIS IS THE KEY ASSERTION - Must be 4, not 1
      expect(testState.players[0].coins).toBe(4);
    });

    test('UT-AI-DECISION-13: Copper + Silver Accumulation Test', () => {
      // @req: FR 3.2 - Mixed treasures accumulate correctly
      // @input: Play Copper ($1), then play Silver ($2)
      // @output: Final coins = $3 (1 + 2)
      // @edge: Different treasure types in sequence
      // @assert: Sum is correct formula, not just one treasure value

      const state = engine.initializeGame(1);
      let testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Copper', 'Silver', 'Estate'],
            coins: 0
          }
        ]
      };

      // Play Copper
      let result = engine.executeMove(testState, { type: 'play_treasure', card: 'Copper' });
      expect(result.success).toBe(true);
      testState = result.newState!;
      expect(testState.players[0].coins).toBe(1);

      // Play Silver
      result = engine.executeMove(testState, { type: 'play_treasure', card: 'Silver' });
      expect(result.success).toBe(true);
      testState = result.newState!;

      // Verify correct accumulation: NOT just Silver ($2) and NOT stuck at Copper ($1)
      expect(testState.players[0].coins).toBe(3);
    });

    test('UT-AI-DECISION-14: Empty Coin Pool Test', () => {
      // @req: FR 3.2 - Starting coins not corrupted
      // @input: Start with coins=5, play no treasures
      // @output: Coins stay at 5
      // @edge: Coins don't reset to 0
      // @assert: coins === 5 after no changes

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Estate', 'Duchy', 'Province'],
            coins: 5,
            buys: 0
          }
        ]
      };

      const result = engine.executeMove(testState, { type: 'end_phase' });

      expect(result.success).toBe(true);
      // Coins should stay the same (though phase will change)
      expect(result.newState!.players[0].coins).toBe(5);
    });
  });

  // ============================================================================
  // CATEGORY 3: Purchase Decision Tests (UT-AI-DECISION-15 to 22)
  // ============================================================================

  describe('Purchase Decision Logic (UT-AI-DECISION-15 to 22)', () => {
    test('UT-AI-DECISION-15: Buy Silver with $3 Test', () => {
      // @req: FR 3.3 - AI buys Silver with exactly 3 coins
      // @input: buy phase, hand=[], coins=3, buys=1, no treasures
      // @output: decide to buy Silver
      // @edge: Minimum coin threshold for Silver
      // @assert: move.type === 'buy' and move.card === 'Silver'

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: [],
            coins: 3,
            buys: 1
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      expect(decision.move.type).toBe('buy');
      expect(decision.move.card).toBe('Silver');

      const result = engine.executeMove(testState, decision.move);
      expect(result.success).toBe(true);
    });

    test('UT-AI-DECISION-16: Don\'t Buy Copper with $3 Test', () => {
      // @req: FR 3.3 - AI prefers Silver over Copper when coins sufficient
      // @input: buy phase, hand=[], coins=3, buys=1
      // @output: decide to buy Silver, NOT Copper
      // @edge: Card prioritization with fixed coins
      // @assert: move.card === 'Silver', NOT 'Copper'

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: [],
            coins: 3,
            buys: 1
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      expect(decision.move.type).toBe('buy');
      expect(decision.move.card).not.toBe('Copper');
      expect(decision.move.card).toBe('Silver');

      const result = engine.executeMove(testState, decision.move);
      expect(result.success).toBe(true);
    });

    test('UT-AI-DECISION-17: Buy Gold with $6 Test', () => {
      // @req: FR 3.3 - AI buys Gold with 6+ coins
      // @input: buy phase, hand=[], coins=6, buys=1
      // @output: decide to buy Gold
      // @edge: Gold purchase threshold
      // @assert: move.type === 'buy' and move.card === 'Gold'

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: [],
            coins: 6,
            buys: 1
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      expect(decision.move.type).toBe('buy');
      expect(decision.move.card).toBe('Gold');

      const result = engine.executeMove(testState, decision.move);
      expect(result.success).toBe(true);
    });

    test('UT-AI-DECISION-18: Don\'t Buy Silver with $6 Test', () => {
      // @req: FR 3.3 - AI prefers Gold over Silver when coins sufficient
      // @input: buy phase, hand=[], coins=6, buys=1
      // @output: decide to buy Gold, NOT Silver
      // @edge: Prioritization hierarchy
      // @assert: move.card === 'Gold', NOT 'Silver'

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: [],
            coins: 6,
            buys: 1
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      expect(decision.move.type).toBe('buy');
      expect(decision.move.card).not.toBe('Silver');
      expect(decision.move.card).toBe('Gold');

      const result = engine.executeMove(testState, decision.move);
      expect(result.success).toBe(true);
    });

    test('UT-AI-DECISION-19: No Buys Remaining Test', () => {
      // @req: FR 3.3 - AI ends phase when no buys
      // @input: buy phase, hand=[], coins=5, buys=0
      // @output: decide to end phase
      // @edge: Zero buys remaining
      // @assert: move.type === 'end_phase'

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: [],
            coins: 5,
            buys: 0
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      expect(decision.move.type).toBe('end_phase');

      const result = engine.executeMove(testState, decision.move);
      expect(result.success).toBe(true);
    });

    test('UT-AI-DECISION-20: Buy Gold with $8 Test (Preferred Over Province)', () => {
      // @req: FR 3.3 - AI buys Gold when 8+ coins available (prioritizes Gold)
      // @input: buy phase, hand=[], coins=8, buys=1, supply has plenty
      // @output: decide to buy Gold (Big Money strategy prioritizes Gold over Victory)
      // @edge: Gold prioritization in Big Money
      // @assert: move.type === 'buy' and move.card === 'Gold'
      // @why: Big Money prioritizes Gold (6+ check) before Province endgame check

      const state = engine.initializeGame(1);

      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: [],
            coins: 8,
            buys: 1
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      expect(decision.move.type).toBe('buy');
      expect(decision.move.card).toBe('Gold');

      const result = engine.executeMove(testState, decision.move);
      expect(result.success).toBe(true);
    });

    test('UT-AI-DECISION-21: No Profitable Purchases Test', () => {
      // @req: FR 3.3 - AI ends phase when no profitable cards available
      // @input: buy phase, hand=[], coins=1, buys=1
      // @output: decide to end phase (can't afford anything useful)
      // @edge: Low coin threshold with limited affordances
      // @assert: move.type === 'end_phase'

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: [],
            coins: 1,
            buys: 1
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      // With only $1, can't buy Silver ($3), Gold ($6), or Province ($8)
      // Should end phase
      expect(decision.move.type).toBe('end_phase');

      const result = engine.executeMove(testState, decision.move);
      expect(result.success).toBe(true);
    });

    test('UT-AI-DECISION-22: Zero Coins Test', () => {
      // @req: FR 3.3 - AI ends phase with zero coins and treasures played
      // @input: buy phase, hand=[], coins=0, buys=1
      // @output: decide to end phase
      // @edge: No coins, no treasures available
      // @assert: move.type === 'end_phase'

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: [],
            coins: 0,
            buys: 1
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      expect(decision.move.type).toBe('end_phase');

      const result = engine.executeMove(testState, decision.move);
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // CATEGORY 4: State Immutability & Determinism (UT-AI-DECISION-23 to 24)
  // ============================================================================

  describe('State Immutability & Determinism (UT-AI-DECISION-23 to 24)', () => {
    test('UT-AI-DECISION-23: decideBestMove Does Not Mutate State', () => {
      // @req: FR 3.4 - AI decisions have NO side effects
      // @input: Create state, deep copy it, call decideBestMove(), compare
      // @output: Original state unchanged
      // @edge: Immutability contract
      // @assert: JSON.stringify(state) === JSON.stringify(originalCopy)

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Copper', 'Silver', 'Estate'],
            coins: 3,
            buys: 1
          }
        ]
      };

      // Deep copy for comparison
      const originalCopy = JSON.parse(JSON.stringify(testState));

      // Call decideBestMove
      ai.decideBestMove(testState, 0);

      // Verify state unchanged
      expect(JSON.stringify(testState)).toBe(JSON.stringify(originalCopy));
    });

    test('UT-AI-DECISION-24: Repeated Calls Same State Same Decision', () => {
      // @req: FR 3.4 - AI decisions are deterministic (idempotent)
      // @input: Create state, call decideBestMove() three times
      // @output: Identical decisions all three times
      // @edge: Determinism and idempotency
      // @assert: All three decisions have same move.type and move.card

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Copper', 'Silver', 'Estate'],
            coins: 0
          }
        ]
      };

      const decision1 = ai.decideBestMove(testState, 0);
      const decision2 = ai.decideBestMove(testState, 0);
      const decision3 = ai.decideBestMove(testState, 0);

      // All decisions must be identical
      expect(decision1.move.type).toBe(decision2.move.type);
      expect(decision2.move.type).toBe(decision3.move.type);
      expect(decision1.move.card).toBe(decision2.move.card);
      expect(decision2.move.card).toBe(decision3.move.card);
    });
  });

  // ============================================================================
  // CATEGORY 5: Edge Cases (UT-AI-DECISION-25 to 28)
  // ============================================================================

  describe('Edge Cases (UT-AI-DECISION-25 to 28)', () => {
    test('UT-AI-DECISION-25: Full Hand All Treasures Test', () => {
      // @req: FR 3.1 - AI handles full hand of identical treasures
      // @input: hand=[Copper, Copper, Copper, Copper, Copper] (5 treasures)
      // @output: decide to play a Copper
      // @edge: All treasures in hand
      // @assert: move.type === 'play_treasure'

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Copper', 'Copper', 'Copper', 'Copper', 'Copper'],
            coins: 0
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      expect(decision.move.type).toBe('play_treasure');
      expect(decision.move.card).toBe('Copper');

      const result = engine.executeMove(testState, decision.move);
      expect(result.success).toBe(true);
    });

    test('UT-AI-DECISION-26: Alternating Treasures and Victories Test', () => {
      // @req: FR 3.1 - AI correctly identifies and plays treasures amid victory cards
      // @input: hand=[Copper, Estate, Copper, Estate, Copper]
      // @output: decide to play a Copper
      // @edge: Mixed card types, treasures not contiguous
      // @assert: move.type === 'play_treasure' and move.card === 'Copper'

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Copper', 'Estate', 'Copper', 'Estate', 'Copper'],
            coins: 0
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      expect(decision.move.type).toBe('play_treasure');
      expect(decision.move.card).toBe('Copper');

      const result = engine.executeMove(testState, decision.move);
      expect(result.success).toBe(true);
    });

    test('UT-AI-DECISION-27: Last Copper in Hand Test', () => {
      // @req: FR 3.1 - AI plays final treasure in hand
      // @input: hand=[Copper], coins=0, inPlay=[Copper, Copper, Copper]
      // @output: decide to play the last Copper
      // @edge: Only one card in hand, others in play
      // @assert: move.type === 'play_treasure' and move.card === 'Copper'

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Copper'],
            coins: 0,
            inPlay: ['Copper', 'Copper', 'Copper'] as any
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      expect(decision.move.type).toBe('play_treasure');
      expect(decision.move.card).toBe('Copper');

      const result = engine.executeMove(testState, decision.move);
      expect(result.success).toBe(true);
    });

    test('UT-AI-DECISION-28: Invalid Move Never Returned Test', () => {
      // @req: FR 3.1-3.3 - All AI decisions pass engine validation
      // @input: 20 diverse game states (action, buy, cleanup phases with valid resources)
      // @output: All decisions are valid (executeMove succeeds)
      // @edge: Comprehensive validation across states with proper setup
      // @assert: EVERY decision passes engine.executeMove()

      for (let i = 0; i < 20; i++) {
        const testEngine = new GameEngine(`validation-test-${i}`);
        const baseState = testEngine.initializeGame(1);

        // Determine phase for this iteration
        const phase = i % 3 === 0 ? 'action' : i % 3 === 1 ? 'buy' : 'cleanup';

        // Create diverse test state with different phases
        // Ensure we have appropriate resources for each phase:
        // - action phase: need actions > 0 to play action cards
        // - buy phase: treasures or buys > 0
        // - cleanup: no requirements
        const testState: GameState = {
          ...baseState,
          phase,
          players: [
            {
              ...baseState.players[0],
              hand: i % 2 === 0
                ? ['Copper', 'Silver', 'Estate', 'Duchy', 'Village']
                : ['Estate', 'Duchy', 'Province', 'Smithy', 'Copper'],
              coins: i % 5,
              buys: phase === 'buy' ? 1 : 0, // Ensure buy phase has buys
              actions: phase === 'action' ? 1 : 0 // Ensure action phase has actions
            }
          ]
        };

        const decision = ai.decideBestMove(testState, 0);

        // CRITICAL: Every single decision must be valid
        const result = testEngine.executeMove(testState, decision.move);
        expect(result.success).toBe(true);
      }
    });
  });

  // ============================================================================
  // CATEGORY 8: Missing Coverage - Edge Cases (UT-AI-DECISION-29 to 35)
  // ============================================================================

  describe('Missing Coverage - Edge Cases (UT-AI-DECISION-29 to 35)', () => {
    test('UT-AI-DECISION-29: Other Action Cards (Line 63)', () => {
      // @req: FR 3.4 - AI should play other action cards when Village/Smithy unavailable
      // @input: action phase, hand=[Cellar, Estate, Estate, Estate, Estate], actions=1
      // @output: decide to play Cellar (other action card)
      // @edge: Action card that is neither Village nor Smithy
      // @assert: move.type === 'play_action' and move.card === 'Cellar'

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [
          {
            ...state.players[0],
            hand: ['Cellar', 'Estate', 'Estate', 'Estate', 'Estate'],
            actions: 1
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      expect(decision.move.type).toBe('play_action');
      expect(decision.move.card).toBe('Cellar');

      // Verify move is valid
      const result = engine.executeMove(testState, decision.move);
      expect(result.success).toBe(true);
    });

    test('UT-AI-DECISION-30: Unknown Phase (Line 34)', () => {
      // @req: FR 3.4 - AI should handle unknown phases gracefully
      // @input: unknown phase, should fallback to end_phase
      // @output: end_phase move with "Unknown phase" reasoning
      // @edge: Invalid phase value (defensive programming)
      // @assert: move.type === 'end_phase'

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'invalid_phase' as any, // Force invalid phase
        players: [
          {
            ...state.players[0],
            hand: ['Copper', 'Estate', 'Estate', 'Estate', 'Estate']
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      // Should default to end_phase for unknown phase
      expect(decision.move.type).toBe('end_phase');
      expect(decision.reasoning).toBe('Unknown phase');
    });

    test('UT-AI-DECISION-31: Duchy Purchase in Endgame (Line 131)', () => {
      // @req: FR 3.3 - AI should buy Duchy when endgame is detected
      // @input: buy phase, coins=5, empty piles=3 (endgame), Duchy available
      // @output: decide to buy Duchy (3 VP)
      // @edge: Endgame condition with 3+ empty piles, coins >= 5
      // @assert: move.type === 'buy' and move.card === 'Duchy'

      const state = engine.initializeGame(1);

      // Create endgame condition: 3 empty piles
      const supply = new Map(state.supply);
      supply.set('Copper', 0); // Empty pile 1
      supply.set('Silver', 0); // Empty pile 2
      supply.set('Estate', 0); // Empty pile 3

      const testState: GameState = {
        ...state,
        phase: 'buy',
        supply,
        players: [
          {
            ...state.players[0],
            hand: ['Estate', 'Estate', 'Estate', 'Estate', 'Estate'],
            coins: 5,
            buys: 1
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      expect(decision.move.type).toBe('buy');
      expect(decision.move.card).toBe('Duchy');
      expect(decision.reasoning).toContain('Duchy');

      // Verify move is valid
      const result = engine.executeMove(testState, decision.move);
      expect(result.success).toBe(true);
    });

    test('UT-AI-DECISION-32: Province Purchase at 8 Coins (Line 138)', () => {
      // @req: FR 3.3 - AI should buy Province when higher-priority cards unavailable
      // @input: buy phase, coins=8, Gold and Silver out of stock, Province available
      // @output: decide to buy Province (6 VP)
      // @edge: Exactly 8 coins, all higher-priority purchases unavailable, line 138 succeeds
      // @assert: move.type === 'buy' and move.card === 'Province'

      const state = engine.initializeGame(1);

      // Make Gold and Silver unavailable to force AI to line 138 (Province)
      const supply = new Map(state.supply);
      supply.set('Gold', 0);     // Block line 109
      supply.set('Silver', 0);   // Block line 123

      const testState: GameState = {
        ...state,
        phase: 'buy',
        supply,
        players: [
          {
            ...state.players[0],
            hand: ['Estate', 'Estate', 'Estate', 'Estate', 'Estate'],
            coins: 8,
            buys: 1
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      expect(decision.move.type).toBe('buy');
      expect(decision.move.card).toBe('Province');
      expect(decision.reasoning).toContain('Buy Province');

      // Verify move is valid
      const result = engine.executeMove(testState, decision.move);
      expect(result.success).toBe(true);
    });

    test('UT-AI-DECISION-33: Endgame Province at 8 Coins (Line 116)', () => {
      // @req: FR 3.3 - AI should buy Province in endgame when Gold unavailable
      // @input: buy phase, coins=8, 3 empty piles (endgame), Gold unavailable, Province available
      // @output: decide to buy Province (endgame check)
      // @edge: Endgame triggered by 3 empty piles, line 116 succeeds when Gold out of stock
      // @assert: move.type === 'buy' and move.card === 'Province'

      const state = engine.initializeGame(1);

      // Create endgame: 3 empty piles AND make Gold unavailable
      const supply = new Map(state.supply);
      supply.set('Copper', 0);
      supply.set('Silver', 0);
      supply.set('Estate', 0);
      supply.set('Gold', 0); // Force past line 109, allow line 116

      const testState: GameState = {
        ...state,
        phase: 'buy',
        supply,
        players: [
          {
            ...state.players[0],
            hand: ['Estate', 'Estate', 'Estate', 'Estate', 'Estate'],
            coins: 8,
            buys: 1
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      expect(decision.move.type).toBe('buy');
      expect(decision.move.card).toBe('Province');
      expect(decision.reasoning).toContain('Endgame');
    });

    test('UT-AI-DECISION-34: No Profitable Purchases (Line 147)', () => {
      // @req: FR 3.3 - AI should end phase when no profitable purchases available
      // @input: buy phase, coins=1 (only Copper cost), Copper out of stock
      // @output: end_phase move
      // @edge: Low coin total, no available purchases
      // @assert: move.type === 'end_phase'

      const state = engine.initializeGame(1);

      // Make Copper unavailable (already in hand, not in supply)
      const supply = new Map(state.supply);
      supply.set('Copper', 0);

      const testState: GameState = {
        ...state,
        phase: 'buy',
        supply,
        players: [
          {
            ...state.players[0],
            hand: ['Estate', 'Estate', 'Estate', 'Estate', 'Estate'],
            coins: 1,
            buys: 1
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      expect(decision.move.type).toBe('end_phase');
      expect(decision.reasoning).toContain('No profitable purchases');
    });

    test('UT-AI-DECISION-35: Mixed Actions (Village + Cellar)', () => {
      // @req: FR 3.4 - AI should prioritize Village over other actions
      // @input: action phase, hand=[Village, Cellar, Estate, Estate, Estate], actions=2
      // @output: decide to play Village (prioritized)
      // @edge: Multiple action cards present; Village should win
      // @assert: move.type === 'play_action' and move.card === 'Village'

      const state = engine.initializeGame(1);
      const testState: GameState = {
        ...state,
        phase: 'action',
        players: [
          {
            ...state.players[0],
            hand: ['Village', 'Cellar', 'Estate', 'Estate', 'Estate'],
            actions: 2
          }
        ]
      };

      const decision = ai.decideBestMove(testState, 0);

      expect(decision.move.type).toBe('play_action');
      expect(decision.move.card).toBe('Village');
    });
  });
});
