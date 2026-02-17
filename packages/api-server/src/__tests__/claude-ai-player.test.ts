/**
 * Claude AI Player Unit Tests
 *
 * Tests Claude AI move selection with mocked Anthropic SDK.
 * Validates strategy pattern, model selection, and Big Money fallback.
 *
 * @req AI-001 - AI model selection (Haiku/Sonnet/Opus)
 * @req AI-002 - AI decision context and reasoning
 * @req AI-003 - Big Money fallback strategy
 */

import type { GameState, Move, Phase } from '@principality/core';
import type {
  AIDecisionContext,
  AIResources,
} from '../types/ai';

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

// Import after mock setup
import { ClaudeAIStrategy } from '../services/claude-ai-strategy';
import { BigMoneyStrategy } from '../services/big-money-strategy';

// =============================================================================
// Test Helpers
// =============================================================================

function createMockContext(overrides?: Partial<AIDecisionContext>): AIDecisionContext {
  const resources: AIResources = {
    actions: 1,
    buys: 1,
    coins: 0,
    ...overrides?.resources,
  };

  return {
    gameState: createMockGameState(),
    playerIndex: 1,
    validMoves: [{ type: 'end_phase' } as Move],
    phase: 'action' as Phase,
    turnNumber: 1,
    hand: ['Copper', 'Copper', 'Copper', 'Estate', 'Estate'],
    resources,
    playedThisTurn: [],
    kingdomCards: ['Village', 'Smithy', 'Market', 'Laboratory', 'Festival',
                   'Cellar', 'Chapel', 'Workshop', 'Militia', 'Moat'],
    gameLog: [],
    ...overrides,
  };
}

function createMockGameState(overrides?: Partial<GameState>): GameState {
  return {
    players: [
      {
        hand: ['Copper', 'Copper', 'Silver', 'Estate', 'Smithy'],
        deck: ['Copper', 'Copper', 'Estate'],
        discard: [],
        inPlay: [],
        actions: 1,
        buys: 1,
        coins: 0,
      },
      {
        hand: ['Copper', 'Copper', 'Copper', 'Estate', 'Estate'],
        deck: ['Copper', 'Copper', 'Silver', 'Estate'],
        discard: [],
        inPlay: [],
        actions: 1,
        buys: 1,
        coins: 0,
      },
    ],
    supply: new Map([
      ['Copper', 46],
      ['Silver', 40],
      ['Gold', 30],
      ['Estate', 8],
      ['Duchy', 8],
      ['Province', 8],
      ['Curse', 10],
      ['Village', 10],
      ['Smithy', 10],
      ['Market', 10],
      ['Laboratory', 10],
      ['Festival', 10],
      ['Cellar', 10],
      ['Chapel', 10],
      ['Workshop', 10],
      ['Militia', 10],
      ['Moat', 10],
    ]),
    currentPlayer: 1,
    phase: 'action' as Phase,
    turnNumber: 1,
    gameLog: [],
    trash: [],
    kingdomCards: ['Village', 'Smithy', 'Market', 'Laboratory', 'Festival',
                   'Cellar', 'Chapel', 'Workshop', 'Militia', 'Moat'],
    ...overrides,
  } as unknown as GameState;
}

