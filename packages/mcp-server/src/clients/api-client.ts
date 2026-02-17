/**
 * HTTP Client for API Server Communication
 *
 * Provides methods to interact with the Principality API server for web game management.
 * Used by MCP tools to proxy requests to the HTTP API.
 */

const DEFAULT_API_SERVER_URL = 'http://localhost:3000';

export interface CreateWebGameOptions {
  aiModel?: 'haiku' | 'sonnet' | 'opus';
  seed?: string;
  kingdomCards?: string[];
  manualAI?: boolean;
  apiServerUrl?: string;
}

export interface CreateWebGameResponse {
  gameId: string;
  gameState: any;
  wsUrl: string;
}

export interface GetWebGameResponse {
  gameId: string;
  gameState: any;
  validMoves: any[];
  isGameOver: boolean;
  winner?: number;
  scores?: any[];
}

export interface ExecuteWebMoveResponse {
  success: boolean;
  error?: string;
  gameState?: any;
  validMoves?: any[];
  isGameOver?: boolean;
  winner?: number;
  scores?: any[];
}

export interface EndWebGameResponse {
  success: boolean;
  message: string;
}

/**
 * API Client for web game server communication
 */
export class APIClient {
  /**
   * Create a new game on the API server
   */
  static async createGame(options: CreateWebGameOptions = {}): Promise<CreateWebGameResponse> {
    const {
      aiModel = 'haiku',
      seed,
      kingdomCards,
      manualAI = true, // Default to true for MCP control
      apiServerUrl = DEFAULT_API_SERVER_URL,
    } = options;

    const response = await fetch(`${apiServerUrl}/api/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aiModel,
        seed,
        kingdomCards,
        manualAI,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      })) as { message?: string };
      throw new Error(error.message || 'Failed to create game');
    }

    return response.json() as Promise<CreateWebGameResponse>;
  }

  /**
   * Get current game state from the API server
   */
  static async getGame(
    gameId: string,
    apiServerUrl: string = DEFAULT_API_SERVER_URL
  ): Promise<GetWebGameResponse> {
    const response = await fetch(`${apiServerUrl}/api/games/${gameId}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      })) as { message?: string };
      throw new Error(error.message || 'Failed to get game');
    }

    return response.json() as Promise<GetWebGameResponse>;
  }

  /**
   * Execute a move on the API server
   */
  static async executeMove(
    gameId: string,
    move: string,
    apiServerUrl: string = DEFAULT_API_SERVER_URL
  ): Promise<ExecuteWebMoveResponse> {
    const response = await fetch(`${apiServerUrl}/api/games/${gameId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ move }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      })) as { message?: string };
      throw new Error(error.message || 'Failed to execute move');
    }

    return response.json() as Promise<ExecuteWebMoveResponse>;
  }

  /**
   * End a game on the API server
   */
  static async endGame(
    gameId: string,
    apiServerUrl: string = DEFAULT_API_SERVER_URL
  ): Promise<EndWebGameResponse> {
    const response = await fetch(`${apiServerUrl}/api/games/${gameId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      })) as { message?: string };
      throw new Error(error.message || 'Failed to end game');
    }

    return response.json() as Promise<EndWebGameResponse>;
  }
}
