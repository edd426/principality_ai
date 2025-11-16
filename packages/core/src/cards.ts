import { Card, CardName } from './types';

export type { Card } from './types';

export const BASIC_CARDS: Record<CardName, Card> = {
  // Basic Treasures
  'Copper': {
    name: 'Copper',
    type: 'treasure',
    cost: 0,
    effect: { coins: 1 },
    description: 'Worth 1 coin',
    edition: 'both'
  },
  'Silver': {
    name: 'Silver',
    type: 'treasure',
    cost: 3,
    effect: { coins: 2 },
    description: 'Worth 2 coins',
    edition: 'both'
  },
  'Gold': {
    name: 'Gold',
    type: 'treasure',
    cost: 6,
    effect: { coins: 3 },
    description: 'Worth 3 coins',
    edition: 'both'
  },

  // Victory Cards
  'Estate': {
    name: 'Estate',
    type: 'victory',
    cost: 2,
    effect: {},
    description: 'Worth 1 VP',
    victoryPoints: 1,
    edition: 'both'
  },
  'Duchy': {
    name: 'Duchy',
    type: 'victory',
    cost: 5,
    effect: {},
    description: 'Worth 3 VP',
    victoryPoints: 3,
    edition: 'both'
  },
  'Province': {
    name: 'Province',
    type: 'victory',
    cost: 8,
    effect: {},
    description: 'Worth 6 VP',
    victoryPoints: 6,
    edition: 'both'
  },

  // Curse
  'Curse': {
    name: 'Curse',
    type: 'curse',
    cost: 0,
    effect: {},
    description: 'Worth -1 VP',
    victoryPoints: -1,
    edition: 'both'
  }
};

