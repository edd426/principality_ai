/**
 * Game Registry Service
 *
 * Manages multiple concurrent game instances with TTL-based cleanup
 * Adapted from MCP server with API-specific extensions
 *
 * @req API-001.1 - Game creation and storage
 */

import {
  GameEngine,
  GameState,
  getKingdomCardsByEdition,
  CardName,
} from '@principality/core';
import type { AIModel } from '../types/ai';

/**
 * Extended game instance with API-specific metadata
 */
export interface APIGameInstance {
  id: string;
  state: GameState;
  engine: GameEngine;
  aiModel: AIModel;
  humanPlayerIndex: number;
  enableNarration: boolean;
  /** If true, AI turns are not auto-played (for Claude MCP control) */
  manualAI: boolean;
  seed?: string;
  startTime: string;
  lastActivityTime: string;
  moves: number;
}

/**
 * Game Registry Manager
 *
 * Stores and manages game instances with TTL-based cleanup
 */
export class GameRegistry {
  private games: Map<string, APIGameInstance> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    private maxGames: number,
    private ttlMs: number
  ) {
    // Start TTL cleanup interval (every 5 minutes)
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredGames();
    }, 5 * 60 * 1000);
  }

  /**
   * Create a new game instance
   */
  createGame(options: {
    aiModel: AIModel;
    seed?: string;
    kingdomCards?: CardName[];
    enableNarration?: boolean;
    manualAI?: boolean;
    edition?: '1E' | '2E' | 'mixed';
  }): APIGameInstance {
    const {
      aiModel,
      seed,
      kingdomCards,
      enableNarration = false,
      manualAI = false,
      edition = '2E',
    } = options;

    // Check if max games reached, remove oldest
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
        const allCards = getKingdomCardsByEdition(edition);
        const availableCards = allCards.filter((card) => !specifiedCards.includes(card));
        const shuffled = this.shuffleWithSeed(availableCards, seed || gameId);
        const padding = shuffled.slice(0, 10 - specifiedCards.length);
        fullKingdomCards = [...specifiedCards, ...padding];
      } else {
        fullKingdomCards = specifiedCards.slice(0, 10);
      }
    }

    // Initialize 2-player game (human vs AI)
    const state = engine.initializeGame(2, {
      edition,
      kingdomCards: fullKingdomCards,
    });

    const now = new Date().toISOString();
    const gameInstance: APIGameInstance = {
      id: gameId,
      state,
      engine,
      aiModel,
      humanPlayerIndex: 0, // Human is always player 0
      enableNarration,
      manualAI,
      seed,
      startTime: now,
      lastActivityTime: now,
      moves: 0,
    };

    this.games.set(gameId, gameInstance);

    return gameInstance;
  }

  /**
   * Get a game instance by ID
   */
  getGame(gameId: string): APIGameInstance | null {
    const game = this.games.get(gameId);
    if (!game) {
      return null;
    }

    // Update last activity time
    game.lastActivityTime = new Date().toISOString();
    return game;
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
  endGame(gameId: string): APIGameInstance | null {
    const game = this.games.get(gameId);
    if (!game) {
      return null;
    }

    this.games.delete(gameId);
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
      this.games.delete(oldestId);
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

    expiredGames.forEach((id) => this.games.delete(id));
  }

  /**
   * Shuffle an array deterministically using a seed string
   */
  private shuffleWithSeed<T>(array: T[], seed: string): T[] {
    // Simple seeded random number generator
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
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
