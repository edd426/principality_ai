/**
 * Library Pending Effect Tests
 *
 * Verifies that filterStateForHuman passes through the drawnCard field
 * from the core PendingEffect to the ClientPendingEffect.
 *
 * @req GH-128 - Library drawnCard not passed through state filter
 */

import { filterStateForHuman } from '../services/state-filter';
import type { GameState } from '@principality/core';

function makeMinimalState(overrides: Partial<GameState> = {}): GameState {
  const base: GameState = {
    players: [
      {
        hand: ['Copper', 'Copper', 'Copper', 'Estate', 'Library'],
        drawPile: ['Silver', 'Gold'],
        discardPile: [],
        inPlay: [],
        actions: 1,
        buys: 1,
        coins: 0,
      },
      {
        hand: ['Copper', 'Copper', 'Copper', 'Estate', 'Estate'],
        drawPile: ['Silver'],
        discardPile: [],
        inPlay: [],
        actions: 1,
        buys: 1,
        coins: 0,
      },
    ],
    supply: new Map([
      ['Copper', 46],
      ['Silver', 40],
      ['Gold', 30],
      ['Estate', 8],
      ['Duchy', 8],
      ['Province', 8],
      ['Library', 10],
    ]),
    currentPlayer: 0,
    phase: 'action' as const,
    turnNumber: 1,
    gameLog: [],
    trash: [],
    pendingEffect: undefined,
    seed: 'test-seed',
  };
  return { ...base, ...overrides };
}

describe('Library pending effect - drawnCard passthrough', () => {
  it('should include drawnCard in ClientPendingEffect when Library draws an action card', () => {
    const state = makeMinimalState({
      pendingEffect: {
        card: 'Library',
        effect: 'library_set_aside',
        drawnCard: 'Village',
        targetPlayer: 0,
      },
    });

    const clientState = filterStateForHuman(state, 0);

    expect(clientState.pendingEffect).toBeDefined();
    expect(clientState.pendingEffect!.card).toBe('Library');
    expect(clientState.pendingEffect!.effect).toBe('library_set_aside');
    expect(clientState.pendingEffect!.drawnCard).toBe('Village');
  });

  it('should have drawnCard undefined when pendingEffect has no drawnCard', () => {
    const state = makeMinimalState({
      pendingEffect: {
        card: 'Chapel',
        effect: 'trash_cards',
        maxTrash: 4,
      },
    });

    const clientState = filterStateForHuman(state, 0);

    expect(clientState.pendingEffect).toBeDefined();
    expect(clientState.pendingEffect!.card).toBe('Chapel');
    expect(clientState.pendingEffect!.drawnCard).toBeUndefined();
  });

  it('should not include pendingEffect when none is set', () => {
    const state = makeMinimalState();

    const clientState = filterStateForHuman(state, 0);

    expect(clientState.pendingEffect).toBeUndefined();
  });
});
