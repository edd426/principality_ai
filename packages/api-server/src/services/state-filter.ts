/**
 * State Filter Service
 *
 * Transforms full GameState to ClientGameState with visibility rules:
 * - Human player: full hand visibility
 * - AI opponent: hand count only (contents hidden)
 *
 * @req API-003 - Client state filtering
 */

import {
  GameState,
  Move,
  CardName,
  formatMoveCommand,
  groupHand,
  isGameOver,
  calculateScore,
  getAllPlayerCards,
} from '@principality/core';
import type {
  ClientGameState,
  ClientPlayerState,
  OpponentPlayerState,
  ClientPendingEffect,
  ValidMove,
  PlayerScore,
  ScoreBreakdown,
} from '../types/api';

/**
 * Filter game state for human player visibility
 *
 * @param state - Full game state
 * @param humanPlayerIndex - Index of the human player (typically 0)
 * @returns Filtered state safe to send to client
 */
export function filterStateForHuman(
  state: GameState,
  humanPlayerIndex: number = 0
): ClientGameState {
  const aiPlayerIndex = humanPlayerIndex === 0 ? 1 : 0;
  const humanPlayer = state.players[humanPlayerIndex];
  const aiPlayer = state.players[aiPlayerIndex];

  // Get kingdom cards from supply (non-basic cards)
  const kingdomCards = getKingdomCardsFromSupply(state.supply);

  // Convert supply Map to Record
  const supplyRecord: Record<CardName, number> = {};
  state.supply.forEach((count, cardName) => {
    supplyRecord[cardName] = count;
  });

  // Build human player state (full visibility)
  const humanPlayerState: ClientPlayerState = {
    hand: humanPlayer.hand as CardName[],
    drawPileCount: humanPlayer.drawPile.length,
    discardPile: humanPlayer.discardPile as CardName[],
    inPlay: humanPlayer.inPlay as CardName[],
    actions: humanPlayer.actions,
    buys: humanPlayer.buys,
    coins: humanPlayer.coins,
  };

  // Build AI player state (limited visibility - hide hand contents)
  const aiPlayerState: OpponentPlayerState = {
    handCount: aiPlayer.hand.length,
    drawPileCount: aiPlayer.drawPile.length,
    discardPile: aiPlayer.discardPile as CardName[],
    inPlay: aiPlayer.inPlay as CardName[],
    actions: aiPlayer.actions,
    buys: aiPlayer.buys,
    coins: aiPlayer.coins,
  };

  // Build pending effect if present
  let pendingEffect: ClientPendingEffect | undefined;
  if (state.pendingEffect) {
    pendingEffect = {
      card: state.pendingEffect.card,
      effect: state.pendingEffect.effect,
      respondingPlayer:
        state.pendingEffect.targetPlayer !== undefined
          ? state.pendingEffect.targetPlayer
          : state.currentPlayer,
      maxTrash: state.pendingEffect.maxTrash,
      maxGainCost: state.pendingEffect.maxGainCost,
    };
  }

  return {
    humanPlayer: humanPlayerState,
    aiPlayer: aiPlayerState,
    supply: supplyRecord,
    currentPlayer: state.currentPlayer,
    phase: state.phase,
    turnNumber: state.turnNumber,
    gameLog: state.gameLog ? [...state.gameLog] : [],
    trash: state.trash as CardName[],
    pendingEffect,
    kingdomCards,
  };
}

/**
 * Format valid moves with descriptions for the client
 */
export function formatValidMoves(
  validMoves: Move[],
  state: GameState
): ValidMove[] {
  return validMoves.map((move) => ({
    move,
    description: getMoveDescription(move, state),
  }));
}

/**
 * Get a human-readable description for a move
 */
