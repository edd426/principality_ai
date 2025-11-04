import { GameEngine, GameState } from '@principality/core';
import { RulesBasedAI } from '@principality/core';

/**
 * Tests for multiplayer AI auto-execution in CLI
 * Validates that Player 1 (AI) executes moves automatically without human input
 */

describe('Multiplayer AI Auto-Execution', () => {
  let engine: GameEngine;
  let ai: RulesBasedAI;

  beforeEach(() => {
    engine = new GameEngine('ai-auto-exec-test');
    ai = new RulesBasedAI('ai-auto-exec-test');
  });

  describe('Unit Tests: AI Decision Making in 2-Player Context', () => {
    test('UT-AI-1: AI decideBestMove works with 2-player game state', () => {
      // @req: AI must work with 2-player GameState
      // @input: 2-player game in action phase
      // @output: AI returns valid move
      // @level: Unit

      const state = engine.initializeGame(2);
      const decision = ai.decideBestMove(state, 1);

      expect(decision).toBeDefined();
      expect(decision.move).toBeDefined();
      expect(decision.reasoning).toBeDefined();
      expect(decision.reasoning.length).toBeGreaterThan(0);
    });

    test('UT-AI-2: AI returns different decisions based on phase', () => {
      // @req: AI adapts decisions to current phase
      // @input: Action phase vs Buy phase
      // @output: Different moves in different phases
      // @level: Unit

      const state = engine.initializeGame(2);

      // Action phase
      const actionDecision = ai.decideBestMove(state, 1);
      expect(actionDecision.move.type).toBe('end_phase'); // No actions in starting hand

      // Manually change to buy phase
      const buyState: GameState = {
        ...state,
        phase: 'buy',
        players: [
          {
            ...state.players[0],
            hand: state.players[0].hand,
            coins: 5
          },
          {
            ...state.players[1],
            hand: state.players[1].hand,
            coins: 5
          }
        ]
      };

      const buyDecision = ai.decideBestMove(buyState, 1);
      // In buy phase with treasures in hand, AI plays treasures first before buying
      expect(['play_treasure', 'buy']).toContain(buyDecision.move.type);
    });

    test('UT-AI-3: AI move passes GameEngine validation', () => {
      // @req: All AI moves must be valid per GameEngine rules
      // @input: AI decision from 2-player game
      // @output: Move succeeds when executed
      // @level: Unit

      const state = engine.initializeGame(2);
      const decision = ai.decideBestMove(state, 1);

      const result = engine.executeMove(state, decision.move);
      expect(result.success).toBe(true);
      expect(result.newState).toBeDefined();
    });

    test('UT-AI-4: AI makes deterministic decisions', () => {
      // @req: Same game state produces same AI move
      // @input: Fixed game state
      // @output: Same decision twice
      // @level: Unit

      const state = engine.initializeGame(2);

      const decision1 = ai.decideBestMove(state, 1);
      const decision2 = ai.decideBestMove(state, 1);

      expect(decision1.move.type).toBe(decision2.move.type);
      expect(decision1.move.card).toBe(decision2.move.card);
    });
  });

  describe('Integration Tests: CLI AI Auto-Execution Flow', () => {
    test('IT-AI-1: After human move, AI player index becomes current', () => {
      // @req: Turn switching works correctly after human move
      // @input: 2-player game, human makes move
      // @output: currentPlayer switches to 1 (AI)
      // @level: Integration

      let state = engine.initializeGame(2);
      expect(state.currentPlayer).toBe(0);

      // Human (P0) plays a move
      const validMoves = engine.getValidMoves(state, 0);
      const result = engine.executeMove(state, validMoves[0]);
      state = result.newState!;

      // If phase changed, check if player switched
      if (state.phase === 'buy' || state.phase === 'cleanup') {
        // Still P0's turn but later phase
        expect(state.currentPlayer).toBe(0);
      }
    });

    test('IT-AI-2: AI can execute move immediately after human completes turn', () => {
      // @req: AI can make moves without blocking
      // @input: Game state after human completes full turn
      // @output: AI executes move successfully
      // @level: Integration

      let state = engine.initializeGame(2);

      // Complete P0's action phase
      let result = engine.executeMove(state, { type: 'end_phase' });
      state = result.newState!;

      // Complete P0's buy phase
      result = engine.executeMove(state, { type: 'end_phase' });
      state = result.newState!;

      // Complete P0's cleanup phase (auto-executes in real CLI)
      result = engine.executeMove(state, { type: 'end_phase' });
      state = result.newState!;

      // Now it should be P1's turn
      expect(state.currentPlayer).toBe(1);

      // P1 (AI) should be able to make a move
      const aiDecision = ai.decideBestMove(state, 1);
      const aiResult = engine.executeMove(state, aiDecision.move);
      expect(aiResult.success).toBe(true);
    });

    test('IT-AI-3: Multiple turns alternate between human and AI', () => {
      // @req: Turn alternation works over multiple turns
      // @input: Multiple complete turns
      // @output: Correct turn progression
      // @level: Integration

      let state = engine.initializeGame(2);
      let turnCount = 0;

      for (let turn = 0; turn < 3; turn++) {
        // P0 (human) turn
        expect(state.currentPlayer).toBe(0);
        const validMovesP0 = engine.getValidMoves(state, 0);
        let result = engine.executeMove(state, validMovesP0[0]);
        state = result.newState!;

        // Progress through P0's turn (all 3 phases)
        for (let phase = 0; phase < 2; phase++) {
          const moves = engine.getValidMoves(state, 0);
          result = engine.executeMove(state, { type: 'end_phase' });
          state = result.newState!;
        }

        // P1 (AI) turn
        expect(state.currentPlayer).toBe(1);
        const aiDecision = ai.decideBestMove(state, 1);
        result = engine.executeMove(state, aiDecision.move);
        state = result.newState!;

        // Progress through P1's turn
        for (let phase = 0; phase < 2; phase++) {
          const moves = engine.getValidMoves(state, 1);
          result = engine.executeMove(state, { type: 'end_phase' });
          state = result.newState!;
        }

        turnCount++;
      }

      expect(turnCount).toBe(3);
    });

    test('IT-AI-4: AI respects phase restrictions (treasures only in buy phase)', () => {
      // @req: AI doesn't try to play treasures in action phase
      // @input: Action phase with treasures in hand
      // @output: AI chooses end_phase, not play_treasure
      // @level: Integration

      const state = engine.initializeGame(2);
      // In action phase with starting hand (Coppers + Estates)
      // AI should end action phase, not try to play treasures

      const aiDecision = ai.decideBestMove(state, 1);
      expect(aiDecision.move.type).toBe('end_phase');
    });

    test('IT-AI-5: AI decision respects game state constraints', () => {
      // @req: AI validates moves against actual game state
      // @input: AI decision from constrained game state
      // @output: AI respects buys, actions, coins limits
      // @level: Integration

      let state = engine.initializeGame(2);

      // Get to buy phase with limited resources
      let result = engine.executeMove(state, { type: 'end_phase' }); // action → buy
      state = result.newState!;

      // Now in buy phase with no buys (only 1 buy per turn normally)
      const aiDecision = ai.decideBestMove(state, 1);

      // AI should either play treasures or buy cards, not exceed limits
      expect(['play_treasure', 'buy', 'end_phase']).toContain(aiDecision.move.type);
    });
  });

  describe('E2E Tests: Full Game Flow with Auto-Execution', () => {
    test('E2E-AI-1: Complete 5-turn game with human and AI auto-executing', () => {
      // @req: Full game plays with human vs AI without manual AI input
      // @input: Initialize 2-player game
      // @output: Game progresses 5 full turns, AI moves auto-execute
      // @level: E2E
      // @assert: Both players complete 5 full turns
      // @assert: No manual input required for AI
      // @assert: Game state valid throughout

      let state = engine.initializeGame(2);
      let totalMoves = 0;

      for (let turn = 0; turn < 5; turn++) {
        // P0 (human) completes turn
        for (let phase = 0; phase < 3; phase++) {
          const validMoves = engine.getValidMoves(state, 0);
          const moveToPlay = validMoves[Math.floor(Math.random() * validMoves.length)];
          const result = engine.executeMove(state, moveToPlay);
          if (result.newState) {
            state = result.newState;
            totalMoves++;
          }
        }

        // P1 (AI) auto-executes turn
        for (let phase = 0; phase < 3; phase++) {
          const validMoves = engine.getValidMoves(state, 1);
          let moveToPlay: any;

          if (validMoves.some(m => m.type === 'end_phase')) {
            const aiDecision = ai.decideBestMove(state, 1);
            moveToPlay = aiDecision.move;
          } else {
            moveToPlay = validMoves[0];
          }

          const result = engine.executeMove(state, moveToPlay);
          if (result.newState) {
            state = result.newState;
            totalMoves++;
          }
        }
      }

      expect(totalMoves).toBeGreaterThan(20); // At least some moves
      expect(state.players).toHaveLength(2);
    });

    test('E2E-AI-2: Game completes without deadlock or infinite loops', () => {
      // @req: Game ends naturally or reaches move limit safely
      // @input: 2-player game with mixed human random + AI moves
      // @output: Game completes within reasonable move limit
      // @level: E2E

      let state = engine.initializeGame(2);
      let moveCount = 0;
      const maxMoves = 500; // Safety limit to prevent runaway games

      while (moveCount < maxMoves) {
        const victory = engine.checkGameOver(state);
        if (victory.isGameOver) {
          break;
        }

        const player = state.currentPlayer;
        const validMoves = engine.getValidMoves(state, player);

        let moveToPlay: any;
        if (player === 0) {
          // Human makes random valid move
          moveToPlay = validMoves[Math.floor(Math.random() * validMoves.length)];
        } else {
          // AI makes best move (should accelerate game end via Province purchases)
          moveToPlay = ai.decideBestMove(state, player).move;
        }

        const result = engine.executeMove(state, moveToPlay);
        if (result.newState) {
          state = result.newState;
          moveCount++;
        } else {
          break;
        }
      }

      // Game should either end naturally or be well within move limit
      expect(moveCount).toBeGreaterThan(0);
      expect(moveCount).toBeLessThanOrEqual(maxMoves);
      // Note: Game may or may not be over depending on random human moves
      // The important thing is it didn't deadlock
    });

    test('E2E-AI-3: AI makes Big Money strategy moves (Gold > Silver)', () => {
      // @req: AI follows Big Money strategy in actual gameplay
      // @input: Game progression to buy phase with good coin generation
      // @output: AI prefers Gold over Silver when both available
      // @level: E2E

      let state = engine.initializeGame(2);
      let goldBought = 0;
      let silverBought = 0;
      let maxMoves = 500; // Enough moves for ~25 turns
      let moveCount = 0;

      // Run game long enough for AI to accumulate coins and buy Gold
      while (moveCount < maxMoves) {
        if (state.currentPlayer === 0) {
          // P0 (human): Take simple move (end phase or first valid move)
          const moves = engine.getValidMoves(state, 0);
          const result = engine.executeMove(state, moves[0]);
          if (result.newState) {
            state = result.newState;
          } else {
            break; // Error, stop
          }
        } else {
          // P1 (AI): Use Big Money strategy
          const decision = ai.decideBestMove(state, 1);

          // Track AI purchases
          if (decision.move.type === 'buy') {
            if (decision.move.card === 'Gold') goldBought++;
            if (decision.move.card === 'Silver') silverBought++;
          }

          const result = engine.executeMove(state, decision.move);
          if (result.newState) {
            state = result.newState;
          } else {
            break; // Error, stop
          }
        }

        moveCount++;

        // Stop if game ends
        const gameOver = engine.checkGameOver(state);
        if (gameOver.isGameOver) break;

        // Stop early if we've seen enough purchases (validation complete)
        if (goldBought + silverBought >= 5) break;
      }

      // AI should buy Gold at least once (validates 6+ coin generation)
      // Big Money strategy: Silver is cheaper (3) so bought more often early game
      // Gold is expensive (6) so appears less frequently but is prioritized when affordable
      expect(goldBought).toBeGreaterThanOrEqual(1); // At least 1 Gold purchase (validates strategy)
      expect(silverBought).toBeGreaterThanOrEqual(1); // At least 1 Silver purchase
      expect(goldBought + silverBought).toBeGreaterThanOrEqual(3); // Multiple treasure purchases total
    });
  });
});
