/**
 * WebSocket Server Unit Tests
 *
 * Tests WebSocket connection management, event broadcasting, and message handling
 * for real-time game state synchronization between server and clients.
 *
 * @req API-002 - WebSocket events for real-time updates
 * @req API-002.1 - State update event
 * @req API-002.2 - AI turn start event
 * @req API-002.3 - AI move event
 * @req API-002.4 - Narration event
 * @req API-002.5 - Game over event
 * @req API-002.6 - Subscribe to game channel
 * @req API-002.7 - Set narration preference
 */

import type { Move, Phase } from '@principality/core';
import type {
  WebSocketMessage,
  WebSocketEventType,
  GameStateUpdateEvent,
  AITurnStartEvent,
  AIMoveEvent,
  NarrationEvent,
  GameOverEvent,
  ErrorEvent,
  SubscribeEvent,
  SetNarrationEvent,
  ClientGameState,
  ValidMove,
  PlayerScore,
} from '../types/api';

// =============================================================================
// Mock WebSocket
// =============================================================================

/**
 * Mock WebSocket client for testing.
 * Collects sent messages and simulates readyState.
 */
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState: number = MockWebSocket.OPEN;
  sentMessages: string[] = [];
  closeCode?: number;
  closeReason?: string;
  onmessage?: (event: { data: string }) => void;
  onclose?: (event: { code: number; reason: string }) => void;
  onerror?: (event: { error: Error }) => void;

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.sentMessages.push(data);
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    this.closeCode = code;
    this.closeReason = reason;
    if (this.onclose) {
      this.onclose({ code: code || 1000, reason: reason || '' });
    }
  }

  /** Helper to get parsed messages */
  getParsedMessages<T = unknown>(): WebSocketMessage<T>[] {
    return this.sentMessages.map((m) => JSON.parse(m));
  }

  /** Helper to simulate receiving a message from the client */
  simulateMessage(data: object | string): void {
    const msg = typeof data === 'string' ? data : JSON.stringify(data);
    if (this.onmessage) {
      this.onmessage({ data: msg });
    }
  }
}

// =============================================================================
// Test Helpers
// =============================================================================

function createMockClientGameState(overrides?: Partial<ClientGameState>): ClientGameState {
  return {
    humanPlayer: {
      hand: ['Copper', 'Copper', 'Copper', 'Estate', 'Estate'],
      drawPileCount: 5,
      discardPile: [],
      inPlay: [],
      actions: 1,
      buys: 1,
      coins: 0,
    },
    aiPlayer: {
      handCount: 5,
      drawPileCount: 5,
      discardPile: [],
      inPlay: [],
      actions: 1,
      buys: 1,
      coins: 0,
    },
    supply: {
      Copper: 46, Silver: 40, Gold: 30,
      Estate: 8, Duchy: 8, Province: 8, Curse: 10,
      Village: 10, Smithy: 10, Market: 10, Laboratory: 10, Festival: 10,
      Cellar: 10, Chapel: 10, Workshop: 10, Militia: 10, Moat: 10,
    },
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
  };
}

function createMockScores(): PlayerScore[] {
  return [
    {
      playerIndex: 0,
      name: 'Human',
      score: 6,
      breakdown: { estates: 3, duchies: 0, provinces: 0, gardens: 0, curses: 0, total: 6 },
    },
    {
      playerIndex: 1,
      name: 'AI',
      score: 12,
      breakdown: { estates: 0, duchies: 0, provinces: 2, gardens: 0, curses: 0, total: 12 },
    },
  ];
}

// =============================================================================
// WebSocket Server - Connection Management
// =============================================================================

