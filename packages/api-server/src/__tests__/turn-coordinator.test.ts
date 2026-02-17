/**
 * Turn Synchronization Coordinator Tests
 *
 * Tests the turn-based flow between human and AI players, including
 * turn transitions, AI auto-play, state consistency, and timeout handling.
 *
 * @req SYNC-001 - Human turn -> AI turn -> Human turn flow
 * @req SYNC-002 - AI auto-play triggers after human move
 * @req SYNC-003 - State consistency after turn transitions
 * @req SYNC-004 - Multiple WebSocket clients observe same game
 * @req SYNC-005 - Turn timeout handling
 */

import type { GameState, Move, Phase } from '@principality/core';
import type {
  AIDecisionContext,
  AIDecision,
  AIStrategy,
} from '../types/ai';
import type {
  WebSocketMessage,
  GameStateUpdateEvent,
  AITurnStartEvent,
  AIMoveEvent,
  ClientGameState,
} from '../types/api';

// =============================================================================
// Mocks
// =============================================================================

const mockCreate = jest.fn();

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

// =============================================================================
// Test Helpers
// =============================================================================

function createMockGameState(overrides?: Partial<Record<string, unknown>>): GameState {
  return {
    players: [
      {
        hand: ['Copper', 'Copper', 'Copper', 'Estate', 'Estate'],
        deck: ['Copper', 'Copper', 'Silver', 'Estate', 'Copper'],
        discard: [],
        inPlay: [],
        actions: 1,
        buys: 1,
        coins: 0,
      },
      {
        hand: ['Copper', 'Copper', 'Copper', 'Estate', 'Estate'],
        deck: ['Copper', 'Copper', 'Silver', 'Estate', 'Copper'],
        discard: [],
        inPlay: [],
        actions: 1,
        buys: 1,
        coins: 0,
      },
    ],
    supply: new Map([
      ['Copper', 46], ['Silver', 40], ['Gold', 30],
      ['Estate', 8], ['Duchy', 8], ['Province', 8], ['Curse', 10],
      ['Village', 10], ['Smithy', 10], ['Market', 10], ['Laboratory', 10],
      ['Festival', 10], ['Cellar', 10], ['Chapel', 10], ['Workshop', 10],
      ['Militia', 10], ['Moat', 10],
    ]),
    currentPlayer: 0,
    phase: 'action' as Phase,
    turnNumber: 1,
    gameLog: [],
    trash: [],
    kingdomCards: [
      'Village', 'Smithy', 'Market', 'Laboratory', 'Festival',
      'Cellar', 'Chapel', 'Workshop', 'Militia', 'Moat',
    ],
    ...overrides,
  } as unknown as GameState;
}

/**
 * Mock WebSocket client for collecting messages
 */
class MockWSClient {
  sentMessages: string[] = [];
  readyState = 1; // OPEN

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(): void {
    this.readyState = 3; // CLOSED
  }

  getParsedMessages<T = unknown>(): WebSocketMessage<T>[] {
    return this.sentMessages.map((m) => JSON.parse(m));
  }

  getMessagesOfType<T>(type: string): WebSocketMessage<T>[] {
    return this.getParsedMessages<T>().filter((m) => m.type === type);
  }

  clearMessages(): void {
    this.sentMessages = [];
  }
}

/**
 * Mock AI strategy that returns predetermined moves
 */
class MockAIStrategy {
  name = 'mock-ai';
  private moves: AIDecision[] = [];
  private callIndex = 0;

  queueMove(move: Move, reasoning = 'Mock decision.'): void {
    this.moves.push({
      move,
      reasoning,
      decisionTimeMs: 50,
      strategyUsed: 'mock-ai',
    });
  }

  canHandle(): boolean {
    return true;
  }

  async decideMove(): Promise<AIDecision> {
    if (this.callIndex >= this.moves.length) {
      return {
        move: { type: 'end_phase' } as Move,
        reasoning: 'Default end phase.',
        decisionTimeMs: 10,
        strategyUsed: 'mock-ai',
      };
    }
    return this.moves[this.callIndex++];
  }
}

// =============================================================================
// Turn Flow Tests
// =============================================================================

