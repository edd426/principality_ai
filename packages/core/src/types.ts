export type CardName = string;

export type CardType = 'treasure' | 'victory' | 'action' | 'curse' | 'action-attack' | 'action-reaction';

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
  readonly drawPile: ReadonlyArray<CardName>;
  readonly hand: ReadonlyArray<CardName>;
  readonly discardPile: ReadonlyArray<CardName>;
  readonly inPlay: ReadonlyArray<CardName>;
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
  readonly trash: ReadonlyArray<CardName>;
}

export interface Move {
  type: 'play_action' | 'play_treasure' | 'play_all_treasures' | 'buy' | 'end_phase' | 'discard_for_cellar' |
        'trash_cards' | 'gain_card' | 'reveal_reaction' | 'discard_to_hand_size' |
        'reveal_and_topdeck' | 'spy_decision' | 'select_treasure_to_trash' |
        'gain_trashed_card' | 'select_action_for_throne' | 'chancellor_decision' |
        'library_set_aside';
  card?: CardName;
  cards?: ReadonlyArray<CardName>;
  playerIndex?: number;
  destination?: 'hand' | 'discard' | 'topdeck';
  choice?: boolean;
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

export interface GameOptions {
  victoryPileSize?: number; // Number of Estate/Duchy/Province cards (default: 4)
}