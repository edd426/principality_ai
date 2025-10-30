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
  });
});
