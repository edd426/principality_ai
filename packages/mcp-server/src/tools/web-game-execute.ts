/**
 * web_game_execute Tool Implementation
 *
 * Executes a move on an API server game.
 */

import { APIClient } from '../clients/api-client';
import { Logger } from '../logger';

export interface WebGameExecuteRequest {
  gameId: string;
  move: string;
  reasoning?: string;
  apiServerUrl?: string;
}

export interface WebGameExecuteResponse {
  success: boolean;
  gameState?: any;
  validMoves?: any[];
  isGameOver?: boolean;
  winner?: number;
  scores?: any[];
  error?: string;
}

export class WebGameExecuteTool {
  constructor(private logger?: Logger) {}

  async execute(request: WebGameExecuteRequest): Promise<WebGameExecuteResponse> {
    const { gameId, move, reasoning, apiServerUrl } = request;

    if (!gameId) {
      return {
        success: false,
        error: 'gameId is required',
      };
    }

    if (!move) {
      return {
        success: false,
        error: 'move is required',
      };
    }

    try {
      this.logger?.info('Executing web game move', {
        gameId,
        move,
        reasoning,
      });

      const response = await APIClient.executeMove(gameId, move, apiServerUrl);

      if (!response.success) {
        this.logger?.warn('Web game move failed', {
          gameId,
          move,
          error: response.error,
        });

        return {
          success: false,
          error: response.error || 'Move execution failed',
        };
      }

      this.logger?.info('Web game move executed', {
        gameId,
        move,
        phase: response.gameState?.phase,
        currentPlayer: response.gameState?.currentPlayer,
        isGameOver: response.isGameOver,
      });

      return {
        success: true,
        gameState: response.gameState,
        validMoves: response.validMoves,
        isGameOver: response.isGameOver,
        winner: response.winner,
        scores: response.scores,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.error('Failed to execute web game move', {
        gameId,
        move,
        error: errorMessage,
      });

      return {
        success: false,
        error: `Failed to execute move: ${errorMessage}`,
      };
    }
  }
}
