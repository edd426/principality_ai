/**
 * Hono API Server Factory
 *
 * Creates and configures the Hono HTTP server for Principality AI
 *
 * @req API-001 - HTTP REST endpoints for game management
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { APIServerConfig, DEFAULT_CONFIG } from './config';
import { gamesRouter } from './routes/games';
import { errorHandler } from './middleware/error-handler';
import { GameRegistry } from './services/game-registry';
import { GameService } from './services/game-service';
import { AIService } from './services/ai-service';

/**
 * Application context shared across routes
 */
export interface AppContext {
  gameRegistry: GameRegistry;
  gameService: GameService;
  aiService: AIService;
}

/**
 * Create a configured Hono application
 */
export function createServer(config: Partial<APIServerConfig> = {}): {
  app: Hono;
  context: AppContext;
  config: APIServerConfig;
} {
  const finalConfig: APIServerConfig = { ...DEFAULT_CONFIG, ...config };

  // Initialize services
  const gameRegistry = new GameRegistry(finalConfig.maxGames, finalConfig.gameTtlMs);
  const aiService = new AIService();
  const gameService = new GameService(gameRegistry, aiService);

  const context: AppContext = {
    gameRegistry,
    gameService,
    aiService,
  };

  // Create Hono app
  const app = new Hono();

  // Global middleware
  app.use(
    '*',
    cors({
      origin: finalConfig.corsOrigins,
      allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type'],
    })
  );

  // Error handling middleware
  app.onError(errorHandler);

  // Health check endpoint
  app.get('/health', (c) => {
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      gamesCount: gameRegistry.getGameCount(),
    });
  });

  // Mount game routes
  const games = gamesRouter(context);
  app.route('/api/games', games);

  return { app, context, config: finalConfig };
}

/**
 * Stop the server and clean up resources
 */
export function stopServer(context: AppContext): void {
  context.gameRegistry.stop();
}
