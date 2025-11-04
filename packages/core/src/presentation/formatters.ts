/**
 * Presentation Layer: State Formatters
 *
 * Canonical formatting functions for game state, hand, supply, and moves.
 * Single source of truth for all display/formatting logic used by CLI and MCP.
 *
 * @module presentation/formatters
 */

import { GameState, PlayerState, Move, CardName } from '../types';
import { getCard } from '../cards';

/**
 * Card with index and type information (for hand display)
 */
export interface FormattedCard {
  index: number;
  name: string;
  type: 'treasure' | 'victory' | 'action' | 'unknown';
}

/**
 * Grouped hand (card name → count mapping)
 */
export type GroupedHand = Record<string, number>;

/**
 * Supply pile information
 */
export interface SupplyPile {
  name: string;
  remaining: number;
  cost?: number;
}

/**
 * Formatted move with description and command syntax
 */
export interface FormattedMove {
  type: string;
  card?: string;
  description?: string;
  command?: string;
}

/**
 * Detail level for formatting
 */
export type DetailLevel = 'minimal' | 'standard' | 'full';

/**
 * Group hand cards by name with counts
 * @example groupHand(['Copper', 'Copper', 'Estate']) → { Copper: 2, Estate: 1 }
 */
export function groupHand(hand: readonly CardName[]): GroupedHand {
  const grouped: GroupedHand = {};
  hand.forEach(cardName => {
    grouped[cardName] = (grouped[cardName] || 0) + 1;
  });
  return grouped;
}

/**
 * Format hand with indices and card types
 * Used for detailed hand display in MCP/CLI
 */
export function formatHand(hand: readonly CardName[]): FormattedCard[] {
  return hand.map((name, idx) => {
    // Determine card type from card definition
    let cardType: FormattedCard['type'] = 'unknown';

    try {
      const card = getCard(name);
      cardType = card.type as FormattedCard['type'];
    } catch {
      // Fallback: classify by known card names
      if (['Copper', 'Silver', 'Gold'].includes(name)) {
        cardType = 'treasure';
      } else if (['Estate', 'Duchy', 'Province'].includes(name)) {
        cardType = 'victory';
      } else if (['Village', 'Smithy', 'Militia', 'Remodel', 'Cellar',
                  'Market', 'Chapel', 'Workshop', 'Throne Room', 'Woodcutter'].includes(name)) {
        cardType = 'action';
      }
    }

    return {
      index: idx,
      name,
      type: cardType
    };
  });
}

/**
 * Format supply piles with card information
 */
export function formatSupply(state: GameState): SupplyPile[] {
  const supply: SupplyPile[] = [];

  state.supply.forEach((quantity, cardName) => {
    try {
      const card = getCard(cardName);
      supply.push({
        name: cardName,
        remaining: quantity,
        cost: card.cost
      });
    } catch {
      // Handle unknown cards gracefully
      supply.push({
        name: cardName,
        remaining: quantity
      });
    }
  });

  return supply;
}

/**
 * Format valid moves with descriptions and command syntax
 *
 * @param moves - Array of valid moves
 * @param detailLevel - Level of detail to include
 * @returns Formatted moves with descriptions (standard+) or minimal info
 */
export function formatValidMoves(moves: readonly Move[], detailLevel: DetailLevel): FormattedMove[] {
  return moves.map(move => {
    if (detailLevel === 'minimal') {
      return {
        type: move.type,
        card: move.card
      };
    }

    // Standard and full detail levels include descriptions and commands
    const formatted: FormattedMove = {
      type: move.type,
      card: move.card
    };

    // Add human-readable descriptions
    if (move.type === 'play_action') {
      formatted.description = `Play action card: ${move.card}`;
      formatted.command = `play_action ${move.card}`;
    } else if (move.type === 'play_treasure') {
      formatted.description = `Play treasure card: ${move.card} (generates coins)`;
      formatted.command = `play_treasure ${move.card}`;
    } else if (move.type === 'buy') {
      formatted.description = `Buy card: ${move.card}`;
      formatted.command = `buy ${move.card}`;
    } else if (move.type === 'end_phase') {
      formatted.description = 'End current phase and advance to next';
      formatted.command = 'end';
    }

    return formatted;
  });
}

/**
 * Calculate victory points for a player
 * Counts Estate (1), Duchy (3), Province (6) across all zones
 */
export function calculateVictoryPoints(player: PlayerState): number {
  let vp = 0;
  const allCards = [...player.hand, ...player.drawPile, ...player.discardPile, ...player.inPlay];

  allCards.forEach(cardName => {
    if (cardName === 'Estate') vp += 1;
    if (cardName === 'Duchy') vp += 3;
    if (cardName === 'Province') vp += 6;
  });

  return vp;
}

/**
 * Check if game is over
 * Game ends when Province pile is empty OR any 3 piles are empty
 */
export function isGameOver(state: GameState): boolean {
  const emptyPiles = countEmptyPiles(state);
  const provincesEmpty = state.supply.get('Province') === 0;
  return provincesEmpty || emptyPiles >= 3;
}

/**
 * Count number of empty supply piles
 */
export function countEmptyPiles(state: GameState): number {
  let count = 0;
  state.supply.forEach(quantity => {
    if (quantity === 0) count++;
  });
  return count;
}

/**
 * Get human-readable reason why game ended
 */
export function getGameOverReason(state: GameState): string {
  const provincesEmpty = state.supply.get('Province') === 0;
  if (provincesEmpty) {
    return 'Province pile is empty';
  }

  const emptyPilesList: string[] = [];
  state.supply.forEach((quantity, cardName) => {
    if (quantity === 0) {
      emptyPilesList.push(cardName);
    }
  });

  if (emptyPilesList.length >= 3) {
    return `${emptyPilesList.length} supply piles are empty: ${emptyPilesList.slice(0, 3).join(', ')}${emptyPilesList.length > 3 ? ' and more' : ''}`;
  }

  return 'Unknown game end condition';
}

/**
 * Group supply piles by type for organized display
 * Returns treasures, victory cards, and kingdom cards separately
 */
export function groupSupplyByType(state: GameState): {
  treasures: SupplyPile[];
  victory: SupplyPile[];
  kingdom: SupplyPile[];
} {
  const supply = formatSupply(state);

  const treasures: SupplyPile[] = [];
  const victory: SupplyPile[] = [];
  const kingdom: SupplyPile[] = [];

  supply.forEach(pile => {
    if (['Copper', 'Silver', 'Gold'].includes(pile.name)) {
      treasures.push(pile);
    } else if (['Estate', 'Duchy', 'Province'].includes(pile.name)) {
      victory.push(pile);
    } else {
      kingdom.push(pile);
    }
  });

  return { treasures, victory, kingdom };
}
