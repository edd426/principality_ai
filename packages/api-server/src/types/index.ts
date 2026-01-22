/**
 * Type exports for @principality/api-server
 */

// API types (HTTP endpoints and WebSocket events)
export type {
  // HTTP Request/Response
  CreateGameRequest,
  CreateGameResponse,
  GetGameResponse,
  ExecuteMoveRequest,
  ExecuteMoveResponse,
  EndGameResponse,
  // Client state
  ClientGameState,
  ClientPlayerState,
  OpponentPlayerState,
  ClientPendingEffect,
  ValidMove,
  PlayerScore,
  ScoreBreakdown,
  // WebSocket
  WebSocketMessage,
  WebSocketEventType,
  GameStateUpdateEvent,
  AITurnStartEvent,
  AIMoveEvent,
  NarrationEvent,
  GameOverEvent,
  ErrorEvent,
  SubscribeEvent,
  SetNarrationEvent,
  // Errors
  APIError,
  APIErrorCode,
} from './api';

// AI types
export type {
  AIModel,
  AIModelConfig,
  AIStrategy,
  AIDecisionContext,
  AIResources,
  AIDecision,
  AIError,
  AIErrorCode,
  AISession,
  BigMoneyConfig,
  ClaudePrompt,
  ClaudeResponse,
} from './ai';

// AI constants
export {
  AI_MODEL_CONFIGS,
  DEFAULT_BIG_MONEY_CONFIG,
} from './ai';
