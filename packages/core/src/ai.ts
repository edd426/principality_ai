import { GameState, Move, CardName } from './types';
import { isActionCard, isTreasureCard } from './cards';

// @resolved(commit:this): Fixed Province purchase logic at 8 coins
// Added fallback (lines 143-150) to buy Province when Gold unavailable
// Prevents wasting 8 coins by returning end_phase
// Tests UT-AI-DECISION-32 and UT-AI-DECISION-33 now pass

export interface AIDecision {
  move: Move;
  reasoning: string;
}

export class RulesBasedAI {
  constructor(_seed: string) {
    // Seed parameter reserved for future use (deterministic decisions)
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

  private decideActionPhase(_gameState: GameState, _playerIndex: number, player: any): AIDecision {
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

  private decideBuyPhase(gameState: GameState, playerIndex: number, _player: any): AIDecision {
    const player_state = gameState.players[playerIndex];

    // @blocker-fix: FR 3.1, FR 3.2 - Play ALL treasures before purchase decisions
    // Strategy: Check if hand contains treasures (ANY cards, counting duplicates)
    // If yes, play the first one. This handles duplicates correctly.
    const treasureCards = player_state.hand.filter((card: CardName) => isTreasureCard(card));

    // If hand contains treasures, ALWAYS play one
    // We don't track "which treasures have been played" because that fails with duplicates
    // Instead, we simply check "are there treasures in hand?" on each decision cycle
    if (treasureCards.length > 0) {
      // Play the first treasure in hand
      const treasureToPlay = treasureCards[0];
      return {
        move: { type: 'play_treasure', card: treasureToPlay },
        reasoning: `Play ${treasureToPlay} for coins`
      };
    }

    // Now decide what to buy (only reached when hand has NO treasures)
    if (player_state.buys <= 0) {
      return {
        move: { type: 'end_phase' },
        reasoning: 'No buys remaining'
      };
    }

    // Check game state for mid-game and endgame detection
    const emptyPiles = Array.from(gameState.supply.values()).filter(count => count === 0).length;
    const provincesLeft = gameState.supply.get('Province') || 0;

    // Mid-game: Start buying victory points
    // Primary trigger: Turn 10+ (Big Money threshold)
    // Secondary triggers: Game nearing end earlier than expected
    //   - Provinces critically low (<=2) at turn 8+, OR
    //   - ANY pile empty at turn 8+ (signals game acceleration)
    const isMidGame = gameState.turnNumber >= 10 ||
                      (gameState.turnNumber >= 8 && provincesLeft <= 2) ||
                      (gameState.turnNumber >= 8 && emptyPiles >= 1);

    // Endgame: Focus heavily on victory points (Provinces nearly gone OR multiple piles empty)
    const isEndgame = provincesLeft <= 3 || emptyPiles >= 3;

    // Big Money strategy with correct priority:
    // 1. Province (if mid-game+ AND affordable) - HIGHEST PRIORITY
    // 2. Gold (if affordable) - Build economy
    // 3. Duchy (if endgame AND affordable) - Backup victory points
    // 4. Silver (if affordable) - Minimum economy
    // 5. Estate (if very late endgame) - Grab any VP

    // FIRST: Province in mid-game or later (turn 10+)
    if (player_state.coins >= 8 && provincesLeft > 0 && isMidGame) {
      return {
        move: { type: 'buy', card: 'Province' },
        reasoning: `Big Money: Province (8 coins, 6 VP) - Turn ${gameState.turnNumber}, ${provincesLeft} left`
      };
    }

    // SECOND: Gold for economy building (only if NOT ready for Province yet)
    if (player_state.coins >= 6 && (gameState.supply.get('Gold') || 0) > 0) {
      return {
        move: { type: 'buy', card: 'Gold' },
        reasoning: 'Big Money: Gold (6 coins) increases coin generation'
      };
    }

    // FALLBACK: Province when Gold unavailable (don't waste 8 coins)
    // If we have 8 coins but can't buy Gold, buy Province even in early game
    if (player_state.coins >= 8 && provincesLeft > 0) {
      const reasonPrefix = isEndgame ? 'Endgame: ' : 'Buy ';
      return {
        move: { type: 'buy', card: 'Province' },
        reasoning: `${reasonPrefix}Province (8 coins, 6 VP) - Gold unavailable, ${provincesLeft} left`
      };
    }

    // THIRD: Duchy in endgame as backup victory points
    if (player_state.coins >= 5 && (gameState.supply.get('Duchy') || 0) > 0 && isEndgame) {
      return {
        move: { type: 'buy', card: 'Duchy' },
        reasoning: `Endgame: Duchy (5 coins, 3 VP) - Provinces at ${provincesLeft}, ${emptyPiles} empty piles`
      };
    }

    // FOURTH: Silver for minimum economy
    if (player_state.coins >= 3 && (gameState.supply.get('Silver') || 0) > 0) {
      return {
        move: { type: 'buy', card: 'Silver' },
        reasoning: 'Big Money: Silver (3 coins) improves hand'
      };
    }

    // FIFTH: Estate in very late endgame (any VP is better than nothing)
    if (player_state.coins >= 2 && (gameState.supply.get('Estate') || 0) > 0 && isEndgame) {
      return {
        move: { type: 'buy', card: 'Estate' },
        reasoning: `Late endgame: Estate (2 coins, 1 VP) - ${emptyPiles} empty piles`
      };
    }

    // Fallback: end phase if no good purchases
    return {
      move: { type: 'end_phase' },
      reasoning: 'No profitable purchases available'
    };
  }
}
