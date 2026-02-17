/**
 * API Client for Principality Game Server
 */

import type {
  CreateGameRequest,
  CreateGameResponse,
  GetGameResponse,
  ExecuteMoveResponse,
  EndGameResponse,
  APIError,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

class APIClientError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(error: APIError) {
    super(error.message);
    this.name = 'APIClientError';
    this.code = error.code;
    this.details = error.details;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      code: 'UNKNOWN_ERROR',
      message: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new APIClientError(error as APIError);
  }
  return response.json();
}

/**
 * Create a new game
 */
export async function createGame(options: CreateGameRequest): Promise<CreateGameResponse> {
  const response = await fetch(`${API_BASE}/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  return handleResponse<CreateGameResponse>(response);
}

/**
 * Get current game state
 */
export async function getGame(gameId: string): Promise<GetGameResponse> {
  const response = await fetch(`${API_BASE}/games/${gameId}`);
  return handleResponse<GetGameResponse>(response);
}

/**
 * Execute a move
 */
export async function executeMove(gameId: string, move: string): Promise<ExecuteMoveResponse> {
  const response = await fetch(`${API_BASE}/games/${gameId}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ move }),
  });
  return handleResponse<ExecuteMoveResponse>(response);
}

/**
 * End game early
 */
export async function endGame(gameId: string): Promise<EndGameResponse> {
  const response = await fetch(`${API_BASE}/games/${gameId}`, {
    method: 'DELETE',
  });
  return handleResponse<EndGameResponse>(response);
}

export { APIClientError };
