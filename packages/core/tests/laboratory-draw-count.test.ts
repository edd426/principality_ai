/**
 * Test for issue #80 investigation: Laboratory draw count verification
 *
 * Conflicting reports:
 * - Agent a46cd7c: Reports Laboratory draws 2 cards correctly ✓
 * - Agent a537b33: Reports Laboratory draws only 1 card instead of 2 ✗
 */

import { GameEngine, GameState } from '@principality/core';

describe('Issue #80 Investigation: Laboratory Draw Count', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('laboratory-draw-test');
  });

  test('Laboratory should draw exactly 2 cards', () => {
    const state = engine.initializeGame(1);

    const testState: GameState = {
      ...state,
      players: [{
        ...state.players[0],
        hand: ['Laboratory', 'Copper', 'Estate'],
        drawPile: ['Silver', 'Gold', 'Village', 'Smithy'],
        discardPile: [],
        actions: 1
      }]
    };

    const initialHandSize = testState.players[0].hand.length;
    const result = engine.executeMove(testState, { type: 'play_action', card: 'Laboratory' });

    expect(result.success).toBe(true);
    expect(result.newState).toBeDefined();

    const player = result.newState!.players[0];

    // Laboratory: -1 from hand (played), +2 drawn = net +1 card
    // Initial: 3 cards, After: 3 - 1 + 2 = 4 cards
    expect(player.hand.length).toBe(4);

    // Verify the drawn cards are Silver and Gold (top 2 from draw pile)
    expect(player.hand).toContain('Silver');
    expect(player.hand).toContain('Gold');

    // Laboratory should be in play
    expect(player.inPlay).toContain('Laboratory');

    // Draw pile should have 2 fewer cards
    expect(player.drawPile.length).toBe(2);

    // Actions should be 1 (started with 1, used 1 for Lab, gained 1 from Lab effect)
    expect(player.actions).toBe(1);
  });

  test('Laboratory chaining should maintain action economy', () => {
    const state = engine.initializeGame(1);

    const testState: GameState = {
      ...state,
      players: [{
        ...state.players[0],
        hand: ['Laboratory', 'Laboratory', 'Copper'],
        drawPile: ['Silver', 'Gold', 'Village', 'Smithy', 'Market', 'Festival'],
        discardPile: [],
        actions: 1
      }]
    };

    // Play first Laboratory
    const result1 = engine.executeMove(testState, { type: 'play_action', card: 'Laboratory' });
    expect(result1.success).toBe(true);

    let player = result1.newState!.players[0];
    // After first Lab: 3 - 1 + 2 = 4 cards in hand
    expect(player.hand.length).toBe(4);
    expect(player.actions).toBe(1); // Net zero action cost

    // Play second Laboratory
    const result2 = engine.executeMove(result1.newState!, { type: 'play_action', card: 'Laboratory' });
    expect(result2.success).toBe(true);

    player = result2.newState!.players[0];
    // After second Lab: 4 - 1 + 2 = 5 cards in hand
    expect(player.hand.length).toBe(5);
    expect(player.actions).toBe(1); // Still net zero action cost

    // Both Labs in play
    expect(player.inPlay).toHaveLength(2);
    expect(player.inPlay.filter(c => c === 'Laboratory')).toHaveLength(2);
  });

  test('Laboratory draw should work when deck needs reshuffle', () => {
    const state = engine.initializeGame(1);

    const testState: GameState = {
      ...state,
      players: [{
        ...state.players[0],
        hand: ['Laboratory', 'Copper'],
        drawPile: ['Silver'], // Only 1 card in draw pile
        discardPile: ['Gold', 'Village', 'Smithy'], // 3 cards in discard
        actions: 1
      }]
    };

    const result = engine.executeMove(testState, { type: 'play_action', card: 'Laboratory' });
    expect(result.success).toBe(true);

    const player = result.newState!.players[0];
    // Should have drawn 2 cards total (1 from deck, 1 after reshuffle)
    // Initial: 2 cards, -1 played, +2 drawn = 3 cards
    expect(player.hand.length).toBe(3);

    // Silver should definitely be in hand (was top of draw)
    expect(player.hand).toContain('Silver');

    // Actions should be 1
    expect(player.actions).toBe(1);
  });
});
