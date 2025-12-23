/**
 * game_session Tool Implementation
 *
 * Manages game lifecycle (start, end, list) with idempotent operations
 */

import { GameState } from '@principality/core';
import { calculateScore, getAllPlayerCards } from '@principality/core';
import { GameSessionRequest, GameSessionResponse } from '../types/tools';
import { GameRegistryManager } from '../game-registry';
import { Logger } from '../logger';

export class GameSessionTool {
  constructor(
    private registry: GameRegistryManager,
    private defaultModel: 'haiku' | 'sonnet' = 'haiku',
    private logger?: Logger
  ) {}

  async execute(request: GameSessionRequest): Promise<GameSessionResponse> {
    const { command, seed, model = this.defaultModel, edition = '2E', gameId } = request;

    if (command === 'new') {
      // Create new game via registry
      const game = this.registry.createGame(seed, model, edition);

      this.logger?.info('New game started', {
        gameId: game.id,
        seed,
        model,
        edition,
        players: 1
      });

      return {
        success: true,
        gameId: game.id,
        command: 'new',
        initialState: game.state
      };
    }

    if (command === 'end') {
      const game = this.registry.endGame(gameId);

      if (!game) {
        this.logger?.warn('Attempted to end game but no active game', { gameId });
        return {
          success: false,
          error: 'No active game to end. Use game_session(command="new") to start a game.'
        };
      }

      return {
        success: true,
        gameId: game.id,
        command: 'end',
        finalState: game.state,
        winner: this.determineWinner(game.state)
      };
    }

    if (command === 'list') {
      const gameIds = this.registry.listGames();

      this.logger?.info('Listed active games', {
        count: gameIds.length,
        gameIds
      });

      return {
        success: true,
        command: 'list',
        gameId: gameIds.join(', ') || 'No active games'
      };
    }

    return {
      success: false,
      error: `Unknown command: "${command}". Must be "new", "end", or "list".`
    };
  }


  private determineWinner(state: GameState): number | undefined {
    if (!state || !state.players) return undefined;

    let maxVP = -Infinity;
    let winner = -1;

    state.players.forEach((player, idx) => {
      const allCards = getAllPlayerCards(
        player.drawPile,
        player.hand,
        player.discardPile
      );
      const vp = calculateScore(allCards);

      if (vp > maxVP) {
        maxVP = vp;
        winner = idx;
      }
    });

    return winner >= 0 ? winner : undefined;
  }
}
