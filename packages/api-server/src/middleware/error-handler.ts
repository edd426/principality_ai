/**
 * Error Handler Middleware
 *
 * Centralized error handling for API responses.
 *
 * @req API-001 - HTTP REST endpoints for game management
 */

import { Context } from 'hono';
import type { APIErrorCode } from '../types/api';

/**
 * Base API Error class
 */
export class APIError extends Error {
  constructor(
    public code: APIErrorCode,
    message: string,
    public statusCode: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Game not found error
 */
export class GameNotFoundError extends APIError {
  constructor(gameId: string) {
    super('GAME_NOT_FOUND', `Game not found: ${gameId}`, 404, { gameId });
    this.name = 'GameNotFoundError';
  }
}

/**
 * Invalid move error
 */
export class InvalidMoveError extends APIError {
  constructor(move: string, validMoves?: string[]) {
    super(
      'INVALID_MOVE',
      `Invalid move: "${move}"`,
      400,
      validMoves ? { validMoves: validMoves.slice(0, 10) } : undefined
    );
    this.name = 'InvalidMoveError';
  }
}

/**
 * Not your turn error
 */
export class NotYourTurnError extends APIError {
  constructor() {
    super('NOT_YOUR_TURN', "It's not your turn", 400);
    this.name = 'NotYourTurnError';
  }
}

/**
 * Game already over error
 */
export class GameAlreadyOverError extends APIError {
  constructor() {
    super('GAME_ALREADY_OVER', 'Game is already over', 400);
    this.name = 'GameAlreadyOverError';
  }
}

/**
 * Invalid request error
 */
export class InvalidRequestError extends APIError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('INVALID_REQUEST', message, 400, details);
    this.name = 'InvalidRequestError';
  }
}

/**
 * AI error
 */
export class AIProcessingError extends APIError {
  constructor(message: string) {
    super('AI_ERROR', message, 500);
    this.name = 'AIProcessingError';
  }
}

/**
 * Global error handler for Hono
 */
export function errorHandler(err: Error, c: Context) {
  console.error('API Error:', err);

  if (err instanceof APIError) {
    return c.json(
      {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      err.statusCode as any
    );
  }

  // Unknown error
  return c.json(
    {
      code: 'INTERNAL_ERROR' as APIErrorCode,
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? { error: err.message } : undefined,
    },
    500
  );
}
