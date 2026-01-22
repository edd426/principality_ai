/**
 * Card data for the web UI
 *
 * This is a simplified version of the core card data,
 * containing only the fields needed for display purposes.
 */

export interface CardInfo {
  name: string;
  type: 'treasure' | 'victory' | 'action' | 'curse' | 'action-attack' | 'action-reaction';
  cost: number;
}

const CARD_DATA: Record<string, CardInfo> = {
  // Basic Treasures
  'Copper': { name: 'Copper', type: 'treasure', cost: 0 },
  'Silver': { name: 'Silver', type: 'treasure', cost: 3 },
  'Gold': { name: 'Gold', type: 'treasure', cost: 6 },

  // Victory Cards
  'Estate': { name: 'Estate', type: 'victory', cost: 2 },
  'Duchy': { name: 'Duchy', type: 'victory', cost: 5 },
  'Province': { name: 'Province', type: 'victory', cost: 8 },

  // Curse
  'Curse': { name: 'Curse', type: 'curse', cost: 0 },

  // Kingdom Cards - Draw
  'Village': { name: 'Village', type: 'action', cost: 3 },
  'Smithy': { name: 'Smithy', type: 'action', cost: 4 },
  'Laboratory': { name: 'Laboratory', type: 'action', cost: 5 },

  // Kingdom Cards - Economy
  'Market': { name: 'Market', type: 'action', cost: 5 },
  'Woodcutter': { name: 'Woodcutter', type: 'action', cost: 3 },
  'Festival': { name: 'Festival', type: 'action', cost: 5 },

  // Kingdom Cards - Utility
  'Council Room': { name: 'Council Room', type: 'action', cost: 5 },
  'Cellar': { name: 'Cellar', type: 'action', cost: 2 },

  // Kingdom Cards - Trashing
  'Chapel': { name: 'Chapel', type: 'action', cost: 2 },
  'Remodel': { name: 'Remodel', type: 'action', cost: 4 },
  'Mine': { name: 'Mine', type: 'action', cost: 5 },
  'Moneylender': { name: 'Moneylender', type: 'action', cost: 4 },

  // Kingdom Cards - Gaining
  'Workshop': { name: 'Workshop', type: 'action', cost: 3 },
  'Feast': { name: 'Feast', type: 'action', cost: 4 },

  // Kingdom Cards - Attack
  'Militia': { name: 'Militia', type: 'action-attack', cost: 4 },
  'Witch': { name: 'Witch', type: 'action-attack', cost: 5 },
  'Bureaucrat': { name: 'Bureaucrat', type: 'action-attack', cost: 4 },
  'Spy': { name: 'Spy', type: 'action-attack', cost: 4 },
  'Thief': { name: 'Thief', type: 'action-attack', cost: 4 },

  // Kingdom Cards - Reaction
  'Moat': { name: 'Moat', type: 'action-reaction', cost: 2 },

  // Kingdom Cards - Special
  'Throne Room': { name: 'Throne Room', type: 'action', cost: 4 },
  'Adventurer': { name: 'Adventurer', type: 'action', cost: 6 },
  'Chancellor': { name: 'Chancellor', type: 'action', cost: 3 },
  'Library': { name: 'Library', type: 'action', cost: 5 },
  'Gardens': { name: 'Gardens', type: 'victory', cost: 4 },
};

/**
 * Get card info by name
 */
export function getCardInfo(name: string): CardInfo {
  const card = CARD_DATA[name];
  if (!card) {
    // Return a default for unknown cards
    return { name, type: 'action', cost: 0 };
  }
  return card;
}

/**
 * Get card type color class for styling
 */
export function getCardTypeColor(type: string): string {
  switch (type) {
    case 'treasure':
      return 'bg-card-treasure text-gray-900';
    case 'victory':
      return 'bg-card-victory text-gray-900';
    case 'action':
      return 'bg-card-action text-gray-900';
    case 'action-attack':
      return 'bg-card-attack text-gray-900';
    case 'action-reaction':
      return 'bg-card-reaction text-gray-900';
    case 'curse':
      return 'bg-card-curse text-white';
    default:
      return 'bg-gray-200 text-gray-900';
  }
}
