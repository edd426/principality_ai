import { GameEngine, GameState, RulesBasedAI } from '@principality/core';

/**
 * Phase 4 E2E Tests: Backward Compatibility
 * @req: Ensure Phase 1-3 functionality still works
 * @level: E2E
 * @count: 2 tests total
 */

describe('E2E: Backward Compatibility', () => {
  let engine: GameEngine;
  let ai: RulesBasedAI;

  beforeEach(() => {
    engine = new GameEngine('backward-compat-test');
    ai = new RulesBasedAI('backward-compat-test');
  });

  test('E2E-BC-1: Solo game with original 8 kingdom cards', () => {
    // @req: Phase 1 gameplay works exactly as before
    const state = engine.initializeGame(1);

    // Remove Phase 4 cards from supply (simulate Phase 1)
    const phase1Supply = new Map(state.supply);
    ['Chapel', 'Remodel', 'Mine', 'Moneylender', 'Workshop', 'Feast',
     'Militia', 'Witch', 'Bureaucrat', 'Spy', 'Thief', 'Moat',
     'Throne Room', 'Adventurer', 'Chancellor', 'Library', 'Gardens'].forEach(card => {
      phase1Supply.delete(card);
    });

    const phase1State: GameState = {
      ...state,
      supply: phase1Supply
    };

    let currentState = phase1State;
    let turnCount = 0;

    let gameOver = engine.checkGameOver(currentState).isGameOver;
    while (!gameOver && turnCount < 100) { // @req: Sufficient moves for AI to complete game
      const move = ai.decideBestMove(currentState, 0);
      const result = engine.executeMove(currentState, move.move);

      if (!result.success) break;

      currentState = result.newState!;
      gameOver = engine.checkGameOver(currentState).isGameOver;
      turnCount++;
    }

    expect(gameOver).toBe(true);
    // Game completes without Phase 4 cards
    expect(turnCount).toBeLessThan(100);
  });

  test('E2E-BC-2: Multiplayer with all 25 cards', () => {
    // @req: All cards work together without conflicts
    const state = engine.initializeGame(2);

    let currentState = state;
    let turnCount = 0;

    let gameOver = engine.checkGameOver(currentState).isGameOver;
    while (!gameOver && turnCount < 150) { // @req: Phase 4 has 25 cards, needs more moves
      const move = ai.decideBestMove(currentState, currentState.currentPlayer);
      const result = engine.executeMove(currentState, move.move);

      if (!result.success) {
        console.error(`Move failed at turn ${turnCount}:`, result.error);
        break;
      }

      currentState = result.newState!;
      gameOver = engine.checkGameOver(currentState).isGameOver;
      turnCount++;
    }

    expect(gameOver).toBe(true);
    expect(turnCount).toBeLessThan(150);

    // Both players completed game
    expect(currentState.players.length).toBe(2);
  });
});
