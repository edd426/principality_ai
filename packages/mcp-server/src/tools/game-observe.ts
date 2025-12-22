/**
 * game_observe Tool Implementation
 *
 * Combines game state + valid moves query with configurable detail levels
 * for token-efficient LLM gameplay
 */

import {
  GameState,
  groupHand,
  formatHand,
  formatSupply,
  formatValidMoves,
  calculateVictoryPoints,
  isGameOver,
  countEmptyPiles,
  getGameOverReason
} from '@principality/core';
import { GameObserveRequest, GameObserveResponse } from '../types/tools';
import { GameRegistryManager } from '../game-registry';
import { Logger } from '../logger';

export class GameObserveTool {
  private cache = new Map<string, GameObserveResponse>();

  constructor(
    private registry: GameRegistryManager,
    private logger?: Logger
  ) {}

  async execute(request: GameObserveRequest): Promise<GameObserveResponse> {
    const { detail_level, gameId } = request;

    // Validate detail_level
    if (!['minimal', 'standard', 'full'].includes(detail_level)) {
      return {
        success: false,
        error: 'Invalid detail_level. Must be one of: "minimal", "standard", "full"'
      };
    }

    // Get game instance
    const game = this.registry.getGame(gameId);
    if (!game) {
      this.logger?.warn('Game state requested but no active game', { gameId });
      return {
        success: false,
        error: 'No active game. Use game_session(command="new") to start.'
      };
    }

    const state = game.state;

    // Log observation (verbose - for strategy analysis)
    this.logger?.info('Game state observed', {
      detail_level,
      turn: state.turnNumber,
      phase: state.phase,
      activePlayer: state.currentPlayer
    });

    // Check cache
    const cacheKey = `${detail_level}-${state.turnNumber}-${state.phase}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Check game end condition (needed for all detail levels)
    const gameOverFlag = isGameOver(state);

    // Log game-over detection for diagnostics
    if (gameOverFlag) {
      this.logger?.warn('Game over detected', {
        turn: state.turnNumber,
        phase: state.phase,
        gameOverReason: getGameOverReason(state),
        provinceCount: state.supply.get('Province') || 0,
        emptyPilesCount: countEmptyPiles(state),
        victoryPoints: calculateVictoryPoints(state.players[state.currentPlayer])
      });
    }

    // Build response based on detail level
    const response: GameObserveResponse = {
      success: true,
      detail_level,
      phase: state.phase,
      turnNumber: state.turnNumber,
      activePlayer: state.currentPlayer,
      playerCount: state.players.length,
      gameOver: gameOverFlag
    };

    if (detail_level === 'minimal') {
      // Just essentials - no hand, supply, moves
      // gameOver is included above for all detail levels
    } else if (detail_level === 'standard' || detail_level === 'full') {
      // Add hand summary
      const activePlayer = state.players[state.currentPlayer];
      response.hand = groupHand(activePlayer.hand);

      // Add current resources
      response.state = {
        currentCoins: activePlayer.coins || 0,
        currentActions: activePlayer.actions || 0,
        currentBuys: activePlayer.buys || 0,
        gameOver: gameOverFlag
      };
    }

    if (detail_level === 'full') {
      // Add complete state
      const activePlayer = state.players[state.currentPlayer];
      response.supply = formatSupply(state);
      response.state = {
        ...response.state,
        hand: formatHand(activePlayer.hand),
        stats: {
          handCount: activePlayer.hand.length,
          deckCount: activePlayer.drawPile.length,
          discardCount: activePlayer.discardPile.length,
          victoryPoints: calculateVictoryPoints(activePlayer),
          gameOver: gameOverFlag
        }
      };
    }

    // Always add valid moves
    const validMoves = game.engine.getValidMoves(state);
    response.validMoves = formatValidMoves(validMoves, detail_level);
    response.moveSummary = {
      playableCount: validMoves.filter((m: any) => m.type === 'play_action').length,
      buyableCount: validMoves.filter((m: any) => m.type === 'buy').length,
      endPhaseAvailable: validMoves.some((m: any) => m.type === 'end_phase')
    };

    // Cache result
    this.cache.set(cacheKey, response);
    return response;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