function mockClaudeResponse(moveType: string, card?: string, reasoning?: string): void {
  const response: Record<string, string> = {
    moveType,
    reasoning: reasoning || 'Test reasoning.',
  };
  if (card) response.card = card;

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

// =============================================================================
// ClaudeAIStrategy Tests
// =============================================================================

describe('ClaudeAIStrategy', () => {
  let strategy: ClaudeAIStrategy;

  beforeEach(() => {
    mockCreate.mockReset();
    strategy = new ClaudeAIStrategy('haiku');
  });

  describe('name', () => {
    it('should have strategy name "claude-ai"', () => {
      expect(strategy.name).toBe('claude-ai');
    });
  });

  describe('canHandle', () => {
    /**
     * @req AI-001 - Strategy can always attempt to handle when API key is available
     */
    it('should return true when valid moves exist', () => {
      const context = createMockContext({
        validMoves: [{ type: 'end_phase' } as Move],
      });
      expect(strategy.canHandle(context)).toBe(true);
    });

    /**
     * @edge: No valid moves
     */
    it('should return false when no valid moves exist', () => {
      const context = createMockContext({
        validMoves: [],
      });
      expect(strategy.canHandle(context)).toBe(false);
    });
  });

  describe('decideMove - Action Phase', () => {
    /**
     * @req AI-002 - Claude selects action to play
     */
    it('should select an action card when Claude responds with play_action', async () => {
      mockClaudeResponse('play_action', 'Village', 'Village gives +2 Actions and +1 Card.');

      const context = createMockContext({
        phase: 'action' as Phase,
        hand: ['Village', 'Smithy', 'Copper', 'Copper', 'Estate'],
        validMoves: [
          { type: 'play_action', card: 'Village' } as Move,
          { type: 'play_action', card: 'Smithy' } as Move,
          { type: 'end_phase' } as Move,
        ],
      });

      const decision = await strategy.decideMove(context);

      expect(decision.move.type).toBe('play_action');
      expect(decision.move.card).toBe('Village');
      expect(decision.reasoning).toContain('Village');
      expect(decision.strategyUsed).toBe('claude-ai');
    });

    /**
     * @req AI-002 - Claude can choose to end action phase
     */
    it('should end action phase when Claude chooses end_phase', async () => {
      mockClaudeResponse('end_phase', undefined, 'No useful actions to play.');

      const context = createMockContext({
        phase: 'action' as Phase,
        hand: ['Copper', 'Copper', 'Copper', 'Estate', 'Estate'],
        validMoves: [{ type: 'end_phase' } as Move],
      });

      const decision = await strategy.decideMove(context);

      expect(decision.move.type).toBe('end_phase');
    });
  });

  describe('decideMove - Buy Phase', () => {
    /**
     * @req AI-002 - Claude decides what to buy
     */
    it('should buy a card when Claude selects buy move', async () => {
      mockClaudeResponse('buy', 'Silver', 'Silver improves economy.');

      const context = createMockContext({
        phase: 'buy' as Phase,
        resources: { actions: 0, buys: 1, coins: 4 },
        validMoves: [
          { type: 'buy', card: 'Silver' } as Move,
          { type: 'buy', card: 'Estate' } as Move,
          { type: 'end_phase' } as Move,
        ],
      });

      const decision = await strategy.decideMove(context);

      expect(decision.move.type).toBe('buy');
      expect(decision.move.card).toBe('Silver');
    });

    /**
     * @req AI-002 - Claude buys Province when affordable
     */
    it('should buy Province when Claude has 8+ coins', async () => {
      mockClaudeResponse('buy', 'Province', 'Province is the primary VP card.');

      const context = createMockContext({
        phase: 'buy' as Phase,
        resources: { actions: 0, buys: 1, coins: 8 },
        validMoves: [
          { type: 'buy', card: 'Province' } as Move,
          { type: 'buy', card: 'Gold' } as Move,
          { type: 'end_phase' } as Move,
        ],
      });

      const decision = await strategy.decideMove(context);

      expect(decision.move.type).toBe('buy');
      expect(decision.move.card).toBe('Province');
    });
  });

  describe('decideMove - Treasure Phase', () => {
    /**
     * @req AI-002 - Claude plays treasures during buy phase
     */
    it('should play treasure when Claude selects play_treasure', async () => {
      mockClaudeResponse('play_treasure', 'Silver', 'Play Silver for +2 coins.');

      const context = createMockContext({
        phase: 'buy' as Phase,
        hand: ['Copper', 'Copper', 'Silver'],
        resources: { actions: 0, buys: 1, coins: 0 },
        validMoves: [
          { type: 'play_treasure', card: 'Copper' } as Move,
          { type: 'play_treasure', card: 'Silver' } as Move,
          { type: 'end_phase' } as Move,
        ],
      });

      const decision = await strategy.decideMove(context);

      expect(decision.move.type).toBe('play_treasure');
      expect(decision.move.card).toBe('Silver');
    });
  });

  describe('Model Selection', () => {
    /**
     * @req AI-001 - Haiku model configuration
     */
    it('should use Haiku model ID', () => {
      const haikuStrategy = new ClaudeAIStrategy('haiku');
      expect(haikuStrategy.modelId).toContain('haiku');
    });

    /**
     * @req AI-001 - Sonnet model configuration
     */
    it('should use Sonnet model ID', () => {
      const sonnetStrategy = new ClaudeAIStrategy('sonnet');
      expect(sonnetStrategy.modelId).toContain('sonnet');
    });

    /**
     * @req AI-001 - Opus model configuration
     */
    it('should use Opus model ID', () => {
      const opusStrategy = new ClaudeAIStrategy('opus');
      expect(opusStrategy.modelId).toContain('opus');
    });

    /**
     * @req AI-001 - Each model has different config
     */
    it('should have different max tokens per model', () => {
      const haiku = new ClaudeAIStrategy('haiku');
      const sonnet = new ClaudeAIStrategy('sonnet');
      const opus = new ClaudeAIStrategy('opus');

      // Haiku should have lowest maxTokens, Opus highest
      expect(haiku.maxTokens).toBeLessThan(sonnet.maxTokens);
      expect(sonnet.maxTokens).toBeLessThan(opus.maxTokens);
    });
  });

  describe('Decision Metadata', () => {
    /**
     * @req AI-002.2 - Decision includes reasoning
     */
    it('should include reasoning in decision', async () => {
      mockClaudeResponse('end_phase', undefined, 'Ending action phase as I have no actions.');

      const context = createMockContext();
      const decision = await strategy.decideMove(context);

      expect(decision.reasoning).toBeDefined();
      expect(decision.reasoning!.length).toBeGreaterThan(0);
    });

    /**
     * @req AI-002.2 - Decision includes timing
     */
    it('should include decision time in milliseconds', async () => {
      mockClaudeResponse('end_phase');

      const context = createMockContext();
      const decision = await strategy.decideMove(context);

      expect(decision.decisionTimeMs).toBeDefined();
      expect(decision.decisionTimeMs).toBeGreaterThanOrEqual(0);
    });

    /**
     * @req AI-002.2 - Decision identifies strategy used
     */
    it('should identify claude-ai as the strategy used', async () => {
      mockClaudeResponse('end_phase');

      const context = createMockContext();
      const decision = await strategy.decideMove(context);

      expect(decision.strategyUsed).toBe('claude-ai');
    });
  });

  describe('Error Handling', () => {
    /**
     * @edge: API returns invalid JSON
     */
    it('should throw when Claude returns unparseable response', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'I cannot decide.' }],
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      const context = createMockContext();

      await expect(strategy.decideMove(context)).rejects.toThrow();
    });

    /**
     * @edge: API call fails
     */
    it('should throw when Anthropic API fails', async () => {
      mockCreate.mockRejectedValueOnce(new Error('API rate limited'));

      const context = createMockContext();

      await expect(strategy.decideMove(context)).rejects.toThrow('API rate limited');
    });

    /**
     * @edge: Claude suggests invalid move
     */
    it('should throw when Claude suggests move not in valid moves', async () => {
      mockClaudeResponse('buy', 'Province', 'Buy Province!');

      const context = createMockContext({
        validMoves: [
          { type: 'buy', card: 'Silver' } as Move,
          { type: 'end_phase' } as Move,
        ],
      });

      await expect(strategy.decideMove(context)).rejects.toThrow();
    });
  });
});