export const KINGDOM_CARDS: Record<CardName, Card> = {
  // Draw Cards (all in both editions)
  'Village': {
    name: 'Village',
    type: 'action',
    cost: 3,
    effect: { cards: 1, actions: 2 },
    description: '+1 Card, +2 Actions',
    edition: 'both'
  },
  'Smithy': {
    name: 'Smithy',
    type: 'action',
    cost: 4,
    effect: { cards: 3 },
    description: '+3 Cards',
    edition: 'both'
  },
  'Laboratory': {
    name: 'Laboratory',
    type: 'action',
    cost: 5,
    effect: { cards: 2, actions: 1 },
    description: '+2 Cards, +1 Action',
    edition: 'both'
  },

  // Economy Cards
  'Market': {
    name: 'Market',
    type: 'action',
    cost: 5,
    effect: { cards: 1, actions: 1, coins: 1, buys: 1 },
    description: '+1 Card, +1 Action, +1 Buy, +1 Coin',
    edition: 'both'
  },
  'Woodcutter': {
    name: 'Woodcutter',
    type: 'action',
    cost: 3,
    effect: { coins: 2, buys: 1 },
    description: '+1 Buy, +2 Coins',
    edition: '1st'  // Removed in 2nd edition
  },
  'Festival': {
    name: 'Festival',
    type: 'action',
    cost: 5,
    effect: { actions: 2, coins: 2, buys: 1 },
    description: '+2 Actions, +1 Buy, +2 Coins',
    edition: 'both'
  },

  // Utility Cards
  'Council Room': {
    name: 'Council Room',
    type: 'action',
    cost: 5,
    effect: { cards: 4, buys: 1, special: 'each_other_player_draws_1' },
    description: '+4 Cards, +1 Buy. Each other player draws 1 card.',
    edition: 'both'
  },
  'Cellar': {
    name: 'Cellar',
    type: 'action',
    cost: 2,
    effect: { actions: 1, special: 'discard_draw' },
    description: '+1 Action, Discard any number of cards, then draw that many',
    edition: 'both'
  },

  // Trashing System (all in both editions)
  'Chapel': {
    name: 'Chapel',
    type: 'action',
    cost: 2,
    effect: { special: 'trash_up_to_4' },
    description: 'Trash up to 4 cards from your hand',
    edition: 'both'
  },
  'Remodel': {
    name: 'Remodel',
    type: 'action',
    cost: 4,
    effect: { special: 'trash_and_gain' },
    description: 'Trash a card from your hand. Gain a card costing up to $2 more.',
    edition: 'both'
  },
  'Mine': {
    name: 'Mine',
    type: 'action',
    cost: 5,
    effect: { special: 'trash_treasure_gain_treasure' },
    description: 'Trash a Treasure from your hand. Gain a Treasure costing up to $3 more, to your hand.',
    edition: 'both'
  },
  'Moneylender': {
    name: 'Moneylender',
    type: 'action',
    cost: 4,
    effect: { special: 'trash_copper_gain_coins' },
    description: 'Trash a Copper from your hand. If you did, +$3.',
    edition: 'both'
  },

  // Gaining System
  'Workshop': {
    name: 'Workshop',
    type: 'action',
    cost: 3,
    effect: { special: 'gain_card_up_to_4' },
    description: 'Gain a card costing up to $4.',
    edition: 'both'
  },
  'Feast': {
    name: 'Feast',
    type: 'action',
    cost: 4,
    effect: { special: 'trash_self_gain_card' },
    description: 'Trash this card. Gain a card costing up to $5.',
    edition: '1st'  // Removed in 2nd edition
  },

  // Attack System
  'Militia': {
    name: 'Militia',
    type: 'action-attack',
    cost: 4,
    effect: { coins: 2, special: 'attack_discard_to_3' },
    description: '+$2. Each other player discards down to 3 cards in hand.',
    edition: 'both'
  },
  'Witch': {
    name: 'Witch',
    type: 'action-attack',
    cost: 5,
    effect: { cards: 2, special: 'attack_gain_curse' },
    description: '+2 Cards. Each other player gains a Curse.',
    edition: 'both'
  },
  'Bureaucrat': {
    name: 'Bureaucrat',
    type: 'action-attack',
    cost: 4,
    effect: { special: 'gain_silver_attack_topdeck_victory' },
    description: 'Gain a Silver onto your deck. Each other player reveals a Victory card from hand and puts it onto their deck (or reveals hand if no Victory cards).',
    edition: 'both'
  },
  'Spy': {
    name: 'Spy',
    type: 'action-attack',
    cost: 4,
    effect: { cards: 1, actions: 1, special: 'attack_reveal_top_card' },
    description: '+1 Card, +1 Action. Each player (including you) reveals the top card of their deck and discards it or puts it back, your choice.',
    edition: '1st'  // Removed in 2nd edition
  },
  'Thief': {
    name: 'Thief',
    type: 'action-attack',
    cost: 4,
    effect: { special: 'attack_reveal_2_trash_treasure' },
    description: 'Each other player reveals the top 2 cards of their deck. If they revealed any Treasure cards, they trash one of them that you choose. You may gain any or all of these trashed cards. They discard the other revealed cards.',
    edition: '1st'  // Removed in 2nd edition
  },

  // Reaction System
  'Moat': {
    name: 'Moat',
    type: 'action-reaction',
    cost: 2,
    effect: { cards: 2, special: 'reaction_block_attack' },
    description: '+2 Cards. When another player plays an Attack card, you may reveal this from your hand. If you do, you are unaffected by that Attack.',
    edition: 'both'
  },

  // Special Cards
  'Throne Room': {
    name: 'Throne Room',
    type: 'action',
    cost: 4,
    effect: { special: 'play_action_twice' },
    description: 'You may play an Action card from your hand twice.',
    edition: 'both'
  },
  'Adventurer': {
    name: 'Adventurer',
    type: 'action',
    cost: 6,
    effect: { special: 'reveal_until_2_treasures' },
    description: 'Reveal cards from your deck until you reveal 2 Treasure cards. Put those Treasures into your hand and discard the other revealed cards.',
    edition: '1st'  // Removed in 2nd edition
  },
  'Chancellor': {
    name: 'Chancellor',
    type: 'action',
    cost: 3,
    effect: { coins: 2, special: 'may_put_deck_into_discard' },
    description: '+$2. You may immediately put your deck into your discard pile.',
    edition: '1st'  // Removed in 2nd edition
  },
  'Library': {
    name: 'Library',
    type: 'action',
    cost: 5,
    effect: { special: 'draw_to_7_set_aside_actions' },
    description: 'Draw until you have 7 cards in hand. You may set aside any Action cards drawn this way, as you draw them; discard the set aside cards after you finish drawing.',
    edition: 'both'
  },
  'Gardens': {
    name: 'Gardens',
    type: 'victory',
    cost: 4,
    effect: {},
    description: 'Worth 1 VP for every 10 cards in your deck (rounded down).',
    victoryPoints: 0,  // Dynamic - calculated at game end based on deck size
    edition: 'both'
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
  const type = getCard(name).type;
  return type === 'action' || type === 'action-attack' || type === 'action-reaction';
}

export function isTreasureCard(name: CardName): boolean {
  return getCard(name).type === 'treasure';
}

export function isVictoryCard(name: CardName): boolean {
  return getCard(name).type === 'victory';
}

export function isAttackCard(name: CardName): boolean {
  return getCard(name).type === 'action-attack';
}

export function isReactionCard(name: CardName): boolean {
  return getCard(name).type === 'action-reaction';
}

export function getVictoryPoints(name: CardName): number {
  const card = getCard(name);
  return card.victoryPoints || 0;
}

/**
 * Filter kingdom cards by edition
 * @param edition - Which edition to filter by: '1st', '2nd', or 'mixed'
 * @returns Array of card names available in the specified edition
 */
export function getKingdomCardsByEdition(edition: '1st' | '2nd' | 'mixed'): CardName[] {
  const allKingdomCardNames = Object.keys(KINGDOM_CARDS) as CardName[];

  if (edition === 'mixed') {
    return allKingdomCardNames;
  }

  return allKingdomCardNames.filter(cardName => {
    const card = KINGDOM_CARDS[cardName];
    return card.edition === edition || card.edition === 'both';
  });
}