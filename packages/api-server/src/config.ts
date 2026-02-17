/**
 * API Server Configuration
 *
 * @req API-001 - HTTP REST endpoints for game management
 */

import type { AIModel } from './types/ai';

/**
 * Server configuration options
 */
export interface APIServerConfig {
  /** Port to listen on (default: 3000) */
  port: number;
  /** Host to bind to (default: localhost) */
  host: string;
  /** CORS allowed origins (default: ['*']) */
  corsOrigins: string[];
  /** Maximum concurrent games per server */
  maxGames: number;
  /** Game TTL in milliseconds (default: 30 minutes) */
  gameTtlMs: number;
  /** Default AI model for new games */
  defaultAIModel: AIModel;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: APIServerConfig = {
  port: 3000,
  host: 'localhost',
  corsOrigins: ['*'],
  maxGames: 100,
  gameTtlMs: 30 * 60 * 1000, // 30 minutes
  defaultAIModel: 'haiku',
};

/**
 * Load configuration from environment variables
 */
export function loadConfig(overrides?: Partial<APIServerConfig>): APIServerConfig {
  return {
    port: parseInt(process.env.API_PORT || '', 10) || DEFAULT_CONFIG.port,
    host: process.env.API_HOST || DEFAULT_CONFIG.host,
    corsOrigins: process.env.API_CORS_ORIGINS
      ? process.env.API_CORS_ORIGINS.split(',')
      : DEFAULT_CONFIG.corsOrigins,
    maxGames: parseInt(process.env.API_MAX_GAMES || '', 10) || DEFAULT_CONFIG.maxGames,
    gameTtlMs: parseInt(process.env.API_GAME_TTL_MS || '', 10) || DEFAULT_CONFIG.gameTtlMs,
    defaultAIModel: (process.env.API_DEFAULT_AI_MODEL as AIModel) || DEFAULT_CONFIG.defaultAIModel,
    ...overrides,
  };
}
