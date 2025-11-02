import { GameState } from '@principality/core';

/**
 * Transaction Manager for Chain Rollback
 *
 * Implements full rollback semantics: if ANY move in a chain fails,
 * ALL moves are rolled back and the game state is restored to exactly
 * what it was before the chain started.
 */
export class TransactionManager {
  private savedState: GameState | null = null;

  /**
   * Save the current state before executing a chain
   */
  saveState(state: GameState): void {
    // Deep clone with Map preservation
    this.savedState = this.deepCloneGameState(state);
  }

  /**
   * Restore the saved state (rollback)
   */
  restoreState(): GameState {
    if (!this.savedState) {
      throw new Error('No saved state to restore');
    }
    // Return a clone to prevent mutation of saved state
    return this.deepCloneGameState(this.savedState);
  }

  /**
   * Deep clone GameState while preserving Map objects
   */
  private deepCloneGameState(state: GameState): GameState {
    return {
      players: state.players.map(player => ({
        hand: [...player.hand],
        drawPile: [...player.drawPile],
        discardPile: [...player.discardPile],
        inPlay: [...player.inPlay],
        actions: player.actions,
        buys: player.buys,
        coins: player.coins
      })),
      supply: new Map(state.supply),
      currentPlayer: state.currentPlayer,
      phase: state.phase,
      turnNumber: state.turnNumber,
      gameLog: [...state.gameLog],
      seed: state.seed,
      trash: [...state.trash],
      pendingEffect: state.pendingEffect ? { ...state.pendingEffect } : undefined
    };
  }

  /**
   * Clear the saved state (after successful completion)
   */
  clearSavedState(): void {
    this.savedState = null;
  }

  /**
   * Check if there is a saved state
   */
  hasSavedState(): boolean {
    return this.savedState !== null;
  }
}
