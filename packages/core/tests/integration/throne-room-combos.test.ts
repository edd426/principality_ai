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

  test('IT-THRONE-2: Throne Room + Feast (gain 2, trash 1)', () => {
    const state = engine.initializeGame(1);
    const testState: GameState = {
      ...state,
      phase: 'action',
      players: [{ ...state.players[0], hand: ['Throne Room', 'Feast'], actions: 1 }]
    };

    const throne = engine.executeMove(testState, { type: 'play_action', card: 'Throne Room' });
    const feast = engine.executeMove(throne.newState!, { type: 'select_action_for_throne', card: 'Feast' });

    expect(feast.newState!.trash).toContain('Feast'); // Trashed once

    // Gain 2 cards
    const gain1 = engine.executeMove(feast.newState!, { type: 'gain_card', card: 'Duchy' });
    const gain2 = engine.executeMove(gain1.newState!, { type: 'gain_card', card: 'Market' });

    expect(gain2.newState!.players[0].discard).toContain('Duchy');
    expect(gain2.newState!.players[0].discard).toContain('Market');
  });

  test('IT-THRONE-3: Throne Room + Throne Room + Smithy (4x)', () => {
    const state = engine.initializeGame(1);
    const testState: GameState = {
      ...state,
      phase: 'action',
      players: [{
        ...state.players[0],
        hand: ['Throne Room', 'Throne Room', 'Smithy'],
        deck: Array(12).fill('Copper'),
        actions: 1
      }]
    };

    const throne1 = engine.executeMove(testState, { type: 'play_action', card: 'Throne Room' });
    const throne2 = engine.executeMove(throne1.newState!, { type: 'select_action_for_throne', card: 'Throne Room' });
    const smithy = engine.executeMove(throne2.newState!, { type: 'select_action_for_throne', card: 'Smithy' });

    // Smithy played 4 times = +12 Cards
    expect(smithy.newState!.players[0].hand.length).toBe(12);
  });

  test('IT-THRONE-4: Throne Room + Library (draw to 7 once)', () => {
    const state = engine.initializeGame(1);
    const testState: GameState = {
      ...state,
      phase: 'action',
      players: [{
        ...state.players[0],
        hand: ['Throne Room', 'Library'],
        deck: Array(10).fill('Copper'),
        actions: 1
      }]
    };

    const throne = engine.executeMove(testState, { type: 'play_action', card: 'Throne Room' });
    const library = engine.executeMove(throne.newState!, { type: 'select_action_for_throne', card: 'Library' });

    // First Library: draw to 7
    // Second Library: already at 7, no draw
    expect(library.newState!.players[0].hand.length).toBe(7);
  });

  test('IT-THRONE-5: Throne Room + Workshop (gain 2)', () => {
    const state = engine.initializeGame(1);
    const testState: GameState = {
      ...state,
      phase: 'action',
      players: [{ ...state.players[0], hand: ['Throne Room', 'Workshop'], actions: 1 }]
    };

    const throne = engine.executeMove(testState, { type: 'play_action', card: 'Throne Room' });
    const workshop = engine.executeMove(throne.newState!, { type: 'select_action_for_throne', card: 'Workshop' });

    const gain1 = engine.executeMove(workshop.newState!, { type: 'gain_card', card: 'Smithy' });
    const gain2 = engine.executeMove(gain1.newState!, { type: 'gain_card', card: 'Silver' });

    expect(gain2.newState!.players[0].discard).toContain('Smithy');
    expect(gain2.newState!.players[0].discard).toContain('Silver');
  });

  test('IT-THRONE-6: Throne Room + Adventurer (4 Treasures)', () => {
    const state = engine.initializeGame(1);
    const testState: GameState = {
      ...state,
      phase: 'action',
      players: [{
        ...state.players[0],
        hand: ['Throne Room', 'Adventurer'],
        deck: ['Copper', 'Estate', 'Silver', 'Duchy', 'Gold', 'Province', 'Copper', 'Silver'],
        actions: 1
      }]
    };

    const throne = engine.executeMove(testState, { type: 'play_action', card: 'Throne Room' });
    const adventurer = engine.executeMove(throne.newState!, { type: 'select_action_for_throne', card: 'Adventurer' });

    // First Adventurer: 2 Treasures, Second Adventurer: 2 more Treasures
    expect(adventurer.newState!.players[0].hand.filter(c => ['Copper', 'Silver', 'Gold'].includes(c)).length).toBe(4);
  });
});
