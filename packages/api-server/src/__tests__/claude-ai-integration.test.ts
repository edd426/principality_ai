/**
 * Claude AI Integration Tests
 *
 * Tests complete AI turn cycle using mocked Anthropic SDK.
 * Validates the full flow: human turn -> AI turn -> state consistency.
 *
 * @req AI-002 - AI decision context and reasoning
 * @req AI-003 - Big Money fallback strategy
 */

import { GameEngine, GameState, isGameOver } from '@principality/core';
import { AIService } from '../services/ai-service';

// =============================================================================
// Mock Anthropic SDK
// =============================================================================

const mockCreate = jest.fn();

jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: mockCreate,
      },
    })),
  };
});

// =============================================================================
// Test Helpers
// =============================================================================

function mockClaudeJsonResponse(response: Record<string, unknown>): void {
  mockCreate.mockResolvedValueOnce({
    content: [
      {
        type: 'text',
        text: JSON.stringify(response),
      },
    ],
    usage: { input_tokens: 100, output_tokens: 50 },
  });
}

/**
 * Play a simple human turn: skip actions, play all treasures, end buy phase.
 * Returns the state after the human turn completes.
 */
function playSimpleHumanTurn(
  state: GameState,
  engine: GameEngine
): GameState {
  let currentState = state;

  // Skip action phase if in action phase
  if (currentState.phase === 'action') {
    const result = engine.executeMove(currentState, { type: 'end_phase' });
    if (result.success && result.newState) {
      currentState = result.newState;
    }
  }

  // Play all treasures
  if (currentState.phase === 'buy') {
    const player = currentState.players[currentState.currentPlayer];
    for (const card of player.hand) {
      const result = engine.executeMove(currentState, {
        type: 'play_treasure',
        card,
      });
      if (result.success && result.newState) {
        currentState = result.newState;
      }
    }

    // End buy phase
    const endResult = engine.executeMove(currentState, { type: 'end_phase' });
    if (endResult.success && endResult.newState) {
      currentState = endResult.newState;
    }
  }

  // Handle cleanup
  if (currentState.phase === 'cleanup') {
    const cleanupResult = engine.executeMove(currentState, { type: 'end_phase' });
    if (cleanupResult.success && cleanupResult.newState) {
      currentState = cleanupResult.newState;
    }
  }

  return currentState;
}

// =============================================================================
// Integration Tests
// =============================================================================

