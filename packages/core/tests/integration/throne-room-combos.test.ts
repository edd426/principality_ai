import { GameEngine, GameState } from '@principality/core';

/**
 * Phase 4 Integration Tests: Throne Room Combinations
 * @req: Test Throne Room with all card types
 * @level: Integration
 * @count: 6 tests total
 */

describe('IT: Throne Room Combinations', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('throne-combos-test');
  });

  test('IT-THRONE-1: Throne Room + Chapel (trash 8)', () => {
    const state = engine.initializeGame(1);
    const testState: GameState = {
      ...state,
      phase: 'action',
      players: [{
        ...state.players[0],
        hand: ['Throne Room', 'Chapel', ...Array(8).fill('Copper')],
        actions: 1
      }]
    };

    const throne = engine.executeMove(testState, { type: 'play_action', card: 'Throne Room' });
    const chapel = engine.executeMove(throne.newState!, { type: 'select_action_for_throne', card: 'Chapel' });

    // First Chapel: trash 4
    const trash1 = engine.executeMove(chapel.newState!, {
      type: 'trash_cards',
      cards: ['Copper', 'Copper', 'Copper', 'Copper']
    });

    // Second Chapel: trash 4 more
    const trash2 = engine.executeMove(trash1.newState!, {
      type: 'trash_cards',
      cards: ['Copper', 'Copper', 'Copper', 'Copper']
    });

    expect(trash2.newState!.trash.length).toBe(8);
  });

  // @fix: Verified working - Throne Room plays Feast twice, gains 2 cards
  test('IT-THRONE-2: Throne Room + Feast (gain 2, trash 1)', () => {
    const state = engine.initializeGame(1);
    const testState: GameState = {
      ...state,
      phase: 'action',
      // Ensure Feast and target cards are in supply
      supply: new Map([...state.supply, ['Feast', 10], ['Duchy', 10], ['Militia', 10]]),
      players: [{ ...state.players[0], hand: ['Throne Room', 'Feast'], actions: 1, discardPile: [] }]
    };

    const throne = engine.executeMove(testState, { type: 'play_action', card: 'Throne Room' });
    const feast = engine.executeMove(throne.newState!, { type: 'select_action_for_throne', card: 'Feast' });

    expect(feast.newState!.trash).toContain('Feast'); // Trashed once

    // Gain 2 cards (Feast costs $4, can gain up to $5)
    const gain1 = engine.executeMove(feast.newState!, { type: 'gain_card', card: 'Duchy' });
    const gain2 = engine.executeMove(gain1.newState!, { type: 'gain_card', card: 'Militia' });

    expect(gain2.newState!.players[0].discardPile).toContain('Duchy');
    expect(gain2.newState!.players[0].discardPile).toContain('Militia');
  });

  test('IT-THRONE-3: Throne Room + Smithy plays twice (6 cards drawn)', () => {
    // @req: Throne Room plays selected action twice
    // @assert: Smithy drawn 3 cards twice = 6 new cards in hand
    const state = engine.initializeGame(1);
    const testState: GameState = {
      ...state,
      phase: 'action',
      players: [{
        ...state.players[0],
        hand: ['Throne Room', 'Smithy'],
        drawPile: Array(10).fill('Copper'),
        actions: 1
      }]
    };

    const throne = engine.executeMove(testState, { type: 'play_action', card: 'Throne Room' });
    const smithy = engine.executeMove(throne.newState!, { type: 'select_action_for_throne', card: 'Smithy' });

    // Smithy played 2 times = +6 Cards (3 cards per play)
    expect(smithy.newState!.players[0].hand.length).toBe(6);
  });

  test('IT-THRONE-4: Throne Room + Library (draw to 7 once)', () => {
    const state = engine.initializeGame(1);
    const testState: GameState = {
      ...state,
      phase: 'action',
      players: [{
        ...state.players[0],
        hand: ['Throne Room', 'Library'],
        drawPile: Array(10).fill('Copper'),
        actions: 1
      }]
    };

    const throne = engine.executeMove(testState, { type: 'play_action', card: 'Throne Room' });
    const library = engine.executeMove(throne.newState!, { type: 'select_action_for_throne', card: 'Library' });

    // First Library: draw to 7
    // Second Library: already at 7, no draw
    expect(library.newState!.players[0].hand.length).toBe(7);
  });

  // @fix: Verified working - Throne Room plays Workshop twice, gains 2 cards
  test('IT-THRONE-5: Throne Room + Workshop (gain 2)', () => {
    const state = engine.initializeGame(1);
    const testState: GameState = {
      ...state,
      phase: 'action',
      // Ensure target cards are in supply (Workshop gains cards costing up to $4)
      supply: new Map([...state.supply, ['Militia', 10], ['Silver', 40]]),
      players: [{ ...state.players[0], hand: ['Throne Room', 'Workshop'], actions: 1, discardPile: [] }]
    };

    const throne = engine.executeMove(testState, { type: 'play_action', card: 'Throne Room' });
    const workshop = engine.executeMove(throne.newState!, { type: 'select_action_for_throne', card: 'Workshop' });

    // Workshop gains cards costing up to $4
    const gain1 = engine.executeMove(workshop.newState!, { type: 'gain_card', card: 'Militia' });
    const gain2 = engine.executeMove(gain1.newState!, { type: 'gain_card', card: 'Silver' });

    expect(gain2.newState!.players[0].discardPile).toContain('Militia');
    expect(gain2.newState!.players[0].discardPile).toContain('Silver');
  });

  test('IT-THRONE-6: Throne Room + Adventurer (4 Treasures)', () => {
    const state = engine.initializeGame(1);
    const testState: GameState = {
      ...state,
      phase: 'action',
      players: [{
        ...state.players[0],
        hand: ['Throne Room', 'Adventurer'],
        drawPile: ['Copper', 'Estate', 'Silver', 'Duchy', 'Gold', 'Province', 'Copper', 'Silver'],
        actions: 1
      }]
    };

    const throne = engine.executeMove(testState, { type: 'play_action', card: 'Throne Room' });
    const adventurer = engine.executeMove(throne.newState!, { type: 'select_action_for_throne', card: 'Adventurer' });

    // First Adventurer: 2 Treasures, Second Adventurer: 2 more Treasures
    expect(adventurer.newState!.players[0].hand.filter(c => ['Copper', 'Silver', 'Gold'].includes(c)).length).toBe(4);
  });
});
