/**
 * Big Money AI for Auto-Opponent
 *
 * Plays a simple Big Money strategy for opponent players in 2+ player MCP games.
 * Strategy: Province ($8+) > Gold ($6-7) > Silver ($3-5) > nothing
 */

import { GameState, GameEngine, Move, isTreasureCard } from '@principality/core';

export interface OpponentTurnSummary {
  cardsBought: string[];
  treasuresPlayed: string[];
  actionsPlayed: string[];
}

/**
 * Play a full Big Money turn for an AI opponent
 *
 * @param state Current game state (opponent's turn)
 * @param engine Game engine instance
 * @returns Updated state after opponent turn + summary of actions taken
 */
export function playBigMoneyTurn(
  state: GameState,
  engine: GameEngine
): { state: GameState; summary: OpponentTurnSummary } {
  const summary: OpponentTurnSummary = {
    cardsBought: [],
    treasuresPlayed: [],
    actionsPlayed: []
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
    const treasures = player.hand.filter(card => isTreasureCard(card));
    for (const treasure of treasures) {
      const playResult = engine.executeMove(currentState, {
        type: 'play_treasure',
        card: treasure
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
        card: 'Province'
      });
      if (buyResult.success && buyResult.newState) {
        currentState = buyResult.newState;
        summary.cardsBought.push('Province');
      }
    } else if (coins >= 6 && (currentState.supply.get('Gold') || 0) > 0) {
      const buyResult = engine.executeMove(currentState, {
        type: 'buy',
        card: 'Gold'
      });
      if (buyResult.success && buyResult.newState) {
        currentState = buyResult.newState;
        summary.cardsBought.push('Gold');
      }
    } else if (coins >= 3 && (currentState.supply.get('Silver') || 0) > 0) {
      const buyResult = engine.executeMove(currentState, {
        type: 'buy',
        card: 'Silver'
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
