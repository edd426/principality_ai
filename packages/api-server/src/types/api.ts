/**
 * HTTP/WebSocket API Types for Principality AI
 *
 * @req API-001 - HTTP REST endpoints for game management
 * @req API-002 - WebSocket events for real-time updates
 * @req API-003 - Client state filtering (hide opponent's hand)
 */

import type { CardName, Phase, Move } from '@principality/core';
import type { AIModel } from './ai';

// =============================================================================
// HTTP Request/Response Types
// =============================================================================

/**
 * POST /api/games - Create a new game
 * @req API-001.1 - Game creation endpoint
 */
export interface CreateGameRequest {
  /** AI model to play against */
  aiModel: AIModel;
  /** Optional seed for reproducible games */
  seed?: string;
  /** Optional specific kingdom cards to use */
  kingdomCards?: CardName[];
  /** Enable narration (optional AI commentary) */
  enableNarration?: boolean;
  /** If true, AI turns are not auto-played (for Claude MCP control) */
  manualAI?: boolean;
}

export interface CreateGameResponse {
  /** Unique game identifier */
  gameId: string;
  /** Initial game state (filtered for human visibility) */
  gameState: ClientGameState;
  /** WebSocket URL for real-time updates */
  wsUrl: string;
}

/**
 * GET /api/games/:gameId - Get current game state
 * @req API-001.2 - Game state retrieval endpoint
 */
export interface GetGameResponse {
  gameId: string;
  gameState: ClientGameState;
  validMoves: ValidMove[];
  isGameOver: boolean;
  winner?: number;
  scores?: PlayerScore[];
}

/**
 * POST /api/games/:gameId/move - Execute a move
 * @req API-001.3 - Move execution endpoint
 */
export interface ExecuteMoveRequest {
  /** Move can be a string command (e.g., "buy Silver") or a Move object */
  move: Move | string;
}

export interface ExecuteMoveResponse {
  success: boolean;
  error?: string;
  gameState?: ClientGameState;
  validMoves?: ValidMove[];
  isGameOver?: boolean;
  winner?: number;
  scores?: PlayerScore[];
}

/**
 * DELETE /api/games/:gameId - End game early
 * @req API-001.4 - Game termination endpoint
 */
export interface EndGameResponse {
  success: boolean;
  message: string;
}

// =============================================================================
// Client-Facing Game State (Filtered)
// =============================================================================

/**
 * Filtered game state for the human player.
 * Hides opponent's hand and draw pile contents.
 * @req API-003 - Client state filtering
 */
export interface ClientGameState {
  /** Human player state (full visibility) */
  humanPlayer: ClientPlayerState;
  /** AI player state (limited visibility) */
  aiPlayer: OpponentPlayerState;
  /** Supply piles (card name -> count) */
  supply: Record<CardName, number>;
  /** Whose turn it is: 0 = human, 1 = AI */
  currentPlayer: number;
  /** Current phase of the turn */
  phase: Phase;
  /** Turn number (starts at 1) */
  turnNumber: number;
  /** Game log messages */
  gameLog: string[];
  /** Trash pile (visible to all) */
  trash: CardName[];
  /** Pending effect requiring player action */
  pendingEffect?: ClientPendingEffect;
  /** Kingdom cards selected for this game */
  kingdomCards: CardName[];
}

/**
 * Full player state (for the human player)
 */
export interface ClientPlayerState {
  /** Cards in hand (fully visible) */
  hand: CardName[];
  /** Number of cards in draw pile */
  drawPileCount: number;
  /** Cards in discard pile (visible on top) */
  discardPile: CardName[];
  /** Cards currently in play */
  inPlay: CardName[];
  /** Available actions this turn */
  actions: number;
  /** Available buys this turn */
  buys: number;
  /** Available coins this turn */
  coins: number;
}

/**
 * Limited player state (for opponent/AI)
 * Hand contents are hidden
 */
