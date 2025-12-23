/**
 * Test for issue #80 fix: Throne Room stuck state when no action cards available
 */

import { GameEngine, GameState } from '@principality/core';

describe('Issue #80 Fix: Throne Room Skip', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('throne-room-skip-test');
  });

  test('should allow skipping Throne Room when no other actions in hand', () => {
    // Create a test state with Throne Room but no other actions
    const baseState = engine.initializeGame(1);
    const state: GameState = {
      ...baseState,
      players: [{
        ...baseState.players[0],
        hand: ['Throne Room', 'Copper', 'Copper', 'Copper', 'Estate'],
        actions: 1
      }],
      phase: 'action' as const
    };

    // Play Throne Room
    const afterPlay = engine.executeMove(state, { type: 'play_action', card: 'Throne Room' });
    expect(afterPlay.success).toBe(true);
    expect(afterPlay.newState?.pendingEffect?.effect).toBe('select_action_for_throne');

    // Get valid moves - should include skip option (move without card field)
    const validMoves = engine.getValidMoves(afterPlay.newState!);
    const skipMove = validMoves.find(m => m.type === 'select_action_for_throne' && !m.card);
    expect(skipMove).toBeDefined();

    // Execute the skip (move without card)
    const afterSkip = engine.executeMove(afterPlay.newState!, { type: 'select_action_for_throne' });
    expect(afterSkip.success).toBe(true);
    expect(afterSkip.newState?.pendingEffect).toBeUndefined();
    expect(afterSkip.newState?.gameLog.slice(-1)[0]).toContain('no action cards');
  });

  test('should not be stuck - valid moves should not be empty', () => {
    const baseState = engine.initializeGame(1);
    const state: GameState = {
      ...baseState,
      players: [{
        ...baseState.players[0],
        hand: ['Throne Room', 'Copper', 'Copper', 'Copper', 'Estate'],
        actions: 1
      }],
      phase: 'action' as const
    };

    const afterPlay = engine.executeMove(state, { type: 'play_action', card: 'Throne Room' });
    const validMoves = engine.getValidMoves(afterPlay.newState!);

    // Before fix: validMoves would be empty, causing stuck state
    // After fix: should have at least one valid move (the skip option)
    expect(validMoves.length).toBeGreaterThan(0);
  });
});
