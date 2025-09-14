export type CardName = string;

export type CardType = 'treasure' | 'victory' | 'action';

export type Phase = 'action' | 'buy' | 'cleanup';

export interface CardEffect {
  cards?: number;
  actions?: number;
  buys?: number;
  coins?: number;
  special?: string;
}

export interface Card {
  name: CardName;
  type: CardType;
  cost: number;
  effect: CardEffect;
  description: string;
  victoryPoints?: number;
}

export interface PlayerState {
  readonly deck: ReadonlyArray<CardName>;
  readonly hand: ReadonlyArray<CardName>;
  readonly discard: ReadonlyArray<CardName>;
  readonly playArea: ReadonlyArray<CardName>;
  readonly actions: number;
  readonly buys: number;
  readonly coins: number;
}

export interface GameState {
  readonly players: ReadonlyArray<PlayerState>;
  readonly supply: ReadonlyMap<CardName, number>;
  readonly currentPlayer: number;
  readonly phase: Phase;
  readonly turnNumber: number;
  readonly seed: string;
  readonly gameLog: ReadonlyArray<string>;
}

export interface Move {
  type: 'play_action' | 'play_treasure' | 'buy' | 'end_phase' | 'discard_for_cellar';
  card?: CardName;
  cards?: ReadonlyArray<CardName>;
}

export interface GameResult {
  success: boolean;
  newState?: GameState;
  error?: string;
}

export interface Victory {
  isGameOver: boolean;
  winner?: number;
  scores?: ReadonlyArray<number>;
}