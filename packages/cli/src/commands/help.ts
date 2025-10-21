/**
 * Help Command Implementation
 *
 * Displays detailed information about a specific card, including:
 * - Card name
 * - Cost in coins
 * - Card type (action, treasure, victory, curse)
 * - Effect description
 *
 * Usage: help <card_name> or h <card_name>
 */

import { BASIC_CARDS, KINGDOM_CARDS } from '@principality/core/src/cards';

/**
 * Handle the help command to display card information
 *
 * @param cardName - The name of the card to look up (case-insensitive)
 * @returns Formatted card information or error message
 */
export function handleHelpCommand(cardName: string): string {
  // Validate input
  if (!cardName || cardName.trim() === '') {
    return 'Usage: help <card_name> - Display information about a specific card';
  }

  // Normalize input: case-insensitive lookup
  const normalized = cardName.toLowerCase().trim();
  const allCards = { ...BASIC_CARDS, ...KINGDOM_CARDS };

  // Search for matching card (case-insensitive)
  for (const [name, card] of Object.entries(allCards)) {
    if (name.toLowerCase() === normalized) {
      // Return formatted card info: "Name | Cost | Type | Description"
      return `${name} | ${card.cost} | ${card.type} | ${card.description}`;
    }
  }

  // Card not found
  return `Unknown card: ${cardName}. Type 'cards' to see all available cards.`;
}

/**
 * Handle the h (alias) command - identical to help command
 *
 * @param cardName - The name of the card to look up
 * @returns Formatted card information or error message
 */
export function handleHAliasCommand(cardName: string): string {
  return handleHelpCommand(cardName);
}