// =============================================================================
// BigMoneyStrategy Tests
// =============================================================================

describe('BigMoneyStrategy', () => {
  let strategy: BigMoneyStrategy;

  beforeEach(() => {
    strategy = new BigMoneyStrategy();
  });

  describe('name', () => {
    it('should have strategy name "big-money"', () => {
      expect(strategy.name).toBe('big-money');
    });
  });

  describe('canHandle', () => {
    it('should always return true (fallback strategy)', () => {
      const context = createMockContext();
      expect(strategy.canHandle(context)).toBe(true);
    });
  });

  describe('Action Phase Decisions', () => {
    /**
     * @req AI-003 - Big Money skips actions
     */
    it('should end action phase (Big Money plays no actions)', async () => {
      const context = createMockContext({
        phase: 'action' as Phase,
        validMoves: [
          { type: 'play_action', card: 'Village' } as Move,
          { type: 'end_phase' } as Move,
        ],
      });

      const decision = await strategy.decideMove(context);

      expect(decision.move.type).toBe('end_phase');
      expect(decision.strategyUsed).toBe('big-money');
    });
  });

  describe('Treasure Phase Decisions', () => {
    /**
     * @req AI-003 - Big Money plays all treasures
     */
    it('should play treasure when treasures are available', async () => {
      const context = createMockContext({
        phase: 'buy' as Phase,
        hand: ['Copper', 'Copper', 'Silver'],
        validMoves: [
          { type: 'play_treasure', card: 'Copper' } as Move,
          { type: 'play_treasure', card: 'Silver' } as Move,
          { type: 'end_phase' } as Move,
        ],
      });

      const decision = await strategy.decideMove(context);

      // Should play a treasure (any one is fine)
      expect(decision.move.type).toBe('play_treasure');
    });
  });

  describe('Buy Phase Decisions', () => {
    /**
     * @req AI-003 - Big Money buys Province at 8+ coins
     */
    it('should buy Province when coins >= 8', async () => {
      const context = createMockContext({
        phase: 'buy' as Phase,
        resources: { actions: 0, buys: 1, coins: 8 },
        validMoves: [
          { type: 'buy', card: 'Province' } as Move,
          { type: 'buy', card: 'Gold' } as Move,
          { type: 'buy', card: 'Silver' } as Move,
          { type: 'end_phase' } as Move,
        ],
      });

      const decision = await strategy.decideMove(context);

      expect(decision.move.type).toBe('buy');
      expect(decision.move.card).toBe('Province');
    });

    /**
     * @req AI-003 - Big Money buys Gold at 6-7 coins
     */
    it('should buy Gold when coins >= 6 and < 8', async () => {
      const context = createMockContext({
        phase: 'buy' as Phase,
        resources: { actions: 0, buys: 1, coins: 6 },
        validMoves: [
          { type: 'buy', card: 'Gold' } as Move,
          { type: 'buy', card: 'Silver' } as Move,
          { type: 'end_phase' } as Move,
        ],
      });

      const decision = await strategy.decideMove(context);

      expect(decision.move.type).toBe('buy');
      expect(decision.move.card).toBe('Gold');
    });

    /**
     * @req AI-003 - Big Money buys Silver at 3-5 coins
     */
    it('should buy Silver when coins >= 3 and < 6', async () => {
      const context = createMockContext({
        phase: 'buy' as Phase,
        resources: { actions: 0, buys: 1, coins: 4 },
        validMoves: [
          { type: 'buy', card: 'Silver' } as Move,
          { type: 'end_phase' } as Move,
        ],
      });

      const decision = await strategy.decideMove(context);

      expect(decision.move.type).toBe('buy');
      expect(decision.move.card).toBe('Silver');
    });

    /**
     * @req AI-003 - Big Money buys nothing at < 3 coins
     */
    it('should end phase when coins < 3', async () => {
      const context = createMockContext({
        phase: 'buy' as Phase,
        resources: { actions: 0, buys: 1, coins: 2 },
        validMoves: [
          { type: 'buy', card: 'Estate' } as Move,
          { type: 'buy', card: 'Copper' } as Move,
          { type: 'end_phase' } as Move,
        ],
      });

      const decision = await strategy.decideMove(context);

      expect(decision.move.type).toBe('end_phase');
    });

    /**
     * @edge: Province not available in supply
     */
    it('should buy Gold when Province supply is empty', async () => {
      const gameState = createMockGameState();
      (gameState.supply as Map<string, number>).set('Province', 0);

      const context = createMockContext({
        gameState,
        phase: 'buy' as Phase,
        resources: { actions: 0, buys: 1, coins: 8 },
        validMoves: [
          { type: 'buy', card: 'Gold' } as Move,
          { type: 'buy', card: 'Silver' } as Move,
          { type: 'end_phase' } as Move,
        ],
      });

      const decision = await strategy.decideMove(context);

      expect(decision.move.type).toBe('buy');
      expect(decision.move.card).toBe('Gold');
    });

    /**
     * @edge: Duchy buying in late game
     * @why: When Provinces are running low (4 or fewer), Duchies become worth buying
     */
    it('should buy Duchy in late game when Provinces <= 4 and coins >= 5', async () => {
      const gameState = createMockGameState();
      (gameState.supply as Map<string, number>).set('Province', 3);

      const context = createMockContext({
        gameState,
        phase: 'buy' as Phase,
        resources: { actions: 0, buys: 1, coins: 5 },
        validMoves: [
          { type: 'buy', card: 'Duchy' } as Move,
          { type: 'buy', card: 'Silver' } as Move,
          { type: 'end_phase' } as Move,
        ],
      });

      const decision = await strategy.decideMove(context);

      expect(decision.move.type).toBe('buy');
      expect(decision.move.card).toBe('Duchy');
    });
  });

  describe('Decision Metadata', () => {
    it('should include big-money as strategy used', async () => {
      const context = createMockContext();
      const decision = await strategy.decideMove(context);

      expect(decision.strategyUsed).toBe('big-money');
    });

    it('should include reasoning', async () => {
      const context = createMockContext();
      const decision = await strategy.decideMove(context);

      expect(decision.reasoning).toBeDefined();
      expect(typeof decision.reasoning).toBe('string');
    });

    it('should include decision time', async () => {
      const context = createMockContext();
      const decision = await strategy.decideMove(context);

      expect(decision.decisionTimeMs).toBeDefined();
      expect(decision.decisionTimeMs).toBeGreaterThanOrEqual(0);
    });
  });
});
