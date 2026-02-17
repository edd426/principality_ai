/**
 * AI Service
 *
 * Handles AI opponent turns using Claude AI with Big Money fallback.
 * Orchestrates the strategy chain: Claude API -> Big Money.
 *
 * @req AI-001 - AI model selection (Haiku/Sonnet/Opus)
 * @req AI-002 - AI decision context and reasoning
 * @req AI-003 - Big Money fallback strategy
 */

import { GameState, GameEngine, Move, isTreasureCard } from '@principality/core';
import type { AIModel, AIDecisionContext, AIDecision } from '../types/ai';
import { ClaudeAIStrategy } from './claude-ai-strategy';
import { BigMoneyStrategy } from './big-money-strategy';

/**
 * Summary of an AI turn
 */
export interface AITurnSummary {
  cardsBought: string[];
  treasuresPlayed: string[];
  actionsPlayed: string[];
}

/**
 * AI Service for opponent turn automation
 *
 * Supports two modes:
 * - playBigMoneyTurn: Original deterministic strategy (synchronous)
 * - decideNextMove: Claude AI with Big Money fallback (async)
 */
export class AIService {
  private claudeStrategy: ClaudeAIStrategy | null = null;
  private bigMoneyStrategy = new BigMoneyStrategy();

  /**
   * Initialize Claude AI strategy for a specific model.
   * Call this when a game starts with AI enabled.
   */
  initClaudeAI(model: AIModel, apiKey?: string): void {
    this.claudeStrategy = new ClaudeAIStrategy(model, apiKey);
  }

  /**
   * Decide the next move using Claude AI, falling back to Big Money.
   *
   * @req AI-002 - Returns decision with reasoning
   * @req AI-003 - Falls back to Big Money on API errors
   */
  async decideNextMove(
    state: GameState,
    engine: GameEngine,
    playerIndex: number
  ): Promise<AIDecision> {
    const context = this.buildDecisionContext(state, engine, playerIndex);

    // Try Claude AI first
    if (this.claudeStrategy && this.claudeStrategy.canHandle(context)) {
      try {
        return await this.claudeStrategy.decideMove(context);
      } catch (_error) {
        // Fall through to Big Money
      }
    }

    // Fallback to Big Money
    return this.bigMoneyStrategy.decideMove(context);
  }

  /**
   * Build the decision context from game state.
   */
  buildDecisionContext(
    state: GameState,
    engine: GameEngine,
    playerIndex: number
  ): AIDecisionContext {
    const player = state.players[playerIndex];
    const validMoves = engine.getValidMoves(state);

    return {
      gameState: state,
      playerIndex,
      validMoves,
      phase: state.phase,
      turnNumber: state.turnNumber,
      hand: [...player.hand],
      resources: {
        actions: player.actions,
        buys: player.buys,
        coins: player.coins,
      },
      playedThisTurn: [...player.inPlay],
      kingdomCards: state.selectedKingdomCards ? [...state.selectedKingdomCards] : [],
      gameLog: state.gameLog ? [...state.gameLog] : [],
    };
  }

  /**
   * Play a full Big Money turn for the AI opponent
   *
   * Big Money strategy:
   * - Skip action phase (no action cards)
   * - Play all treasures
   * - Buy priority: Province ($8+) > Gold ($6-7) > Silver ($3-5)
   *
   * @param state - Current game state (AI's turn)
   * @param engine - Game engine instance
   * @returns Updated state and turn summary
   */
  playBigMoneyTurn(
    state: GameState,
    engine: GameEngine
  ): { state: GameState; summary: AITurnSummary } {
    const summary: AITurnSummary = {
      cardsBought: [],
      treasuresPlayed: [],
      actionsPlayed: [],
    };

    let currentState = state;
    const playerIndex = currentState.currentPlayer;

    // Action phase: Skip (Big Money doesn't play actions)
    if (currentState.phase === 'action') {
      const endActionResult = engine.executeMove(currentState, { type: 'end_phase' });
      if (endActionResult.success && endActionResult.newState) {
        currentState = endActionResult.newState;
      }
    }

    // Buy phase: Play all treasures first
    if (currentState.phase === 'buy') {
      const player = currentState.players[playerIndex];

      // Play all treasures in hand
      const treasures = player.hand.filter((card) => isTreasureCard(card));
      for (const treasure of treasures) {
        const playResult = engine.executeMove(currentState, {
          type: 'play_treasure',
          card: treasure,
        });
        if (playResult.success && playResult.newState) {
          currentState = playResult.newState;
          summary.treasuresPlayed.push(treasure);
        }
      }

      // Now decide what to buy using Big Money priority
      const currentPlayer = currentState.players[playerIndex];
      const coins = currentPlayer.coins;

      // Big Money buy priority: Province > Gold > Silver
      if (coins >= 8 && (currentState.supply.get('Province') || 0) > 0) {
        const buyResult = engine.executeMove(currentState, {
          type: 'buy',
          card: 'Province',
        });
        if (buyResult.success && buyResult.newState) {
          currentState = buyResult.newState;
          summary.cardsBought.push('Province');
        }
      } else if (coins >= 6 && (currentState.supply.get('Gold') || 0) > 0) {
        const buyResult = engine.executeMove(currentState, {
          type: 'buy',
          card: 'Gold',
        });
        if (buyResult.success && buyResult.newState) {
          currentState = buyResult.newState;
          summary.cardsBought.push('Gold');
        }
      } else if (coins >= 3 && (currentState.supply.get('Silver') || 0) > 0) {
        const buyResult = engine.executeMove(currentState, {
          type: 'buy',
          card: 'Silver',
        });
        if (buyResult.success && buyResult.newState) {
          currentState = buyResult.newState;
          summary.cardsBought.push('Silver');
        }
      }
      // If less than 3 coins, buy nothing

      // End buy phase (transition to cleanup)
      const endBuyResult = engine.executeMove(currentState, { type: 'end_phase' });
      if (endBuyResult.success && endBuyResult.newState) {
        currentState = endBuyResult.newState;
      }
    }

    // Cleanup phase: End phase to transition to next player's turn
    if (currentState.phase === 'cleanup') {
      const cleanupResult = engine.executeMove(currentState, { type: 'end_phase' });
      if (cleanupResult.success && cleanupResult.newState) {
        currentState = cleanupResult.newState;
      }
    }

    return { state: currentState, summary };
  }

