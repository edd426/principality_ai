/**
 * @principality/api-server
 *
 * HTTP/WebSocket API server for Principality AI
 * Enables human vs Claude AI gameplay
 */

// Server factory
export { createServer, stopServer, type AppContext } from './server';

// Configuration
export { loadConfig, DEFAULT_CONFIG, type APIServerConfig } from './config';

// Services
export { GameRegistry, type APIGameInstance } from './services/game-registry';
export { GameService } from './services/game-service';
export { AIService, type AITurnSummary } from './services/ai-service';
export {
  filterStateForHuman,
  formatValidMoves,
  calculatePlayerScores,
  formatCompactState,
} from './services/state-filter';

// Middleware
export {
  APIError,
  GameNotFoundError,
  InvalidMoveError,
  NotYourTurnError,
  GameAlreadyOverError,
  InvalidRequestError,
  AIProcessingError,
  errorHandler,
} from './middleware/error-handler';
export {
  validateBody,
  CreateGameSchema,
  ExecuteMoveSchema,
  type CreateGameBody,
  type ExecuteMoveBody,
} from './middleware/validation';

// Routes
export { gamesRouter } from './routes/games';

// Export all types
export * from './types';
