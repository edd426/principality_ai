import { GameEngine, GameState } from '@principality/core';

/**
 * Phase 4 Integration Tests: Gaining Mechanics
 * @req: Test gaining system interactions
 * @level: Integration
 * @count: 4 tests total
 */

describe('IT: Gaining Mechanics', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('gaining-mechanics-test');
  });

  test('IT-GAIN-1: Gaining doesn\'t consume buys', () => {
    const state = engine.initializeGame(1);
    const testState: GameState = {
      ...state,
      phase: 'action',
      players: [{
        ...state.players[0],
        hand: ['Workshop', 'Copper', 'Copper', 'Copper'],
        actions: 1,
        buys: 1
      }]
    };

    const workshop = engine.executeMove(testState, { type: 'play_action', card: 'Workshop' });
    const gain = engine.executeMove(workshop.newState!, { type: 'gain_card', card: 'Silver' });

    expect(gain.newState!.players[0].buys).toBe(1); // Still has buy

    // Can still buy in buy phase
    const buyPhase: GameState = { ...gain.newState!, phase: 'buy', players: [{ ...gain.newState!.players[0], coins: 3 }] };
    const buy = engine.executeMove(buyPhase, { type: 'buy', card: 'Silver' });

    expect(buy.success).toBe(true);
  });

  test('IT-GAIN-2: Gained cards go to discard (default)', () => {
    const state = engine.initializeGame(1);
    const testState: GameState = {
      ...state,
      phase: 'action',
      players: [{ ...state.players[0], hand: ['Workshop', 'Feast'], actions: 2 }]
    };

    const workshop = engine.executeMove(testState, { type: 'play_action', card: 'Workshop' });
    const workshopGain = engine.executeMove(workshop.newState!, { type: 'gain_card', card: 'Smithy' });

    expect(workshopGain.newState!.players[0].discard).toContain('Smithy');
    expect(workshopGain.newState!.players[0].hand).not.toContain('Smithy');

    const feast = engine.executeMove(workshopGain.newState!, { type: 'play_action', card: 'Feast' });
    const feastGain = engine.executeMove(feast.newState!, { type: 'gain_card', card: 'Duchy' });

    expect(feastGain.newState!.players[0].discard).toContain('Duchy');
  });

  test('IT-GAIN-3: Mine gains to hand (exception)', () => {
    const state = engine.initializeGame(1);
    const testState: GameState = {
      ...state,
      phase: 'action',
      players: [{ ...state.players[0], hand: ['Mine', 'Copper'], actions: 1 }]
    };

    const mine = engine.executeMove(testState, { type: 'play_action', card: 'Mine' });
    const trash = engine.executeMove(mine.newState!, { type: 'trash_cards', cards: ['Copper'] });
    const gain = engine.executeMove(trash.newState!, { type: 'gain_card', card: 'Silver', destination: 'hand' });

    expect(gain.newState!.players[0].hand).toContain('Silver'); // To hand
    expect(gain.newState!.players[0].discard).not.toContain('Silver');
  });

  test('IT-GAIN-4: Supply properly decremented', () => {
    const state = engine.initializeGame(1);
    const initialSmithyCount = state.supply.get('Smithy')!;

    const testState: GameState = {
      ...state,
      phase: 'action',
      players: [{ ...state.players[0], hand: ['Workshop'], actions: 1 }]
    };

    const workshop = engine.executeMove(testState, { type: 'play_action', card: 'Workshop' });
    const gain = engine.executeMove(workshop.newState!, { type: 'gain_card', card: 'Smithy' });

    expect(gain.newState!.supply.get('Smithy')).toBe(initialSmithyCount - 1);
  });
});
