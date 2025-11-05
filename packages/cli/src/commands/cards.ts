/**
 * Cards Command Implementation
 *
 * Displays a formatted table of all available cards with:
 * - All 32 cards (25 kingdom + 7 base) - Phase 4
 * - Sorted by type (action, treasure, victory, curse), then by cost, then by name
 * - Columns: Name, Cost, Type, Effect Description
 *
 * Usage: cards (no arguments)
 *
 * @resolved(commit:this): Fixed sorting for action-attack and action-reaction cards
 * Added these types to typeOrder map so they sort with action cards (cost ascending)
 */

import { BASIC_CARDS, KINGDOM_CARDS } from '@principality/core';

/**
 * Handle the cards command to display all available cards in a table format
 *
 * @returns Formatted table of all cards
 */
export function handleCardsCommand(): string {
  const allCards = { ...BASIC_CARDS, ...KINGDOM_CARDS };

  // Define sort order for card types
  // Note: action-attack and action-reaction cards are grouped with action cards
  const typeOrder: Record<string, number> = {
    'action': 0,
    'action-attack': 0,
    'action-reaction': 0,
    'treasure': 1,
    'victory': 2,
    'curse': 3
  };

  // Sort by type, then cost, then name
  const sortedCards = Object.values(allCards).sort((a, b) => {
    // First, sort by type
    const aOrder = typeOrder[a.type] ?? 999; // Unknown types go to end
    const bOrder = typeOrder[b.type] ?? 999;
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    // Within same type, sort by cost
    if (a.cost !== b.cost) {
      return a.cost - b.cost;
    }

    // Within same type and cost, sort by name
    return a.name.localeCompare(b.name);
  });

  // Format as table
  const header = '=== AVAILABLE CARDS ===';
  const columnHeader = 'Name          | Cost | Type     | Effect';
  const separator = '--------------|------|----------|------------------------------------------';

  // Format each card row with proper padding
  const rows = sortedCards.map(card => {
    // Pad name to 14 characters
    const name = card.name.padEnd(14);
    // Right-align cost to 4 characters
    const cost = String(card.cost).padStart(4);
    // Pad type to 9 characters (longest is "treasure" = 8 chars)
    const type = card.type.padEnd(9);
    // Description follows (with spaces before pipes to match column headers)
    return `${name} | ${cost} | ${type} | ${card.description}`;
  });

  // Combine all parts
  return [header, '', columnHeader, separator, ...rows].join('\n');
}
