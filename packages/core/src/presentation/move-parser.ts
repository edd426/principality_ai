/**
 * Presentation Layer: Move Parser
 *
 * Unified move parsing for both CLI and MCP interfaces.
 * Supports multiple input formats:
 * - Indexed: "0", "1", "2" (CLI)
 * - Named: "play_action Village", "buy Province" (MCP)
 * - Natural: "play Village", "buy Province" (both)
 * - Special: "end", "treasures" (both)
 *
 * @blocker: Missing parsers for pending effect commands
 * Issue: formatMoveCommand() in move-options.ts generates commands like:
 *   - "select_treasure_to_trash Silver"
 *   - "gain_card Gold"
 *   - "trash_cards Copper,Estate"
 * But parseMove() cannot parse these - returns "Cannot parse move" error
 * Fix: Add handlers for all 9 pending effect command types (see tests)
 * Tests: packages/core/tests/move-parser-pending-effects.test.ts (44/50 failing)
 * Impact: MCP server cannot parse pending effect commands
 *
 * @module presentation/move-parser
 */

import { Move, GameState, CardName } from '../types';
import { isActionCard, isTreasureCard, getCard } from '../cards';

/**
 * Parse result for move parsing
 */
export interface ParseMoveResult {
  success: boolean;
  move?: Move;
  error?: string;
}

/**
 * Parse a move string into a Move object
 *
 * Supports multiple formats:
 * - "play 0" - Play card at index 0
 * - "play_action Village" - Play Village action
 * - "play_treasure Copper" - Play Copper treasure
 * - "play_treasure all" - Play all treasures
 * - "buy Province" - Buy Province
 * - "end" - End current phase
 *
 * @param moveStr - Input string to parse
 * @param state - Current game state (for hand validation)
 * @returns ParseMoveResult with move or error
 */
export function parseMove(moveStr: string, state: GameState): ParseMoveResult {
  const trimmed = moveStr.toLowerCase().trim();
  const player = state.players[state.currentPlayer];

  // Parse "play N" or "play_action N" - determine actual card type
  if (trimmed.startsWith('play ')) {
    const indexStr = trimmed.substring(5).trim();
    const index = parseInt(indexStr);

    if (!isNaN(index) && index >= 0 && index < player.hand.length) {
      const cardName = player.hand[index];

      // Determine actual move type based on card type
      if (isActionCard(cardName)) {
        return {
          success: true,
          move: {
            type: 'play_action',
            card: cardName
          }
        };
      } else if (isTreasureCard(cardName)) {
        return {
          success: true,
          move: {
            type: 'play_treasure',
            card: cardName
          }
        };
      }
      // Unknown card type
      return {
        success: false,
        error: `Card at index ${index} (${cardName}) is not playable`
      };
    }
    return {
      success: false,
      error: `Invalid index: ${indexStr}. Must be 0-${player.hand.length - 1}`
    };
  }

  // Parse "play_action CARD" syntax
  if (trimmed.startsWith('play_action ')) {
    const cardName = trimmed.substring('play_action '.length).trim();
    const normalizedName = capitalizeCardName(cardName);

    if (player.hand.includes(normalizedName) && isActionCard(normalizedName)) {
      return {
        success: true,
        move: {
          type: 'play_action',
          card: normalizedName
        }
      };
    }
    return {
      success: false,
      error: `Cannot play action "${normalizedName}": not in hand or not an action card`
    };
  }

  // Parse "play_treasure all" - batch play all treasures
  if (trimmed === 'play_treasure all' || trimmed === 'play treasure all') {
    return {
      success: true,
      move: {
        type: 'play_all_treasures'
      }
    };
  }

  // Parse "play_treasure CARD" or "play treasure CARD"
  if (trimmed.startsWith('play_treasure ') || trimmed.startsWith('play treasure ')) {
    const cardName = trimmed.includes('_')
      ? trimmed.substring('play_treasure '.length).trim()
      : trimmed.substring('play treasure '.length).trim();

    const normalizedName = capitalizeCardName(cardName);

    if (player.hand.includes(normalizedName)) {
      return {
        success: true,
        move: {
          type: 'play_treasure',
          card: normalizedName
        }
      };
    }
    return {
      success: false,
      error: `Cannot play treasure "${normalizedName}": not in hand`
    };
  }

  // Parse "buy CARD"
  if (trimmed.startsWith('buy ')) {
    const cardName = trimmed.substring(4).trim();
    const normalizedName = capitalizeCardName(cardName);

    if (state.supply.has(normalizedName)) {
      return {
        success: true,
        move: {
          type: 'buy',
          card: normalizedName
        }
      };
    }
    return {
      success: false,
      error: `Cannot buy "${normalizedName}": not in supply`
    };
  }

  // Parse "end" or "end phase"
  if (trimmed === 'end' || trimmed === 'end phase' || trimmed === 'end_phase') {
    return {
      success: true,
      move: {
        type: 'end_phase'
      }
    };
  }

  return {
    success: false,
    error: `Cannot parse move: "${moveStr}". Invalid format.`
  };
}

/**
 * Capitalize card name (e.g., "village" → "Village")
 * Handles multi-word cards like "Throne Room"
 */
function capitalizeCardName(name: string): CardName {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Check if a parsed move is valid against available moves
 *
 * @param move - Parsed move to validate
 * @param validMoves - Array of currently valid moves
 * @returns true if move is in validMoves list
 */
export function isMoveValid(move: Move, validMoves: readonly Move[]): boolean {
  return validMoves.some(vm =>
    vm.type === move.type && vm.card === move.card
  );
}

/**
 * Get card cost (wrapper around getCard for convenience)
 * Returns null if card doesn't exist
 */
export function getCardCost(cardName: CardName | undefined): number | null {
  if (!cardName) return null;

  try {
    const card = getCard(cardName);
    return card.cost;
  } catch {
    return null;
  }
}
