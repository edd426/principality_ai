/**
 * API Integration Tests
 *
 * Tests the HTTP endpoints for game management.
 *
 * @req API-001 - HTTP REST endpoints for game management
 * @req API-003 - Client state filtering (hide opponent's hand)
 */

import { createServer, stopServer, type AppContext } from '../server';
import { Hono } from 'hono';
import type {
  CreateGameResponse,
  GetGameResponse,
  ExecuteMoveResponse,
  EndGameResponse,
  APIError,
} from '../types/api';

// Helper to get typed JSON from Hono response
async function json<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

describe('API Server Integration Tests', () => {
  let app: Hono;
  let context: AppContext;

  beforeEach(() => {
    const server = createServer({ maxGames: 10, gameTtlMs: 60000 });
    app = server.app;
    context = server.context;
  });

  afterEach(() => {
    stopServer(context);
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const res = await app.request('/health');
      expect(res.status).toBe(200);
      const body = await json<{ status: string; gamesCount: number }>(res);
      expect(body.status).toBe('ok');
      expect(body.gamesCount).toBe(0);
    });
  });

  describe('POST /api/games - Create Game', () => {
    it('should create a new game with default settings', async () => {
      const res = await app.request('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiModel: 'haiku' }),
      });

      expect(res.status).toBe(201);
      const body = await json<CreateGameResponse>(res);

      expect(body.gameId).toBeDefined();
      expect(body.gameId).toMatch(/^game-\d+-/);
      expect(body.gameState).toBeDefined();
      expect(body.wsUrl).toBeDefined();
    });

    it('should create a game with seed for reproducibility', async () => {
      const res = await app.request('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiModel: 'sonnet', seed: 'test-seed-123' }),
      });

      expect(res.status).toBe(201);
      const body = await json<CreateGameResponse>(res);
      expect(body.gameId).toBeDefined();
    });

    it('should create a game with specific kingdom cards', async () => {
      const res = await app.request('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiModel: 'haiku',
          kingdomCards: ['Village', 'Smithy', 'Market'],
        }),
      });

      expect(res.status).toBe(201);
      const body = await json<CreateGameResponse>(res);
      expect(body.gameState.kingdomCards).toContain('Village');
      expect(body.gameState.kingdomCards).toContain('Smithy');
      expect(body.gameState.kingdomCards).toContain('Market');
    });

    it('should reject invalid AI model', async () => {
      const res = await app.request('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiModel: 'invalid-model' }),
      });

      expect(res.status).toBe(400);
      const body = await json<APIError>(res);
      expect(body.code).toBe('INVALID_REQUEST');
    });

    it('should reject missing aiModel', async () => {
      const res = await app.request('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/games/:gameId - Get Game State', () => {
    let gameId: string;

    beforeEach(async () => {
      const createRes = await app.request('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiModel: 'haiku' }),
      });
      const createBody = await json<CreateGameResponse>(createRes);
      gameId = createBody.gameId;
    });

    it('should return game state with valid moves', async () => {
      const res = await app.request(`/api/games/${gameId}`);
      expect(res.status).toBe(200);

      const body = await json<GetGameResponse>(res);
      expect(body.gameId).toBe(gameId);
      expect(body.gameState).toBeDefined();
      expect(body.validMoves).toBeDefined();
      expect(Array.isArray(body.validMoves)).toBe(true);
      expect(body.isGameOver).toBe(false);
    });

    /**
     * @req API-003 - Client state filtering
     */
    it('should hide AI opponent hand contents', async () => {
      const res = await app.request(`/api/games/${gameId}`);
      const body = await json<GetGameResponse>(res);

      // Human player should have full hand visibility
      expect(body.gameState.humanPlayer.hand).toBeDefined();
      expect(Array.isArray(body.gameState.humanPlayer.hand)).toBe(true);
      expect(body.gameState.humanPlayer.hand.length).toBe(5);

      // AI player should only show hand count, not contents
      expect(body.gameState.aiPlayer.handCount).toBeDefined();
      expect((body.gameState.aiPlayer as any).hand).toBeUndefined();
    });

    it('should return 404 for non-existent game', async () => {
      const res = await app.request('/api/games/non-existent-game-id');
      expect(res.status).toBe(404);

      const body = await json<APIError>(res);
      expect(body.code).toBe('GAME_NOT_FOUND');
    });
  });

  describe('POST /api/games/:gameId/move - Execute Move', () => {
    let gameId: string;

    beforeEach(async () => {
      const createRes = await app.request('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiModel: 'haiku', seed: 'test-move-seed' }),
      });
      const createBody = await json<CreateGameResponse>(createRes);
      gameId = createBody.gameId;
    });

    it('should execute a valid move using string command', async () => {
      // Game starts in action phase, end it to go to buy phase
      const res = await app.request(`/api/games/${gameId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move: 'end' }),
      });

      expect(res.status).toBe(200);
      const body = await json<ExecuteMoveResponse>(res);
      expect(body.success).toBe(true);
      expect(body.gameState).toBeDefined();
    });

    it('should execute a valid move using Move object', async () => {
      const res = await app.request(`/api/games/${gameId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move: { type: 'end_phase' } }),
      });

      expect(res.status).toBe(200);
      const body = await json<ExecuteMoveResponse>(res);
      expect(body.success).toBe(true);
    });

    it('should return error for invalid move', async () => {
      // Try to buy something in action phase (invalid)
      const res = await app.request(`/api/games/${gameId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move: 'buy Silver' }),
      });

      expect(res.status).toBe(400);
      const body = await json<APIError>(res);
      expect(body.code).toBe('INVALID_MOVE');
    });

    it('should auto-play AI turn after human ends their turn', async () => {
      // End action phase
      await app.request(`/api/games/${gameId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move: 'end' }),
      });

      // Play all treasures
      await app.request(`/api/games/${gameId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move: 'play_treasure all' }),
      });

      // End buy phase (will trigger AI turn)
      const res = await app.request(`/api/games/${gameId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move: 'end' }),
      });

      expect(res.status).toBe(200);
      const body = await json<ExecuteMoveResponse>(res);
      expect(body.success).toBe(true);

      // After AI turn completes, it should be human's turn again
      expect(body.gameState?.currentPlayer).toBe(0);
    });

    it('should return 404 for non-existent game', async () => {
      const res = await app.request('/api/games/non-existent/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move: 'end' }),
      });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/games/:gameId - End Game', () => {
    let gameId: string;

    beforeEach(async () => {
      const createRes = await app.request('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiModel: 'haiku' }),
      });
      const createBody = await json<CreateGameResponse>(createRes);
      gameId = createBody.gameId;
    });

    it('should end an existing game', async () => {
      const res = await app.request(`/api/games/${gameId}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(200);
      const body = await json<EndGameResponse>(res);
      expect(body.success).toBe(true);
      expect(body.message).toContain(gameId);
    });

    it('should return 404 for already-ended game', async () => {
      // End the game first
      await app.request(`/api/games/${gameId}`, { method: 'DELETE' });

      // Try to end again
      const res = await app.request(`/api/games/${gameId}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(404);
    });

    it('should remove game from registry after deletion', async () => {
      // End the game
      await app.request(`/api/games/${gameId}`, { method: 'DELETE' });

      // Try to get the game - should 404
      const getRes = await app.request(`/api/games/${gameId}`);
      expect(getRes.status).toBe(404);
    });
  });

  describe('Game Flow Integration', () => {
    it('should support a complete game flow', async () => {
      // 1. Create game
      const createRes = await app.request('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiModel: 'haiku', seed: 'complete-game-flow' }),
      });
      expect(createRes.status).toBe(201);
      const createBody = await json<CreateGameResponse>(createRes);
      const gameId = createBody.gameId;

      // 2. Get initial state
      const getRes1 = await app.request(`/api/games/${gameId}`);
      const state1 = await json<GetGameResponse>(getRes1);
      expect(state1.gameState.phase).toBe('action');
      expect(state1.gameState.turnNumber).toBe(1);

      // 3. End action phase (no actions to play)
      const endActionRes = await app.request(`/api/games/${gameId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move: 'end' }),
      });
      const stateAfterAction = await json<ExecuteMoveResponse>(endActionRes);
      expect(stateAfterAction.gameState?.phase).toBe('buy');

      // 4. Play treasures
      const playTreasuresRes = await app.request(`/api/games/${gameId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move: 'play_treasure all' }),
      });
      const playTreasuresBody = await json<ExecuteMoveResponse>(playTreasuresRes);
      expect(playTreasuresBody.success).toBe(true);

      // 5. Buy a card if we have enough coins
      const getRes2 = await app.request(`/api/games/${gameId}`);
      const state2 = await json<GetGameResponse>(getRes2);

      if (state2.gameState.humanPlayer.coins >= 3) {
        const buyRes = await app.request(`/api/games/${gameId}/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ move: 'buy Silver' }),
        });
        const buyBody = await json<ExecuteMoveResponse>(buyRes);
        expect(buyBody.success).toBe(true);
      }

      // 6. End buy phase (triggers AI turn and cleanup)
      const endBuyRes = await app.request(`/api/games/${gameId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move: 'end' }),
      });
      const finalState = await json<ExecuteMoveResponse>(endBuyRes);

      // Should be turn 2, human's turn again
      expect(finalState.gameState?.currentPlayer).toBe(0);
      expect(finalState.gameState?.turnNumber).toBe(2);
      expect(finalState.gameState?.phase).toBe('action');

      // 7. End the game
      const endRes = await app.request(`/api/games/${gameId}`, {
        method: 'DELETE',
      });
      expect(endRes.status).toBe(200);
    });
  });
});