export interface OpponentPlayerState {
  /** Number of cards in hand (count only) */
  handCount: number;
  /** Number of cards in draw pile */
  drawPileCount: number;
  /** Cards in discard pile (visible) */
  discardPile: CardName[];
  /** Cards currently in play */
  inPlay: CardName[];
  /** Available actions this turn */
  actions: number;
  /** Available buys this turn */
  buys: number;
  /** Available coins this turn */
  coins: number;
}

/**
 * Pending effect requiring player action
 */
export interface ClientPendingEffect {
  card: CardName;
  effect: string;
  /** Which player must respond: 0 = human, 1 = AI */
  respondingPlayer: number;
  /** Maximum cards that can be trashed (if applicable) */
  maxTrash?: number;
  /** Maximum cost of card that can be gained (if applicable) */
  maxGainCost?: number;
}

/**
 * Valid move with optional description
 */
export interface ValidMove {
  move: Move;
  description: string;
}

/**
 * Player score at game end
 */
export interface PlayerScore {
  playerIndex: number;
  name: string;
  score: number;
  breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  estates: number;
  duchies: number;
  provinces: number;
  gardens: number;
  curses: number;
  total: number;
}

// =============================================================================
// WebSocket Event Types
// =============================================================================

/**
 * Base WebSocket message structure
 */
export interface WebSocketMessage<T = unknown> {
  type: WebSocketEventType;
  payload: T;
  timestamp: number;
}

/**
 * All WebSocket event types
 * @req API-002 - WebSocket events for real-time updates
 */
export type WebSocketEventType =
  | 'game_state_update'
  | 'ai_turn_start'
  | 'ai_move'
  | 'narration'
  | 'game_over'
  | 'error'
  | 'subscribe'
  | 'set_narration';

// Server → Client Events

/**
 * Game state has changed
 * @req API-002.1 - State update event
 */
export interface GameStateUpdateEvent {
  gameState: ClientGameState;
  validMoves: ValidMove[];
  trigger: 'move_executed' | 'turn_changed' | 'phase_changed';
}

/**
 * AI is about to take its turn
 * @req API-002.2 - AI turn start event
 */
export interface AITurnStartEvent {
  /** Estimated time for AI to decide (milliseconds) */
  estimatedTimeMs: number;
}

/**
 * AI has made a move
 * @req API-002.3 - AI move event
 */
export interface AIMoveEvent {
  move: Move;
  /** AI's reasoning (if available) */
  reasoning?: string;
  gameState: ClientGameState;
  validMoves: ValidMove[];
}

/**
 * Optional game narration/commentary
 * @req API-002.4 - Narration event
 */
export interface NarrationEvent {
  /** The narration text */
  text: string;
  /** Type of narration */
  type: 'move_commentary' | 'strategy_insight' | 'game_milestone';
}

/**
 * Game has ended
 * @req API-002.5 - Game over event
 */
export interface GameOverEvent {
  winner: number;
  scores: PlayerScore[];
  endCondition: 'provinces_empty' | 'three_piles_empty';
  /** Summary narration of the game */
  summary?: string;
}

/**
 * Error occurred
 */
export interface ErrorEvent {
  code: string;
  message: string;
}

// Client → Server Events

/**
 * Subscribe to game updates
 * @req API-002.6 - Subscribe to game channel
 */
export interface SubscribeEvent {
  gameId: string;
}

/**
 * Toggle narration on/off
 * @req API-002.7 - Set narration preference
 */
export interface SetNarrationEvent {
  enabled: boolean;
}

// =============================================================================
// API Error Types
// =============================================================================

export interface APIError {
  code: APIErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export type APIErrorCode =
  | 'GAME_NOT_FOUND'
  | 'INVALID_MOVE'
  | 'NOT_YOUR_TURN'
  | 'GAME_ALREADY_OVER'
  | 'INVALID_REQUEST'
  | 'AI_ERROR'
  | 'INTERNAL_ERROR';
