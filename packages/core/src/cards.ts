import { Card, CardName } from './types';

export type { Card } from './types';

export const BASIC_CARDS: Record<CardName, Card> = {
  // Basic Treasures
  'Copper': {
    name: 'Copper',
    type: 'treasure',
    cost: 0,
    effect: { coins: 1 },
    description: 'Worth 1 coin'
  },
  'Silver': {
    name: 'Silver',
    type: 'treasure',
    cost: 3,
    effect: { coins: 2 },
    description: 'Worth 2 coins'
  },
  'Gold': {
    name: 'Gold',
    type: 'treasure',
    cost: 6,
    effect: { coins: 3 },
    description: 'Worth 3 coins'
  },

  // Victory Cards
  'Estate': {
    name: 'Estate',
    type: 'victory',
    cost: 2,
    effect: {},
    description: 'Worth 1 VP',
    victoryPoints: 1
  },
  'Duchy': {
    name: 'Duchy',
    type: 'victory',
    cost: 5,
    effect: {},
    description: 'Worth 3 VP',
    victoryPoints: 3
  },
  'Province': {
    name: 'Province',
    type: 'victory',
    cost: 8,
    effect: {},
    description: 'Worth 6 VP',
    victoryPoints: 6
  },

  // Curse
  'Curse': {
    name: 'Curse',
    type: 'curse',
    cost: 0,
    effect: {},
    description: 'Worth -1 VP',
    victoryPoints: -1
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
    description: '+1 Card, +1 Action, +1 Buy, +1 Coin'
  },
  'Woodcutter': {
    name: 'Woodcutter',
    type: 'action',
    cost: 3,
    effect: { coins: 2, buys: 1 },
    description: '+1 Buy, +2 Coins'
  },
  'Festival': {
    name: 'Festival',
    type: 'action',
    cost: 5,
    effect: { actions: 2, coins: 2, buys: 1 },
    description: '+2 Actions, +1 Buy, +2 Coins'
  },

  // Utility Cards
  'Council Room': {
    name: 'Council Room',
    type: 'action',
    cost: 5,
    effect: { cards: 4, buys: 1, special: 'each_other_player_draws_1' },
    description: '+4 Cards, +1 Buy. Each other player draws 1 card.'
  },
  'Cellar': {
    name: 'Cellar',
    type: 'action',
    cost: 2,
    effect: { actions: 1, special: 'discard_draw' },
    description: '+1 Action, Discard any number of cards, then draw that many'
  },

  // Trashing System (4 cards)
  'Chapel': {
    name: 'Chapel',
    type: 'action',
    cost: 2,
    effect: { special: 'trash_up_to_4' },
    description: 'Trash up to 4 cards from your hand'
  },
  'Remodel': {
    name: 'Remodel',
    type: 'action',
    cost: 4,
    effect: { special: 'trash_and_gain' },
    description: 'Trash a card from your hand. Gain a card costing up to $2 more.'
  },
  'Mine': {
    name: 'Mine',
    type: 'action',
    cost: 5,
    effect: { special: 'trash_treasure_gain_treasure' },
    description: 'Trash a Treasure from your hand. Gain a Treasure costing up to $3 more, to your hand.'
  },
  'Moneylender': {
    name: 'Moneylender',
    type: 'action',
    cost: 4,
    effect: { special: 'trash_copper_gain_coins' },
    description: 'Trash a Copper from your hand. If you did, +$3.'
  },

  // Gaining System (2 cards)
  'Workshop': {
    name: 'Workshop',
    type: 'action',
    cost: 3,
    effect: { special: 'gain_card_up_to_4' },
    description: 'Gain a card costing up to $4.'
  },
  'Feast': {
    name: 'Feast',
    type: 'action',
    cost: 4,
    effect: { special: 'trash_self_gain_card' },
    description: 'Trash this card. Gain a card costing up to $5.'
  },

  // Attack System (5 cards)
  'Militia': {
    name: 'Militia',
    type: 'action-attack',
    cost: 4,
    effect: { coins: 2, special: 'attack_discard_to_3' },
    description: '+$2. Each other player discards down to 3 cards in hand.'
  },
  'Witch': {
    name: 'Witch',
    type: 'action-attack',
    cost: 5,
    effect: { cards: 2, special: 'attack_gain_curse' },
    description: '+2 Cards. Each other player gains a Curse.'
  },
  'Bureaucrat': {
    name: 'Bureaucrat',
    type: 'action-attack',
    cost: 4,
    effect: { special: 'gain_silver_attack_topdeck_victory' },
    description: 'Gain a Silver onto your deck. Each other player reveals a Victory card from hand and puts it onto their deck (or reveals hand if no Victory cards).'
  },
  'Spy': {
    name: 'Spy',
    type: 'action-attack',
    cost: 4,
    effect: { cards: 1, actions: 1, special: 'attack_reveal_top_card' },
    description: '+1 Card, +1 Action. Each player (including you) reveals the top card of their deck and discards it or puts it back, your choice.'
  },
  'Thief': {
    name: 'Thief',
    type: 'action-attack',
    cost: 4,
    effect: { special: 'attack_reveal_2_trash_treasure' },
    description: 'Each other player reveals the top 2 cards of their deck. If they revealed any Treasure cards, they trash one of them that you choose. You may gain any or all of these trashed cards. They discard the other revealed cards.'
  },

  // Reaction System (1 card)
  'Moat': {
    name: 'Moat',
    type: 'action-reaction',
    cost: 2,
    effect: { cards: 2, special: 'reaction_block_attack' },
    description: '+2 Cards. When another player plays an Attack card, you may reveal this from your hand. If you do, you are unaffected by that Attack.'
  },

  // Special Cards (5 cards)
  'Throne Room': {
    name: 'Throne Room',
    type: 'action',
    cost: 4,
    effect: { special: 'play_action_twice' },
    description: 'You may play an Action card from your hand twice.'
  },
  'Adventurer': {
    name: 'Adventurer',
    type: 'action',
    cost: 6,
    effect: { special: 'reveal_until_2_treasures' },
    description: 'Reveal cards from your deck until you reveal 2 Treasure cards. Put those Treasures into your hand and discard the other revealed cards.'
  },
  'Chancellor': {
    name: 'Chancellor',
    type: 'action',
    cost: 3,
    effect: { coins: 2, special: 'may_put_deck_into_discard' },
    description: '+$2. You may immediately put your deck into your discard pile.'
  },
  'Library': {
    name: 'Library',
    type: 'action',
    cost: 5,
    effect: { special: 'draw_to_7_set_aside_actions' },
    description: 'Draw until you have 7 cards in hand. You may set aside any Action cards drawn this way, as you draw them; discard the set aside cards after you finish drawing.'
  },
  'Gardens': {
    name: 'Gardens',
    type: 'victory',
    cost: 4,
    effect: {},
    description: 'Worth 1 VP for every 10 cards in your deck (rounded down).',
    victoryPoints: 0  // Dynamic - calculated at game end based on deck size
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