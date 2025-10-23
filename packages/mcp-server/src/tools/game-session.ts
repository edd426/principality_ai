/**
 * game_session Tool Implementation
 *
 * Manages game lifecycle (start, end) with idempotent operations
 */

import { GameEngine, GameState } from '@principality/core';
import { calculateScore, getAllPlayerCards } from '@principality/core';
import { GameInstance, GameSessionRequest, GameSessionResponse } from '../types/tools';
import { Logger } from '../logger';

export class GameSessionTool {
  private currentGame: GameInstance | null = null;
  private gameHistory: GameInstance[] = [];

  constructor(
    private gameEngine: GameEngine,
    private defaultModel: 'haiku' | 'sonnet' = 'haiku',
    private setState: (state: GameState) => void,
    private getState: () => GameState | null,
    private logger?: Logger
  ) {}

  async execute(request: GameSessionRequest): Promise<GameSessionResponse> {
    const { command, seed, model = this.defaultModel } = request;

    if (command === 'new') {
      // Idempotent: end current game if active
      if (this.currentGame) {
        this.logger?.info('Previous game ended, starting new game', {
          previousGameId: this.currentGame.id,
          moves: this.currentGame.moves
        });
        this.gameHistory.push(this.currentGame);
      }

      // Start new game
      const gameId = `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create new engine with seed if provided
      const engine = new GameEngine(seed || gameId);
      const state = engine.initializeGame(1);

      this.currentGame = {
        id: gameId,
        state,
        model,
        seed,
        startTime: new Date().toISOString(),
        moves: 0
      };

      // Update server state
      this.setState(state);

      this.logger?.info('New game started', {
        gameId,
        seed,
        model,
        players: 1
      });

      return {
        success: true,
        gameId,
        command: 'new',
        initialState: state
      };
    }

    if (command === 'end') {
      const currentState = this.getState();
      if (!currentState) {
        this.logger?.warn('Attempted to end game but no active game');
        return {
          success: false,
          error: 'No active game to end. Use game_session(command="new") to start a game.'
        };
      }

      if (this.currentGame) {
        this.logger?.info('Game ended', {
          gameId: this.currentGame.id,
          moves: this.currentGame.moves,
          duration: new Date().getTime() - new Date(this.currentGame.startTime).getTime()
        });
        this.gameHistory.push(this.currentGame);
        this.currentGame = null;
      }

      return {
        success: true,
        command: 'end',
        finalState: currentState,
        winner: this.determineWinner(currentState)
      };
    }

    return {
      success: false,
      error: `Unknown command: "${command}". Must be "new" or "end".`
    };
  }

  getCurrentGame(): GameInstance | null {
    return this.currentGame;
  }

  getGameHistory(): GameInstance[] {
    return this.gameHistory;
  }

  updateCurrentGameState(newState: GameState): void {
    if (this.currentGame) {
      this.currentGame.state = newState;
      this.currentGame.moves++;
    }
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