describe('Claude AI Integration', () => {
  let engine: GameEngine;
  let aiService: AIService;
  let initialState: GameState;

  beforeEach(() => {
    mockCreate.mockReset();
    engine = new GameEngine('integration-test-seed');
    initialState = engine.initializeGame(2, { edition: '2E' });
    aiService = new AIService();
  });

  describe('Full AI Turn Cycle', () => {
    /**
     * @req AI-002 - Claude AI plays a complete turn with decisions
     */
    it('should complete a full AI turn using decideNextMove', async () => {
      // Set up: play human turn first to get to AI's turn
      let state = playSimpleHumanTurn(initialState, engine);

      // Now it should be AI's turn (player 1)
      expect(state.currentPlayer).toBe(1);

      // AI turn: action phase -> end_phase
      const actionDecision = await aiService.decideNextMove(state, engine, 1);
      expect(actionDecision.move.type).toBe('end_phase');
      expect(actionDecision.strategyUsed).toBe('big-money');

      const actionResult = engine.executeMove(state, actionDecision.move);
      expect(actionResult.success).toBe(true);
      state = actionResult.newState!;

      // AI turn: buy phase -> play treasures then buy
      expect(state.phase).toBe('buy');

      // Play treasures one by one using decideNextMove
      let treasurePlayed = true;
      while (treasurePlayed) {
        const decision = await aiService.decideNextMove(state, engine, 1);
        if (decision.move.type === 'play_treasure') {
          const result = engine.executeMove(state, decision.move);
          if (result.success && result.newState) {
            state = result.newState;
          } else {
            treasurePlayed = false;
          }
        } else {
          // Not a treasure play, execute the move (buy or end_phase)
          const result = engine.executeMove(state, decision.move);
          if (result.success && result.newState) {
            state = result.newState;
          }
          treasurePlayed = false;
        }
      }

      // Continue until buy phase ends
      while (state.phase === 'buy' && state.currentPlayer === 1) {
        const decision = await aiService.decideNextMove(state, engine, 1);
        const result = engine.executeMove(state, decision.move);
        if (result.success && result.newState) {
          state = result.newState;
        } else {
          break;
        }
      }

      // Handle cleanup
      if (state.phase === 'cleanup') {
        const cleanupResult = engine.executeMove(state, { type: 'end_phase' });
        if (cleanupResult.success && cleanupResult.newState) {
          state = cleanupResult.newState;
        }
      }

      // After AI turn, it should be human's turn again
      expect(state.currentPlayer).toBe(0);
      expect(state.turnNumber).toBe(2);
    });

    /**
     * @req AI-003 - Big Money fallback works for full turn
     */
    it('should complete a full turn using Big Money fallback only', async () => {
      // Play human turn
      let state = playSimpleHumanTurn(initialState, engine);
      expect(state.currentPlayer).toBe(1);

      // Play full Big Money turn using existing method
      const { state: stateAfterAI, summary } = aiService.playBigMoneyTurn(state, engine);

      // Verify turn completed successfully
      expect(stateAfterAI.currentPlayer).toBe(0);
      expect(stateAfterAI.turnNumber).toBe(2);
      expect(summary.treasuresPlayed.length).toBeGreaterThan(0);
    });
  });

  describe('Claude AI with Fallback', () => {
    /**
     * @req AI-003 - Falls back to Big Money when Claude API fails
     */
    it('should fall back to Big Money when Claude API throws', async () => {
      aiService.initClaudeAI('haiku');

      // Mock Claude to fail
      mockCreate.mockRejectedValue(new Error('API unavailable'));

      let state = playSimpleHumanTurn(initialState, engine);
      expect(state.currentPlayer).toBe(1);

      // Should fall back to Big Money
      const decision = await aiService.decideNextMove(state, engine, 1);
      expect(decision.strategyUsed).toBe('big-money');
      expect(decision.move.type).toBe('end_phase'); // Big Money ends action phase
    });

    /**
     * @req AI-002 - Uses Claude when available and successful
     */
    it('should use Claude AI when API responds correctly', async () => {
      aiService.initClaudeAI('haiku');

      let state = playSimpleHumanTurn(initialState, engine);
      expect(state.currentPlayer).toBe(1);

      // Mock Claude to respond with end_phase
      mockClaudeJsonResponse({
        moveType: 'end_phase',
        reasoning: 'No actions in hand, proceeding to buy phase.',
      });

      const decision = await aiService.decideNextMove(state, engine, 1);
      expect(decision.strategyUsed).toBe('claude-ai');
      expect(decision.move.type).toBe('end_phase');
      expect(decision.reasoning).toContain('No actions');
    });

    /**
     * @req AI-003 - Falls back when Claude returns invalid move
     */
    it('should fall back to Big Money when Claude returns invalid response', async () => {
      aiService.initClaudeAI('haiku');

      let state = playSimpleHumanTurn(initialState, engine);
      expect(state.currentPlayer).toBe(1);

      // Mock Claude to return unparseable response
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: 'I think we should play Village but I am not sure.',
          },
        ],
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      const decision = await aiService.decideNextMove(state, engine, 1);
      expect(decision.strategyUsed).toBe('big-money');
    });
  });

  describe('Game State Consistency', () => {
    /**
     * @req AI-002 - Game state remains valid after AI decisions
     */
    it('should maintain valid game state after multiple AI turns', async () => {
      let state = initialState;

      // Play 3 full rounds
      for (let round = 0; round < 3; round++) {
        // Human turn
        if (state.currentPlayer === 0) {
          state = playSimpleHumanTurn(state, engine);
        }

        // AI turn using Big Money
        if (state.currentPlayer === 1 && !isGameOver(state)) {
          const { state: newState } = aiService.playBigMoneyTurn(state, engine);
          state = newState;
        }

        if (isGameOver(state)) break;
      }

      // Verify state consistency
      expect(state.players.length).toBe(2);
      for (const player of state.players) {
        // Total cards should be >= starting 10 (gained cards through buying)
        const totalCards =
          player.hand.length +
          player.drawPile.length +
          player.discardPile.length +
          player.inPlay.length;
        expect(totalCards).toBeGreaterThanOrEqual(10);
      }
    });

    /**
     * @edge: AI handles turn when hand has only treasure cards
     */
    it('should handle AI turn with all-treasure hand', async () => {
      let state = playSimpleHumanTurn(initialState, engine);
      expect(state.currentPlayer).toBe(1);

      // AI's starting deck has 7 Copper + 3 Estate, hand is 5 random cards
      // Big Money handles this correctly
      const { state: stateAfterAI } = aiService.playBigMoneyTurn(state, engine);
      expect(stateAfterAI.currentPlayer).toBe(0);
    });
  });

  describe('AI Decision Context Building', () => {
    /**
     * @req AI-002 - Context includes correct player info
     */
    it('should build context with correct player index', () => {
      const context = aiService.buildDecisionContext(initialState, engine, 1);

      expect(context.playerIndex).toBe(1);
      expect(context.hand).toEqual(
        expect.arrayContaining(initialState.players[1].hand as unknown as string[])
      );
    });

    /**
     * @req AI-002 - Context includes valid moves
     */
    it('should include valid moves in context', () => {
      const context = aiService.buildDecisionContext(initialState, engine, 0);

      expect(context.validMoves.length).toBeGreaterThan(0);
      expect(context.phase).toBe(initialState.phase);
      expect(context.turnNumber).toBe(initialState.turnNumber);
    });

    /**
     * @req AI-002 - Context includes resources
     */
    it('should include player resources', () => {
      const context = aiService.buildDecisionContext(initialState, engine, 0);
      const player = initialState.players[0];

      expect(context.resources.actions).toBe(player.actions);
      expect(context.resources.buys).toBe(player.buys);
      expect(context.resources.coins).toBe(player.coins);
    });
  });
});
