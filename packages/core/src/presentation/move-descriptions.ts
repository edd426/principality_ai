/**
 * Presentation Layer: Move Descriptions
 *
 * Canonical move descriptions and command syntax.
 * Single source of truth for displaying moves to users.
 *
 * @module presentation/move-descriptions
 */

import { Move, Phase } from '../types';
import { getCard } from '../cards';

/**
 * Get human-readable description of a move
 * @example getMoveDescription({type: 'buy', card: 'Village'}) → "Buy Village"
 */
export function getMoveDescription(move: Move): string {
  switch (move.type) {
    case 'play_action':
      return `Play ${move.card}`;

    case 'play_treasure':
      return `Play ${move.card}`;

    case 'play_all_treasures':
      return 'Play all treasures';

    case 'buy':
      return `Buy ${move.card}`;

    case 'end_phase':
      return 'End Phase';

    case 'discard_for_cellar':
      return 'Discard cards for Cellar';

    default:
      return 'Unknown move';
  }
}

/**
 * Get compact move description with card cost for buying
 * Used in CLI menu display
 * @example getMoveDescriptionCompact({type: 'buy', card: 'Village'}) → "Buy Village ($3)"
 */
export function getMoveDescriptionCompact(move: Move): string {
  switch (move.type) {
    case 'play_action':
      return `Play ${move.card}`;

    case 'play_treasure':
      return `Play ${move.card}`;

    case 'buy':
      try {
        const card = getCard(move.card!);
        return `Buy ${move.card} ($${card.cost})`;
      } catch {
        return `Buy ${move.card}`;
      }

    case 'end_phase':
      return 'End Phase';

    case 'discard_for_cellar':
      return 'Discard cards for Cellar';

    default:
      return 'Unknown move';
  }
}

/**
 * Get command syntax for executing a move
 * Used by MCP to show users how to execute moves
 * @example getMoveCommand({type: 'buy', card: 'Village'}) → "buy Village"
 */
export function getMoveCommand(move: Move): string {
  switch (move.type) {
    case 'play_action':
      return `play_action ${move.card}`;

    case 'play_treasure':
      return `play_treasure ${move.card}`;

    case 'play_all_treasures':
      return 'play_treasure all';

    case 'buy':
      return `buy ${move.card}`;

    case 'end_phase':
      return 'end';

    default:
      return move.type;
  }
}

/**
 * Get example commands for a given phase
 * Used in error messages to guide users
 */
export function getMoveExamples(phase: Phase): string[] {
  switch (phase) {
    case 'action':
      return [
        '"play 0" (play card at index 0)',
        '"play_action Village"',
        '"end" (move to buy phase)'
      ];

    case 'buy':
      return [
        '"play_treasure Copper"',
        '"play_treasure all" (play all treasures)',
        '"buy Province"',
        '"end" (move to cleanup)'
      ];

    case 'cleanup':
      return [
        '"end" (end turn)'
      ];

    default:
      return ['"end"'];
  }
}

/**
 * Get next phase name for display
 */
export function getNextPhaseName(currentPhase: Phase): string {
  switch (currentPhase) {
    case 'action':
      return 'buy phase';
    case 'buy':
      return 'cleanup phase';
    case 'cleanup':
      return "next player's action phase";
    default:
      return 'next phase';
  }
}
