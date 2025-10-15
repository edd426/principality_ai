/**
 * Stable Number Mapping for Cards
 *
 * These numbers never change across turns/phases, making it easier for AI agents
 * to learn consistent strategies.
 *
 * Reference: STABLE_NUMBER_REFERENCE.md
 */

import { CardName } from '@principality/core';

/**
 * Action Cards: 1-10 (alphabetically sorted)
 */
const ACTION_CARD_NUMBERS: Record<string, number> = {
  'Cellar': 1,
  'Council Room': 2,
  'Festival': 3,
  'Laboratory': 4,
  'Market': 5,
  'Smithy': 6,
  'Village': 7,
  'Woodcutter': 8
};

/**
 * Treasure Cards: 11-13 (by value)
 */
const TREASURE_CARD_NUMBERS: Record<string, number> = {
  'Copper': 11,
  'Silver': 12,
  'Gold': 13
};

/**
 * Buy Moves: 21-34 (alphabetically sorted)
 */
const BUY_MOVE_NUMBERS: Record<string, number> = {
  'Buy Copper': 21,
  'Buy Silver': 22,
  'Buy Gold': 23,
  'Buy Estate': 24,
  'Buy Duchy': 25,
  'Buy Province': 26,
  'Buy Cellar': 27,
  'Buy Council Room': 28,
  'Buy Festival': 29,
  'Buy Laboratory': 30,
  'Buy Market': 31,
  'Buy Smithy': 32,
  'Buy Village': 33,
  'Buy Woodcutter': 34
};

/**
 * Special Moves: 50+
 */
const SPECIAL_MOVE_NUMBERS: Record<string, number> = {
  'End Phase': 50
};

/**
 * Complete stable number mapping
 */
export const STABLE_NUMBERS: Record<string, number> = {
  ...ACTION_CARD_NUMBERS,
  ...TREASURE_CARD_NUMBERS,
  ...BUY_MOVE_NUMBERS,
  ...SPECIAL_MOVE_NUMBERS
};

/**
 * Reverse lookup: number to move description
 */
export const NUMBER_TO_MOVE: Record<number, string> = Object.fromEntries(
  Object.entries(STABLE_NUMBERS).map(([move, num]) => [num, move])
);

/**
 * Get stable number for a move description
 */
export function getStableNumber(moveDescription: string): number | null {
  return STABLE_NUMBERS[moveDescription] ?? null;
}

/**
 * Get move description from stable number
 */
export function getMoveFromNumber(num: number): string | null {
  return NUMBER_TO_MOVE[num] ?? null;
}

/**
 * Check if a number is a valid stable number
 */
export function isValidStableNumber(num: number): boolean {
  return num in NUMBER_TO_MOVE;
}

/**
 * Get help text for stable numbering
 */
export function getStableNumberHelp(): string {
  return `
Stable Number Reference:
  Actions:     1-10  (alphabetical)
  Treasures:   11-13 (by value)
  Buy Moves:   21-34 (alphabetical)
  End Phase:   50

Common Actions:
  [7] Village      [6] Smithy      [5] Market
  [4] Laboratory   [3] Festival    [2] Council Room

Common Buys:
  [33] Buy Village   [32] Buy Smithy   [31] Buy Market
  [26] Buy Province  [25] Buy Duchy    [24] Buy Estate
  [22] Buy Silver    [21] Buy Copper

Type a stable number (e.g., "7" for Village) to select that move.
`;
}