function getMoveDescription(move: Move, state: GameState): string {
  switch (move.type) {
    case 'play_action':
      return `Play ${move.card}`;

    case 'play_treasure':
      return `Play ${move.card} for coins`;

    case 'play_all_treasures':
      return 'Play all treasures at once';

    case 'buy':
      return `Buy ${move.card}`;

    case 'end_phase':
      return `End ${state.phase} phase`;

    case 'discard_for_cellar':
      if (move.cards && move.cards.length > 0) {
        return `Discard ${[...move.cards].join(', ')} with Cellar`;
      }
      return 'Discard cards with Cellar';

    case 'trash_cards':
      if (move.cards && move.cards.length > 0) {
        return `Trash ${[...move.cards].join(', ')}`;
      }
      return 'Trash cards (up to 4)';

    case 'gain_card':
      return `Gain ${move.card}`;

    case 'select_treasure_to_trash':
      return `Trash ${move.card} with Mine`;

    case 'discard_to_hand_size':
      return `Discard to 3 cards (Militia)`;

    case 'reveal_reaction':
      return `Reveal ${move.card} as reaction`;

    case 'reveal_and_topdeck':
      return move.card ? `Topdeck ${move.card}` : 'Reveal hand (no Victory cards)';

    case 'spy_decision':
      return move.choice ? 'Discard revealed card' : 'Keep revealed card';

    case 'gain_trashed_card':
      return `Gain ${move.card} from trash`;

    case 'select_action_for_throne':
      return `Play ${move.card} with Throne Room`;

    case 'chancellor_decision':
      return move.choice ? 'Put deck into discard' : 'Keep deck as is';

    case 'library_set_aside':
      return `Set aside ${move.card}`;

    default:
      return formatMoveCommand(move);
  }
}

/**
 * Get kingdom cards from supply (non-basic cards)
 */
function getKingdomCardsFromSupply(supply: ReadonlyMap<CardName, number>): CardName[] {
  const basicCards: CardName[] = [
    'Copper',
    'Silver',
    'Gold',
    'Estate',
    'Duchy',
    'Province',
    'Curse',
  ];

  const kingdomCards: CardName[] = [];
  supply.forEach((_, cardName) => {
    if (!basicCards.includes(cardName)) {
      kingdomCards.push(cardName);
    }
  });

  return kingdomCards.sort();
}

/**
 * Calculate player scores at game end
 */
export function calculatePlayerScores(state: GameState): PlayerScore[] {
  return state.players.map((player, index) => {
    const allCards = getAllPlayerCards(
      player.drawPile,
      player.hand,
      player.discardPile
    ) as CardName[];
    const score = calculateScore(allCards);

    const breakdown = calculateScoreBreakdown(allCards);

    return {
      playerIndex: index,
      name: index === 0 ? 'Human' : 'AI',
      score,
      breakdown,
    };
  });
}

/**
 * Calculate detailed score breakdown
 */
function calculateScoreBreakdown(cards: CardName[]): ScoreBreakdown {
  let estates = 0;
  let duchies = 0;
  let provinces = 0;
  let curses = 0;
  let gardens = 0;
  const deckSize = cards.length;

  for (const card of cards) {
    switch (card) {
      case 'Estate':
        estates++;
        break;
      case 'Duchy':
        duchies++;
        break;
      case 'Province':
        provinces++;
        break;
      case 'Curse':
        curses++;
        break;
      case 'Gardens':
        gardens++;
        break;
    }
  }

  const estatePoints = estates * 1;
  const duchyPoints = duchies * 3;
  const provincePoints = provinces * 6;
  const cursePoints = curses * -1;
  const gardensPoints = gardens * Math.floor(deckSize / 10);

  return {
    estates: estatePoints,
    duchies: duchyPoints,
    provinces: provincePoints,
    gardens: gardensPoints,
    curses: cursePoints,
    total: estatePoints + duchyPoints + provincePoints + gardensPoints + cursePoints,
  };
}

/**
 * Format a compact state summary for responses
 */
export function formatCompactState(state: GameState): {
  phase: string;
  turnNumber: number;
  activePlayer: number;
  hand: Record<string, number>;
  currentCoins: number;
  currentActions: number;
  currentBuys: number;
  gameOver: boolean;
} {
  const activePlayer = state.players[state.currentPlayer];

  return {
    phase: state.phase,
    turnNumber: state.turnNumber,
    activePlayer: state.currentPlayer,
    hand: groupHand(activePlayer.hand) as Record<string, number>,
    currentCoins: activePlayer.coins,
    currentActions: activePlayer.actions,
    currentBuys: activePlayer.buys,
    gameOver: isGameOver(state),
  };
}
