/**
 * Game Routes
 *
 * HTTP endpoints for game management.
 *
 * @req API-001.1 - POST /api/games - Create a new game
 * @req API-001.2 - GET /api/games/:gameId - Get game state
 * @req API-001.3 - POST /api/games/:gameId/move - Execute a move
 * @req API-001.4 - DELETE /api/games/:gameId - End game early
 */

import { Hono } from 'hono';
import type { AppContext } from '../server';
import { validateBody, CreateGameSchema, ExecuteMoveSchema } from '../middleware/validation';
import type { CreateGameRequest, ExecuteMoveRequest } from '../types/api';

/**
 * Create the games router
 */
export function gamesRouter(context: AppContext): Hono {
  const router = new Hono();
  const { gameService } = context;

  /**
   * POST /api/games - Create a new game
   *
   * @req API-001.1 - Game creation endpoint
   */
  router.post('/', async (c) => {
    const body = await c.req.json();
    const validated = validateBody(CreateGameSchema, body);

    const request: CreateGameRequest = {
      aiModel: validated.aiModel,
      seed: validated.seed,
      kingdomCards: validated.kingdomCards,
      enableNarration: validated.enableNarration,
    };

    // Build base URL for WebSocket URL
    const protocol = c.req.header('x-forwarded-proto') || 'http';
    const host = c.req.header('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const response = gameService.createGame(request, baseUrl);
    return c.json(response, 201);
  });

  /**
   * GET /api/games/:gameId - Get current game state
   *
   * @req API-001.2 - Game state retrieval endpoint
   */
  router.get('/:gameId', (c) => {
    const gameId = c.req.param('gameId');
    const response = gameService.getGameState(gameId);
    return c.json(response);
  });

  /**
   * POST /api/games/:gameId/move - Execute a move
   *
   * @req API-001.3 - Move execution endpoint
   */
  router.post('/:gameId/move', async (c) => {
    const gameId = c.req.param('gameId');
    const body = await c.req.json();
    const validated = validateBody(ExecuteMoveSchema, body);

    // Validated.move is either a string or an object matching Move structure
    const request: ExecuteMoveRequest = {
      move: validated.move as ExecuteMoveRequest['move'],
    };

    const response = gameService.executeMove(gameId, request);
    return c.json(response);
  });

  /**
   * DELETE /api/games/:gameId - End game early
   *
   * @req API-001.4 - Game termination endpoint
   */
  router.delete('/:gameId', (c) => {
    const gameId = c.req.param('gameId');
    const response = gameService.endGame(gameId);
    return c.json(response);
  });

  return router;
}
