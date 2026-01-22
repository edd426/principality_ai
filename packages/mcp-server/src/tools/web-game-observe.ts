/**
 * web_game_observe Tool Implementation
 *
 * Gets current game state and valid moves from the API server.
 */

import { APIClient } from '../clients/api-client';
import { Logger } from '../logger';

export interface WebGameObserveRequest {
  gameId: string;
  detail_level?: 'minimal' | 'standard' | 'full';
  apiServerUrl?: string;
}

export interface WebGameObserveResponse {
  success: boolean;
  gameId?: string;
  gameState?: any;
  validMoves?: any[];
  isGameOver?: boolean;
  winner?: number;
  scores?: any[];
  error?: string;
}

export class WebGameObserveTool {
  constructor(private logger?: Logger) {}

  async execute(request: WebGameObserveRequest): Promise<WebGameObserveResponse> {
    const { gameId, detail_level = 'standard', apiServerUrl } = request;

    if (!gameId) {
      return {
        success: false,
        error: 'gameId is required',
      };
    }

    try {
      this.logger?.debug('Observing web game', { gameId, detail_level });

      const response = await APIClient.getGame(gameId, apiServerUrl);

      // Format response based on detail level
      const formattedResponse = this.formatResponse(response, detail_level);

      this.logger?.debug('Web game observed', {
        gameId,
        currentPlayer: response.gameState?.currentPlayer,
        phase: response.gameState?.phase,
        isGameOver: response.isGameOver,
      });

      return {
        success: true,
        ...formattedResponse,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.error('Failed to observe web game', { gameId, error: errorMessage });

      return {
        success: false,
        error: `Failed to observe web game: ${errorMessage}`,
      };
    }
  }

  private formatResponse(
    response: any,
    detail_level: 'minimal' | 'standard' | 'full'
  ): Partial<WebGameObserveResponse> {
    const { gameId, gameState, validMoves, isGameOver, winner, scores } = response;

    if (detail_level === 'minimal') {
      // Minimal: just enough to make a decision
      return {
        gameId,
        gameState: {
          currentPlayer: gameState.currentPlayer,
          phase: gameState.phase,
          turnNumber: gameState.turnNumber,
          humanPlayer: {
            hand: gameState.humanPlayer.hand,
            actions: gameState.humanPlayer.actions,
            buys: gameState.humanPlayer.buys,
            coins: gameState.humanPlayer.coins,
          },
        },
        validMoves: validMoves.map((vm: any) => vm.description),
        isGameOver,
        winner,
      };
    }

    if (detail_level === 'standard') {
      // Standard: good balance of info
      return {
        gameId,
        gameState: {
          currentPlayer: gameState.currentPlayer,
          phase: gameState.phase,
          turnNumber: gameState.turnNumber,
          humanPlayer: gameState.humanPlayer,
          aiPlayer: {
            handCount: gameState.aiPlayer.handCount,
            inPlay: gameState.aiPlayer.inPlay,
            actions: gameState.aiPlayer.actions,
            buys: gameState.aiPlayer.buys,
            coins: gameState.aiPlayer.coins,
          },
          pendingEffect: gameState.pendingEffect,
        },
        validMoves,
        isGameOver,
        winner,
        scores,
      };
    }

    // Full: everything
    return {
      gameId,
      gameState,
      validMoves,
      isGameOver,
      winner,
      scores,
    };
  }
}