  /**
   * Auto-resolve pending effects targeting the AI opponent
   *
   * Handles attack effects like:
   * - Militia: discard down to 3 cards (discard lowest cost cards)
   * - Bureaucrat: topdeck cheapest victory card
   *
   * @param state - Current game state with pending effect
   * @param engine - Game engine instance
   * @returns Updated state and resolution summary
   */
  resolveAIPendingEffect(
    state: GameState,
    engine: GameEngine
  ): { state: GameState; resolved: boolean; summary?: string } {
    const pending = state.pendingEffect;

    if (!pending) {
      return { state, resolved: false };
    }

    // Only handle effects targeting AI player (player 1)
    if (pending.targetPlayer === undefined || pending.targetPlayer === 0) {
      return { state, resolved: false };
    }

    const targetPlayer = state.players[pending.targetPlayer];
    let move: Move | null = null;
    let summary: string | undefined;

    switch (pending.effect) {
      case 'discard_to_hand_size': {
        // Militia: discard down to 3 cards
        const hand = [...targetPlayer.hand];
        const targetSize = 3;
        const cardsToDiscard = hand.length - targetSize;

        if (cardsToDiscard <= 0) {
          move = { type: 'discard_to_hand_size', cards: [] };
          summary = 'AI has 3 or fewer cards (no discard needed)';
        } else {
          // Sort by card cost ascending (discard cheapest)
          const sortedHand = hand
            .map((card) => ({ card, cost: this.getCardCostSimple(card) }))
            .sort((a, b) => a.cost - b.cost);

          const discardList = sortedHand.slice(0, cardsToDiscard).map((item) => item.card);

          move = { type: 'discard_to_hand_size', cards: discardList };
          summary = `AI discarded ${discardList.join(', ')} (Militia)`;
        }
        break;
      }

      case 'reveal_and_topdeck': {
        // Bureaucrat: topdeck a victory card
        const victoryCards = targetPlayer.hand.filter((c) =>
          ['Estate', 'Duchy', 'Province', 'Gardens', 'Curse'].includes(c)
        );

        if (victoryCards.length === 0) {
          // No victory cards - reveal hand
          move = { type: 'reveal_and_topdeck', card: undefined as any };
          summary = 'AI revealed hand (no Victory cards)';
        } else {
          // Topdeck cheapest victory card
          const sortedVictory = victoryCards
            .map((card) => ({ card, cost: this.getCardCostSimple(card) }))
            .sort((a, b) => a.cost - b.cost);

          const cardToTopdeck = sortedVictory[0].card;
          move = { type: 'reveal_and_topdeck', card: cardToTopdeck };
          summary = `AI topdecked ${cardToTopdeck} (Bureaucrat)`;
        }
        break;
      }

      default:
        return { state, resolved: false };
    }

    if (!move) {
      return { state, resolved: false };
    }

    const result = engine.executeMove(state, move);
    if (result.success && result.newState) {
      return { state: result.newState, resolved: true, summary };
    }

    return { state, resolved: false };
  }

  /**
   * Simple card cost lookup for AI decisions
   */
  private getCardCostSimple(card: string): number {
    const costs: Record<string, number> = {
      Copper: 0,
      Curse: 0,
      Estate: 2,
      Silver: 3,
      Duchy: 5,
      Gold: 6,
      Province: 8,
      // Kingdom cards
      Village: 3,
      Smithy: 4,
      Laboratory: 5,
      Market: 5,
      Festival: 5,
      'Council Room': 5,
      Cellar: 2,
      Chapel: 2,
      Moat: 2,
      Workshop: 3,
      Militia: 4,
      Remodel: 4,
      Moneylender: 4,
      Spy: 4,
      Thief: 4,
      'Throne Room': 4,
      Bureaucrat: 4,
      Feast: 4,
      Mine: 5,
      Witch: 5,
      Library: 5,
      Adventurer: 6,
      Gardens: 4,
      Chancellor: 3,
    };
    return costs[card] ?? 0;
  }
}
