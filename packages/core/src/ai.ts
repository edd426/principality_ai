import { GameState, Move, CardName } from './types';
import { getCard, isActionCard, isTreasureCard, isVictoryCard } from './cards';
import { SeededRandom } from './utils';

export interface AIDecision {
  move: Move;
  reasoning: string;
}

export class RulesBasedAI {
  private random: SeededRandom;
  private seed: string;

  constructor(seed: string) {
    this.seed = seed;
    this.random = new SeededRandom(seed);
  }

  /**
   * Decide the best move for a given game state using Big Money strategy
   * @param gameState Current game state
   * @param playerIndex Which player is making the decision
   * @returns The best move and reasoning
   */
  decideBestMove(gameState: GameState, playerIndex: number): AIDecision {
    const player = gameState.players[playerIndex];

    switch (gameState.phase) {
      case 'action':
        return this.decideActionPhase(gameState, playerIndex, player);
      case 'buy':
        return this.decideBuyPhase(gameState, playerIndex, player);
      case 'cleanup':
        return {
          move: { type: 'end_phase' },
          reasoning: 'Cleanup phase - end turn'
        };
      default:
        return {
          move: { type: 'end_phase' },
          reasoning: 'Unknown phase'
        };
    }
  }

  private decideActionPhase(gameState: GameState, playerIndex: number, player: any): AIDecision {
    // Strategy: Village > Smithy > other actions > end_phase
    const actionCards = player.hand.filter((card: CardName) => isActionCard(card));

    // Prioritize Village (enables more actions)
    if (actionCards.includes('Village')) {
      return {
        move: { type: 'play_action', card: 'Village' },
        reasoning: 'Village enables more actions (+2 actions, +1 card)'
      };
    }

    // Then Smithy (draw 3 cards)
    if (actionCards.includes('Smithy')) {
      return {
        move: { type: 'play_action', card: 'Smithy' },
        reasoning: 'Smithy draws cards (+3 cards)'
      };
    }

    // Play any other action cards
    if (actionCards.length > 0) {
      return {
        move: { type: 'play_action', card: actionCards[0] },
        reasoning: `Play ${actionCards[0]} for its effect`
      };
    }

    // No action cards, end phase
    return {
      move: { type: 'end_phase' },
      reasoning: 'No action cards in hand'
    };
  }

  private decideBuyPhase(gameState: GameState, playerIndex: number, player: any): AIDecision {
    const player_state = gameState.players[playerIndex];

    // First, check if we should play treasures to increase coins
    const treasureCards = player_state.hand.filter((card: CardName) => isTreasureCard(card));

    // If we have treasure cards and haven't played them all, play them
    // This is implicit in the strategy - we always play treasures before buying
    if (treasureCards.length > 0) {
      // Find the first treasure not yet in play
      const inPlayTreasures = new Set(player_state.inPlay.filter((c: CardName) => isTreasureCard(c)));
      const unplayedTreasure = treasureCards.find((card: CardName) => !inPlayTreasures.has(card));

      if (unplayedTreasure) {
        return {
          move: { type: 'play_treasure', card: unplayedTreasure },
          reasoning: `Play ${unplayedTreasure} for coins`
        };
      }
    }

    // Now decide what to buy
    if (player_state.buys <= 0) {
      return {
        move: { type: 'end_phase' },
        reasoning: 'No buys remaining'
      };
    }

    // Check game state for endgame detection
    const emptyPiles = Array.from(gameState.supply.values()).filter(count => count === 0).length;
    const isEndgame = emptyPiles >= 2 || (gameState.supply.get('Province') || 0) <= 2;

    // Big Money strategy
    if (player_state.coins >= 6 && (gameState.supply.get('Gold') || 0) > 0) {
      return {
        move: { type: 'buy', card: 'Gold' },
        reasoning: 'Big Money: Gold (6 coins) increases coin generation'
      };
    }

    if (player_state.coins >= 8 && (gameState.supply.get('Province') || 0) > 0 && isEndgame) {
      return {
        move: { type: 'buy', card: 'Province' },
        reasoning: 'Endgame: Buy Province for victory points'
      };
    }

    if (player_state.coins >= 3 && (gameState.supply.get('Silver') || 0) > 0) {
      return {
        move: { type: 'buy', card: 'Silver' },
        reasoning: 'Big Money: Silver (3 coins) improves hand'
      };
    }

    if (player_state.coins >= 5 && (gameState.supply.get('Duchy') || 0) > 0 && isEndgame) {
      return {
        move: { type: 'buy', card: 'Duchy' },
        reasoning: 'Endgame: Buy Duchy for 3 VP'
      };
    }

    if (player_state.coins >= 8 && (gameState.supply.get('Province') || 0) > 0) {
      return {
        move: { type: 'buy', card: 'Province' },
        reasoning: 'Buy Province for 6 VP'
      };
    }

    // Fallback: end phase if no good purchases
    return {
      move: { type: 'end_phase' },
      reasoning: 'No profitable purchases available'
    };
  }

  /**
   * Get valid moves for a specific player (used for validation)
   */
  getValidMoves(gameState: GameState, playerIndex: number): Move[] {
    const player = gameState.players[playerIndex];
    const moves: Move[] = [];

    switch (gameState.phase) {
      case 'action':
        if (player.actions > 0) {
          const actionCards = player.hand.filter((card: CardName) => isActionCard(card));
          actionCards.forEach(card => {
            moves.push({ type: 'play_action', card });
          });
        }
        const treasureCards = player.hand.filter((card: CardName) => isTreasureCard(card));
        treasureCards.forEach(card => {
          moves.push({ type: 'play_treasure', card });
        });
        moves.push({ type: 'end_phase' });
        break;

      case 'buy':
        const treasures = player.hand.filter((card: CardName) => isTreasureCard(card));
        treasures.forEach(card => {
          moves.push({ type: 'play_treasure', card });
        });

        if (player.buys > 0) {
          for (const [cardName, count] of gameState.supply) {
            if (count > 0 && player.coins >= getCard(cardName).cost) {
              moves.push({ type: 'buy', card: cardName });
            }
          }
        }

        moves.push({ type: 'end_phase' });
        break;

      case 'cleanup':
        moves.push({ type: 'end_phase' });
        break;
    }

    return moves;
  }
}
