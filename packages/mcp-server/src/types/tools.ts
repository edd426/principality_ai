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
  gameId?: string;
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
  gameId?: string;
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
  // Phase 4.2: Pending effect support for interactive cards
  pendingEffect?: {
    card: string;
    effect: string;
    step?: number | null;  // null = not multi-step, number = current step
    options?: Array<{
      index: number;
      description: string;
      command: string;
    }>;
    // Fallback fields when option generation is not implemented
    error?: string;
    validMoves?: string[];
  };
  // 2-player MCP: Opponent turn summary after auto-play
  opponentTurnSummary?: {
    cardsBought: string[];
    treasuresPlayed: string[];
    actionsPlayed: string[];
  };
  error?: {
    message: string;
    suggestion?: string;
    details?: any;
  };
}

// game_session types
export interface GameSessionRequest {
  command: 'new' | 'end' | 'list';
  seed?: string;
  model?: 'haiku' | 'sonnet';
  edition?: '1E' | '2E' | 'mixed';
  gameId?: string;
  numPlayers?: number; // 1-4 players (default: 1)
  kingdomCards?: string[]; // Optional specific kingdom cards
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

// Extended game instance for multi-game registry
export interface ExtendedGameInstance {
  id: string;
  state: any;
  model: 'haiku' | 'sonnet';
  seed?: string;
  startTime: string;
  lastActivityTime: string;
  moves: number;
  engine: any; // GameEngine instance
}
