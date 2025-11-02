import { GameEngine, GameState } from '@principality/core';

/**
 * Phase 4 Integration Tests: Curse Mechanics
 * @req: Test Curse distribution and scoring
 * @level: Integration
 * @count: 4 tests total
 */

describe('IT: Curse Mechanics', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('curse-test');
  });

  test('IT-CURSE-1: Curse supply scales with player count', () => {
    const game2p = engine.initializeGame(2);
    expect(game2p.supply.get('Curse')).toBe(10);

    const game3p = engine.initializeGame(3);
    expect(game3p.supply.get('Curse')).toBe(20);

    const game4p = engine.initializeGame(4);
    expect(game4p.supply.get('Curse')).toBe(30);
  });

  test('IT-CURSE-2: Curses reduce VP by -1 each', () => {
    const state = engine.initializeGame(1);
    const testState: GameState = {
      ...state,
      players: [{
        ...state.players[0],
        hand: [],
        deck: ['Curse', 'Curse', 'Curse', 'Estate', 'Estate'], // 3 Curses, 2 Estates
        discard: [],
        inPlay: []
      }]
    };

    const vp = engine.calculateVictoryPoints(testState, 0);

    // 2 Estates = 2 VP, 3 Curses = -3 VP, Total = -1 VP
    expect(vp).toBe(-1);
  });

  test('IT-CURSE-3: Chapel can trash Curses', () => {
    const state = engine.initializeGame(1);
    const testState: GameState = {
      ...state,
      phase: 'action',
      players: [{
        ...state.players[0],
        hand: ['Chapel', 'Curse', 'Curse', 'Curse'],
        actions: 1
      }]
    };

    const chapel = engine.executeMove(testState, { type: 'play_action', card: 'Chapel' });
    const trash = engine.executeMove(chapel.newState!, {
      type: 'trash_cards',
      cards: ['Curse', 'Curse', 'Curse']
    });

    expect(trash.newState!.trash.filter(c => c === 'Curse').length).toBe(3);
    expect(trash.newState!.players[0].hand).not.toContain('Curse');
  });

  test('IT-CURSE-4: Witch distributes Curses to all opponents', () => {
    const state = engine.initializeGame(3);
    const testState: GameState = {
      ...state,
      phase: 'action',
      currentPlayer: 0,
      supply: new Map([...state.supply, ['Curse', 20]]),
      players: [
        { ...state.players[0], hand: ['Witch'], actions: 1 },
        state.players[1],
        state.players[2]
      ]
    };

    const witch = engine.executeMove(testState, { type: 'play_action', card: 'Witch' });

    expect(witch.newState!.players[1].discard).toContain('Curse');
    expect(witch.newState!.players[2].discard).toContain('Curse');
    expect(witch.newState!.supply.get('Curse')).toBe(18); // 20 - 2
  });
});
