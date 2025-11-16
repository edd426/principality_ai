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

    case 'trash_cards':
      if (move.cards && move.cards.length > 0) {
        return `Trash ${move.cards.join(', ')}`;
      }
      return 'Trash cards';

    case 'gain_card':
      return move.card ? `Gain ${move.card}` : 'Gain card';

    case 'reveal_reaction':
      return move.card ? `Reveal ${move.card}` : 'Reveal reaction';

    case 'discard_to_hand_size':
      if (move.cards && move.cards.length > 0) {
        return `Discard ${move.cards.join(', ')} to hand size`;
      }
      return 'Discard to hand size';

    case 'reveal_and_topdeck':
      return move.card ? `Topdeck ${move.card}` : 'Topdeck victory card';

    case 'spy_decision':
      return move.choice ? 'Discard revealed card' : 'Keep revealed card on top';

    case 'select_treasure_to_trash':
      return move.card ? `Trash ${move.card}` : 'Select treasure to trash';

    case 'gain_trashed_card':
      return move.card ? `Gain ${move.card} from trash` : 'Gain trashed treasure';

    case 'select_action_for_throne':
      return move.card ? `Play ${move.card} twice` : 'Select action for Throne Room';

    case 'chancellor_decision':
      return move.choice ? 'Shuffle deck into discard' : 'Keep deck as is';

    case 'library_set_aside':
      return move.cards && move.cards.length > 0
        ? `Set aside ${move.cards[0]}`
        : 'Set aside action card';

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

    case 'play_all_treasures':
      return 'Play all treasures';

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
      if (!move.cards) {
        return 'Discard cards for Cellar';
      }
      return move.cards.length > 0
        ? `Discard: ${move.cards.join(', ')}`
        : 'Discard nothing';

    case 'trash_cards':
      return move.cards && move.cards.length > 0
        ? `Trash: ${move.cards.join(', ')}`
        : 'Trash cards';

    case 'gain_card':
      if (move.card) {
        try {
          const card = getCard(move.card);
          return `Gain: ${move.card} ($${card.cost})`;
        } catch {
          return `Gain: ${move.card}`;
        }
      }
      return 'Gain card';

    case 'select_treasure_to_trash':
      return move.card
        ? `Trash: ${move.card}`
        : 'Select treasure to trash';

    case 'library_set_aside':
      return move.cards && move.cards.length > 0
        ? `Set aside: ${move.cards[0]}`
        : 'Set aside action card';

    case 'select_action_for_throne':
      return move.card
        ? `Play twice: ${move.card}`
        : 'Select action for Throne Room';

    case 'chancellor_decision':
      return move.choice
        ? 'Shuffle deck into discard'
        : 'Keep deck as is';

    case 'spy_decision':
      return move.choice
        ? 'Discard revealed card'
        : 'Keep revealed card on top';

    case 'reveal_and_topdeck':
      return move.card
        ? `Topdeck: ${move.card}`
        : 'Topdeck victory card';

    case 'discard_to_hand_size':
      if (move.cards && move.cards.length > 0) {
        return `Discard to hand size: ${move.cards.join(', ')}`;
      }
      return 'Discard to hand size';

    case 'reveal_reaction':
      return move.card ? `Reveal ${move.card}` : 'Reveal reaction';

    case 'gain_trashed_card':
      if (move.card) {
        try {
          const card = getCard(move.card);
          return `Gain from trash: ${move.card} ($${card.cost})`;
        } catch {
          return `Gain from trash: ${move.card}`;
        }
      }
      return 'Gain trashed treasure';

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

    case 'discard_for_cellar':
      return move.cards && move.cards.length > 0
        ? `discard_for_cellar ${move.cards.join(',')}`
        : 'discard_for_cellar';

    case 'trash_cards':
      return move.cards && move.cards.length > 0
        ? `trash_cards ${move.cards.join(',')}`
        : 'trash_cards';

    case 'gain_card':
      return move.card ? `gain_card ${move.card}` : 'gain_card';

    case 'reveal_reaction':
      return move.card ? `reveal_reaction ${move.card}` : 'reveal_reaction';

    case 'discard_to_hand_size':
      return move.cards && move.cards.length > 0
        ? `discard_to_hand_size ${move.cards.join(',')}`
        : 'discard_to_hand_size';

    case 'reveal_and_topdeck':
      return move.card ? `reveal_and_topdeck ${move.card}` : 'reveal_and_topdeck';

    case 'spy_decision':
      return `spy_decision ${move.choice ? 'yes' : 'no'}`;

    case 'select_treasure_to_trash':
      return move.card ? `select_treasure_to_trash ${move.card}` : 'select_treasure_to_trash';

    case 'gain_trashed_card':
      return move.card ? `gain_trashed_card ${move.card}` : 'gain_trashed_card';

    case 'select_action_for_throne':
      return move.card ? `select_action_for_throne ${move.card}` : 'select_action_for_throne';

    case 'chancellor_decision':
      return `chancellor_decision ${move.choice ? 'yes' : 'no'}`;

    case 'library_set_aside':
      return move.cards && move.cards.length > 0
        ? `library_set_aside ${move.cards[0]}`
        : 'library_set_aside';

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
