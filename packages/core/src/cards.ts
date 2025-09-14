import { Card, CardName } from './types';

export const BASIC_CARDS: Record<CardName, Card> = {
  // Basic Treasures
  'Copper': {
    name: 'Copper',
    type: 'treasure',
    cost: 0,
    effect: { coins: 1 },
    description: '+$1'
  },
  'Silver': {
    name: 'Silver',
    type: 'treasure',
    cost: 3,
    effect: { coins: 2 },
    description: '+$2'
  },
  'Gold': {
    name: 'Gold',
    type: 'treasure',
    cost: 6,
    effect: { coins: 3 },
    description: '+$3'
  },

  // Victory Cards
  'Estate': {
    name: 'Estate',
    type: 'victory',
    cost: 2,
    effect: {},
    description: '1 Victory Point',
    victoryPoints: 1
  },
  'Duchy': {
    name: 'Duchy',
    type: 'victory',
    cost: 5,
    effect: {},
    description: '3 Victory Points',
    victoryPoints: 3
  },
  'Province': {
    name: 'Province',
    type: 'victory',
    cost: 8,
    effect: {},
    description: '6 Victory Points',
    victoryPoints: 6
  }
};

export const KINGDOM_CARDS: Record<CardName, Card> = {
  // Draw Cards
  'Village': {
    name: 'Village',
    type: 'action',
    cost: 3,
    effect: { cards: 1, actions: 2 },
    description: '+1 Card, +2 Actions'
  },
  'Smithy': {
    name: 'Smithy',
    type: 'action',
    cost: 4,
    effect: { cards: 3 },
    description: '+3 Cards'
  },
  'Laboratory': {
    name: 'Laboratory',
    type: 'action',
    cost: 5,
    effect: { cards: 2, actions: 1 },
    description: '+2 Cards, +1 Action'
  },

  // Economy Cards
  'Market': {
    name: 'Market',
    type: 'action',
    cost: 5,
    effect: { cards: 1, actions: 1, coins: 1, buys: 1 },
    description: '+1 Card, +1 Action, +$1, +1 Buy'
  },
  'Woodcutter': {
    name: 'Woodcutter',
    type: 'action',
    cost: 3,
    effect: { coins: 2, buys: 1 },
    description: '+$2, +1 Buy'
  },
  'Festival': {
    name: 'Festival',
    type: 'action',
    cost: 5,
    effect: { actions: 2, coins: 2, buys: 1 },
    description: '+2 Actions, +$2, +1 Buy'
  },

  // Utility Cards
  'Council Room': {
    name: 'Council Room',
    type: 'action',
    cost: 5,
    effect: { cards: 4, buys: 1 },
    description: '+4 Cards, +1 Buy'
  },
  'Cellar': {
    name: 'Cellar',
    type: 'action',
    cost: 2,
    effect: { actions: 1, special: 'discard_draw' },
    description: '+1 Action, Discard any number of cards, then draw that many'
  }
};

export const ALL_CARDS: Record<CardName, Card> = {
  ...BASIC_CARDS,
  ...KINGDOM_CARDS
};

export function getCard(name: CardName): Card {
  const card = ALL_CARDS[name];
  if (!card) {
    throw new Error(`Unknown card: ${name}`);
  }
  return card;
}

export function isActionCard(name: CardName): boolean {
  return getCard(name).type === 'action';
}

export function isTreasureCard(name: CardName): boolean {
  return getCard(name).type === 'treasure';
}

export function isVictoryCard(name: CardName): boolean {
  return getCard(name).type === 'victory';
}

export function getVictoryPoints(name: CardName): number {
  const card = getCard(name);
  return card.victoryPoints || 0;
}