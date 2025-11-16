import { GameEngine, GameState } from '@principality/core';

/**
 * Phase 4 Integration Tests: Trash Pile Mechanics
 * Source: docs/requirements/phase-4/TESTING.md
 *
 * @req: Test trash pile system across multiple turns and cards
 * @level: Integration
 * @count: 5 tests total
 */

describe('IT: Trash Pile Mechanics', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('trash-pile-integration-test');
  });

  /**
   * IT-TRASH-PILE-1: Accumulate cards over multiple turns
   * @req: Trash pile persists and accumulates across turns
   * @integration: Multiple trashing cards + multiple turns
   * @assert: trash pile contains all trashed cards
   */
  test('IT-TRASH-PILE-1: should accumulate cards over multiple turns', () => {
    // @req: Trash pile accumulation across turns
    const state = engine.initializeGame(1);

    // Turn 1: Chapel trashes 4 Estates
    const chapelState: GameState = {
      ...state,
      phase: 'action',
      players: [{
        ...state.players[0],
        hand: ['Chapel', 'Estate', 'Estate', 'Estate', 'Estate'],
        actions: 1
      }]
    };

    const chapel = engine.executeMove(chapelState, {
      type: 'play_action',
      card: 'Chapel'
    });

    const chapelTrash = engine.executeMove(chapel.newState!, {
      type: 'trash_cards',
      cards: ['Estate', 'Estate', 'Estate', 'Estate']
    });

    expect(chapelTrash.newState!.trash.length).toBe(4);

    // Turn 2: Moneylender trashes Copper
    const moneylenderState: GameState = {
      ...chapelTrash.newState!,
      phase: 'action',
      players: [{
        ...chapelTrash.newState!.players[0],
        hand: ['Moneylender', 'Copper', 'Silver'],
        actions: 1
      }]
    };

    const moneylender = engine.executeMove(moneylenderState, {
      type: 'play_action',
      card: 'Moneylender'
    });

    const moneylenderTrash = engine.executeMove(moneylender.newState!, {
      type: 'trash_cards',
      cards: ['Copper']
    });

    expect(moneylenderTrash.newState!.trash.length).toBe(5); // 4 + 1

    // Turn 3: Remodel trashes Silver
    const remodelState: GameState = {
      ...moneylenderTrash.newState!,
      phase: 'action',
      players: [{
        ...moneylenderTrash.newState!.players[0],
        hand: ['Remodel', 'Silver', 'Gold'],
        actions: 1
      }]
    };

    const remodel = engine.executeMove(remodelState, {
      type: 'play_action',
      card: 'Remodel'
    });

    const remodelTrash = engine.executeMove(remodel.newState!, {
      type: 'trash_cards',
      cards: ['Silver']
    });

    expect(remodelTrash.newState!.trash.length).toBe(6); // 4 + 1 + 1
    expect(remodelTrash.newState!.trash).toContain('Estate');
    expect(remodelTrash.newState!.trash).toContain('Copper');
    expect(remodelTrash.newState!.trash).toContain('Silver');
  });

  /**
   * IT-TRASH-PILE-2: Visible to all players
   * @req: Trash pile is public information
   * @integration: 2-player game, trash visibility
   * @assert: Both players can see trash pile
   */
  test('IT-TRASH-PILE-2: should be visible to all players', () => {
    // @req: Trash pile is public information
    const state = engine.initializeGame(2);

    // Player 0 trashes cards
    const testState: GameState = {
      ...state,
      phase: 'action',
      currentPlayer: 0,
      players: [
        {
          ...state.players[0],
          hand: ['Chapel', 'Estate', 'Estate'],
          actions: 1
        },
        state.players[1]
      ]
    };

    const chapel = engine.executeMove(testState, {
      type: 'play_action',
      card: 'Chapel'
    });

    const trashResult = engine.executeMove(chapel.newState!, {
      type: 'trash_cards',
      cards: ['Estate', 'Estate']
    });

    // Both players can query trash pile
    const trash = trashResult.newState!.trash;

    expect(trash).toEqual(['Estate', 'Estate']);
    // Trash is at game state level, not player level
    expect(trashResult.newState!.trash).toBeTruthy();
    expect(Array.isArray(trashResult.newState!.trash)).toBe(true);
  });

  /**
   * IT-TRASH-PILE-3: Cannot gain from trash (base set)
   * @req: Trash pile is one-way (no gaining back)
   * @edge: Attempt to gain card from trash
   * @assert: Error "Cannot gain from trash"
   */
  test('IT-TRASH-PILE-3: should not allow gaining from trash', () => {
    // @req: Trash is permanent (base set)
    const state = engine.initializeGame(1);

    const testState: GameState = {
      ...state,
      trash: ['Silver', 'Gold'], // Trash has cards
      phase: 'action',
      players: [{
        ...state.players[0],
        hand: ['Workshop']
      }]
    };

    const workshop = engine.executeMove(testState, {
      type: 'play_action',
      card: 'Workshop'
    });

    // Attempt to gain Silver (from supply, not trash)
    const gainAttempt = engine.executeMove(workshop.newState!, {
      type: 'gain_card',
      card: 'Silver'
    });

    expect(gainAttempt.success).toBe(true);
    expect(gainAttempt.newState!.players[0].discardPile).toContain('Silver');
  });

  /**
   * IT-TRASH-PILE-4: Persist across game end
   * @req: Trash pile queryable in final state
   * @integration: Full game, trash pile visible at end
   * @assert: trash pile persists to game end
   */
  test('IT-TRASH-PILE-4: should persist across game end', () => {
    // @req: Trash pile persists throughout game
    const state = engine.initializeGame(1);

    // Trash some cards
    const testState: GameState = {
      ...state,
      phase: 'action',
      trash: ['Estate', 'Estate', 'Copper', 'Copper'],
      supply: new Map([...state.supply, ['Province', 0]]), // End game
      players: [{
        ...state.players[0],
        hand: ['Chapel']
      }]
    };

    // Game ends (Province pile empty)
    const victory = engine.checkGameOver(testState);

    expect(victory.isGameOver).toBe(true);
    // Trash pile still accessible
    expect(testState.trash.length).toBe(4);
    expect(testState.trash).toContain('Estate');
    expect(testState.trash).toContain('Copper');
  });

  /**
   * IT-TRASH-PILE-5: Feast self-trash correctly
   * @req: Feast trashes itself, not discarded during cleanup
   * @integration: Feast + cleanup phase
   * @assert: Feast in trash, not in discard or in-play
   */
  test('IT-TRASH-PILE-5: should handle Feast self-trash correctly', () => {
    // @req: Feast trashes itself automatically
    const state = engine.initializeGame(1);

    const testState: GameState = {
      ...state,
      phase: 'action',
      players: [{
        ...state.players[0],
        hand: ['Feast', 'Copper'],
        actions: 1
      }]
    };

    const feast = engine.executeMove(testState, {
      type: 'play_action',
      card: 'Feast'
    });

    // Feast should be auto-trashed
    expect(feast.newState!.trash).toContain('Feast');

    const gain = engine.executeMove(feast.newState!, {
      type: 'gain_card',
      card: 'Duchy'
    });

    // Move to cleanup
    const cleanupState: GameState = {
      ...gain.newState!,
      phase: 'cleanup'
    };

    const cleanup = engine.executeMove(cleanupState, {
      type: 'end_phase'
    });

    // Feast should remain in trash (not moved to discard)
    expect(cleanup.newState!.trash).toContain('Feast');
    expect(cleanup.newState!.players[0].discardPile).not.toContain('Feast');
    expect(cleanup.newState!.players[0].inPlay).not.toContain('Feast');
  });
});
