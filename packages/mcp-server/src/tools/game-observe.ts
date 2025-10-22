/**
 * game_observe Tool Implementation
 *
 * Combines game state + valid moves query with configurable detail levels
 * for token-efficient LLM gameplay
 */

import { GameEngine, GameState } from '@principality/core';
import { GameObserveRequest, GameObserveResponse } from '../types/tools';

export class GameObserveTool {
  private cache = new Map<string, GameObserveResponse>();

  constructor(
    private gameEngine: GameEngine,
    private getState: () => GameState | null
  ) {}

  async execute(request: GameObserveRequest): Promise<GameObserveResponse> {
    const { detail_level } = request;

    // Validate detail_level
    if (!['minimal', 'standard', 'full'].includes(detail_level)) {
      return {
        success: false,
        error: 'Invalid detail_level. Must be one of: "minimal", "standard", "full"'
      };
    }

    // Get current state
    const state = this.getState();
    if (!state) {
      return {
        success: false,
        error: 'No active game. Use game_session(command="new") to start.'
      };
    }

    // Check cache
    const cacheKey = `${detail_level}-${state.turnNumber}-${state.phase}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Build response based on detail level
    const response: GameObserveResponse = {
      success: true,
      detail_level,
      phase: state.phase,
      turnNumber: state.turnNumber,
      activePlayer: state.currentPlayer,
      playerCount: state.players.length
    };

    if (detail_level === 'minimal') {
      // Just essentials - no hand, supply, moves
      // Will add validMoves below
    } else if (detail_level === 'standard' || detail_level === 'full') {
      // Add hand summary
      const activePlayer = state.players[state.currentPlayer];
      response.hand = this.groupHand(activePlayer.hand);

      // Add current resources
      response.state = {
        currentCoins: activePlayer.coins || 0,
        currentActions: activePlayer.actions || 0,
        currentBuys: activePlayer.buys || 0
      };
    }

    if (detail_level === 'full') {
      // Add complete state
      const activePlayer = state.players[state.currentPlayer];
      response.supply = this.formatSupply(state);
      response.state = {
        ...response.state,
        hand: this.formatHand(activePlayer.hand),
        stats: {
          handCount: activePlayer.hand.length,
          deckCount: activePlayer.drawPile.length,
          discardCount: activePlayer.discardPile.length,
          victoryPoints: this.calculateVP(activePlayer),
          gameOver: this.isGameOver(state)
        }
      };
    }

    // Always add valid moves
    const validMoves = this.gameEngine.getValidMoves(state);
    response.validMoves = this.formatValidMoves(validMoves, detail_level);
    response.moveSummary = {
      playableCount: validMoves.filter((m: any) => m.type === 'play_action').length,
      buyableCount: validMoves.filter((m: any) => m.type === 'buy').length,
      endPhaseAvailable: validMoves.some((m: any) => m.type === 'end_phase')
    };

    // Cache result
    this.cache.set(cacheKey, response);
    return response;
  }

  private groupHand(hand: readonly string[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    hand.forEach(cardName => {
      grouped[cardName] = (grouped[cardName] || 0) + 1;
    });
    return grouped;
  }

  private formatHand(hand: readonly string[]): Array<{ index: number; name: string }> {
    return hand.map((name, idx) => ({
      index: idx,
      name
    }));
  }

  private formatValidMoves(validMoves: any[], detailLevel: string): any[] {
    return validMoves.map(move => {
      if (detailLevel === 'minimal') {
        return {
          type: move.type,
          card: move.card || undefined
        };
      }

      if (detailLevel === 'standard' || detailLevel === 'full') {
        const formatted: any = {
          type: move.type,
          card: move.card
        };

        // Add descriptions for standard+ detail
        if (move.type === 'end_phase') {
          formatted.description = 'End phase and advance to next';
        }

        return formatted;
      }

      return move;
    });
  }

  private formatSupply(state: GameState): any[] {
    const supply: any[] = [];

    state.supply.forEach((quantity, cardName) => {
      supply.push({
        name: cardName,
        remaining: quantity
      });
    });

    return supply;
  }

  private calculateVP(player: any): number {
    let vp = 0;
    const allCards = [...player.hand, ...player.drawPile, ...player.discardPile];

    allCards.forEach(cardName => {
      // Victory point cards: Estate (1), Duchy (3), Province (6)
      if (cardName === 'Estate') vp += 1;
      if (cardName === 'Duchy') vp += 3;
      if (cardName === 'Province') vp += 6;
    });

    return vp;
  }

  private isGameOver(state: GameState): boolean {
    // Game ends when Province pile is empty or any 3 piles are empty
    // Check supply for game end conditions
    let emptyPiles = 0;

    state.supply.forEach(quantity => {
      if (quantity === 0) emptyPiles++;
    });

    const provincesEmpty = state.supply.get('Province') === 0;
    return provincesEmpty || emptyPiles >= 3;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
