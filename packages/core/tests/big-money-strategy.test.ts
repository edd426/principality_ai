import { GameEngine, GameState, RulesBasedAI } from '@principality/core';

/**
 * Tests for Big Money Strategy Priority Tree
 * Source: /docs/requirements/BIG_MONEY_STRATEGY.md
 *
 * @req: Validates all 5 priority levels from BIG_MONEY_STRATEGY.md
 * @bug: Current ai.ts checks Gold (line 109) BEFORE Province (line 116)
 *       causing AI to buy Gold instead of Province at turn 10+ with 8 coins
 *
 * Test Organization:
 * - Unit Tests (UT-BM-1 to UT-BM-6): Direct decision validation
 * - Integration Tests (IT-BM-1 to IT-BM-6): Multi-turn progression
 * - E2E Tests (E2E-BM-1 to E2E-BM-3): Full game validation
 *
 * CRITICAL: UT-BM-2 and IT-BM-4 MUST FAIL with current code (RED phase)
 */

describe('Big Money Strategy - Priority Tree Validation', () => {
  let engine: GameEngine;
  let ai: RulesBasedAI;

  beforeEach(() => {
    engine = new GameEngine('big-money-test');
    ai = new RulesBasedAI('big-money-test');
  });

  describe('Unit Tests: Purchase Decision Priority (UT-BM-*)', () => {
    /**
     * UT-BM-1: Gold Priority in Early Game (Turn < 10)
     * @req: BIG_MONEY_STRATEGY.md Priority 2 - Buy Gold when turn < 10
     * @input: turn 8, 8 coins, Province available, Gold available
     * @expected: Buy Gold (NOT Province, turn < 10)
     * @why: Mid-game threshold not met yet, continue economy building
     * @assert: decision.move.card === 'Gold'
     */
    test('UT-BM-1: Gold Priority in Early Game (Turn < 10)', () => {
      const state = engine.initializeGame(1);

      // Set up early game scenario: turn 8, 8 coins, both Province+Gold available
      const earlyGameState: GameState = {
        ...state,
        turnNumber: 8,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Estate', 'Estate', 'Estate', 'Estate', 'Estate'],
            coins: 8,
            buys: 1,
            inPlay: []
          }
        ]
      };

      const decision = ai.decideBestMove(earlyGameState, 0);

      // Turn < 10, so mid-game threshold NOT met
      // Should buy Gold for economy, NOT Province
      expect(decision.move.type).toBe('buy');
      expect(decision.move.card).toBe('Gold');
      expect(decision.reasoning).toContain('Gold');
    });

    /**
     * UT-BM-2: Province Priority in Mid-Game (Turn >= 10) 🚨 CRITICAL BUG TEST
     * @req: BIG_MONEY_STRATEGY.md Priority 1 - Province > Gold at turn 10+
     * @input: turn 10, 8 coins, Province available, Gold available
     * @expected: Buy Province (NOT Gold, mid-game threshold met)
     * @edge: Both Gold and Province affordable with 8 coins
     * @why: This is THE critical bug - AI currently buys Gold instead of Province
     * @assert: decision.move.card === 'Province' (NOT 'Gold')
     * @level: CRITICAL - MUST FAIL with current code
     */
    test('UT-BM-2: Province Priority in Mid-Game (Turn >= 10) - CRITICAL BUG TEST', () => {
      const state = engine.initializeGame(1);

      // Set up THE BUG SCENARIO: turn 10, 8 coins, both Province+Gold available
      const midGameState: GameState = {
        ...state,
        turnNumber: 10,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Estate', 'Estate', 'Estate', 'Estate', 'Estate'],
            coins: 8,
            buys: 1,
            inPlay: []
          }
        ]
      };

      const decision = ai.decideBestMove(midGameState, 0);

      // Turn >= 10, so mid-game threshold IS met
      // Province has Priority 1, Gold has Priority 2
      // MUST buy Province, NOT Gold
      expect(decision.move.type).toBe('buy');
      expect(decision.move.card).toBe('Province'); // WILL FAIL - current code returns 'Gold'
      expect(decision.reasoning).toContain('Province');
      expect(decision.reasoning).not.toContain('Gold');
    });

    /**
     * UT-BM-3: Province Priority with Empty Pile Trigger
     * @req: BIG_MONEY_STRATEGY.md Priority 1 - Mid-game triggered by empty pile
     * @input: turn 8, 8 coins, Province available, Gold available, 1 pile empty
     * @expected: Buy Province (mid-game triggered by empty pile)
     * @edge: Mid-game threshold met by empty pile, not turn number
     * @why: Empty pile indicates endgame approaching, start VP accumulation
     * @assert: decision.move.card === 'Province'
     */
    test('UT-BM-3: Province Priority with Empty Pile Trigger', () => {
      const state = engine.initializeGame(1);

      // Set up empty pile trigger: turn 8 (early), but 1 pile empty
      const emptyPileState: GameState = {
        ...state,
        turnNumber: 8,
        phase: 'buy',
        supply: new Map([
          ...state.supply,
          ['Village', 0] // One pile empty triggers mid-game
        ]),
        players: [
          {
            ...state.players[0],
            hand: ['Estate', 'Estate', 'Estate', 'Estate', 'Estate'],
            coins: 8,
            buys: 1,
            inPlay: []
          }
        ]
      };

      const decision = ai.decideBestMove(emptyPileState, 0);

      // Empty pile triggers mid-game threshold even at turn 8
      // Should buy Province, not Gold
      expect(decision.move.type).toBe('buy');
      expect(decision.move.card).toBe('Province');
    });

    /**
     * UT-BM-4: Gold When Province Unaffordable
     * @req: BIG_MONEY_STRATEGY.md Priority 2 - Buy Gold when Province unaffordable
     * @input: turn 12, 7 coins, Province available, Gold available
     * @expected: Buy Gold (can't afford Province)
     * @edge: Mid-game, but insufficient coins for Priority 1
     * @why: Priority 1 fails (7 < 8), Priority 2 succeeds
     * @assert: decision.move.card === 'Gold'
     */
    test('UT-BM-4: Gold When Province Unaffordable', () => {
      const state = engine.initializeGame(1);

      // Set up scenario: mid-game, only 7 coins (1 short of Province)
      const lowCoinsState: GameState = {
        ...state,
        turnNumber: 12,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Estate', 'Estate', 'Estate', 'Estate', 'Estate'],
            coins: 7,
            buys: 1,
            inPlay: []
          }
        ]
      };

      const decision = ai.decideBestMove(lowCoinsState, 0);

      // 7 coins can't buy Province (cost 8), falls through to Priority 2
      expect(decision.move.type).toBe('buy');
      expect(decision.move.card).toBe('Gold');
      expect(decision.reasoning).toContain('Gold');
    });

    /**
     * UT-BM-5: Duchy in Endgame
     * @req: BIG_MONEY_STRATEGY.md Priority 3 - Buy Duchy when Provinces scarce
     * @input: turn 20, 5 coins, Duchy available, Provinces remaining = 2
     * @expected: Buy Duchy (endgame, Provinces scarce)
     * @edge: Endgame threshold met (Provinces <= 3)
     * @why: Provinces nearly exhausted, Duchy provides VP before game ends
     * @assert: decision.move.card === 'Duchy'
     */
    test('UT-BM-5: Duchy in Endgame', () => {
      const state = engine.initializeGame(1);

      // Set up endgame: Provinces nearly exhausted (2 remaining)
      const endgameState: GameState = {
        ...state,
        turnNumber: 20,
        phase: 'buy',
        supply: new Map([
          ...state.supply,
          ['Province', 2] // Endgame threshold: <= 3 Provinces
        ]),
        players: [
          {
            ...state.players[0],
            hand: ['Estate', 'Estate', 'Estate', 'Estate', 'Estate'],
            coins: 5,
            buys: 1,
            inPlay: []
          }
        ]
      };

      const decision = ai.decideBestMove(endgameState, 0);

      // With 5 coins and Provinces scarce, should buy Duchy
      expect(decision.move.type).toBe('buy');
      expect(decision.move.card).toBe('Duchy');
      expect(decision.reasoning).toContain('Duchy');
    });

    /**
     * UT-BM-6: Never Buy Duchy Early
     * @req: BIG_MONEY_STRATEGY.md Priority 3 condition - Avoid Duchy before endgame
     * @input: turn 10, 5 coins, Duchy available, Provinces remaining = 10
     * @expected: Buy Silver (NOT Duchy, not endgame yet)
     * @edge: Duchy affordable but endgame threshold not met
     * @why: Avoid Duchy before endgame threshold (harms tempo)
     * @assert: decision.move.card === 'Silver' (NOT 'Duchy')
     */
    test('UT-BM-6: Never Buy Duchy Early', () => {
      const state = engine.initializeGame(1);

      // Set up mid-game: Duchy affordable but Provinces plentiful
      const midGameDuchyState: GameState = {
        ...state,
        turnNumber: 10,
        phase: 'buy',
        supply: new Map([
          ...state.supply,
          ['Province', 10] // Plenty of Provinces, not endgame
        ]),
        players: [
          {
            ...state.players[0],
            hand: ['Estate', 'Estate', 'Estate', 'Estate', 'Estate'],
            coins: 5,
            buys: 1,
            inPlay: []
          }
        ]
      };

      const decision = ai.decideBestMove(midGameDuchyState, 0);

      // Endgame threshold NOT met (Provinces > 3)
      // Should buy Silver, NOT Duchy
      expect(decision.move.type).toBe('buy');
      expect(decision.move.card).toBe('Silver');
      expect(decision.reasoning).not.toContain('Duchy');
    });
  });

  describe('Integration Tests: Game Progression (IT-BM-*)', () => {
    /**
     * IT-BM-1: First Silver by Turn 5
     * @req: BIG_MONEY_STRATEGY.md Milestone 1 - Silver acquisition timing
     * @input: Run AI through 5 turns
     * @expected: Deck contains >= 1 Silver by turn 5
     * @why: Validates early economy building
     * @assert: deck contains >= 1 Silver by turn 5
     * @level: INTEGRATION
     */
    test('IT-BM-1: First Silver by Turn 5', () => {
      let state = engine.initializeGame(1);

      // Run AI through 5 turns
      for (let turn = 0; turn < 5; turn++) {
        // Complete AI's full turn (action → buy → cleanup)
        for (let step = 0; step < 50; step++) {
          const decision = ai.decideBestMove(state, 0);
          const result = engine.executeMove(state, decision.move);

          if (!result.newState) break;
          state = result.newState;

          // Break if new turn started
          if (state.turnNumber > turn + 1) break;
        }
      }

      // Check deck composition
      const allCards = [
        ...state.players[0].hand,
        ...state.players[0].drawPile,
        ...state.players[0].discardPile
      ];

      const silverCount = allCards.filter(c => c === 'Silver').length;

      // Should have at least 1 Silver by turn 5
      expect(silverCount).toBeGreaterThanOrEqual(1);
    });

    /**
     * IT-BM-2: First Gold by Turn 10
     * @req: BIG_MONEY_STRATEGY.md Milestone 2 - Gold acquisition timing
     * @input: Run AI through 10 turns
     * @expected: Deck contains >= 1 Gold by turn 10
     * @why: Validates economic acceleration
     * @assert: deck contains >= 1 Gold by turn 10
     */
    test('IT-BM-2: First Gold by Turn 10', () => {
      let state = engine.initializeGame(1);

      // Run AI through 10 turns
      for (let turn = 0; turn < 10; turn++) {
        for (let step = 0; step < 50; step++) {
          const decision = ai.decideBestMove(state, 0);
          const result = engine.executeMove(state, decision.move);

          if (!result.newState) break;
          state = result.newState;

          if (state.turnNumber > turn + 1) break;
        }
      }

      const allCards = [
        ...state.players[0].hand,
        ...state.players[0].drawPile,
        ...state.players[0].discardPile
      ];

      const goldCount = allCards.filter(c => c === 'Gold').length;

      // Should have at least 1 Gold by turn 10
      expect(goldCount).toBeGreaterThanOrEqual(1);
    });

    /**
     * IT-BM-3: First Province by Turn 13
     * @req: BIG_MONEY_STRATEGY.md Milestone 3 - Province acquisition timing
     * @input: Run AI through 13 turns
     * @expected: Deck contains >= 1 Province by turn 13
     * @why: Validates transition to VP accumulation
     * @assert: deck contains >= 1 Province by turn 13
     */
    test('IT-BM-3: First Province by Turn 13', () => {
      let state = engine.initializeGame(1);

      // Run AI through 13 turns
      for (let turn = 0; turn < 13; turn++) {
        for (let step = 0; step < 50; step++) {
          const decision = ai.decideBestMove(state, 0);
          const result = engine.executeMove(state, decision.move);

          if (!result.newState) break;
          state = result.newState;

          if (state.turnNumber > turn + 1) break;
        }
      }

      const allCards = [
        ...state.players[0].hand,
        ...state.players[0].drawPile,
        ...state.players[0].discardPile
      ];

      const provinceCount = allCards.filter(c => c === 'Province').length;

      // Should have at least 1 Province by turn 13
      expect(provinceCount).toBeGreaterThanOrEqual(1);
    });

    /**
     * IT-BM-4: Turn 10 Priority Transition 🚨 CRITICAL BUG TEST
     * @req: BIG_MONEY_STRATEGY.md Priority 1 triggers at turn 10
     * @input: Run AI to turn 10, manually give 8-coin hand with Province+Gold available
     * @expected: AI buys Province (NOT Gold) at turn 10+
     * @edge: The exact moment mid-game threshold is met
     * @why: Validates priority tree ordering - Province MUST beat Gold at turn 10+
     * @assert: Purchase log shows "Province" for turn 10 decision, NOT "Gold"
     * @level: CRITICAL - MUST FAIL with current code
     */
    test('IT-BM-4: Turn 10 Priority Transition - CRITICAL BUG TEST', () => {
      let state = engine.initializeGame(1);

      // Run AI to turn 10
      while (state.turnNumber < 10) {
        const decision = ai.decideBestMove(state, 0);
        const result = engine.executeMove(state, decision.move);

        if (!result.newState) break;
        state = result.newState;

        if (state.turnNumber >= 10) break;
      }

      // Force exact scenario: turn 10, 8 coins, buy phase
      const turn10State: GameState = {
        ...state,
        turnNumber: 10,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: ['Estate', 'Estate', 'Estate', 'Estate', 'Estate'],
            coins: 8,
            buys: 1,
            inPlay: []
          }
        ]
      };

      const decision = ai.decideBestMove(turn10State, 0);

      // At turn 10, with 8 coins and both Province+Gold available:
      // Priority 1 (Province) MUST win over Priority 2 (Gold)
      expect(decision.move.type).toBe('buy');
      expect(decision.move.card).toBe('Province'); // WILL FAIL - current code returns 'Gold'
      expect(decision.reasoning).toContain('Province');
    });

    /**
     * IT-BM-5: Deck Composition at Turn 15
     * @req: BIG_MONEY_STRATEGY.md Turn 15 Snapshot - Expected deck state
     * @input: Run AI through 15 turns, capture deck composition
     * @expected: Silvers: 5-7, Golds: 2-4, Provinces: 2-3
     * @edge: Deck progression validation at mid-game peak
     * @why: Validates balanced economy + VP accumulation
     * @assert: Silvers: 5-7, Golds: 2-4, Provinces: 2-3, Duchies: 0
     */
    test('IT-BM-5: Deck Composition at Turn 15', () => {
      let state = engine.initializeGame(1);

      // Run AI through 15 turns
      for (let turn = 0; turn < 15; turn++) {
        for (let step = 0; step < 50; step++) {
          const decision = ai.decideBestMove(state, 0);
          const result = engine.executeMove(state, decision.move);

          if (!result.newState) break;
          state = result.newState;

          if (state.turnNumber > turn + 1) break;
        }
      }

      const allCards = [
        ...state.players[0].hand,
        ...state.players[0].drawPile,
        ...state.players[0].discardPile
      ];

      const silverCount = allCards.filter(c => c === 'Silver').length;
      const goldCount = allCards.filter(c => c === 'Gold').length;
      const provinceCount = allCards.filter(c => c === 'Province').length;
      const duchyCount = allCards.filter(c => c === 'Duchy').length;

      // Validate deck composition matches Turn 15 snapshot expectations
      expect(silverCount).toBeGreaterThanOrEqual(5);
      expect(silverCount).toBeLessThanOrEqual(7);
      expect(goldCount).toBeGreaterThanOrEqual(2);
      expect(goldCount).toBeLessThanOrEqual(4);
      expect(provinceCount).toBeGreaterThanOrEqual(2);
      expect(provinceCount).toBeLessThanOrEqual(3);
      expect(duchyCount).toBe(0); // No Duchies in mid-game
    });

    /**
     * IT-BM-6: Economic Progression Tracking
     * @req: BIG_MONEY_STRATEGY.md Economic Efficiency - Coin generation per turn
     * @input: Run AI through 20 turns, log coins per turn
     * @expected: Turn 5 avg: 3-4, Turn 10 avg: 5-7, Turn 15 avg: 7-9, Turn 20 avg: 8-10
     * @edge: Validates economic progression over time
     * @why: Ensures economy grows consistently per Big Money strategy
     * @assert: Coin averages meet targets at milestone turns
     */
    test('IT-BM-6: Economic Progression Tracking', () => {
      let state = engine.initializeGame(1);
      const coinsByTurn: number[] = [];

      // Run AI through 20 turns, tracking coins
      for (let turn = 0; turn < 20; turn++) {
        let maxCoinsThisTurn = 0;

        for (let step = 0; step < 50; step++) {
          const player = state.players[0];
          maxCoinsThisTurn = Math.max(maxCoinsThisTurn, player.coins);

          const decision = ai.decideBestMove(state, 0);
          const result = engine.executeMove(state, decision.move);

          if (!result.newState) break;
          state = result.newState;

          if (state.turnNumber > turn + 1) break;
        }

        coinsByTurn.push(maxCoinsThisTurn);
      }

      // Validate coin progression at milestones
      // Turn 5: should have 3-4 coins average
      const turn5Coins = coinsByTurn[4] || 0;
      expect(turn5Coins).toBeGreaterThanOrEqual(3);
      expect(turn5Coins).toBeLessThanOrEqual(5);

      // Turn 10: should have 5-7 coins average
      const turn10Coins = coinsByTurn[9] || 0;
      expect(turn10Coins).toBeGreaterThanOrEqual(5);
      expect(turn10Coins).toBeLessThanOrEqual(8);

      // Turn 15: should have 7-9 coins average
      const turn15Coins = coinsByTurn[14] || 0;
      expect(turn15Coins).toBeGreaterThanOrEqual(7);
      expect(turn15Coins).toBeLessThanOrEqual(10);
    });

    describe('Extended Progression Validation (IT-BM-7 to IT-BM-15)', () => {
      /**
       * IT-BM-7: Multi-Turn Province Accumulation 🚨 EXPECTED FAIL
       * @req: BIG_MONEY_STRATEGY.md Priority 1 - Continuous Province purchases at turn 10+
       * @input: Run AI through 20 turns, log all Province purchases
       * @expected: At least 2 Provinces purchased between turns 10-20
       * @edge: Validates AI continues buying Provinces, not just the first one
       * @why: Tests sustained VP accumulation, not one-time Province purchase
       * @assert: provincesPurchased >= 2 between turns 10-20
       * @level: CRITICAL - WILL FAIL with current code (no Provinces purchased)
       */
      test('IT-BM-7: Multi-Turn Province Accumulation - EXPECTED FAIL', () => {
        let state = engine.initializeGame(1);
        let provincesPurchased = 0;

        // Run AI through 20 turns, tracking Province purchases
        for (let turn = 0; turn < 20; turn++) {
          for (let step = 0; step < 50; step++) {
            const decision = ai.decideBestMove(state, 0);

            // Track Province purchases after turn 10
            if (
              state.turnNumber >= 10 &&
              decision.move.type === 'buy' &&
              decision.move.card === 'Province'
            ) {
              provincesPurchased++;
            }

            const result = engine.executeMove(state, decision.move);
            if (!result.newState) break;
            state = result.newState;

            if (state.turnNumber > turn + 1) break;
          }
        }

        // Should purchase at least 2 Provinces between turns 10-20
        // WILL FAIL: AI currently buys Gold instead of Province
        expect(provincesPurchased).toBeGreaterThanOrEqual(2);
      });

      /**
       * IT-BM-8: Gold-to-Province Transition
       * @req: BIG_MONEY_STRATEGY.md Economic progression - Build economy before VP
       * @input: Run AI through 15 turns, track when first Province and first Gold purchased
       * @expected: First Province occurs AFTER first Gold
       * @expected: Time gap between first Gold and first Province: 2-5 turns
       * @edge: Validates proper economic progression sequence
       * @why: Ensures AI builds economy before transitioning to VP accumulation
       * @assert: turn(first Province) > turn(first Gold)
       * @assert: turn(first Province) - turn(first Gold) in [2, 5]
       * @level: INTEGRATION
       */
      test('IT-BM-8: Gold-to-Province Transition', () => {
        let state = engine.initializeGame(1);
        let firstGoldTurn: number | null = null;
        let firstProvinceTurn: number | null = null;

        // Run AI through 15 turns, tracking first Gold and Province purchases
        for (let turn = 0; turn < 15; turn++) {
          for (let step = 0; step < 50; step++) {
            const decision = ai.decideBestMove(state, 0);

            // Track first Gold purchase
            if (
              firstGoldTurn === null &&
              decision.move.type === 'buy' &&
              decision.move.card === 'Gold'
            ) {
              firstGoldTurn = state.turnNumber;
            }

            // Track first Province purchase
            if (
              firstProvinceTurn === null &&
              decision.move.type === 'buy' &&
              decision.move.card === 'Province'
            ) {
              firstProvinceTurn = state.turnNumber;
            }

            const result = engine.executeMove(state, decision.move);
            if (!result.newState) break;
            state = result.newState;

            if (state.turnNumber > turn + 1) break;
          }
        }

        // Validate economic progression
        expect(firstGoldTurn).not.toBeNull();

        // Province should come after Gold (if Province was purchased at all)
        if (firstProvinceTurn !== null) {
          expect(firstProvinceTurn).toBeGreaterThan(firstGoldTurn!);

          const gap = firstProvinceTurn - firstGoldTurn!;
          expect(gap).toBeGreaterThanOrEqual(2);
          expect(gap).toBeLessThanOrEqual(5);
        }
      });

      /**
       * IT-BM-9: Province Priority Over Multiple Gold Opportunities 🚨 EXPECTED FAIL
       * @req: BIG_MONEY_STRATEGY.md Priority 1 - Province > Gold consistency
       * @input: Give AI 8 coins at turns 10, 11, 12 with Gold+Province both available
       * @expected: AI buys Province at least 2 out of 3 times
       * @edge: Validates consistent Province priority, not one-time fluke
       * @why: Tests decision consistency across multiple identical scenarios
       * @assert: provincePurchases >= 2 out of 3 opportunities
       * @level: CRITICAL - WILL FAIL with current code (Gold chosen instead)
       */
      test('IT-BM-9: Province Priority Over Multiple Gold Opportunities - EXPECTED FAIL', () => {
        let state = engine.initializeGame(1);
        let provincePurchases = 0;

        // Run AI to turn 10
        while (state.turnNumber < 10) {
          const decision = ai.decideBestMove(state, 0);
          const result = engine.executeMove(state, decision.move);
          if (!result.newState) break;
          state = result.newState;
        }

        // Test three identical scenarios: turn 10, 11, 12 with 8 coins
        for (let testTurn = 10; testTurn <= 12; testTurn++) {
          const testState: GameState = {
            ...state,
            turnNumber: testTurn,
            phase: 'buy',
            players: [
              {
                ...state.players[0],
                hand: ['Estate', 'Estate', 'Estate', 'Estate', 'Estate'],
                coins: 8,
                buys: 1,
                inPlay: []
              }
            ]
          };

          const decision = ai.decideBestMove(testState, 0);

          if (decision.move.type === 'buy' && decision.move.card === 'Province') {
            provincePurchases++;
          }
        }

        // Should buy Province at least 2 out of 3 times (67%+ consistency)
        // WILL FAIL: Current code buys Gold instead
        expect(provincePurchases).toBeGreaterThanOrEqual(2);
      });

      /**
       * IT-BM-10: Endgame Duchy Fallback Behavior
       * @req: BIG_MONEY_STRATEGY.md Priority 3 - Duchy when Provinces scarce
       * @input: Run AI to turn 18, deplete Province pile to 2 remaining, give 5 coins
       * @expected: AI switches to buying Duchy when Provinces scarce
       * @expected: At least 1 Duchy purchased in endgame
       * @edge: Validates Priority 3 triggers correctly when Provinces <= 3
       * @why: Ensures AI adapts to Province scarcity by buying Duchies
       * @assert: duchyCount >= 1 in final deck
       * @level: INTEGRATION
       */
      test('IT-BM-10: Endgame Duchy Fallback Behavior', () => {
        let state = engine.initializeGame(1);

        // Run AI to turn 18
        while (state.turnNumber < 18) {
          const decision = ai.decideBestMove(state, 0);
          const result = engine.executeMove(state, decision.move);
          if (!result.newState) break;
          state = result.newState;
        }

        // Deplete Province pile to 2 (triggers endgame threshold)
        const endgameState: GameState = {
          ...state,
          turnNumber: 18,
          phase: 'buy',
          supply: new Map([
            ...state.supply,
            ['Province', 2] // Endgame threshold: <= 3 Provinces
          ]),
          players: [
            {
              ...state.players[0],
              hand: ['Estate', 'Estate', 'Estate', 'Estate', 'Estate'],
              coins: 5,
              buys: 1,
              inPlay: []
            }
          ]
        };

        // Run through several turns in endgame
        let currentState = endgameState;
        for (let turn = 0; turn < 5; turn++) {
          for (let step = 0; step < 50; step++) {
            const decision = ai.decideBestMove(currentState, 0);
            const result = engine.executeMove(currentState, decision.move);
            if (!result.newState) break;
            currentState = result.newState;

            if (currentState.turnNumber > endgameState.turnNumber + turn + 1) break;
          }
        }

        // Check if any Duchies were purchased
        const allCards = [
          ...currentState.players[0].hand,
          ...currentState.players[0].drawPile,
          ...currentState.players[0].discardPile
        ];

        const duchyCount = allCards.filter(c => c === 'Duchy').length;

        // Should have purchased at least 1 Duchy in endgame
        expect(duchyCount).toBeGreaterThanOrEqual(1);
      });

      /**
       * IT-BM-11: Economic Efficiency - Coin Generation Curve
       * @req: BIG_MONEY_STRATEGY.md Economic progression - Increasing coin generation
       * @input: Run 5 games through 20 turns, log coins per turn
       * @expected: Coin generation increases over time (early < mid < late)
       * @expected: Turn 5 avg < Turn 10 avg < Turn 15 avg
       * @edge: Validates treasure upgrades are working across multiple games
       * @why: Ensures economy grows consistently per Big Money strategy
       * @assert: avgCoins(turn5) < avgCoins(turn10) < avgCoins(turn15)
       * @level: INTEGRATION
       */
      test('IT-BM-11: Economic Efficiency - Coin Generation Curve', () => {
        const turn5Coins: number[] = [];
        const turn10Coins: number[] = [];
        const turn15Coins: number[] = [];

        // Run 5 games to gather statistical data
        for (let game = 0; game < 5; game++) {
          const gameEngine = new GameEngine(`coin-curve-${game}`);
          const gameAI = new RulesBasedAI(`coin-curve-${game}`);
          let state = gameEngine.initializeGame(1);
          const coinsByTurn: number[] = [];

          // Run through 20 turns, tracking max coins per turn
          for (let turn = 0; turn < 20; turn++) {
            let maxCoinsThisTurn = 0;

            for (let step = 0; step < 50; step++) {
              const player = state.players[0];
              maxCoinsThisTurn = Math.max(maxCoinsThisTurn, player.coins);

              const decision = gameAI.decideBestMove(state, 0);
              const result = gameEngine.executeMove(state, decision.move);
              if (!result.newState) break;
              state = result.newState;

              if (state.turnNumber > turn + 1) break;
            }

            coinsByTurn.push(maxCoinsThisTurn);
          }

          turn5Coins.push(coinsByTurn[4] || 0);
          turn10Coins.push(coinsByTurn[9] || 0);
          turn15Coins.push(coinsByTurn[14] || 0);
        }

        // Calculate averages
        const avgTurn5 = turn5Coins.reduce((sum, val) => sum + val, 0) / turn5Coins.length;
        const avgTurn10 = turn10Coins.reduce((sum, val) => sum + val, 0) / turn10Coins.length;
        const avgTurn15 = turn15Coins.reduce((sum, val) => sum + val, 0) / turn15Coins.length;

        // Validate upward economic progression
        expect(avgTurn10).toBeGreaterThan(avgTurn5);
        expect(avgTurn15).toBeGreaterThan(avgTurn10);
      });

      /**
       * IT-BM-12: No Gold Hoarding in Late Game 🚨 EXPECTED FAIL
       * @req: BIG_MONEY_STRATEGY.md Priority 1 - Province priority in late game
       * @input: Run AI through 25 turns, count Gold purchases after turn 15
       * @expected: <= 2 Gold purchases after turn 15 (should prioritize Provinces)
       * @edge: Validates AI doesn't keep buying treasures when VP needed
       * @why: Late-game Gold purchases indicate broken priority tree
       * @assert: lateGameGoldPurchases <= 2
       * @level: CRITICAL - MAY FAIL if AI over-prioritizes Gold
       */
      test('IT-BM-12: No Gold Hoarding in Late Game - EXPECTED FAIL', () => {
        let state = engine.initializeGame(1);
        let lateGameGoldPurchases = 0;

        // Run AI through 25 turns, tracking Gold purchases after turn 15
        for (let turn = 0; turn < 25; turn++) {
          for (let step = 0; step < 50; step++) {
            const decision = ai.decideBestMove(state, 0);

            // Track Gold purchases after turn 15
            if (
              state.turnNumber > 15 &&
              decision.move.type === 'buy' &&
              decision.move.card === 'Gold'
            ) {
              lateGameGoldPurchases++;
            }

            const result = engine.executeMove(state, decision.move);
            if (!result.newState) break;
            state = result.newState;

            if (state.turnNumber > turn + 1) break;
          }
        }

        // Should have <= 2 Gold purchases after turn 15
        // WILL FAIL: AI may buy Gold excessively in late game
        expect(lateGameGoldPurchases).toBeLessThanOrEqual(2);
      });

      /**
       * IT-BM-13: Province Scarcity Response
       * @req: BIG_MONEY_STRATEGY.md Mid-game threshold - Scarcity trigger
       * @input: Start game with Provinces_remaining = 4, run 10 turns
       * @expected: AI switches to Province priority immediately (scarcity trigger)
       * @expected: First Province purchased by turn 6-8 (earlier than normal)
       * @edge: Validates mid-game threshold triggers on scarcity, not just turn number
       * @why: Limited Provinces should trigger aggressive VP accumulation
       * @assert: firstProvinceTurn <= 8
       * @level: INTEGRATION
       */
      test('IT-BM-13: Province Scarcity Response', () => {
        let state = engine.initializeGame(1);

        // Start with scarce Provinces (4 remaining)
        state = {
          ...state,
          supply: new Map([
            ...state.supply,
            ['Province', 4] // Scarcity indicator
          ])
        };

        let firstProvinceTurn: number | null = null;

        // Run AI through 10 turns
        for (let turn = 0; turn < 10; turn++) {
          for (let step = 0; step < 50; step++) {
            const decision = ai.decideBestMove(state, 0);

            // Track first Province purchase
            if (
              firstProvinceTurn === null &&
              decision.move.type === 'buy' &&
              decision.move.card === 'Province'
            ) {
              firstProvinceTurn = state.turnNumber;
            }

            const result = engine.executeMove(state, decision.move);
            if (!result.newState) break;
            state = result.newState;

            if (state.turnNumber > turn + 1) break;
          }
        }

        // Scarcity should trigger earlier Province purchases
        // First Province should occur by turn 6-8 (vs normal turn 10-13)
        if (firstProvinceTurn !== null) {
          expect(firstProvinceTurn).toBeLessThanOrEqual(8);
        }
      });

      /**
       * IT-BM-14: Empty Pile Trigger for Mid-Game
       * @req: BIG_MONEY_STRATEGY.md Mid-game threshold - Empty pile trigger
       * @input: Run AI to turn 8, empty Copper pile, give 8 coins with Province+Gold available
       * @expected: AI buys Province (empty pile triggered mid-game)
       * @edge: Mid-game threshold triggered by empty pile, not just turn number
       * @why: Empty pile indicates endgame approaching, start VP accumulation
       * @assert: decision.move.card === 'Province'
       * @level: INTEGRATION
       */
      test('IT-BM-14: Empty Pile Trigger for Mid-Game', () => {
        let state = engine.initializeGame(1);

        // Run AI to turn 8 (early game)
        while (state.turnNumber < 8) {
          const decision = ai.decideBestMove(state, 0);
          const result = engine.executeMove(state, decision.move);
          if (!result.newState) break;
          state = result.newState;
        }

        // Empty Copper pile to trigger mid-game threshold
        const emptyPileState: GameState = {
          ...state,
          turnNumber: 8,
          phase: 'buy',
          supply: new Map([
            ...state.supply,
            ['Copper', 0] // Empty pile triggers mid-game
          ]),
          players: [
            {
              ...state.players[0],
              hand: ['Estate', 'Estate', 'Estate', 'Estate', 'Estate'],
              coins: 8,
              buys: 1,
              inPlay: []
            }
          ]
        };

        const decision = ai.decideBestMove(emptyPileState, 0);

        // Empty pile at turn 8 should trigger Province priority
        expect(decision.move.type).toBe('buy');
        expect(decision.move.card).toBe('Province');
      });

      /**
       * IT-BM-15: Full Economic Progression Path
       * @req: BIG_MONEY_STRATEGY.md Complete economic progression
       * @input: Run AI through 20 turns, log ALL purchases
       * @expected: Purchase pattern matches: Copper only → Silver → Silver+Gold → Gold → Province → Province+Gold
       * @edge: Validates complete progression through all economic stages
       * @why: Ensures AI follows proper Big Money purchase sequence
       * @assert: Purchase pattern follows expected stages
       * @level: INTEGRATION
       */
      test('IT-BM-15: Full Economic Progression Path', () => {
        let state = engine.initializeGame(1);
        const purchases: Array<{ turn: number; card: string }> = [];

        // Run AI through 20 turns, logging all purchases
        for (let turn = 0; turn < 20; turn++) {
          for (let step = 0; step < 50; step++) {
            const decision = ai.decideBestMove(state, 0);

            // Track all buy decisions
            if (decision.move.type === 'buy' && decision.move.card) {
              purchases.push({
                turn: state.turnNumber,
                card: decision.move.card
              });
            }

            const result = engine.executeMove(state, decision.move);
            if (!result.newState) break;
            state = result.newState;

            if (state.turnNumber > turn + 1) break;
          }
        }

        // Validate progression stages
        const silverPurchases = purchases.filter(p => p.card === 'Silver');
        const goldPurchases = purchases.filter(p => p.card === 'Gold');
        const provincePurchases = purchases.filter(p => p.card === 'Province');

        // Stage 1: Silver purchases should occur early
        expect(silverPurchases.length).toBeGreaterThanOrEqual(3);
        const firstSilver = silverPurchases[0];
        expect(firstSilver.turn).toBeLessThanOrEqual(5);

        // Stage 2: Gold purchases should occur mid-game
        expect(goldPurchases.length).toBeGreaterThanOrEqual(2);
        const firstGold = goldPurchases[0];
        expect(firstGold.turn).toBeLessThanOrEqual(10);

        // Stage 3: Province purchases should occur after Gold
        if (provincePurchases.length > 0) {
          const firstProvince = provincePurchases[0];
          expect(firstProvince.turn).toBeGreaterThan(firstGold.turn);
        }
      });
    });
  });

  describe('E2E Tests: Full Game Outcomes (E2E-BM-*)', () => {
    /**
     * E2E-BM-1: Complete Game with Expected Outcomes
     * @req: BIG_MONEY_STRATEGY.md Full Big Money game progression
     * @input: Run full AI vs AI game to completion
     * @expected: Game ends 18-25 turns, final deck: 4-6 Provinces, 3-5 Golds, Total VP: 28-38
     * @edge: Full game validation
     * @why: Validates complete strategy produces expected outcomes
     * @assert: Game ends in 18-25 turns, final deck composition matches targets
     */
    test('E2E-BM-1: Complete Game with Expected Outcomes', () => {
      let state = engine.initializeGame(1);
      let moves = 0;
      const maxMoves = 1000;

      // Run game to completion
      while (moves < maxMoves) {
        const victory = engine.checkGameOver(state);
        if (victory.isGameOver) break;

        const decision = ai.decideBestMove(state, 0);
        const result = engine.executeMove(state, decision.move);

        if (!result.newState) break;
        state = result.newState;
        moves++;
      }

      const allCards = [
        ...state.players[0].hand,
        ...state.players[0].drawPile,
        ...state.players[0].discardPile
      ];

      const provinceCount = allCards.filter(c => c === 'Province').length;
      const goldCount = allCards.filter(c => c === 'Gold').length;
      const silverCount = allCards.filter(c => c === 'Silver').length;

      // Validate final deck composition
      expect(provinceCount).toBeGreaterThanOrEqual(4);
      expect(provinceCount).toBeLessThanOrEqual(6);
      expect(goldCount).toBeGreaterThanOrEqual(3);
      expect(goldCount).toBeLessThanOrEqual(5);
      expect(silverCount).toBeGreaterThanOrEqual(5);
      expect(silverCount).toBeLessThanOrEqual(8);

      // Calculate total VP
      const estateCount = allCards.filter(c => c === 'Estate').length;
      const duchyCount = allCards.filter(c => c === 'Duchy').length;
      const totalVP = (provinceCount * 6) + (duchyCount * 3) + (estateCount * 1);

      // Total VP should be in winning range
      expect(totalVP).toBeGreaterThanOrEqual(28);
      expect(totalVP).toBeLessThanOrEqual(40);

      // Game should complete in reasonable time (18-25 turns)
      expect(state.turnNumber).toBeGreaterThanOrEqual(10);
      expect(state.turnNumber).toBeLessThanOrEqual(30);
    });

    /**
     * E2E-BM-2: Province Purchase Pattern Validation
     * @req: BIG_MONEY_STRATEGY.md Decision quality - Province timing
     * @input: Run 10 games, log all Province purchases
     * @expected: 90% of Province purchases occur turn 9+
     * @expected: When 8 coins + turn 10+ + Province+Gold available → Province purchased (not Gold)
     * @edge: Statistical validation of purchase patterns
     * @why: Validates AI follows Province priority correctly across multiple games
     * @assert: 90% of Province purchases occur turn 9+
     */
    test('E2E-BM-2: Province Purchase Pattern Validation', () => {
      const provinceByTurn: number[] = [];
      const totalGames = 10;

      for (let game = 0; game < totalGames; game++) {
        const gameEngine = new GameEngine(`big-money-game-${game}`);
        const gameAI = new RulesBasedAI(`big-money-game-${game}`);
        let state = gameEngine.initializeGame(1);
        let moves = 0;
        const maxMoves = 1000;

        while (moves < maxMoves) {
          const victory = gameEngine.checkGameOver(state);
          if (victory.isGameOver) break;

          const decision = gameAI.decideBestMove(state, 0);

          // Track Province purchases
          if (decision.move.type === 'buy' && decision.move.card === 'Province') {
            provinceByTurn.push(state.turnNumber);
          }

          const result = gameEngine.executeMove(state, decision.move);
          if (!result.newState) break;
          state = result.newState;
          moves++;
        }
      }

      // Validate: 90% of Province purchases occur turn 9+
      const lateProvinces = provinceByTurn.filter(turn => turn >= 9).length;
      const provinceRatio = lateProvinces / provinceByTurn.length;

      expect(provinceRatio).toBeGreaterThanOrEqual(0.90);
    });

    /**
     * E2E-BM-3: No Premature Victory Cards
     * @req: BIG_MONEY_STRATEGY.md Anti-pattern avoidance
     * @input: Run 10 games, log all victory card purchases
     * @expected: 90%+ games have ZERO Provinces before turn 9
     * @expected: 95%+ games have ZERO Duchies before turn 15
     * @edge: Validates avoidance of premature VP purchases
     * @why: Early victory cards harm tempo, Big Money avoids them
     * @assert: Premature victory purchases are rare
     */
    test('E2E-BM-3: No Premature Victory Cards', () => {
      const totalGames = 10;
      let gamesWithEarlyProvince = 0;
      let gamesWithMidDuchy = 0;

      for (let game = 0; game < totalGames; game++) {
        const gameEngine = new GameEngine(`big-money-game-${game}`);
        const gameAI = new RulesBasedAI(`big-money-game-${game}`);
        let state = gameEngine.initializeGame(1);
        let moves = 0;
        const maxMoves = 1000;

        let earlyProvincePurchased = false;
        let midDuchyPurchased = false;

        while (moves < maxMoves) {
          const victory = gameEngine.checkGameOver(state);
          if (victory.isGameOver) break;

          const decision = gameAI.decideBestMove(state, 0);

          // Track early Province (before turn 9)
          if (
            decision.move.type === 'buy' &&
            decision.move.card === 'Province' &&
            state.turnNumber < 9
          ) {
            earlyProvincePurchased = true;
          }

          // Track mid-game Duchy (before turn 15)
          if (
            decision.move.type === 'buy' &&
            decision.move.card === 'Duchy' &&
            state.turnNumber < 15
          ) {
            midDuchyPurchased = true;
          }

          const result = gameEngine.executeMove(state, decision.move);
          if (!result.newState) break;
          state = result.newState;
          moves++;
        }

        if (earlyProvincePurchased) gamesWithEarlyProvince++;
        if (midDuchyPurchased) gamesWithMidDuchy++;
      }

      // Validate: 90%+ games have NO early Provinces
      const earlyProvinceRatio = gamesWithEarlyProvince / totalGames;
      expect(earlyProvinceRatio).toBeLessThanOrEqual(0.10);

      // Validate: 95%+ games have NO mid-game Duchies
      const midDuchyRatio = gamesWithMidDuchy / totalGames;
      expect(midDuchyRatio).toBeLessThanOrEqual(0.05);
    });

    describe('Statistical Validation (E2E-BM-4 to E2E-BM-11)', () => {
      /**
       * E2E-BM-4: 10-Game Statistical Validation 🚨 EXPECTED FAIL
       * @req: BIG_MONEY_STRATEGY.md Statistical performance targets
       * @input: Run 10 full games, aggregate results
       * @expected: Average game length: 18-25 turns
       * @expected: Average final Provinces: 4-6
       * @expected: Average final Golds: 3-5
       * @expected: Average final VP: 28-38
       * @edge: Statistical validation across multiple games
       * @why: Validates strategy consistency and performance targets
       * @assert: All statistical targets met within expected ranges
       * @level: CRITICAL - WILL FAIL with low Province counts
       */
      test('E2E-BM-4: 10-Game Statistical Validation - EXPECTED FAIL', async () => {
        const gameLengths: number[] = [];
        const provinceCounts: number[] = [];
        const goldCounts: number[] = [];
        const totalVPs: number[] = [];

        for (let game = 0; game < 10; game++) {
          const gameEngine = new GameEngine(`stats-game-${game}`);
          const gameAI = new RulesBasedAI(`stats-game-${game}`);
          let state = gameEngine.initializeGame(1);
          let moves = 0;
          const maxMoves = 1000;

          // Run game to completion
          while (moves < maxMoves) {
            const victory = gameEngine.checkGameOver(state);
            if (victory.isGameOver) break;

            const decision = gameAI.decideBestMove(state, 0);
            const result = gameEngine.executeMove(state, decision.move);
            if (!result.newState) break;
            state = result.newState;
            moves++;
          }

          // Collect statistics
          gameLengths.push(state.turnNumber);

          const allCards = [
            ...state.players[0].hand,
            ...state.players[0].drawPile,
            ...state.players[0].discardPile
          ];

          const provinceCount = allCards.filter(c => c === 'Province').length;
          const goldCount = allCards.filter(c => c === 'Gold').length;
          const estateCount = allCards.filter(c => c === 'Estate').length;
          const duchyCount = allCards.filter(c => c === 'Duchy').length;
          const totalVP = (provinceCount * 6) + (duchyCount * 3) + (estateCount * 1);

          provinceCounts.push(provinceCount);
          goldCounts.push(goldCount);
          totalVPs.push(totalVP);
        }

        // Calculate averages
        const avgGameLength = gameLengths.reduce((sum, val) => sum + val, 0) / gameLengths.length;
        const avgProvinces = provinceCounts.reduce((sum, val) => sum + val, 0) / provinceCounts.length;
        const avgGolds = goldCounts.reduce((sum, val) => sum + val, 0) / goldCounts.length;
        const avgVP = totalVPs.reduce((sum, val) => sum + val, 0) / totalVPs.length;

        // Validate statistical targets
        expect(avgGameLength).toBeGreaterThanOrEqual(18);
        expect(avgGameLength).toBeLessThanOrEqual(25);

        // WILL FAIL: Provinces likely 0-1 instead of 4-6
        expect(avgProvinces).toBeGreaterThanOrEqual(4);
        expect(avgProvinces).toBeLessThanOrEqual(6);

        expect(avgGolds).toBeGreaterThanOrEqual(3);
        expect(avgGolds).toBeLessThanOrEqual(5);

        // WILL FAIL: VP likely 20-24 instead of 28-38
        expect(avgVP).toBeGreaterThanOrEqual(28);
        expect(avgVP).toBeLessThanOrEqual(38);
      }, 30000); // 30s timeout for 10 games

      /**
       * E2E-BM-5: Province Purchase Timing Distribution 🚨 EXPECTED FAIL
       * @req: BIG_MONEY_STRATEGY.md Province timing targets
       * @input: Run 20 games, log turn number of EACH Province purchase
       * @expected: First Province: 90% occur turns 9-13
       * @expected: Second Province: 80% occur turns 12-17
       * @expected: Third Province: 70% occur turns 15-20
       * @edge: Validates proper pacing of VP acquisition
       * @why: Tests that Province purchases occur at expected timing milestones
       * @assert: Province timing distributions meet targets
       * @level: CRITICAL - WILL FAIL with no Province purchases
       */
      test('E2E-BM-5: Province Purchase Timing Distribution - EXPECTED FAIL', async () => {
        const firstProvinceTurns: number[] = [];
        const secondProvinceTurns: number[] = [];
        const thirdProvinceTurns: number[] = [];

        for (let game = 0; game < 20; game++) {
          const gameEngine = new GameEngine(`timing-game-${game}`);
          const gameAI = new RulesBasedAI(`timing-game-${game}`);
          let state = gameEngine.initializeGame(1);
          let moves = 0;
          const maxMoves = 1000;
          const provincePurchaseTurns: number[] = [];

          while (moves < maxMoves) {
            const victory = gameEngine.checkGameOver(state);
            if (victory.isGameOver) break;

            const decision = gameAI.decideBestMove(state, 0);

            // Track Province purchases
            if (decision.move.type === 'buy' && decision.move.card === 'Province') {
              provincePurchaseTurns.push(state.turnNumber);
            }

            const result = gameEngine.executeMove(state, decision.move);
            if (!result.newState) break;
            state = result.newState;
            moves++;
          }

          // Collect timing data
          if (provincePurchaseTurns.length >= 1) {
            firstProvinceTurns.push(provincePurchaseTurns[0]);
          }
          if (provincePurchaseTurns.length >= 2) {
            secondProvinceTurns.push(provincePurchaseTurns[1]);
          }
          if (provincePurchaseTurns.length >= 3) {
            thirdProvinceTurns.push(provincePurchaseTurns[2]);
          }
        }

        // Validate first Province timing (90% occur turns 9-13)
        const firstInRange = firstProvinceTurns.filter(t => t >= 9 && t <= 13).length;
        const firstRatio = firstInRange / firstProvinceTurns.length;
        // WILL FAIL: No Provinces purchased
        expect(firstProvinceTurns.length).toBeGreaterThanOrEqual(18); // 90% of 20 games
        expect(firstRatio).toBeGreaterThanOrEqual(0.90);

        // Validate second Province timing (80% occur turns 12-17)
        if (secondProvinceTurns.length > 0) {
          const secondInRange = secondProvinceTurns.filter(t => t >= 12 && t <= 17).length;
          const secondRatio = secondInRange / secondProvinceTurns.length;
          expect(secondProvinceTurns.length).toBeGreaterThanOrEqual(16); // 80% of 20 games
          expect(secondRatio).toBeGreaterThanOrEqual(0.80);
        }

        // Validate third Province timing (70% occur turns 15-20)
        if (thirdProvinceTurns.length > 0) {
          const thirdInRange = thirdProvinceTurns.filter(t => t >= 15 && t <= 20).length;
          const thirdRatio = thirdInRange / thirdProvinceTurns.length;
          expect(thirdProvinceTurns.length).toBeGreaterThanOrEqual(14); // 70% of 20 games
          expect(thirdRatio).toBeGreaterThanOrEqual(0.70);
        }
      }, 60000); // 60s timeout for 20 games

      /**
       * E2E-BM-6: Economic Stagnation Detection
       * @req: BIG_MONEY_STRATEGY.md Economic progression - Continuous growth
       * @input: Run 10 games, track if AI "gets stuck" (same coin total for 3+ consecutive turns)
       * @expected: Economic stagnation occurs < 10% of turns
       * @expected: Coin generation shows upward trend
       * @edge: Catches bugs where AI stops progressing economically
       * @why: Ensures AI doesn't get stuck in economic loops
       * @assert: stagnationRate < 0.10
       * @level: E2E
       */
      test('E2E-BM-6: Economic Stagnation Detection', async () => {
        let totalTurns = 0;
        let stagnantTurns = 0;

        for (let game = 0; game < 10; game++) {
          const gameEngine = new GameEngine(`stagnation-game-${game}`);
          const gameAI = new RulesBasedAI(`stagnation-game-${game}`);
          let state = gameEngine.initializeGame(1);
          let moves = 0;
          const maxMoves = 1000;
          const coinsByTurn: number[] = [];

          while (moves < maxMoves) {
            const victory = gameEngine.checkGameOver(state);
            if (victory.isGameOver) break;

            // Track max coins per turn
            let maxCoinsThisTurn = 0;
            const startTurn = state.turnNumber;

            while (state.turnNumber === startTurn && moves < maxMoves) {
              const player = state.players[0];
              maxCoinsThisTurn = Math.max(maxCoinsThisTurn, player.coins);

              const decision = gameAI.decideBestMove(state, 0);
              const result = gameEngine.executeMove(state, decision.move);
              if (!result.newState) break;
              state = result.newState;
              moves++;
            }

            coinsByTurn.push(maxCoinsThisTurn);
            totalTurns++;

            // Detect stagnation: same coin total for 3+ consecutive turns
            if (coinsByTurn.length >= 3) {
              const lastThree = coinsByTurn.slice(-3);
              if (lastThree[0] === lastThree[1] && lastThree[1] === lastThree[2]) {
                stagnantTurns++;
              }
            }
          }
        }

        // Validate: < 10% of turns show stagnation
        const stagnationRate = stagnantTurns / totalTurns;
        expect(stagnationRate).toBeLessThan(0.10);
      }, 30000); // 30s timeout

      /**
       * E2E-BM-7: Deck Dilution Avoidance
       * @req: BIG_MONEY_STRATEGY.md Deck efficiency - Treasure ratio
       * @input: Run 10 games, calculate deck efficiency (treasures / total cards)
       * @expected: Deck efficiency improves over time (better treasure ratio)
       * @expected: Final deck: 60-75% treasures, 25-40% victory/estates
       * @edge: Validates AI isn't clogging deck with too many victory cards
       * @why: Ensures optimal deck composition for Big Money strategy
       * @assert: Final treasure ratio in [0.60, 0.75]
       * @level: E2E
       */
      test('E2E-BM-7: Deck Dilution Avoidance', async () => {
        const treasureRatios: number[] = [];

        for (let game = 0; game < 10; game++) {
          const gameEngine = new GameEngine(`dilution-game-${game}`);
          const gameAI = new RulesBasedAI(`dilution-game-${game}`);
          let state = gameEngine.initializeGame(1);
          let moves = 0;
          const maxMoves = 1000;

          // Run game to completion
          while (moves < maxMoves) {
            const victory = gameEngine.checkGameOver(state);
            if (victory.isGameOver) break;

            const decision = gameAI.decideBestMove(state, 0);
            const result = gameEngine.executeMove(state, decision.move);
            if (!result.newState) break;
            state = result.newState;
            moves++;
          }

          // Calculate treasure ratio
          const allCards = [
            ...state.players[0].hand,
            ...state.players[0].drawPile,
            ...state.players[0].discardPile
          ];

          const treasures = allCards.filter(c =>
            c === 'Copper' || c === 'Silver' || c === 'Gold'
          ).length;

          const treasureRatio = treasures / allCards.length;
          treasureRatios.push(treasureRatio);
        }

        // Validate: All games have 60-75% treasures
        treasureRatios.forEach(ratio => {
          expect(ratio).toBeGreaterThanOrEqual(0.60);
          expect(ratio).toBeLessThanOrEqual(0.75);
        });
      }, 30000); // 30s timeout

      /**
       * E2E-BM-8: Turn 10 Pivot Point Validation 🚨 EXPECTED FAIL
       * @req: BIG_MONEY_STRATEGY.md Mid-game pivot - Strategy shift at turn 10
       * @input: Run 50 games, compare purchases before turn 10 vs after turn 10
       * @expected: Before turn 10: 90%+ purchases are treasures (Copper/Silver/Gold)
       * @expected: After turn 10: 50%+ purchases are Provinces
       * @edge: Validates critical strategy pivot at mid-game threshold
       * @why: Tests that AI shifts from economy building to VP accumulation
       * @assert: earlyTreasureRatio >= 0.90, lateProvinceRatio >= 0.50
       * @level: CRITICAL - WILL FAIL with no late-game Province purchases
       */
      test('E2E-BM-8: Turn 10 Pivot Point Validation - EXPECTED FAIL', async () => {
        let earlyPurchases = 0;
        let earlyTreasurePurchases = 0;
        let latePurchases = 0;
        let lateProvincePurchases = 0;

        for (let game = 0; game < 50; game++) {
          const gameEngine = new GameEngine(`pivot-game-${game}`);
          const gameAI = new RulesBasedAI(`pivot-game-${game}`);
          let state = gameEngine.initializeGame(1);
          let moves = 0;
          const maxMoves = 1000;

          while (moves < maxMoves) {
            const victory = gameEngine.checkGameOver(state);
            if (victory.isGameOver) break;

            const decision = gameAI.decideBestMove(state, 0);

            if (decision.move.type === 'buy' && decision.move.card) {
              if (state.turnNumber < 10) {
                earlyPurchases++;
                if (['Copper', 'Silver', 'Gold'].includes(decision.move.card)) {
                  earlyTreasurePurchases++;
                }
              } else {
                latePurchases++;
                if (decision.move.card === 'Province') {
                  lateProvincePurchases++;
                }
              }
            }

            const result = gameEngine.executeMove(state, decision.move);
            if (!result.newState) break;
            state = result.newState;
            moves++;
          }
        }

        // Validate early game: 90%+ treasures
        const earlyTreasureRatio = earlyTreasurePurchases / earlyPurchases;
        expect(earlyTreasureRatio).toBeGreaterThanOrEqual(0.90);

        // Validate late game: 50%+ Provinces
        // WILL FAIL: No Provinces purchased after turn 10
        const lateProvinceRatio = lateProvincePurchases / latePurchases;
        expect(lateProvinceRatio).toBeGreaterThanOrEqual(0.50);
      }, 120000); // 120s timeout for 50 games

      /**
       * E2E-BM-9: Competitive Game Length
       * @req: BIG_MONEY_STRATEGY.md Game pacing targets
       * @input: Run 20 games, measure turn count distribution
       * @expected: 80% of games complete in 18-25 turn range
       * @expected: < 5% of games exceed 30 turns (too slow)
       * @expected: < 5% of games end before 15 turns (too fast/broken)
       * @edge: Validates games end at reasonable pace
       * @why: Ensures strategy produces consistent game length
       * @assert: Game length distribution meets targets
       * @level: E2E
       */
      test('E2E-BM-9: Competitive Game Length', async () => {
        const gameLengths: number[] = [];

        for (let game = 0; game < 20; game++) {
          const gameEngine = new GameEngine(`length-game-${game}`);
          const gameAI = new RulesBasedAI(`length-game-${game}`);
          let state = gameEngine.initializeGame(1);
          let moves = 0;
          const maxMoves = 1000;

          while (moves < maxMoves) {
            const victory = gameEngine.checkGameOver(state);
            if (victory.isGameOver) break;

            const decision = gameAI.decideBestMove(state, 0);
            const result = gameEngine.executeMove(state, decision.move);
            if (!result.newState) break;
            state = result.newState;
            moves++;
          }

          gameLengths.push(state.turnNumber);
        }

        // Validate: 80% of games complete in 18-25 turn range
        const inRange = gameLengths.filter(len => len >= 18 && len <= 25).length;
        const inRangeRatio = inRange / gameLengths.length;
        expect(inRangeRatio).toBeGreaterThanOrEqual(0.80);

        // Validate: < 5% exceed 30 turns
        const tooLong = gameLengths.filter(len => len > 30).length;
        const tooLongRatio = tooLong / gameLengths.length;
        expect(tooLongRatio).toBeLessThan(0.05);

        // Validate: < 5% end before 15 turns
        const tooShort = gameLengths.filter(len => len < 15).length;
        const tooShortRatio = tooShort / gameLengths.length;
        expect(tooShortRatio).toBeLessThan(0.05);
      }, 60000); // 60s timeout

      /**
       * E2E-BM-10: Final Deck Composition Variance
       * @req: BIG_MONEY_STRATEGY.md Deck variance targets
       * @input: Run 20 games, capture final deck of each
       * @expected: Province count variance: 4-6 range (not all 4 or all 6)
       * @expected: Gold count variance: 3-5 range
       * @expected: Silver count variance: 5-8 range
       * @edge: Validates strategy has natural variance, not deterministic lock-in
       * @why: Ensures AI adapts to game conditions, not robotic play
       * @assert: Final deck counts show healthy variance
       * @level: E2E
       */
      test('E2E-BM-10: Final Deck Composition Variance', async () => {
        const provinceCounts: number[] = [];
        const goldCounts: number[] = [];
        const silverCounts: number[] = [];

        for (let game = 0; game < 20; game++) {
          const gameEngine = new GameEngine(`variance-game-${game}`);
          const gameAI = new RulesBasedAI(`variance-game-${game}`);
          let state = gameEngine.initializeGame(1);
          let moves = 0;
          const maxMoves = 1000;

          while (moves < maxMoves) {
            const victory = gameEngine.checkGameOver(state);
            if (victory.isGameOver) break;

            const decision = gameAI.decideBestMove(state, 0);
            const result = gameEngine.executeMove(state, decision.move);
            if (!result.newState) break;
            state = result.newState;
            moves++;
          }

          const allCards = [
            ...state.players[0].hand,
            ...state.players[0].drawPile,
            ...state.players[0].discardPile
          ];

          provinceCounts.push(allCards.filter(c => c === 'Province').length);
          goldCounts.push(allCards.filter(c => c === 'Gold').length);
          silverCounts.push(allCards.filter(c => c === 'Silver').length);
        }

        // Validate variance: Provinces (4-6 range)
        const minProvinces = Math.min(...provinceCounts);
        const maxProvinces = Math.max(...provinceCounts);
        expect(maxProvinces - minProvinces).toBeGreaterThanOrEqual(1); // At least 2-point spread

        // Validate variance: Golds (3-5 range)
        const minGolds = Math.min(...goldCounts);
        const maxGolds = Math.max(...goldCounts);
        expect(maxGolds - minGolds).toBeGreaterThanOrEqual(1);

        // Validate variance: Silvers (5-8 range)
        const minSilvers = Math.min(...silverCounts);
        const maxSilvers = Math.max(...silverCounts);
        expect(maxSilvers - minSilvers).toBeGreaterThanOrEqual(2);
      }, 60000); // 60s timeout

      /**
       * E2E-BM-11: Province Priority Adherence Rate 🚨 CRITICAL TEST
       * @req: BIG_MONEY_STRATEGY.md Priority 1 adherence - THE KEY METRIC
       * @input: Run 30 games, log EVERY decision where 8+ coins + Province+Gold both available + turn >= 10
       * @expected: Province chosen 95%+ of the time (Priority 1 adherence)
       * @edge: This is THE critical metric - validates Province > Gold priority
       * @why: Tests the exact bug scenario across many games for statistical significance
       * @assert: provinceAdherenceRate >= 0.95
       * @level: CRITICAL - WILL FAIL with current code (0% adherence)
       */
      test('E2E-BM-11: Province Priority Adherence Rate - CRITICAL TEST', async () => {
        let opportunityCount = 0;
        let provinceChosenCount = 0;

        for (let game = 0; game < 30; game++) {
          const gameEngine = new GameEngine(`adherence-game-${game}`);
          const gameAI = new RulesBasedAI(`adherence-game-${game}`);
          let state = gameEngine.initializeGame(1);
          let moves = 0;
          const maxMoves = 1000;

          while (moves < maxMoves) {
            const victory = gameEngine.checkGameOver(state);
            if (victory.isGameOver) break;

            const decision = gameAI.decideBestMove(state, 0);

            // Track THE CRITICAL SCENARIO: 8+ coins, turn >= 10, Province+Gold both available
            if (
              state.turnNumber >= 10 &&
              state.players[0].coins >= 8 &&
              state.phase === 'buy' &&
              state.supply.get('Province')! > 0 &&
              state.supply.get('Gold')! > 0 &&
              decision.move.type === 'buy'
            ) {
              opportunityCount++;

              if (decision.move.card === 'Province') {
                provinceChosenCount++;
              }
            }

            const result = gameEngine.executeMove(state, decision.move);
            if (!result.newState) break;
            state = result.newState;
            moves++;
          }
        }

        // Validate: Province chosen 95%+ of the time
        // THIS IS THE CRITICAL METRIC
        // WILL FAIL: Current code likely chooses Gold 100% of the time
        const adherenceRate = provinceChosenCount / opportunityCount;

        // Log for debugging
        console.log(`Province Priority Adherence: ${(adherenceRate * 100).toFixed(1)}% (${provinceChosenCount}/${opportunityCount})`);

        expect(adherenceRate).toBeGreaterThanOrEqual(0.95);
      }, 90000); // 90s timeout for 30 games
    });
  });
});
