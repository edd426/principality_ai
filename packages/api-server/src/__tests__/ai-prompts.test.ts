/**
 * AI Prompts Unit Tests
 *
 * Tests prompt building for Claude AI decision-making.
 *
 * @req AI-002 - AI decision context and reasoning
 * @req AI-004 - Structured prompt format for Claude API
 */

import { buildSystemPrompt, buildUserPrompt, parseClaudeResponse } from '../services/ai-prompts';
import type { AIDecisionContext, AIResources } from '../types/ai';
import type { GameState, Move, Phase } from '@principality/core';

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

function createMockGameState(): GameState {
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
  } as unknown as GameState;
}

// =============================================================================
// System Prompt Tests
// =============================================================================

describe('buildSystemPrompt', () => {
  /**
   * @req AI-004.1 - System prompt includes Dominion rules
   */
  it('should include game rules in system prompt', () => {
    const prompt = buildSystemPrompt();

    expect(prompt).toContain('Dominion');
    expect(prompt).toContain('Action');
    expect(prompt).toContain('Buy');
    expect(prompt).toContain('Cleanup');
  });

  /**
   * @req AI-004.2 - System prompt specifies JSON response format
   */
  it('should specify expected JSON response format', () => {
    const prompt = buildSystemPrompt();

    expect(prompt).toContain('JSON');
    expect(prompt).toContain('moveType');
    expect(prompt).toContain('reasoning');
  });

  /**
   * @req AI-004.3 - System prompt includes strategy guidance
   */
  it('should include strategy guidance', () => {
    const prompt = buildSystemPrompt();

    expect(prompt).toContain('Province');
    expect(prompt).toContain('Gold');
    expect(prompt).toContain('Silver');
  });
});

// =============================================================================
// User Prompt Tests
// =============================================================================

describe('buildUserPrompt', () => {
  /**
   * @req AI-002.1 - Prompt includes current hand
   */
  it('should include the AI player hand', () => {
    const context = createMockContext({
      hand: ['Copper', 'Copper', 'Silver', 'Village', 'Estate'],
    });
    const prompt = buildUserPrompt(context);

    expect(prompt).toContain('Copper');
    expect(prompt).toContain('Silver');
    expect(prompt).toContain('Village');
    expect(prompt).toContain('Estate');
  });

  /**
   * @req AI-002.2 - Prompt includes available resources
   */
  it('should include resources (actions, buys, coins)', () => {
    const context = createMockContext({
      resources: { actions: 2, buys: 1, coins: 3 },
    });
    const prompt = buildUserPrompt(context);

    expect(prompt).toContain('2');  // actions
    expect(prompt).toContain('1');  // buys
    expect(prompt).toContain('3');  // coins
  });

  /**
   * @req AI-002.3 - Prompt includes valid moves
   */
  it('should include valid moves', () => {
    const context = createMockContext({
      validMoves: [
        { type: 'play_action', card: 'Village' } as Move,
        { type: 'play_action', card: 'Smithy' } as Move,
        { type: 'end_phase' } as Move,
      ],
    });
    const prompt = buildUserPrompt(context);

    expect(prompt).toContain('Village');
    expect(prompt).toContain('Smithy');
    expect(prompt).toContain('end_phase');
  });

  /**
   * @req AI-002.4 - Prompt includes supply state
   */
  it('should include supply pile information', () => {
    const context = createMockContext();
    const prompt = buildUserPrompt(context);

    expect(prompt).toContain('Province');
    expect(prompt).toContain('Gold');
    expect(prompt).toContain('Silver');
  });

  /**
   * @req AI-002.5 - Prompt includes phase and turn number
   */
  it('should include game phase and turn number', () => {
    const context = createMockContext({
      phase: 'buy' as Phase,
      turnNumber: 5,
    });
    const prompt = buildUserPrompt(context);

    expect(prompt).toContain('Buy');
    expect(prompt).toContain('5');
  });

  /**
   * @req AI-002.6 - Prompt includes kingdom cards
   */
  it('should include kingdom cards for this game', () => {
    const context = createMockContext({
      kingdomCards: ['Village', 'Smithy', 'Market'],
    });
    const prompt = buildUserPrompt(context);

    expect(prompt).toContain('Village');
    expect(prompt).toContain('Smithy');
    expect(prompt).toContain('Market');
  });

  /**
   * @edge: Empty hand during buy phase
   */
  it('should handle empty hand gracefully', () => {
    const context = createMockContext({
      hand: [],
      phase: 'buy' as Phase,
    });
    const prompt = buildUserPrompt(context);

    expect(prompt).toBeDefined();
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(0);
  });

  /**
   * @edge: Cards already played this turn
   */
  it('should include cards played this turn', () => {
    const context = createMockContext({
      playedThisTurn: ['Village', 'Smithy'],
    });
    const prompt = buildUserPrompt(context);

    expect(prompt).toContain('Village');
    expect(prompt).toContain('Smithy');
  });
});