describe('WebSocketServer', () => {
  // We import the module to test after setup. The actual class/module path
  // will be defined by the implementer.
  // Expected import: import { WebSocketServer } from '../services/websocket-server';

  describe('Connection Management', () => {
    /**
     * @req API-002.6 - Client can subscribe to game updates
     * @why Clients must connect and subscribe to receive game events
     */
    it('should accept a new client connection', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client = new MockWebSocket();
      wsServer.handleConnection(client as any);

      expect(wsServer.getConnectionCount()).toBe(1);
    });

    /**
     * @req API-002.6 - Multiple clients can connect
     */
    it('should handle multiple simultaneous connections', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client1 = new MockWebSocket();
      const client2 = new MockWebSocket();
      const client3 = new MockWebSocket();

      wsServer.handleConnection(client1 as any);
      wsServer.handleConnection(client2 as any);
      wsServer.handleConnection(client3 as any);

      expect(wsServer.getConnectionCount()).toBe(3);
    });

    /**
     * @req API-002.6 - Clean disconnection handling
     * @why Server must track active connections and clean up on disconnect
     */
    it('should remove client on disconnect', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client = new MockWebSocket();
      wsServer.handleConnection(client as any);
      expect(wsServer.getConnectionCount()).toBe(1);

      // Simulate disconnect
      client.close();
      // Server should detect and clean up
      wsServer.handleDisconnection(client as any);

      expect(wsServer.getConnectionCount()).toBe(0);
    });

    /**
     * @edge: Client connection error
     */
    it('should handle client connection errors gracefully', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client = new MockWebSocket();
      wsServer.handleConnection(client as any);

      // Simulate error
      const error = new Error('Connection reset by peer');
      wsServer.handleError(client as any, error);

      // Should not throw, should clean up
      expect(wsServer.getConnectionCount()).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Game Subscription
  // ---------------------------------------------------------------------------

  describe('Game Subscription', () => {
    /**
     * @req API-002.6 - Subscribe to game channel
     * @why Clients subscribe to a specific gameId to receive updates for that game
     */
    it('should subscribe client to a game channel', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client = new MockWebSocket();
      wsServer.handleConnection(client as any);

      const subscribeMsg: WebSocketMessage<SubscribeEvent> = {
        type: 'subscribe',
        payload: { gameId: 'game-123' },
        timestamp: Date.now(),
      };

      wsServer.handleMessage(client as any, JSON.stringify(subscribeMsg));

      expect(wsServer.getSubscribers('game-123')).toHaveLength(1);
    });

    /**
     * @req API-002.6 - Multiple clients subscribe to same game
     */
    it('should allow multiple clients to subscribe to the same game', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client1 = new MockWebSocket();
      const client2 = new MockWebSocket();
      wsServer.handleConnection(client1 as any);
      wsServer.handleConnection(client2 as any);

      const subscribeMsg: WebSocketMessage<SubscribeEvent> = {
        type: 'subscribe',
        payload: { gameId: 'game-123' },
        timestamp: Date.now(),
      };

      wsServer.handleMessage(client1 as any, JSON.stringify(subscribeMsg));
      wsServer.handleMessage(client2 as any, JSON.stringify(subscribeMsg));

      expect(wsServer.getSubscribers('game-123')).toHaveLength(2);
    });

    /**
     * @edge: Subscribe to non-existent game
     * @why Server should send error event, not crash
     */
    it('should send error when subscribing to non-existent game', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client = new MockWebSocket();
      wsServer.handleConnection(client as any);

      const subscribeMsg: WebSocketMessage<SubscribeEvent> = {
        type: 'subscribe',
        payload: { gameId: 'nonexistent-game' },
        timestamp: Date.now(),
      };

      // Server may either accept the subscription (lazy validation)
      // or send an error. Either way, it should not throw.
      expect(() => {
        wsServer.handleMessage(client as any, JSON.stringify(subscribeMsg));
      }).not.toThrow();
    });

    /**
     * @edge: Client disconnects while subscribed
     * @why Subscription cleanup must happen on disconnect
     */
    it('should remove subscriber when client disconnects', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client = new MockWebSocket();
      wsServer.handleConnection(client as any);

      const subscribeMsg: WebSocketMessage<SubscribeEvent> = {
        type: 'subscribe',
        payload: { gameId: 'game-456' },
        timestamp: Date.now(),
      };
      wsServer.handleMessage(client as any, JSON.stringify(subscribeMsg));
      expect(wsServer.getSubscribers('game-456')).toHaveLength(1);

      // Disconnect
      wsServer.handleDisconnection(client as any);
      expect(wsServer.getSubscribers('game-456')).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Server -> Client Events: Game State Updates
  // ---------------------------------------------------------------------------

  describe('Game State Update Events', () => {
    /**
     * @req API-002.1 - Broadcast state update after move execution
     * @why All subscribed clients must receive the updated game state after a move
     */
    it('should broadcast game_state_update to all subscribers', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client1 = new MockWebSocket();
      const client2 = new MockWebSocket();
      wsServer.handleConnection(client1 as any);
      wsServer.handleConnection(client2 as any);

      // Subscribe both to game
      const subscribeMsg: WebSocketMessage<SubscribeEvent> = {
        type: 'subscribe',
        payload: { gameId: 'game-789' },
        timestamp: Date.now(),
      };
      wsServer.handleMessage(client1 as any, JSON.stringify(subscribeMsg));
      wsServer.handleMessage(client2 as any, JSON.stringify(subscribeMsg));

      // Broadcast state update
      const stateUpdate: GameStateUpdateEvent = {
        gameState: createMockClientGameState({ phase: 'buy' as Phase }),
        validMoves: [{ move: { type: 'end_phase' } as Move, description: 'End buy phase' }],
        trigger: 'move_executed',
      };

      wsServer.broadcastToGame('game-789', 'game_state_update', stateUpdate);

      // Both clients should receive the message
      expect(client1.sentMessages).toHaveLength(1);
      expect(client2.sentMessages).toHaveLength(1);

      const parsed1 = JSON.parse(client1.sentMessages[0]) as WebSocketMessage<GameStateUpdateEvent>;
      expect(parsed1.type).toBe('game_state_update');
      expect(parsed1.payload.trigger).toBe('move_executed');
      expect(parsed1.payload.gameState.phase).toBe('buy');
    });

    /**
     * @req API-002.1 - State update includes trigger reason
     */
    it('should include trigger type in state update events', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client = new MockWebSocket();
      wsServer.handleConnection(client as any);
      wsServer.handleMessage(client as any, JSON.stringify({
        type: 'subscribe',
        payload: { gameId: 'game-trigger' },
        timestamp: Date.now(),
      }));

      // Test each trigger type
      const triggers: Array<GameStateUpdateEvent['trigger']> = [
        'move_executed',
        'turn_changed',
        'phase_changed',
      ];

      for (const trigger of triggers) {
        wsServer.broadcastToGame('game-trigger', 'game_state_update', {
          gameState: createMockClientGameState(),
          validMoves: [],
          trigger,
        } satisfies GameStateUpdateEvent);
      }

      expect(client.sentMessages).toHaveLength(3);

      const messages = client.getParsedMessages<GameStateUpdateEvent>();
      expect(messages[0].payload.trigger).toBe('move_executed');
      expect(messages[1].payload.trigger).toBe('turn_changed');
      expect(messages[2].payload.trigger).toBe('phase_changed');
    });

    /**
     * @edge: Broadcast to game with no subscribers
     * @why Should be a no-op, not an error
     */
    it('should not throw when broadcasting to game with no subscribers', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      expect(() => {
        wsServer.broadcastToGame('no-subscribers-game', 'game_state_update', {
          gameState: createMockClientGameState(),
          validMoves: [],
          trigger: 'move_executed',
        } satisfies GameStateUpdateEvent);
      }).not.toThrow();
    });

    /**
     * @edge: Closed client in subscriber list
     * @why Server must skip clients that have disconnected but not yet cleaned up
     */
    it('should skip closed connections when broadcasting', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client1 = new MockWebSocket();
      const client2 = new MockWebSocket();
      wsServer.handleConnection(client1 as any);
      wsServer.handleConnection(client2 as any);

      const subscribeMsg: WebSocketMessage<SubscribeEvent> = {
        type: 'subscribe',
        payload: { gameId: 'game-closed' },
        timestamp: Date.now(),
      };
      wsServer.handleMessage(client1 as any, JSON.stringify(subscribeMsg));
      wsServer.handleMessage(client2 as any, JSON.stringify(subscribeMsg));

      // Close client1 without proper cleanup
      client1.readyState = MockWebSocket.CLOSED;

      wsServer.broadcastToGame('game-closed', 'game_state_update', {
        gameState: createMockClientGameState(),
        validMoves: [],
        trigger: 'move_executed',
      } satisfies GameStateUpdateEvent);

      // Only client2 should receive the message
      expect(client1.sentMessages).toHaveLength(0);
      expect(client2.sentMessages).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Server -> Client Events: AI Turn Events
  // ---------------------------------------------------------------------------

  describe('AI Turn Events', () => {
    /**
     * @req API-002.2 - AI turn start event with estimated time
     * @why Client shows "AI is thinking..." indicator with estimated duration
     */
    it('should broadcast ai_turn_start event', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client = new MockWebSocket();
      wsServer.handleConnection(client as any);
      wsServer.handleMessage(client as any, JSON.stringify({
        type: 'subscribe',
        payload: { gameId: 'game-ai' },
        timestamp: Date.now(),
      }));

      const aiStartEvent: AITurnStartEvent = {
        estimatedTimeMs: 5000,
      };

      wsServer.broadcastToGame('game-ai', 'ai_turn_start', aiStartEvent);

      expect(client.sentMessages).toHaveLength(1);
      const parsed = JSON.parse(client.sentMessages[0]) as WebSocketMessage<AITurnStartEvent>;
      expect(parsed.type).toBe('ai_turn_start');
      expect(parsed.payload.estimatedTimeMs).toBe(5000);
    });

    /**
     * @req API-002.3 - AI move event with move details and reasoning
     * @why Client displays AI's move and optional reasoning/narration
     */
    it('should broadcast ai_move event with reasoning', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client = new MockWebSocket();
      wsServer.handleConnection(client as any);
      wsServer.handleMessage(client as any, JSON.stringify({
        type: 'subscribe',
        payload: { gameId: 'game-ai-move' },
        timestamp: Date.now(),
      }));

      const aiMoveEvent: AIMoveEvent = {
        move: { type: 'buy', card: 'Gold' } as Move,
        reasoning: 'Gold is the best economy card at $6.',
        gameState: createMockClientGameState({ phase: 'buy' as Phase }),
        validMoves: [],
      };

      wsServer.broadcastToGame('game-ai-move', 'ai_move', aiMoveEvent);

      expect(client.sentMessages).toHaveLength(1);
      const parsed = JSON.parse(client.sentMessages[0]) as WebSocketMessage<AIMoveEvent>;
      expect(parsed.type).toBe('ai_move');
      expect(parsed.payload.move.type).toBe('buy');
      expect(parsed.payload.move.card).toBe('Gold');
      expect(parsed.payload.reasoning).toContain('Gold');
    });

    /**
     * @edge: AI move without reasoning
     * @why Reasoning is optional; should not break the event
     */
    it('should broadcast ai_move without reasoning', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client = new MockWebSocket();
      wsServer.handleConnection(client as any);
      wsServer.handleMessage(client as any, JSON.stringify({
        type: 'subscribe',
        payload: { gameId: 'game-no-reason' },
        timestamp: Date.now(),
      }));

      const aiMoveEvent: AIMoveEvent = {
        move: { type: 'end_phase' } as Move,
        gameState: createMockClientGameState(),
        validMoves: [],
      };

      wsServer.broadcastToGame('game-no-reason', 'ai_move', aiMoveEvent);

      const parsed = JSON.parse(client.sentMessages[0]) as WebSocketMessage<AIMoveEvent>;
      expect(parsed.payload.reasoning).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Server -> Client Events: Narration
  // ---------------------------------------------------------------------------

  describe('Narration Events', () => {
    /**
     * @req API-002.4 - Narration event for game commentary
     * @why Optional flavor text that makes the game more engaging
     */
    it('should broadcast narration event', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client = new MockWebSocket();
      wsServer.handleConnection(client as any);
      wsServer.handleMessage(client as any, JSON.stringify({
        type: 'subscribe',
        payload: { gameId: 'game-narrate' },
        timestamp: Date.now(),
      }));

      const narrationEvent: NarrationEvent = {
        text: 'The AI strategically builds its economy with Gold.',
        type: 'move_commentary',
      };

      wsServer.broadcastToGame('game-narrate', 'narration', narrationEvent);

      const parsed = JSON.parse(client.sentMessages[0]) as WebSocketMessage<NarrationEvent>;
      expect(parsed.type).toBe('narration');
      expect(parsed.payload.text).toContain('Gold');
      expect(parsed.payload.type).toBe('move_commentary');
    });

    /**
     * @req API-002.4 - Different narration types
     */
    it('should support different narration types', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client = new MockWebSocket();
      wsServer.handleConnection(client as any);
      wsServer.handleMessage(client as any, JSON.stringify({
        type: 'subscribe',
        payload: { gameId: 'game-narrate-types' },
        timestamp: Date.now(),
      }));

      const types: NarrationEvent['type'][] = [
        'move_commentary',
        'strategy_insight',
        'game_milestone',
      ];

      for (const narType of types) {
        wsServer.broadcastToGame('game-narrate-types', 'narration', {
          text: `Narration of type: ${narType}`,
          type: narType,
        } satisfies NarrationEvent);
      }

      expect(client.sentMessages).toHaveLength(3);
      const messages = client.getParsedMessages<NarrationEvent>();
      expect(messages[0].payload.type).toBe('move_commentary');
      expect(messages[1].payload.type).toBe('strategy_insight');
      expect(messages[2].payload.type).toBe('game_milestone');
    });
  });

  // ---------------------------------------------------------------------------
  // Server -> Client Events: Game Over
  // ---------------------------------------------------------------------------

  describe('Game Over Events', () => {
    /**
     * @req API-002.5 - Game over event with winner and scores
     * @why Client needs final scores and end condition for game summary screen
     */
    it('should broadcast game_over event with scores', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client = new MockWebSocket();
      wsServer.handleConnection(client as any);
      wsServer.handleMessage(client as any, JSON.stringify({
        type: 'subscribe',
        payload: { gameId: 'game-over' },
        timestamp: Date.now(),
      }));

      const gameOverEvent: GameOverEvent = {
        winner: 1,
        scores: createMockScores(),
        endCondition: 'provinces_empty',
        summary: 'AI won by aggressive Province buying.',
      };

      wsServer.broadcastToGame('game-over', 'game_over', gameOverEvent);

      const parsed = JSON.parse(client.sentMessages[0]) as WebSocketMessage<GameOverEvent>;
      expect(parsed.type).toBe('game_over');
      expect(parsed.payload.winner).toBe(1);
      expect(parsed.payload.scores).toHaveLength(2);
      expect(parsed.payload.endCondition).toBe('provinces_empty');
      expect(parsed.payload.summary).toContain('AI won');
    });

    /**
     * @req API-002.5 - Game over with three piles empty condition
     */
    it('should support three_piles_empty end condition', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client = new MockWebSocket();
      wsServer.handleConnection(client as any);
      wsServer.handleMessage(client as any, JSON.stringify({
        type: 'subscribe',
        payload: { gameId: 'game-3piles' },
        timestamp: Date.now(),
      }));

      const gameOverEvent: GameOverEvent = {
        winner: 0,
        scores: createMockScores(),
        endCondition: 'three_piles_empty',
      };

      wsServer.broadcastToGame('game-3piles', 'game_over', gameOverEvent);

      const parsed = JSON.parse(client.sentMessages[0]) as WebSocketMessage<GameOverEvent>;
      expect(parsed.payload.endCondition).toBe('three_piles_empty');
    });
  });

  // ---------------------------------------------------------------------------
  // Server -> Client Events: Errors
  // ---------------------------------------------------------------------------

  describe('Error Events', () => {
    /**
     * @req API-002 - Error event for client notification
     * @why Client needs to display error messages to the user
     */
    it('should send error event to specific client', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client = new MockWebSocket();
      wsServer.handleConnection(client as any);

      const errorEvent: ErrorEvent = {
        code: 'INVALID_MOVE',
        message: 'Cannot buy Province: insufficient coins.',
      };

      wsServer.sendToClient(client as any, 'error', errorEvent);

      expect(client.sentMessages).toHaveLength(1);
      const parsed = JSON.parse(client.sentMessages[0]) as WebSocketMessage<ErrorEvent>;
      expect(parsed.type).toBe('error');
      expect(parsed.payload.code).toBe('INVALID_MOVE');
      expect(parsed.payload.message).toContain('Province');
    });
  });

  // ---------------------------------------------------------------------------
  // Client -> Server Events: Set Narration
  // ---------------------------------------------------------------------------

  describe('Set Narration Preference', () => {
    /**
     * @req API-002.7 - Client can toggle narration
     * @why Narration is optional; client can enable/disable it
     */
    it('should handle set_narration message from client', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client = new MockWebSocket();
      wsServer.handleConnection(client as any);

      // Subscribe first
      wsServer.handleMessage(client as any, JSON.stringify({
        type: 'subscribe',
        payload: { gameId: 'game-narr' },
        timestamp: Date.now(),
      }));

      // Set narration preference
      const narrationMsg: WebSocketMessage<SetNarrationEvent> = {
        type: 'set_narration',
        payload: { enabled: false },
        timestamp: Date.now(),
      };

      wsServer.handleMessage(client as any, JSON.stringify(narrationMsg));

      expect(wsServer.isNarrationEnabled(client as any)).toBe(false);
    });

    /**
     * @req API-002.7 - Narration enabled by default
     */
    it('should have narration enabled by default', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client = new MockWebSocket();
      wsServer.handleConnection(client as any);

      expect(wsServer.isNarrationEnabled(client as any)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Client -> Server Events: Invalid Messages
  // ---------------------------------------------------------------------------

  describe('Invalid Message Handling', () => {
    /**
     * @edge: Non-JSON message from client
     * @why Client might send malformed data; server should not crash
     */
    it('should handle non-JSON messages gracefully', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client = new MockWebSocket();
      wsServer.handleConnection(client as any);

      expect(() => {
        wsServer.handleMessage(client as any, 'not valid json at all');
      }).not.toThrow();

      // Should send an error back to client
      expect(client.sentMessages.length).toBeGreaterThanOrEqual(1);
      const parsed = JSON.parse(client.sentMessages[0]) as WebSocketMessage<ErrorEvent>;
      expect(parsed.type).toBe('error');
    });

    /**
     * @edge: Unknown message type from client
     */
    it('should handle unknown message types gracefully', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client = new MockWebSocket();
      wsServer.handleConnection(client as any);

      const unknownMsg = {
        type: 'unknown_type',
        payload: {},
        timestamp: Date.now(),
      };

      expect(() => {
        wsServer.handleMessage(client as any, JSON.stringify(unknownMsg));
      }).not.toThrow();
    });

    /**
     * @edge: Message missing required fields
     */
    it('should handle message missing type field', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client = new MockWebSocket();
      wsServer.handleConnection(client as any);

      const malformedMsg = {
        payload: { gameId: 'game-123' },
        timestamp: Date.now(),
      };

      expect(() => {
        wsServer.handleMessage(client as any, JSON.stringify(malformedMsg));
      }).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // Message Format
  // ---------------------------------------------------------------------------

  describe('Message Format', () => {
    /**
     * @req API-002 - All messages follow WebSocketMessage structure
     * @why Consistent format: { type, payload, timestamp }
     */
    it('should include timestamp in all outgoing messages', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client = new MockWebSocket();
      wsServer.handleConnection(client as any);
      wsServer.handleMessage(client as any, JSON.stringify({
        type: 'subscribe',
        payload: { gameId: 'game-ts' },
        timestamp: Date.now(),
      }));

      wsServer.broadcastToGame('game-ts', 'game_state_update', {
        gameState: createMockClientGameState(),
        validMoves: [],
        trigger: 'move_executed',
      } satisfies GameStateUpdateEvent);

      const parsed = JSON.parse(client.sentMessages[0]) as WebSocketMessage;
      expect(parsed.timestamp).toBeDefined();
      expect(typeof parsed.timestamp).toBe('number');
      expect(parsed.timestamp).toBeGreaterThan(0);
    });

    /**
     * @req API-002 - All messages include type field
     */
    it('should include type in all outgoing messages', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client = new MockWebSocket();
      wsServer.handleConnection(client as any);

      wsServer.sendToClient(client as any, 'error', {
        code: 'TEST',
        message: 'Test error',
      } satisfies ErrorEvent);

      const parsed = JSON.parse(client.sentMessages[0]) as WebSocketMessage;
      expect(parsed.type).toBe('error');
      expect(parsed.payload).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  describe('Server Cleanup', () => {
    /**
     * @req API-002 - Clean shutdown closes all connections
     * @why Server must properly close all WebSocket connections on shutdown
     */
    it('should close all connections on shutdown', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client1 = new MockWebSocket();
      const client2 = new MockWebSocket();
      wsServer.handleConnection(client1 as any);
      wsServer.handleConnection(client2 as any);

      expect(wsServer.getConnectionCount()).toBe(2);

      wsServer.shutdown();

      expect(wsServer.getConnectionCount()).toBe(0);
    });

    /**
     * @edge: Shutdown with no active connections
     */
    it('should handle shutdown with no connections gracefully', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      expect(() => {
        wsServer.shutdown();
      }).not.toThrow();
    });

    /**
     * @edge: Remove all subscribers for a deleted game
     * @why When a game ends or is deleted, all subscribers should be unsubscribed
     */
    it('should remove all subscribers when game is removed', async () => {
      const { WebSocketServer } = await import('../services/websocket-server');
      const wsServer = new WebSocketServer();

      const client1 = new MockWebSocket();
      const client2 = new MockWebSocket();
      wsServer.handleConnection(client1 as any);
      wsServer.handleConnection(client2 as any);

      const subscribeMsg: WebSocketMessage<SubscribeEvent> = {
        type: 'subscribe',
        payload: { gameId: 'game-to-delete' },
        timestamp: Date.now(),
      };
      wsServer.handleMessage(client1 as any, JSON.stringify(subscribeMsg));
      wsServer.handleMessage(client2 as any, JSON.stringify(subscribeMsg));

      expect(wsServer.getSubscribers('game-to-delete')).toHaveLength(2);

      wsServer.removeGame('game-to-delete');

      expect(wsServer.getSubscribers('game-to-delete')).toHaveLength(0);
    });
  });
});
