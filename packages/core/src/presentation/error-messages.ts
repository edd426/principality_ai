/**
 * Presentation Layer: Error Messages
 *
 * Error analysis and suggestion generation for invalid moves.
 * Separated from execution logic to keep business logic clean.
 *
 * @module presentation/error-messages
 */

import { Move, GameState } from '../types';
import { getCardCost } from './move-parser';
import { getNextPhaseName } from './move-descriptions';

/**
 * Rejection reason with details for logging/debugging
 */
export interface RejectionReason {
  reason: string;
  details: any;
}

/**
 * Analyze why a move was rejected
 * Used for detailed logging and diagnostics
 *
 * @param move - The rejected move
 * @param validMoves - Array of currently valid moves
 * @param state - Current game state
 * @returns Structured rejection reason with details
 */
export function analyzeRejectionReason(
  move: Move,
  validMoves: readonly Move[],
  state: GameState
): RejectionReason {
  const moveType = move.type;
  const validOfType = validMoves.filter(m => m.type === moveType);

  // Check if there are NO valid moves of this type
  if (validOfType.length === 0) {
    if (moveType === 'buy') {
      const player = state.players[state.currentPlayer];
      return {
        reason: 'No valid purchases available',
        details: {
          playerCoins: player.coins || 0,
          cardCost: move.card ? getCardCost(move.card) : null,
          availableCards: Array.from(state.supply.keys()).slice(0, 5)
        }
      };
    }
    if (moveType === 'play_action') {
      return {
        reason: 'No valid action plays available',
        details: { wrongPhase: state.phase !== 'action' }
      };
    }
    if (moveType === 'play_treasure') {
      return {
        reason: 'No valid treasure plays available',
        details: { phase: state.phase }
      };
    }
  }

  // Move type has valid options but this specific card/move is not valid
  if (moveType === 'buy' && move.card) {
    const player = state.players[state.currentPlayer];
    const cardCost = getCardCost(move.card);
    if (cardCost && player.coins! < cardCost) {
      return {
        reason: 'Insufficient coins',
        details: {
          playerCoins: player.coins,
          cardCost: cardCost,
          deficit: cardCost - (player.coins || 0)
        }
      };
    }
    if (!state.supply.has(move.card)) {
      return {
        reason: 'Card not in supply',
        details: { card: move.card }
      };
    }
    if (state.supply.get(move.card) === 0) {
      return {
        reason: 'Card pile empty',
        details: { card: move.card }
      };
    }
  }

  if ((moveType === 'play_action' || moveType === 'play_treasure') && move.card) {
    const player = state.players[state.currentPlayer];
    if (!player.hand.includes(move.card)) {
      return {
        reason: 'Card not in hand',
        details: { card: move.card, handSize: player.hand.length }
      };
    }
  }

  return {
    reason: 'Unknown rejection reason',
    details: { moveType, card: move.card }
  };
}

/**
 * Generate helpful suggestion for an invalid move
 *
 * @param move - The rejected move
 * @param validMoves - Array of currently valid moves
 * @param state - Current game state
 * @returns Human-readable suggestion string
 */
export function generateSuggestion(
  move: Move,
  validMoves: readonly Move[],
  state: GameState
): string {
  const moveType = move.type;
  const validOfType = validMoves.filter(m => m.type === moveType);

  if (moveType === 'play_action') {
    if (validOfType.length === 0) {
      if (state.phase === 'buy') {
        return `Cannot play action cards in buy phase. You must be in action phase. Try "play_treasure Copper" to play treasures or "buy CARD" to make a purchase.`;
      }
      return `No valid action plays available. Try "end" to move to next phase.`;
    }

    const validCards = validOfType.map(m => m.card).join(', ');
    return `Valid plays: ${validCards}. Use "play 0", "play 1", etc.`;
  }

  if (moveType === 'play_treasure') {
    if (validOfType.length === 0) {
      if (state.phase === 'action') {
        return `Cannot play treasures in action phase. You're in action phase - play action cards or "end" to move to buy phase.`;
      }
      return `No treasures in hand to play. Try "buy CARD" to make a purchase or "end" to move to cleanup.`;
    }

    const validCards = validOfType.map(m => m.card).join(', ');
    return `Valid treasures to play: ${validCards}. Use "play_treasure CARD" format, e.g., "play_treasure Copper"`;
  }

  if (moveType === 'buy') {
    if (validOfType.length === 0) {
      if (state.phase === 'action') {
        return `Cannot buy in action phase. Play action cards or use "end" to move to buy phase.`;
      }
      return `No valid purchases available. You may not have enough coins. Try "end" to move to cleanup phase.`;
    }

    const validCards = validOfType.map(m => m.card).join(', ');
    return `Valid purchases: ${validCards}. Use "buy CARD" format, e.g., "buy Province"`;
  }

  if (moveType === 'end_phase') {
    return `Use "end" to move to the next phase (${getNextPhaseName(state.phase)}).`;
  }

  return 'Use game_observe() to see valid moves.';
}
