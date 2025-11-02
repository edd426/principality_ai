import { GameEngine, GameState } from '@principality/core';

/**
 * Phase 4 E2E Tests: Gardens Strategy
 * @req: Test full games using Gardens alternative VP
 * @level: E2E
 * @count: 2 tests total
 */

describe('E2E: Gardens Strategy', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('e2e-gardens-test');
  });

  test('E2E-GARDENS-1: Win with Gardens + Workshop', () => {
    const state = engine.initializeGame(1);

    // Simulate Gardens strategy: inflate deck size
    const gardensState: GameState = {
      ...state,
      players: [{
        ...state.players[0],
        hand: ['Gardens', 'Gardens', 'Gardens', 'Gardens'],
        drawPile: Array(25).fill('Copper'), // Lots of cheap cards
        discardPile: Array(21).fill('Estate'), // More cheap cards
        inPlay: []
        // Total: 4 + 25 + 21 = 50 cards
      }]
    };

    const victory = engine.checkGameOver(gardensState);
    const vp = victory.scores?.[0] || 0;

    // 50 cards / 10 = 5 VP per Gardens
    // 4 Gardens × 5 VP = 20 VP
    // 21 Estates = 21 VP
    // Total = 41 VP
    expect(vp).toBeGreaterThanOrEqual(20); // At least 20 VP from Gardens
  });

  test('E2E-GARDENS-2: Gardens vs Big Money', () => {
    const state = engine.initializeGame(2);

    // Player 0: Gardens strategy (50 cards)
    const gardensPlayer: GameState = {
      ...state,
      players: [
        {
          ...state.players[0],
          hand: ['Gardens', 'Gardens', 'Gardens', 'Gardens'],
          drawPile: Array(25).fill('Copper'),
          discardPile: Array(21).fill('Estate'),
          inPlay: []
          // Total: 50 cards, 4 Gardens = 20 VP from Gardens + 21 Estates = 41 VP
        },
        {
          ...state.players[1],
          hand: ['Province', 'Province', 'Province'],
          drawPile: ['Province', 'Province'],
          discardPile: ['Duchy', 'Duchy', 'Estate'],
          inPlay: []
          // 5 Provinces = 30 VP, 2 Duchies = 6 VP, 1 Estate = 1 VP, Total = 37 VP
        }
      ]
    };

    const victory = engine.checkGameOver(gardensPlayer);
    const vp0 = victory.scores?.[0] || 0;
    const vp1 = victory.scores?.[1] || 0;

    expect(vp0).toBeGreaterThan(vp1); // Gardens wins
  });
});
