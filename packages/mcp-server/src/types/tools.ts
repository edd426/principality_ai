/**
 * Tool Request and Response Types
 *
 * Type definitions for the three MCP tools:
 * - game_observe: Query game state + valid moves
 * - game_execute: Execute a move atomically
 * - game_session: Manage game lifecycle
 */

// game_observe types
export interface GameObserveRequest {
  detail_level: 'minimal' | 'standard' | 'full';
}

export interface GameObserveResponse {
  success: boolean;
  detail_level?: 'minimal' | 'standard' | 'full';
  phase?: string;
  turnNumber?: number;
  activePlayer?: number;
  playerCount?: number;
  gameOver?: boolean; // R2.0-NEW: Game end status (available in all detail levels)
  hand?: any;
  validMoves?: any[];
  moveSummary?: {
    playableCount: number;
    buyableCount: number;
    endPhaseAvailable: boolean;
  };
  supply?: any[];
  state?: any;
  error?: string;
}

// game_execute types
export interface GameExecuteRequest {
  move: string;
  return_detail?: 'minimal' | 'full';
  reasoning?: string; // Optional brief rationale for the move (for strategy analysis)
}

export interface GameExecuteResponse {
  success: boolean;
  phaseChanged?: string;
  message?: string;
  state?: any;
  // R2.1-ACC: Auto-return state fields (always included)
  gameState?: any; // Current game state (standard detail level)
  validMoves?: string[]; // Available move commands for next action
  gameOver?: boolean; // Game end status flag
  error?: {
    message: string;
    suggestion?: string;
    details?: any;
  };
}

// game_session types
export interface GameSessionRequest {
  command: 'new' | 'end';
  seed?: string;
  model?: 'haiku' | 'sonnet';
}

export interface GameSessionResponse {
  success: boolean;
  gameId?: string;
  command?: string;
  initialState?: any;
  finalState?: any;
  winner?: number;
  error?: string;
}

// Internal game instance tracking
export interface GameInstance {
  id: string;
  state: any;
  model: 'haiku' | 'sonnet';
  seed?: string;
  startTime: string;
  moves: number;
}
