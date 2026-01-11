/**
 * GameRegistryManager
 *
 * Manages multiple concurrent game instances with TTL-based cleanup
 */

import { GameEngine, GameState, getKingdomCardsByEdition, CardName } from '@principality/core';
import { ExtendedGameInstance } from './types/tools';
import { Logger } from './logger';

export class GameRegistryManager {
  private games: Map<string, ExtendedGameInstance> = new Map();
  private defaultGameId: string | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    private maxGames: number,
    private ttlMs: number,
    private logger?: Logger
  ) {
    // Start TTL cleanup interval (every 5 minutes)
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredGames();
    }, 5 * 60 * 1000);
  }

  /**
   * Create a new game instance
   */
  createGame(
    seed?: string,
    model: 'haiku' | 'sonnet' = 'haiku',
    edition: '1E' | '2E' | 'mixed' = '2E',
    numPlayers: number = 1,
    kingdomCards?: string[]
  ): ExtendedGameInstance {
    // Check if max games reached, remove oldest by lastActivityTime
    if (this.games.size >= this.maxGames) {
      this.removeOldestGame();
    }

    // Generate unique game ID
    const gameId = `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create new engine with seed
    const engine = new GameEngine(seed || gameId);

    // Handle partial kingdom cards by padding to 10
    let fullKingdomCards: CardName[] | undefined;
    if (kingdomCards && kingdomCards.length > 0) {
      const specifiedCards = kingdomCards as CardName[];
      if (specifiedCards.length < 10) {
        // Get all available kingdom cards for this edition
        const allCards = getKingdomCardsByEdition(edition);
        // Filter out cards already specified
        const availableCards = allCards.filter(card => !specifiedCards.includes(card));
        // Shuffle available cards deterministically using the seed
        const shuffled = this.shuffleWithSeed(availableCards, seed || gameId);
        // Pad to 10 cards
        const padding = shuffled.slice(0, 10 - specifiedCards.length);
        fullKingdomCards = [...specifiedCards, ...padding];
      } else {
        fullKingdomCards = specifiedCards;
      }
    }

    const state = engine.initializeGame(numPlayers, {
      edition,
      kingdomCards: fullKingdomCards
    });

    const now = new Date().toISOString();
    const gameInstance: ExtendedGameInstance = {
      id: gameId,
      state,
      model,
      seed,
      startTime: now,
      lastActivityTime: now,
      moves: 0,
      engine
    };

    // Store game
    this.games.set(gameId, gameInstance);

    // FIX #107: Always set newly created game as the default
    // Previously only set default when it was the first game, causing
    // game_execute to return stale state from old games.
    this.defaultGameId = gameId;

    this.logger?.info('Game created', {
      gameId,
      seed,
      model,
      isDefault: this.defaultGameId === gameId,
      totalGames: this.games.size
    });

    return gameInstance;
  }

  /**
   * Get a game instance by ID (or default if no ID provided)
   */
  getGame(gameId?: string): ExtendedGameInstance | null {
    const targetId = gameId || this.defaultGameId;

    if (!targetId) {
      return null;
    }

    const game = this.games.get(targetId);
    if (!game) {
      return null;
    }

    // Update last activity time
    game.lastActivityTime = new Date().toISOString();

    return game;
  }

  /**
   * Get game state by ID
   */
  getState(gameId?: string): GameState | null {
    const game = this.getGame(gameId);
    return game ? game.state : null;
  }

  /**
   * Update game state
   */
  setState(gameId: string, state: GameState): void {
    const game = this.games.get(gameId);
    if (game) {
      game.state = state;
      game.lastActivityTime = new Date().toISOString();
      game.moves++;
    }
  }

  /**
   * End a game and remove it from registry
   */
  endGame(gameId?: string): ExtendedGameInstance | null {
    const targetId = gameId || this.defaultGameId;

    if (!targetId) {
      return null;
    }

    const game = this.games.get(targetId);
    if (!game) {
      return null;
    }

    // Remove from registry
    this.games.delete(targetId);

    // Update default if this was the default game
    if (this.defaultGameId === targetId) {
      // Set most recent game as new default
      this.defaultGameId = this.getMostRecentGameId();
    }

    this.logger?.info('Game ended', {
      gameId: targetId,
      moves: game.moves,
      duration: Date.now() - new Date(game.startTime).getTime(),
      newDefault: this.defaultGameId,
      totalGames: this.games.size
    });

    return game;
  }

  /**
   * List all active game IDs
   */
  listGames(): string[] {
    return Array.from(this.games.keys());
  }

  /**
   * Get total game count
   */
  getGameCount(): number {
    return this.games.size;
  }

  /**
   * Stop cleanup interval
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Remove oldest game by lastActivityTime
   */
  private removeOldestGame(): void {
    if (this.games.size === 0) return;

    let oldestId: string | null = null;
    let oldestTime = Date.now();

    this.games.forEach((game, id) => {
      const activityTime = new Date(game.lastActivityTime).getTime();
      if (activityTime < oldestTime) {
        oldestTime = activityTime;
        oldestId = id;
      }
    });

    if (oldestId) {
      this.logger?.info('Removing oldest game due to max limit', {
        gameId: oldestId,
        maxGames: this.maxGames,
        currentGames: this.games.size
      });
      this.endGame(oldestId);
    }
  }

  /**
   * Clean up expired games based on TTL
   */
  private cleanupExpiredGames(): void {
    const now = Date.now();
    const expiredGames: string[] = [];

    this.games.forEach((game, id) => {
      const activityTime = new Date(game.lastActivityTime).getTime();
      if (now - activityTime > this.ttlMs) {
        expiredGames.push(id);
      }
    });

    if (expiredGames.length > 0) {
      this.logger?.info('Cleaning up expired games', {
        expiredCount: expiredGames.length,
        expiredGames,
        ttlMs: this.ttlMs
      });

      expiredGames.forEach(id => this.endGame(id));
    }
  }

  /**
   * Get most recent game ID by lastActivityTime
   */
  private getMostRecentGameId(): string | null {
    if (this.games.size === 0) return null;

    let mostRecentId: string | null = null;
    let mostRecentTime = 0;

    this.games.forEach((game, id) => {
      const activityTime = new Date(game.lastActivityTime).getTime();
      if (activityTime > mostRecentTime) {
        mostRecentTime = activityTime;
        mostRecentId = id;
      }
    });

    return mostRecentId;
  }

  /**
   * Shuffle an array deterministically using a seed string
   * Uses a simple seeded random algorithm for reproducibility
   */
  private shuffleWithSeed<T>(array: T[], seed: string): T[] {
    // Simple seeded random number generator
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    const seededRandom = () => {
      hash = (hash * 1103515245 + 12345) & 0x7fffffff;
      return hash / 0x7fffffff;
    };

    // Fisher-Yates shuffle with seeded random
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }
}
