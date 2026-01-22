/**
 * web_game_create Tool Implementation
 *
 * Creates a new game on the API server for web UI integration.
 */

import { APIClient, CreateWebGameOptions } from '../clients/api-client';
import { Logger } from '../logger';

export interface WebGameCreateRequest {
  seed?: string;
  kingdomCards?: string[];
  manualAI?: boolean;
  apiServerUrl?: string;
}

export interface WebGameCreateResponse {
  success: boolean;
  gameId?: string;
  gameState?: any;
  wsUrl?: string;
  error?: string;
}

export class WebGameCreateTool {
  constructor(private logger?: Logger) {}

  async execute(request: WebGameCreateRequest): Promise<WebGameCreateResponse> {
    const { seed, kingdomCards, manualAI = true, apiServerUrl } = request;

    try {
      this.logger?.info('Creating web game', {
        seed,
        kingdomCards,
        manualAI,
        apiServerUrl,
      });

      const response = await APIClient.createGame({
        seed,
        kingdomCards,
        manualAI,
        apiServerUrl,
      });

      this.logger?.info('Web game created', {
        gameId: response.gameId,
      });

      return {
        success: true,
        gameId: response.gameId,
        gameState: response.gameState,
        wsUrl: response.wsUrl,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.error('Failed to create web game', { error: errorMessage });

      return {
        success: false,
        error: `Failed to create web game: ${errorMessage}`,
      };
    }
  }
}