// =============================================================================
// Response Parsing Tests
// =============================================================================

describe('parseClaudeResponse', () => {
  /**
   * @req AI-002.7 - Parse valid JSON response into Move
   */
  it('should parse a valid action move response', () => {
    const responseText = JSON.stringify({
      moveType: 'play_action',
      card: 'Village',
      reasoning: 'Village gives +1 Card and +2 Actions, enabling more plays.',
    });

    const validMoves: Move[] = [
      { type: 'play_action', card: 'Village' } as Move,
      { type: 'end_phase' } as Move,
    ];

    const result = parseClaudeResponse(responseText, validMoves);

    expect(result).not.toBeNull();
    expect(result!.move.type).toBe('play_action');
    expect(result!.move.card).toBe('Village');
    expect(result!.reasoning).toContain('Village');
  });

  /**
   * @req AI-002.8 - Parse buy move response
   */
  it('should parse a valid buy move response', () => {
    const responseText = JSON.stringify({
      moveType: 'buy',
      card: 'Silver',
      reasoning: 'Silver improves economy at $3.',
    });

    const validMoves: Move[] = [
      { type: 'buy', card: 'Silver' } as Move,
      { type: 'buy', card: 'Copper' } as Move,
      { type: 'end_phase' } as Move,
    ];

    const result = parseClaudeResponse(responseText, validMoves);

    expect(result).not.toBeNull();
    expect(result!.move.type).toBe('buy');
    expect(result!.move.card).toBe('Silver');
  });

  /**
   * @req AI-002.9 - Parse end_phase response
   */
  it('should parse end_phase response', () => {
    const responseText = JSON.stringify({
      moveType: 'end_phase',
      reasoning: 'No beneficial actions to play, moving to buy phase.',
    });

    const validMoves: Move[] = [{ type: 'end_phase' } as Move];

    const result = parseClaudeResponse(responseText, validMoves);

    expect(result).not.toBeNull();
    expect(result!.move.type).toBe('end_phase');
  });

  /**
   * @edge: Invalid JSON response
   */
  it('should return null for invalid JSON', () => {
    const result = parseClaudeResponse('not valid json', []);
    expect(result).toBeNull();
  });

  /**
   * @edge: Valid JSON but missing moveType
   */
  it('should return null for response missing moveType', () => {
    const responseText = JSON.stringify({
      card: 'Village',
      reasoning: 'some reasoning',
    });

    const result = parseClaudeResponse(responseText, []);
    expect(result).toBeNull();
  });

  /**
   * @edge: Response contains move not in validMoves
   */
  it('should return null when move is not in valid moves list', () => {
    const responseText = JSON.stringify({
      moveType: 'buy',
      card: 'Province',
      reasoning: 'Buy Province for victory points.',
    });

    const validMoves: Move[] = [
      { type: 'buy', card: 'Silver' } as Move,
      { type: 'end_phase' } as Move,
    ];

    const result = parseClaudeResponse(responseText, validMoves);
    expect(result).toBeNull();
  });

  /**
   * @edge: JSON wrapped in markdown code block
   */
  it('should handle JSON wrapped in markdown code blocks', () => {
    const responseText = '```json\n{"moveType": "end_phase", "reasoning": "No actions."}\n```';

    const validMoves: Move[] = [{ type: 'end_phase' } as Move];

    const result = parseClaudeResponse(responseText, validMoves);

    expect(result).not.toBeNull();
    expect(result!.move.type).toBe('end_phase');
  });

  /**
   * @edge: Response with play_treasure move including card
   */
  it('should parse play_treasure response', () => {
    const responseText = JSON.stringify({
      moveType: 'play_treasure',
      card: 'Copper',
      reasoning: 'Play Copper for +1 coin.',
    });

    const validMoves: Move[] = [
      { type: 'play_treasure', card: 'Copper' } as Move,
      { type: 'play_treasure', card: 'Silver' } as Move,
      { type: 'end_phase' } as Move,
    ];

    const result = parseClaudeResponse(responseText, validMoves);

    expect(result).not.toBeNull();
    expect(result!.move.type).toBe('play_treasure');
    expect(result!.move.card).toBe('Copper');
  });

  /**
   * @edge: Response with cards array (e.g., discard moves)
   */
  it('should parse response with cards array for discard moves', () => {
    const responseText = JSON.stringify({
      moveType: 'discard_to_hand_size',
      cards: ['Copper', 'Estate'],
      reasoning: 'Discard lowest value cards.',
    });

    const validMoves: Move[] = [
      { type: 'discard_to_hand_size', cards: ['Copper', 'Estate'] } as Move,
    ];

    const result = parseClaudeResponse(responseText, validMoves);

    expect(result).not.toBeNull();
    expect(result!.move.type).toBe('discard_to_hand_size');
    expect(result!.move.cards).toEqual(['Copper', 'Estate']);
  });
});
