/**
 * AI Strategy Types for Principality AI
 *
 * @req AI-001 - AI model selection (Haiku/Sonnet/Opus)
 * @req AI-002 - AI decision context and reasoning
 * @req AI-003 - Fallback to Big Money strategy
 */

import type { GameState, Move, CardName, Phase } from '@principality/core';

// =============================================================================
// AI Model Types
// =============================================================================

/**
 * Available Claude models for AI opponent
 * @req AI-001 - AI model selection
 */
export type AIModel = 'haiku' | 'sonnet' | 'opus';

/**
 * AI model configuration
 */
export interface AIModelConfig {
  model: AIModel;
  /** Maximum tokens for response */
  maxTokens: number;
  /** Temperature for response variability (0-1) */
  temperature: number;
  /** Timeout in milliseconds */
  timeoutMs: number;
}

/**
 * Default configurations per model
 */
export const AI_MODEL_CONFIGS: Record<AIModel, AIModelConfig> = {
  haiku: {
    model: 'haiku',
    maxTokens: 1024,
    temperature: 0.3,
    timeoutMs: 10000,
  },
  sonnet: {
    model: 'sonnet',
    maxTokens: 2048,
    temperature: 0.5,
    timeoutMs: 30000,
  },
  opus: {
    model: 'opus',
    maxTokens: 4096,
    temperature: 0.7,
    timeoutMs: 60000,
  },
};

// =============================================================================
// AI Strategy Interface
// =============================================================================

/**
 * Strategy interface for AI decision-making
 * Allows different implementations (Claude API, Big Money fallback, etc.)
 * @req AI-003 - Strategy pattern for fallback
 */
export interface AIStrategy {
  /** Strategy identifier */
  readonly name: string;

  /**
   * Decide the next move given the current game state
   * @param context - All information needed to make a decision
   * @returns The decision with optional reasoning
   */
  decideMove(context: AIDecisionContext): Promise<AIDecision>;

  /**
   * Check if this strategy can handle the given context
   * @param context - The decision context
   * @returns true if this strategy can make a decision
   */
  canHandle(context: AIDecisionContext): boolean;
}

// =============================================================================
// AI Decision Context
// =============================================================================

/**
 * All information available to the AI for decision-making
 * @req AI-002 - AI decision context
 */
export interface AIDecisionContext {
  /** Full game state (AI sees everything for its own decisions) */
  gameState: GameState;
  /** AI's player index */
  playerIndex: number;
  /** Valid moves the AI can make */
  validMoves: Move[];
  /** Game phase */
  phase: Phase;
  /** Turn number */
  turnNumber: number;
  /** AI's current hand */
  hand: CardName[];
  /** AI's available resources */
  resources: AIResources;
  /** Cards AI has already played this turn */
  playedThisTurn: CardName[];
  /** Kingdom cards in this game */
  kingdomCards: CardName[];
  /** Game history/log */
  gameLog: string[];
}

/**
 * AI's current resources
 */
export interface AIResources {
  actions: number;
  buys: number;
  coins: number;
}

// =============================================================================
// AI Decision Output
// =============================================================================

/**
 * AI's decision with optional reasoning
 * @req AI-002.2 - AI decision with reasoning
 */
export interface AIDecision {
  /** The move to execute */
  move: Move;
  /** AI's reasoning for this move (for narration/debugging) */
  reasoning?: string;
  /** Confidence level (0-1) */
  confidence?: number;
  /** Time taken to decide (milliseconds) */
  decisionTimeMs: number;
  /** Which strategy made the decision */
  strategyUsed: string;
}

// =============================================================================
// AI Error Types
// =============================================================================

/**
 * Error during AI decision-making
 */
export interface AIError {
  code: AIErrorCode;
  message: string;
  /** Strategy that failed */
  strategy?: string;
  /** Original error if available */
  cause?: Error;
}

export type AIErrorCode =
  | 'API_ERROR'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'NO_VALID_MOVES'
  | 'STRATEGY_FAILED';

// =============================================================================
// AI Session State
// =============================================================================

/**
 * Persistent state for an AI opponent across a game
 */
export interface AISession {
  /** Game ID this session is for */
  gameId: string;
  /** AI model being used */
  model: AIModel;
  /** Strategy chain (primary + fallbacks) */
  strategies: AIStrategy[];
  /** Total decisions made */
  decisionsCount: number;
  /** Total time spent deciding */
  totalDecisionTimeMs: number;
  /** Times fallback was used */
  fallbackCount: number;
}

// =============================================================================
// Big Money Strategy Types
// =============================================================================

/**
 * Configuration for Big Money fallback strategy
 * @req AI-003 - Big Money fallback
 */
export interface BigMoneyConfig {
  /** Minimum coins to buy Province */
  provinceThreshold: number;
  /** Minimum coins to buy Gold */
  goldThreshold: number;
  /** Minimum coins to buy Silver */
  silverThreshold: number;
  /** Province count threshold to start buying Duchies */
  duchyThreshold: number;
  /** Province count threshold to start buying Estates */
  estateThreshold: number;
}

/**
 * Default Big Money configuration
 */
export const DEFAULT_BIG_MONEY_CONFIG: BigMoneyConfig = {
  provinceThreshold: 8,
  goldThreshold: 6,
  silverThreshold: 3,
  duchyThreshold: 4,
  estateThreshold: 2,
};

// =============================================================================
// Claude API Prompt Types
// =============================================================================

/**
 * Structure for prompting Claude API
 */
export interface ClaudePrompt {
  /** System prompt with game rules and strategy */
  systemPrompt: string;
  /** User message with current game state */
  userMessage: string;
  /** Expected response format */
  responseFormat: 'json' | 'text';
}

/**
 * Expected JSON response structure from Claude
 */
export interface ClaudeResponse {
  /** The move type to execute */
  moveType: string;
  /** Card name if applicable */
  card?: string;
  /** Array of cards if applicable */
  cards?: string[];
  /** Brief reasoning */
  reasoning: string;
}