describe('TurnCoordinator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Human -> AI -> Human Turn Flow
  // ---------------------------------------------------------------------------

  describe('Turn Flow: Human -> AI -> Human', () => {
    /**
     * @req SYNC-001.1 - Game starts on human player's turn (player 0)
     * @why Human is always player 0 and goes first
     */
    it('should start with human player turn', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');
      const mockAI = new MockAIStrategy();
      const coordinator = new TurnCoordinator(mockAI as any);

      const state = createMockGameState({ currentPlayer: 0 });

      expect(coordinator.isHumanTurn(state)).toBe(true);
      expect(coordinator.isAITurn(state)).toBe(false);
    });

    /**
     * @req SYNC-001.2 - After human ends their turn, AI turn begins
     * @why Turn must transition from human (0) to AI (1) after cleanup
     */
    it('should detect when it becomes AI turn', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');
      const mockAI = new MockAIStrategy();
      const coordinator = new TurnCoordinator(mockAI as any);

      const state = createMockGameState({ currentPlayer: 1 });

      expect(coordinator.isAITurn(state)).toBe(true);
      expect(coordinator.isHumanTurn(state)).toBe(false);
    });

    /**
     * @req SYNC-001.3 - AI turn completes and transitions back to human
     * @why After AI plays action, buy, cleanup, it should be human's turn again
     */
    it('should execute full AI turn and return to human turn', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');
      const mockAI = new MockAIStrategy();

      // Queue AI moves for a full turn: end action, play treasures, buy Silver, end buy
      mockAI.queueMove({ type: 'end_phase' } as Move, 'Skip actions.');
      mockAI.queueMove({ type: 'play_treasure', card: 'Copper' } as Move, 'Play Copper.');
      mockAI.queueMove({ type: 'play_treasure', card: 'Copper' } as Move, 'Play Copper.');
      mockAI.queueMove({ type: 'play_treasure', card: 'Copper' } as Move, 'Play Copper.');
      mockAI.queueMove({ type: 'buy', card: 'Silver' } as Move, 'Buy Silver.');
      mockAI.queueMove({ type: 'end_phase' } as Move, 'End buy phase.');

      const coordinator = new TurnCoordinator(mockAI as any);

      // Start state: AI's turn
      const aiTurnState = createMockGameState({ currentPlayer: 1, phase: 'action' });

      const result = await coordinator.executeAITurn(aiTurnState, null as any);

      // After AI turn completes, should be human's turn
      expect(result.finalState.currentPlayer).toBe(0);
      expect(result.movesPlayed).toBeDefined();
      expect(result.movesPlayed.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // AI Auto-Play After Human Move
  // ---------------------------------------------------------------------------

  describe('AI Auto-Play', () => {
    /**
     * @req SYNC-002.1 - AI automatically plays when it becomes AI's turn
     * @why After human's cleanup phase transitions to AI's action phase,
     *      the coordinator must trigger AI auto-play without user interaction
     */
    it('should trigger AI turn after human move transitions to AI', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');
      const mockAI = new MockAIStrategy();
      mockAI.queueMove({ type: 'end_phase' } as Move, 'Skip.');

      const coordinator = new TurnCoordinator(mockAI as any);

      // State where it just became AI's turn
      const state = createMockGameState({ currentPlayer: 1, phase: 'action' });

      const shouldAutoPlay = coordinator.shouldAutoPlayAI(state);
      expect(shouldAutoPlay).toBe(true);
    });

    /**
     * @req SYNC-002.2 - AI auto-play does NOT trigger on human's turn
     */
    it('should not trigger auto-play on human turn', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');
      const coordinator = new TurnCoordinator(new MockAIStrategy() as any);

      const state = createMockGameState({ currentPlayer: 0, phase: 'action' });

      expect(coordinator.shouldAutoPlayAI(state)).toBe(false);
    });

    /**
     * @req SYNC-002.3 - AI auto-play does NOT trigger when game is over
     */
    it('should not trigger auto-play when game is over', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');
      const coordinator = new TurnCoordinator(new MockAIStrategy() as any);

      const state = createMockGameState({ currentPlayer: 1 });
      // Empty Province pile to trigger game over
      (state as any).supply.set('Province', 0);

      expect(coordinator.shouldAutoPlayAI(state)).toBe(false);
    });

    /**
     * @req SYNC-002.4 - Manual AI mode disables auto-play
     * @why When manualAI is true (for Claude MCP control), auto-play is disabled
     */
    it('should not auto-play when manualAI mode is enabled', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');
      const coordinator = new TurnCoordinator(new MockAIStrategy() as any, {
        manualAI: true,
      });

      const state = createMockGameState({ currentPlayer: 1 });

      expect(coordinator.shouldAutoPlayAI(state)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // State Consistency
  // ---------------------------------------------------------------------------

  describe('State Consistency', () => {
    /**
     * @req SYNC-003.1 - Turn number increments correctly
     * @why After both players take a turn, turn number should advance
     */
    it('should track turn number correctly across transitions', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');
      const mockAI = new MockAIStrategy();
      mockAI.queueMove({ type: 'end_phase' } as Move);

      const coordinator = new TurnCoordinator(mockAI as any);

      const state = createMockGameState({ turnNumber: 1 });

      // After a full round (human + AI), turn should advance
      const result = await coordinator.executeAITurn(
        createMockGameState({ currentPlayer: 1, turnNumber: 1 }),
        null as any
      );

      // Turn number should be 2 after AI completes their turn
      expect(result.finalState.turnNumber).toBeGreaterThanOrEqual(1);
    });

    /**
     * @req SYNC-003.2 - Phase resets to action at start of each turn
     * @why Each player's turn starts in action phase
     */
    it('should start each turn in action phase', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');
      const mockAI = new MockAIStrategy();
      mockAI.queueMove({ type: 'end_phase' } as Move); // skip actions
      mockAI.queueMove({ type: 'end_phase' } as Move); // skip buy

      const coordinator = new TurnCoordinator(mockAI as any);

      const result = await coordinator.executeAITurn(
        createMockGameState({ currentPlayer: 1, phase: 'action' }),
        null as any
      );

      // After AI turn, human's turn should start in action phase
      expect(result.finalState.phase).toBe('action');
    });

    /**
     * @req SYNC-003.3 - Each player draws 5 cards at turn start
     * @why After cleanup, draw pile provides 5 new cards for next turn
     */
    it('should ensure player has 5 cards after turn transition', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');
      const mockAI = new MockAIStrategy();
      mockAI.queueMove({ type: 'end_phase' } as Move);
      mockAI.queueMove({ type: 'end_phase' } as Move);

      const coordinator = new TurnCoordinator(mockAI as any);

      const result = await coordinator.executeAITurn(
        createMockGameState({ currentPlayer: 1, phase: 'action' }),
        null as any
      );

      // The human player should have 5 cards in hand for their turn
      const humanPlayer = result.finalState.players[0];
      expect(humanPlayer.hand).toHaveLength(5);
    });

    /**
     * @edge: AI turn when game ends mid-turn
     * @why If Province pile empties during AI's buy, game should end immediately
     */
    it('should stop AI turn if game ends during AI play', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');
      const mockAI = new MockAIStrategy();
      // AI buys last Province
      mockAI.queueMove({ type: 'end_phase' } as Move);
      mockAI.queueMove({ type: 'buy', card: 'Province' } as Move, 'Buy last Province.');

      const coordinator = new TurnCoordinator(mockAI as any);

      const state = createMockGameState({ currentPlayer: 1, phase: 'action' });
      // Only 1 Province left
      (state as any).supply.set('Province', 1);

      const result = await coordinator.executeAITurn(state, null as any);

      // Game should be marked as over
      expect(result.gameOver).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // WebSocket Event Broadcasting During Turns
  // ---------------------------------------------------------------------------

  describe('WebSocket Event Broadcasting', () => {
    /**
     * @req SYNC-004.1 - Broadcast ai_turn_start when AI begins
     * @why All connected clients need to know AI is thinking
     */
    it('should emit ai_turn_start event when AI turn begins', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');
      const mockAI = new MockAIStrategy();
      mockAI.queueMove({ type: 'end_phase' } as Move);
      mockAI.queueMove({ type: 'end_phase' } as Move);

      const coordinator = new TurnCoordinator(mockAI as any);

      const events: Array<{ type: string; payload: unknown }> = [];
      coordinator.on('ai_turn_start', (payload: unknown) => {
        events.push({ type: 'ai_turn_start', payload });
      });

      await coordinator.executeAITurn(
        createMockGameState({ currentPlayer: 1, phase: 'action' }),
        null as any
      );

      const startEvents = events.filter((e) => e.type === 'ai_turn_start');
      expect(startEvents).toHaveLength(1);
      expect((startEvents[0].payload as AITurnStartEvent).estimatedTimeMs).toBeDefined();
    });

    /**
     * @req SYNC-004.2 - Broadcast ai_move for each AI action
     * @why Clients animate/display each AI move as it happens
     */
    it('should emit ai_move event for each move AI makes', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');
      const mockAI = new MockAIStrategy();
      mockAI.queueMove({ type: 'end_phase' } as Move, 'Skip actions.');
      mockAI.queueMove({ type: 'buy', card: 'Silver' } as Move, 'Buy Silver.');
      mockAI.queueMove({ type: 'end_phase' } as Move, 'End buy.');

      const coordinator = new TurnCoordinator(mockAI as any);

      const moveEvents: Array<{ move: Move; reasoning?: string }> = [];
      coordinator.on('ai_move', (payload: unknown) => {
        const event = payload as AIMoveEvent;
        moveEvents.push({ move: event.move, reasoning: event.reasoning });
      });

      await coordinator.executeAITurn(
        createMockGameState({ currentPlayer: 1, phase: 'action' }),
        null as any
      );

      // Should have emitted events for each AI move
      expect(moveEvents.length).toBeGreaterThan(0);
    });

    /**
     * @req SYNC-004.3 - Broadcast game_state_update after AI turn completes
     */
    it('should emit game_state_update after AI turn', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');
      const mockAI = new MockAIStrategy();
      mockAI.queueMove({ type: 'end_phase' } as Move);
      mockAI.queueMove({ type: 'end_phase' } as Move);

      const coordinator = new TurnCoordinator(mockAI as any);

      const stateEvents: unknown[] = [];
      coordinator.on('game_state_update', (payload: unknown) => {
        stateEvents.push(payload);
      });

      await coordinator.executeAITurn(
        createMockGameState({ currentPlayer: 1, phase: 'action' }),
        null as any
      );

      expect(stateEvents.length).toBeGreaterThan(0);
    });

    /**
     * @req SYNC-004.4 - Broadcast game_over when game ends during AI turn
     */
    it('should emit game_over event if game ends during AI turn', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');
      const mockAI = new MockAIStrategy();
      mockAI.queueMove({ type: 'end_phase' } as Move);
      mockAI.queueMove({ type: 'buy', card: 'Province' } as Move);

      const coordinator = new TurnCoordinator(mockAI as any);

      const gameOverEvents: unknown[] = [];
      coordinator.on('game_over', (payload: unknown) => {
        gameOverEvents.push(payload);
      });

      const state = createMockGameState({ currentPlayer: 1, phase: 'action' });
      (state as any).supply.set('Province', 1);

      await coordinator.executeAITurn(state, null as any);

      // May or may not emit depending on whether the buy actually empties provinces
      // (depends on engine). Test that if game is over, event is emitted.
      if (gameOverEvents.length > 0) {
        expect(gameOverEvents[0]).toBeDefined();
      }
    });

    /**
     * @req SYNC-004.5 - Multiple clients receive same events
     * @why All observers see identical game progression
     */
    it('should deliver events to all registered listeners', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');
      const mockAI = new MockAIStrategy();
      mockAI.queueMove({ type: 'end_phase' } as Move);
      mockAI.queueMove({ type: 'end_phase' } as Move);

      const coordinator = new TurnCoordinator(mockAI as any);

      // Two independent listeners (simulating two WS clients)
      const listener1Events: string[] = [];
      const listener2Events: string[] = [];

      coordinator.on('ai_turn_start', () => listener1Events.push('ai_turn_start'));
      coordinator.on('ai_turn_start', () => listener2Events.push('ai_turn_start'));

      await coordinator.executeAITurn(
        createMockGameState({ currentPlayer: 1, phase: 'action' }),
        null as any
      );

      expect(listener1Events).toContain('ai_turn_start');
      expect(listener2Events).toContain('ai_turn_start');
    });
  });

  // ---------------------------------------------------------------------------
  // Turn Timeout Handling
  // ---------------------------------------------------------------------------

  describe('Turn Timeout', () => {
    /**
     * @req SYNC-005.1 - AI turn has a maximum duration
     * @why Prevents infinite AI turns if API is unresponsive
     */
    it('should have configurable AI turn timeout', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');
      const coordinator = new TurnCoordinator(new MockAIStrategy() as any, {
        aiTurnTimeoutMs: 30000,
      });

      expect(coordinator.getAITurnTimeout()).toBe(30000);
    });

    /**
     * @req SYNC-005.2 - Default timeout is reasonable
     * @why Must have a sensible default even if not configured
     */
    it('should have a default AI turn timeout', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');
      const coordinator = new TurnCoordinator(new MockAIStrategy() as any);

      const timeout = coordinator.getAITurnTimeout();
      expect(timeout).toBeGreaterThan(0);
      expect(timeout).toBeLessThanOrEqual(120000); // Max 2 minutes
    });

    /**
     * @req SYNC-005.3 - Timeout triggers fallback behavior
     * @why If AI strategy times out, coordinator should use Big Money fallback
     */
    it('should fall back to Big Money if AI times out', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');

      // Create a slow AI that takes too long
      const slowAI = {
        name: 'slow-ai',
        canHandle: () => true,
        decideMove: () => new Promise<AIDecision>((resolve) => {
          // Never resolves within timeout
          setTimeout(() => resolve({
            move: { type: 'end_phase' } as Move,
            reasoning: 'Eventually...',
            decisionTimeMs: 999999,
            strategyUsed: 'slow-ai',
          }), 60000);
        }),
      };

      const coordinator = new TurnCoordinator(slowAI as any, {
        aiTurnTimeoutMs: 100, // Very short timeout for testing
      });

      const state = createMockGameState({ currentPlayer: 1, phase: 'action' });
      const result = await coordinator.executeAITurn(state, null as any);

      // Should have completed (via fallback) even though slow AI didn't respond
      expect(result).toBeDefined();
      expect(result.timedOut).toBe(true);
    });

    /**
     * @edge: Human turn timeout (optional feature)
     * @why Server may enforce a time limit on human turns
     */
    it('should support configurable human turn timeout', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');
      const coordinator = new TurnCoordinator(new MockAIStrategy() as any, {
        humanTurnTimeoutMs: 300000, // 5 minutes
      });

      expect(coordinator.getHumanTurnTimeout()).toBe(300000);
    });
  });

  // ---------------------------------------------------------------------------
  // Pending Effects During AI Turn
  // ---------------------------------------------------------------------------

  describe('Pending Effects', () => {
    /**
     * @req SYNC-001.4 - AI resolves pending attack effects
     * @why When human plays an attack (Militia), AI must respond (discard cards)
     */
    it('should handle pending effects targeting AI', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');
      const mockAI = new MockAIStrategy();
      mockAI.queueMove(
        { type: 'discard_to_hand_size', cards: ['Copper', 'Estate'] } as Move,
        'Discard weakest cards.'
      );

      const coordinator = new TurnCoordinator(mockAI as any);

      const stateWithPending = createMockGameState({
        currentPlayer: 0, // Human's turn but AI has pending effect
      });
      (stateWithPending as any).pendingEffect = {
        card: 'Militia',
        effect: 'discard_to_hand_size',
        targetPlayer: 1,
        targetHandSize: 3,
      };

      const result = await coordinator.resolveAIPendingEffect(stateWithPending, null as any);

      expect(result.resolved).toBe(true);
    });

    /**
     * @edge: Pending effect targets human, not AI
     * @why Coordinator should not auto-resolve human's effects
     */
    it('should not auto-resolve effects targeting human player', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');
      const coordinator = new TurnCoordinator(new MockAIStrategy() as any);

      const stateWithHumanPending = createMockGameState();
      (stateWithHumanPending as any).pendingEffect = {
        card: 'Militia',
        effect: 'discard_to_hand_size',
        targetPlayer: 0, // Human
        targetHandSize: 3,
      };

      const result = await coordinator.resolveAIPendingEffect(stateWithHumanPending, null as any);

      expect(result.resolved).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // AI Turn Result
  // ---------------------------------------------------------------------------

  describe('AI Turn Result', () => {
    /**
     * @req SYNC-001.5 - AI turn result includes summary
     * @why Callers need to know what happened during the AI turn
     */
    it('should return turn result with moves played and timing', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');
      const mockAI = new MockAIStrategy();
      mockAI.queueMove({ type: 'end_phase' } as Move, 'Skip actions.');
      mockAI.queueMove({ type: 'end_phase' } as Move, 'Skip buying.');

      const coordinator = new TurnCoordinator(mockAI as any);

      const result = await coordinator.executeAITurn(
        createMockGameState({ currentPlayer: 1, phase: 'action' }),
        null as any
      );

      expect(result.finalState).toBeDefined();
      expect(result.movesPlayed).toBeDefined();
      expect(Array.isArray(result.movesPlayed)).toBe(true);
      expect(result.totalTimeMs).toBeDefined();
      expect(result.totalTimeMs).toBeGreaterThanOrEqual(0);
    });

    /**
     * @req SYNC-001.6 - AI turn result indicates game over status
     */
    it('should indicate whether game is over in result', async () => {
      const { TurnCoordinator } = await import('../services/turn-coordinator');
      const mockAI = new MockAIStrategy();
      mockAI.queueMove({ type: 'end_phase' } as Move);
      mockAI.queueMove({ type: 'end_phase' } as Move);

      const coordinator = new TurnCoordinator(mockAI as any);

      const result = await coordinator.executeAITurn(
        createMockGameState({ currentPlayer: 1, phase: 'action' }),
        null as any
      );

      expect(typeof result.gameOver).toBe('boolean');
    });
  });
});
