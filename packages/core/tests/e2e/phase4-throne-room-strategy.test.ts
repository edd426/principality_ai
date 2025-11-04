import { GameEngine, GameState } from '@principality/core';

/**
 * Phase 4 E2E Tests: Throne Room Strategy
 * @req: Test full games using Throne Room combos
 * @level: E2E
 * @count: 3 tests total
 */

describe('E2E: Throne Room Strategy', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('e2e-throne-test');
  });

  test('E2E-THRONE-1: Throne Room + Smithy engine', () => {
    const state = engine.initializeGame(1);

    const testState: GameState = {
      ...state,
      phase: 'action',
      players: [{
        ...state.players[0],
        hand: ['Throne Room', 'Throne Room', 'Smithy', 'Smithy'],
        drawPile: Array(20).fill('Copper'),
        actions: 2
      }]
    };

    // Play Throne Room + Smithy
    const throne1 = engine.executeMove(testState, { type: 'play_action', card: 'Throne Room' });
    const smithy1 = engine.executeMove(throne1.newState!, { type: 'select_action_for_throne', card: 'Smithy' });

    expect(smithy1.newState!.players[0].hand.length).toBeGreaterThanOrEqual(7); // Drew 6 + remaining cards

    // Second Throne Room + Smithy
    const throne2 = engine.executeMove(smithy1.newState!, { type: 'play_action', card: 'Throne Room' });
    const smithy2 = engine.executeMove(throne2.newState!, { type: 'select_action_for_throne', card: 'Smithy' });

    expect(smithy2.newState!.players[0].hand.length).toBeGreaterThanOrEqual(13); // Drew 12 total
  });

  test('E2E-THRONE-2: Throne Room + Village chain', () => {
    const state = engine.initializeGame(1);

    const testState: GameState = {
      ...state,
      phase: 'action',
      players: [{
        ...state.players[0],
        hand: ['Throne Room', 'Village', 'Village', 'Smithy'],
        drawPile: Array(10).fill('Copper'),
        actions: 1
      }]
    };

    // Throne Room + Village → +2 Cards, +4 Actions
    const throne = engine.executeMove(testState, { type: 'play_action', card: 'Throne Room' });
    const village = engine.executeMove(throne.newState!, { type: 'select_action_for_throne', card: 'Village' });

    expect(village.newState!.players[0].actions).toBeGreaterThanOrEqual(4);

    // Play second Village
    const village2 = engine.executeMove(village.newState!, { type: 'play_action', card: 'Village' });

    expect(village2.newState!.players[0].actions).toBeGreaterThanOrEqual(5);

    // Play Smithy
    const smithy = engine.executeMove(village2.newState!, { type: 'play_action', card: 'Smithy' });

    expect(smithy.newState!.players[0].hand.length).toBeGreaterThanOrEqual(5);
  });

  test('E2E-THRONE-3: Throne Room + Chapel (deck thinning)', () => {
    const state = engine.initializeGame(1);

    const testState: GameState = {
      ...state,
      phase: 'action',
      players: [{
        ...state.players[0],
        hand: ['Throne Room', 'Chapel', ...Array(8).fill('Estate')],
        actions: 1
      }]
    };

    const throne = engine.executeMove(testState, { type: 'play_action', card: 'Throne Room' });
    const chapel = engine.executeMove(throne.newState!, { type: 'select_action_for_throne', card: 'Chapel' });

    // Trash 4 Estates
    const trash1 = engine.executeMove(chapel.newState!, {
      type: 'trash_cards',
      cards: ['Estate', 'Estate', 'Estate', 'Estate']
    });

    // Trash 4 more Estates
    const trash2 = engine.executeMove(trash1.newState!, {
      type: 'trash_cards',
      cards: ['Estate', 'Estate', 'Estate', 'Estate']
    });

    expect(trash2.newState!.trash.length).toBe(8);
    expect(trash2.newState!.players[0].hand.length).toBe(0); // All Estates trashed
  });
});
