/**
 * Big Money Strategy
 *
 * A simple, deterministic fallback strategy that follows the Big Money approach:
 * - Skip action phase (no action cards)
 * - Play all treasures
 * - Buy priority: Province ($8+) > Gold ($6-7) > Duchy ($5 late game) > Silver ($3-5)
 *
 * @req AI-003 - Big Money fallback strategy
 */

import type { Move } from '@principality/core';
import type { AIStrategy, AIDecisionContext, AIDecision } from '../types/ai';

/**
 * Big Money Strategy - deterministic fallback for AI decisions
 *
 * @req AI-003 - Always available as fallback when Claude API fails
 */
export class BigMoneyStrategy implements AIStrategy {
  readonly name = 'big-money';

  /**
   * Big Money can always handle any context (it's the fallback)
   */
  canHandle(_context: AIDecisionContext): boolean {
    return true;
  }

  /**
   * Decide the next move using Big Money heuristics
   */
  async decideMove(context: AIDecisionContext): Promise<AIDecision> {
    const startTime = Date.now();

    const { phase, resources, validMoves, gameState } = context;
    let move: Move;
    let reasoning: string;

    if (phase === 'action') {
      // Big Money: always end action phase
      move = { type: 'end_phase' };
      reasoning = 'Big Money strategy: skip action phase.';
    } else if (phase === 'buy') {
      const result = this.decideBuyPhase(resources.coins, validMoves, gameState);
      move = result.move;
      reasoning = result.reasoning;
    } else {
      // Cleanup or unknown phase: end it
      move = { type: 'end_phase' };
      reasoning = 'Ending phase.';
    }

    const decisionTimeMs = Date.now() - startTime;

    return {
      move,
      reasoning,
      decisionTimeMs,
      strategyUsed: this.name,
    };
  }

  /**
   * Decide what to do during buy phase.
   * Handles both treasure playing and card buying.
   */
  private decideBuyPhase(
    coins: number,
    validMoves: Move[],
    gameState: { supply: ReadonlyMap<string, number> }
  ): { move: Move; reasoning: string } {
    // Check if we can play treasures first
    const treasureMoves = validMoves.filter((m) => m.type === 'play_treasure');
    if (treasureMoves.length > 0) {
      // Play highest value treasure first
      const priority = ['Gold', 'Silver', 'Copper'];
      for (const card of priority) {
        const treasureMove = treasureMoves.find((m) => m.card === card);
        if (treasureMove) {
          return {
            move: treasureMove,
            reasoning: `Big Money: play ${card} for coins.`,
          };
        }
      }
      // Play any treasure if none matched priority
      return {
        move: treasureMoves[0],
        reasoning: `Big Money: play treasure for coins.`,
      };
    }

    // Buy phase: find best card to buy
    const buyMoves = validMoves.filter((m) => m.type === 'buy');
    const provinceCount = gameState.supply.get('Province') ?? 0;

    // Province at 8+ coins
    if (coins >= 8) {
      const provinceBuy = buyMoves.find((m) => m.card === 'Province');
      if (provinceBuy) {
        return {
          move: provinceBuy,
          reasoning: 'Big Money: buy Province for 6 VP.',
        };
      }
    }

    // Gold at 6+ coins
    if (coins >= 6) {
      const goldBuy = buyMoves.find((m) => m.card === 'Gold');
      if (goldBuy) {
        return {
          move: goldBuy,
          reasoning: 'Big Money: buy Gold for +3 coins.',
        };
      }
    }

    // Duchy at 5+ coins in late game (Provinces <= 4)
    if (coins >= 5 && provinceCount <= 4) {
      const duchyBuy = buyMoves.find((m) => m.card === 'Duchy');
      if (duchyBuy) {
        return {
          move: duchyBuy,
          reasoning: `Big Money: buy Duchy (late game, ${provinceCount} Provinces left).`,
        };
      }
    }

    // Silver at 3+ coins
    if (coins >= 3) {
      const silverBuy = buyMoves.find((m) => m.card === 'Silver');
      if (silverBuy) {
        return {
          move: silverBuy,
          reasoning: 'Big Money: buy Silver for +2 coins.',
        };
      }
    }

    // Nothing worth buying, end phase
    return {
      move: { type: 'end_phase' },
      reasoning: 'Big Money: no worthwhile purchases available.',
    };
  }
}
