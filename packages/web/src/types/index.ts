/**
 * Type definitions for the web UI
 *
 * These are self-contained to avoid runtime imports from @principality/core
 * which uses CommonJS and can cause issues with Vite's ESM bundling.
 */

// Card types (mirrored from core for type safety)
export type CardName = string;
export type CardType = 'treasure' | 'victory' | 'action' | 'curse' | 'action-attack' | 'action-reaction';
export type Phase = 'action' | 'buy' | 'cleanup';

export interface Card {
  name: CardName;
  type: CardType;
  cost: number;
}

export interface Move {
  type: string;
  card?: CardName;
  cards?: ReadonlyArray<CardName>;
  playerIndex?: number;
  destination?: 'hand' | 'discard' | 'topdeck';
  choice?: boolean;
}

// AI model type
export type AIModel = 'haiku' | 'sonnet' | 'opus';

// API Request/Response types (mirrored from api-server)
export interface CreateGameRequest {
  aiModel: AIModel;
  seed?: string;
  kingdomCards?: string[];
  enableNarration?: boolean;
  /** If true, AI turns are not auto-played (for Claude MCP control) */
  manualAI?: boolean;
}

export interface CreateGameResponse {
  gameId: string;
  gameState: ClientGameState;
  wsUrl: string;
}

export interface GetGameResponse {
  gameId: string;
  gameState: ClientGameState;
  validMoves: ValidMove[];
  isGameOver: boolean;
  winner?: number;
  scores?: PlayerScore[];
}

export interface ExecuteMoveRequest {
  move: string | object;
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

export interface EndGameResponse {
  success: boolean;
  message: string;
}

// Client-facing game state
export interface ClientGameState {
  humanPlayer: ClientPlayerState;
  aiPlayer: OpponentPlayerState;
  supply: Record<string, number>;
  currentPlayer: number;
  phase: Phase;
  turnNumber: number;
  gameLog: string[];
  trash: string[];
  pendingEffect?: ClientPendingEffect;
  kingdomCards: string[];
}

export interface ClientPlayerState {
  hand: string[];
  drawPileCount: number;
  discardPile: string[];
  inPlay: string[];
  actions: number;
  buys: number;
  coins: number;
}

export interface OpponentPlayerState {
  handCount: number;
  drawPileCount: number;
  discardPile: string[];
  inPlay: string[];
  actions: number;
  buys: number;
  coins: number;
}

export interface ClientPendingEffect {
  card: string;
  effect: string;
  respondingPlayer: number;
  maxTrash?: number;
  maxGainCost?: number;
  /** The action card drawn by Library that the player must decide on */
  drawnCard?: string;
}

export interface ValidMove {
  move: object;
  description: string;
}

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

// API Error
export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
