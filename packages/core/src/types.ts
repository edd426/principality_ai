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

export interface PendingEffect {
  card: CardName;
  effect: string;
  maxTrash?: number;
  maxGainCost?: number;
  trashedCard?: CardName;
  targetPlayer?: number;
  throneRoomDouble?: boolean;
  destination?: 'hand' | 'discard' | 'topdeck';  // For Mine and other cards that gain to specific location
  deckSize?: number;  // For Chancellor decision
  revealedCard?: CardName;  // For Spy decision - card revealed from top of deck
  drawnCard?: CardName;  // For Library decision - action card that was drawn
  setAsideCards?: CardName[];  // For Library - cards set aside during drawing
  targetHandSize?: number;  // For Library - target hand size (usually 7)
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
  readonly pendingEffect?: PendingEffect;
  readonly selectedKingdomCards?: ReadonlyArray<CardName>;
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
  kingdomCards?: ReadonlyArray<CardName>; // Kingdom cards to include in supply (default: Phase 1 cards)
  allCards?: boolean; // Include all Phase 4 cards (ignores kingdomCards if true)
  debugMode?: boolean; // Enable debug mode for inspecting hidden game state (default: false)
}