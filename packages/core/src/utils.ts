import { CardName } from './types';
import { getCard } from './cards';

// @blocker: Conflicting test expectations for default supply composition
// Phase 3 tests (multiplayer-mcp-tools.test.ts) expect: supply.size === 8
// Phase 4 attack tests (attack-reaction-flow.test.ts) require Phase 4 cards by default
// Decision: Default now includes ALL Phase 4 cards (Phase 4 is current phase)
// Consequence: Phase 3 tests must use mvpOnly option or be updated by test-architect
// Note: Phase 3 tests were written with outdated MVP assumption (2 kingdom cards only)

export class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    this.seed = this.hashString(seed);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  next(): number {
    // Linear congruential generator
    this.seed = (this.seed * 1664525 + 1013904223) % Math.pow(2, 32);
    return this.seed / Math.pow(2, 32);
  }

  shuffle<T>(array: ReadonlyArray<T>): ReadonlyArray<T> {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export function createStartingDeck(): ReadonlyArray<CardName> {
  return [
    'Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper',
    'Estate', 'Estate', 'Estate'
  ];
}

// Phase 1 kingdom cards - NOTE: Phase 1 spec requires 8 cards, but Phase 3 tests expect only 2
// MVP set: Village, Smithy (6 basic + 2 kingdom = 8 total)
export const PHASE1_KINGDOM_CARDS_MVP: ReadonlyArray<CardName> = [
  'Village', 'Smithy'
];

// Full Phase 1 kingdom cards (all 8)
export const PHASE1_KINGDOM_CARDS: ReadonlyArray<CardName> = [
  'Village', 'Smithy', 'Laboratory', 'Market',
  'Woodcutter', 'Festival', 'Council Room', 'Cellar'
];

// Phase 4 trashing system cards
export const PHASE4_TRASHING_CARDS: ReadonlyArray<CardName> = [
  'Chapel', 'Remodel', 'Mine', 'Moneylender'
];

// Phase 4 gaining system cards
export const PHASE4_GAINING_CARDS: ReadonlyArray<CardName> = [
  'Workshop', 'Feast'
];

// Phase 4 attack system cards
export const PHASE4_ATTACK_CARDS: ReadonlyArray<CardName> = [
  'Militia', 'Witch', 'Bureaucrat', 'Spy', 'Thief'
];

// Phase 4 reaction system cards
export const PHASE4_REACTION_CARDS: ReadonlyArray<CardName> = [
  'Moat'
];

// Phase 4 special cards
export const PHASE4_SPECIAL_CARDS: ReadonlyArray<CardName> = [
  'Throne Room', 'Adventurer', 'Chancellor', 'Library', 'Gardens'
];

export function createDefaultSupply(options?: { victoryPileSize?: number; kingdomCards?: ReadonlyArray<CardName>; allCards?: boolean; fullPhase1?: boolean; mvpOnly?: boolean }): ReadonlyMap<CardName, number> {
  const victoryPileSize = options?.victoryPileSize ?? 4;

  // Determine which kingdom cards to include
  let kingdomCards = options?.kingdomCards;
  if (options?.allCards === true) {
    // Include all cards from all phases (Phase 4 full set)
    kingdomCards = [
      ...PHASE1_KINGDOM_CARDS,
      ...PHASE4_TRASHING_CARDS,
      ...PHASE4_GAINING_CARDS,
      ...PHASE4_ATTACK_CARDS,
      ...PHASE4_REACTION_CARDS,
      ...PHASE4_SPECIAL_CARDS
    ];
  } else if (options?.fullPhase1 === true) {
    // Include all Phase 1 cards (8)
    kingdomCards = PHASE1_KINGDOM_CARDS;
  } else if (options?.mvpOnly === true) {
    // MVP set for Phase 3 compatibility (2 kingdom cards)
    kingdomCards = PHASE1_KINGDOM_CARDS_MVP;
  } else if (!kingdomCards) {
    // Default: All Phase 4 cards (for Phase 4 gameplay)
    kingdomCards = [
      ...PHASE1_KINGDOM_CARDS,
      ...PHASE4_TRASHING_CARDS,
      ...PHASE4_GAINING_CARDS,
      ...PHASE4_ATTACK_CARDS,
      ...PHASE4_REACTION_CARDS,
      ...PHASE4_SPECIAL_CARDS
    ];
  }

  const supply = new Map<CardName, number>([
    // Basic cards (always available)
    ['Copper', 60],
    ['Silver', 40],
    ['Gold', 30],
    ['Estate', victoryPileSize],
    ['Duchy', victoryPileSize],
    ['Province', victoryPileSize],
    ['Curse', 10]  // Always include Curse (Phase 4.1 requirement)
  ]);

  // Add kingdom cards
  kingdomCards.forEach(card => {
    supply.set(card, 10);
  });

  return supply;
}

export function calculateScore(cards: ReadonlyArray<CardName>): number {
  let score = 0;
  const deckSize = cards.length;

  for (const cardName of cards) {
    if (cardName === 'Estate') score += 1;
    else if (cardName === 'Duchy') score += 3;
    else if (cardName === 'Province') score += 6;
    else if (cardName === 'Curse') score -= 1;
    else if (cardName === 'Gardens') score += Math.floor(deckSize / 10);
  }
  return score;
}

export function getAllPlayerCards(deck: ReadonlyArray<CardName>, hand: ReadonlyArray<CardName>, discard: ReadonlyArray<CardName>): ReadonlyArray<CardName> {
  return [...deck, ...hand, ...discard];
}

/**
 * Sort cards by cost (ascending) and then alphabetically within each cost tier
 * This is a display-only function - does not mutate the original array
 *
 * @param cards - Array of card names to sort
 * @returns New sorted array
 */
export function sortCardsByCostAndName(cards: ReadonlyArray<CardName>): CardName[] {
  return [...cards].sort((a, b) => {
    const cardA = getCard(a);
    const cardB = getCard(b);

    // Primary sort: cost ascending
    if (cardA.cost !== cardB.cost) {
      return cardA.cost - cardB.cost;
    }

    // Secondary sort: alphabetical
    return a.localeCompare(b);
  });
}