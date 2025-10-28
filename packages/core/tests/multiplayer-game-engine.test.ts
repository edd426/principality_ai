import { GameEngine } from '../src/game';
import { GameState, Move } from '../src/types';

// @req: FR 1.1-1.5 Multiplayer Game Engine
// @edge: 2-player initialization; player state isolation; turn tracking; solo backward compatibility
// @why: Foundation for multiplayer - ensures player independence and turn management work correctly

describe('Feature 1: Multiplayer Game Engine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('test-multiplayer-001');
  });

  // ============================================================================
  // UNIT TESTS: Game State Structure (UT 1.1 - UT 1.4)
  // ============================================================================

  describe('UT 1.1: GameState Structure - 2 Players', () => {
    test('should initialize 2-player game with correct structure', () => {
      // @req: FR 1.1 - GameState contains 2 PlayerState objects
      // @input: initializeGame(2)
      // @output: GameState with players array of length 2
      // @level: Unit
      // @assert: players.length === 2, currentPlayer === 0, phase === 'action'

      const state = engine.initializeGame(2);

      expect(state.players).toHaveLength(2);
      expect(state.currentPlayer).toBe(0);
      expect(state.phase).toBe('action');
      expect(state.turnNumber).toBe(1);
    });

    test('should create distinct player objects', () => {
      // @req: FR 1.1 - players[0] and players[1] are distinct
      // @assert: players[0] !== players[1] (different object references)

      const state = engine.initializeGame(2);

      expect(state.players[0]).not.toBe(state.players[1]);
      expect(state.players[0].hand).not.toBe(state.players[1].hand);
      expect(state.players[0].drawPile).not.toBe(state.players[1].drawPile);
    });
  });

  describe('UT 1.2: GameState Structure - Solo Backward Compatibility', () => {
    test('should initialize 1-player game (solo mode)', () => {
      // @req: FR 1.5 - Solo games still work
      // @input: initializeGame(1)
      // @output: GameState with single player (Phase 1 compatible)
      // @level: Unit
      // @assert: players.length === 1

      const state = engine.initializeGame(1);

      expect(state.players).toHaveLength(1);
      expect(state.currentPlayer).toBe(0);
      expect(state.phase).toBe('action');
    });

    test('should default to 1 player when no argument provided', () => {
      // @req: FR 1.5 - Default to solo mode
      // @assert: initializeGame() === initializeGame(1)

      const defaultState = engine.initializeGame();
      const soloState = engine.initializeGame(1);

      expect(defaultState.players).toHaveLength(1);
      expect(soloState.players).toHaveLength(1);
    });
  });

  describe('UT 1.3: Player 0 Starting Hand', () => {
    test('should give Player 0 correct starting hand and deck', () => {
      // @req: FR 1.2 - Player 0 hand correctly initialized
      // @input: initializeGame(2)
      // @output: P0 has 5-card starting hand
      // @level: Unit
      // @assert: players[0].hand.length === 5, players[0].drawPile.length === 5

      const state = engine.initializeGame(2);
      const p0 = state.players[0];

      expect(p0.hand).toHaveLength(5);
      expect(p0.drawPile).toHaveLength(5);
      expect(p0.discardPile).toHaveLength(0);

      // All cards should be valid (Copper or Estate)
      const allCards = [...p0.hand, ...p0.drawPile];
      allCards.forEach(card => {
        expect(['Copper', 'Estate']).toContain(card);
      });

      // Should have 7 Copper and 3 Estate total
      const copperCount = allCards.filter(c => c === 'Copper').length;
      const estateCount = allCards.filter(c => c === 'Estate').length;
      expect(copperCount).toBe(7);
      expect(estateCount).toBe(3);
    });

    test('should have different hand order with different seed', () => {
      // @req: FR 1.2 - Seed affects shuffle
      // @edge: Different seeds produce different hand orders

      const engine1 = new GameEngine('seed-1');
      const engine2 = new GameEngine('seed-2');

      const state1 = engine1.initializeGame(2);
      const state2 = engine2.initializeGame(2);

      // Hands should be different due to different seeds
      const hands1 = state1.players[0].hand.join(',');
      const hands2 = state2.players[0].hand.join(',');

      // Very unlikely to be identical with different seeds
      expect(hands1).not.toBe(hands2);
    });
  });

  describe('UT 1.4: Player 1 Starting Hand', () => {
    test('should give Player 1 independent starting hand', () => {
      // @req: FR 1.2 - Player 1 hand independently initialized
      // @input: initializeGame(2)
      // @output: P1 has independent 5-card starting hand
      // @level: Unit
      // @assert: players[1].hand.length === 5

      const state = engine.initializeGame(2);
      const p1 = state.players[1];

      expect(p1.hand).toHaveLength(5);
      expect(p1.drawPile).toHaveLength(5);
      expect(p1.discardPile).toHaveLength(0);
    });

    test('should give different hand order to Player 1', () => {
      // @req: FR 1.2 - P1 hand different from P0 (same cards, different order)
      // @edge: P0.hand !== P1.hand (different order due to seeded shuffle)

      const state = engine.initializeGame(2);
      const p0Hand = state.players[0].hand.join(',');
      const p1Hand = state.players[1].hand.join(',');

      // Hands should be in different order (rare to be same with seeded RNG)
      expect(p0Hand).not.toBe(p1Hand);

      // But both should have same card distribution
      const p0Cards = [...state.players[0].hand, ...state.players[0].drawPile];
      const p1Cards = [...state.players[1].hand, ...state.players[1].drawPile];

      const p0Copper = p0Cards.filter(c => c === 'Copper').length;
      const p1Copper = p1Cards.filter(c => c === 'Copper').length;
      expect(p0Copper).toBe(7);
      expect(p1Copper).toBe(7);
    });
  });

  // ============================================================================
  // UNIT TESTS: Player State Isolation (UT 1.5 - UT 1.6)
  // ============================================================================

  describe('UT 1.5: Player State Isolation - Hand Changes', () => {
    test('should not affect P1 hand when P0 hand changes', () => {
      // @req: FR 1.3 - Changes to P0 hand don't affect P1
      // @input: initializeGame(2), executeMove(play_treasure, 'Copper')
      // @output: P0 hand modified, P1 hand unchanged
      // @level: Unit

      const state1 = engine.initializeGame(2);
      const p1HandBefore = state1.players[1].hand;

      // Execute move for Player 0
      const result = engine.executeMove(state1, { type: 'play_treasure', card: 'Copper' });

      expect(result.success).toBe(true);
      expect(result.newState).toBeDefined();

      if (result.newState) {
        const state2 = result.newState;

        // P0 hand should change
        expect(state2.players[0].hand).not.toBe(state1.players[0].hand);

        // P1 hand should be unchanged (same reference)
        expect(state2.players[1].hand).toBe(p1HandBefore);
      }
    });

    test('should preserve immutability when P0 hand changes', () => {
      // @req: FR 1.3 - Original state unchanged
      // @assert: Original state1 unmodified after creating state2

      const state1 = engine.initializeGame(2);
      const p0HandBefore = state1.players[0].hand;

      engine.executeMove(state1, { type: 'play_treasure', card: 'Copper' });

      // Original state should be unchanged
      expect(state1.players[0].hand).toBe(p0HandBefore);
    });
  });

  describe('UT 1.6: Player State Isolation - Coins', () => {
    test('should not affect P1 coins when P0 plays treasure', () => {
      // @req: FR 1.3 - P0 coins don't affect P1 coins
      // @input: initializeGame(2), executeMove(play_treasure, 'Silver')
      // @output: P0 coins increased, P1 coins unchanged
      // @level: Unit

      const state1 = engine.initializeGame(2);

      // Move to buy phase
      const buyState: GameState = {
        ...state1,
        phase: 'buy',
        players: [
          {
            ...state1.players[0],
            hand: ['Copper', 'Silver', 'Estate', 'Duchy', 'Village'],
            actions: 0,
            coins: 0
          },
          state1.players[1]
        ]
      };

      const result = engine.executeMove(buyState, { type: 'play_treasure', card: 'Silver' });

      if (result.newState) {
        const state2 = result.newState;

        // P0 should have 2 coins (from Silver)
        expect(state2.players[0].coins).toBe(2);

        // P1 should still have 0 coins
        expect(state2.players[1].coins).toBe(0);
      }
    });
  });

  // ============================================================================
  // UNIT TESTS: Turn Tracking (UT 1.7 - UT 1.10)
  // ============================================================================

  describe('UT 1.7: Turn Tracking - Initial State', () => {
    test('should initialize with Player 0, Turn 1, Action phase', () => {
      // @req: FR 1.4 - Turn tracking initializes correctly
      // @input: initializeGame(2)
      // @output: currentPlayer=0, turnNumber=1, phase='action'
      // @level: Unit

      const state = engine.initializeGame(2);

      expect(state.currentPlayer).toBe(0);
      expect(state.turnNumber).toBe(1);
      expect(state.phase).toBe('action');
    });
  });

  describe('UT 1.8: Current Player After Move', () => {
    test('should keep current player as P0 through phases', () => {
      // @req: FR 1.4 - currentPlayer remains 0 until cleanup
      // @input: initializeGame(2), execute phase transition
      // @output: currentPlayer still 0, phase advanced
      // @level: Unit

      const state1 = engine.initializeGame(2);

      // End action phase
      const result1 = engine.executeMove(state1, { type: 'end_phase' });

      expect(result1.newState?.currentPlayer).toBe(0);
      expect(result1.newState?.phase).not.toBe('action');
    });
  });

  describe('UT 1.9: Player Switch After Cleanup', () => {
    test('should switch to Player 1 after P0 cleanup', () => {
      // @req: FR 1.4 - currentPlayer switches after P0 cleanup
      // @input: 2-player game in cleanup phase for P0
      // @output: currentPlayer switches to 1
      // @level: Unit

      const state = engine.initializeGame(2);

      // Execute moves to reach cleanup phase
      let currentState = state;

      // End action phase
      let result = engine.executeMove(currentState, { type: 'end_phase' });
      currentState = result.newState!;

      // End buy phase
      result = engine.executeMove(currentState, { type: 'end_phase' });
      currentState = result.newState!;

      // End cleanup phase - should switch to P1
      result = engine.executeMove(currentState, { type: 'end_phase' });

      if (result.newState) {
        expect(result.newState.currentPlayer).toBe(1);
        expect(result.newState.phase).toBe('action');
      }
    });
  });

  describe('UT 1.10: Turn Number Increment', () => {
    test('should increment turn number after both players complete full turn', () => {
      // @req: FR 1.4 - turnNumber increments after both players complete cleanup
      // @input: 2-player game, both players complete full turn
      // @output: turnNumber increments from 1 to 2
      // @level: Unit

      const state1 = engine.initializeGame(2);
      expect(state1.turnNumber).toBe(1);

      let currentState = state1;

      // Player 0: action -> buy -> cleanup
      currentState = engine.executeMove(currentState, { type: 'end_phase' }).newState!;
      currentState = engine.executeMove(currentState, { type: 'end_phase' }).newState!;
      currentState = engine.executeMove(currentState, { type: 'end_phase' }).newState!;

      // After P0 cleanup, still turn 1 but now P1
      expect(currentState.turnNumber).toBe(1);
      expect(currentState.currentPlayer).toBe(1);

      // Player 1: action -> buy -> cleanup
      currentState = engine.executeMove(currentState, { type: 'end_phase' }).newState!;
      currentState = engine.executeMove(currentState, { type: 'end_phase' }).newState!;
      currentState = engine.executeMove(currentState, { type: 'end_phase' }).newState!;

      // After P1 cleanup, turn should increment to 2
      expect(currentState.turnNumber).toBe(2);
      expect(currentState.currentPlayer).toBe(0);
    });
  });

  // ============================================================================
  // UNIT TESTS: Supply and Deck Management (UT 1.11 - UT 1.12)
  // ============================================================================

  describe('UT 1.11: Supply Shared Between Players', () => {
    test('should initialize shared supply visible to both players', () => {
      // @req: FR 1.2 - Supply is shared between players
      // @input: initializeGame(2)
      // @output: Single supply, modifications visible to both
      // @level: Unit

      const state = engine.initializeGame(2);

      expect(state.supply).toBeDefined();
      expect(state.supply.get('Copper')).toBe(60);
      expect(state.supply.get('Silver')).toBe(40);
      expect(state.supply.get('Gold')).toBe(30);
    });

    test('should show supply changes to both players', () => {
      // @req: FR 1.2 - P0 buy changes supply, P1 sees change

      const state1 = engine.initializeGame(2);
      const copperBefore = state1.supply.get('Copper')!;

      // Set up buy phase with enough coins
      const buyState: GameState = {
        ...state1,
        phase: 'buy',
        players: [
          {
            ...state1.players[0],
            hand: ['Copper', 'Copper', 'Copper', 'Estate', 'Duchy'],
            actions: 0,
            coins: 3
          },
          state1.players[1]
        ]
      };

      const result = engine.executeMove(buyState, { type: 'buy', card: 'Copper' });

      if (result.newState) {
        const copperAfter = result.newState.supply.get('Copper')!;
        expect(copperAfter).toBe(copperBefore - 1);
      }
    });
  });

  describe('UT 1.12: Player Deck Isolation', () => {
    test('should give each player independent deck', () => {
      // @req: FR 1.3 - Each player has independent deck
      // @input: initializeGame(2)
      // @output: players[0].drawPile !== players[1].drawPile
      // @level: Unit

      const state = engine.initializeGame(2);

      expect(state.players[0].drawPile).not.toBe(state.players[1].drawPile);
      expect(state.players[0].hand).not.toBe(state.players[1].hand);

      // Decks should have same size but different content (due to shuffle)
      expect(state.players[0].drawPile).toHaveLength(5);
      expect(state.players[1].drawPile).toHaveLength(5);
    });
  });

  // ============================================================================
  // INTEGRATION TESTS: Full Game Flows (IT 1.1 - IT 1.5)
  // ============================================================================

  describe('IT 1.1: Solo Game Flow Still Works', () => {
    test('should complete 10-turn solo game without errors', () => {
      // @req: FR 1.5 - Solo games compatible with Phase 1
      // @input: Full solo game (10 turns)
      // @output: Game completes successfully
      // @level: Integration

      const state = engine.initializeGame(1);
      let currentState = state;
      let moves = 0;

      // Play 10 turns (30 phases per turn: action, buy, cleanup)
      for (let turn = 0; turn < 10; turn++) {
        // Action phase
        const result1 = engine.executeMove(currentState, { type: 'end_phase' });
        expect(result1.success).toBe(true);
        currentState = result1.newState!;
        moves++;

        // Buy phase
        const result2 = engine.executeMove(currentState, { type: 'end_phase' });
        expect(result2.success).toBe(true);
        currentState = result2.newState!;
        moves++;

        // Cleanup phase
        const result3 = engine.executeMove(currentState, { type: 'end_phase' });
        expect(result3.success).toBe(true);
        currentState = result3.newState!;
        moves++;
      }

      expect(moves).toBe(30);
      expect(currentState.turnNumber).toBeGreaterThan(1);
    });
  });

  describe('IT 1.2: 2-Player Game Flow', () => {
    test('should execute moves for both players correctly', () => {
      // @req: FR 1.1-1.4 - 2-player game initializes and plays
      // @input: initializeGame(2), 3 moves for each player
      // @output: Correct player states after each move
      // @level: Integration

      const state = engine.initializeGame(2);
      let currentState = state;

      // P0 turn: action -> buy -> cleanup
      currentState = engine.executeMove(currentState, { type: 'end_phase' }).newState!;
      expect(currentState.currentPlayer).toBe(0);
      expect(currentState.phase).toBe('buy');

      currentState = engine.executeMove(currentState, { type: 'end_phase' }).newState!;
      expect(currentState.currentPlayer).toBe(0);
      expect(currentState.phase).toBe('cleanup');

      currentState = engine.executeMove(currentState, { type: 'end_phase' }).newState!;
      expect(currentState.currentPlayer).toBe(1);
      expect(currentState.phase).toBe('action');

      // P1 turn: action -> buy -> cleanup
      currentState = engine.executeMove(currentState, { type: 'end_phase' }).newState!;
      expect(currentState.currentPlayer).toBe(1);
      expect(currentState.phase).toBe('buy');

      currentState = engine.executeMove(currentState, { type: 'end_phase' }).newState!;
      expect(currentState.currentPlayer).toBe(1);
      expect(currentState.phase).toBe('cleanup');

      currentState = engine.executeMove(currentState, { type: 'end_phase' }).newState!;
      expect(currentState.currentPlayer).toBe(0);
      expect(currentState.turnNumber).toBe(2);
    });
  });

  describe('IT 1.3: Multiple 2-Player Games Sequential', () => {
    test('should play two games independently', () => {
      // @req: FR 1.1-1.4 - Can play multiple games sequentially
      // @input: Play game 1, reset, play game 2
      // @output: Both games complete successfully, independent
      // @level: Integration

      const engine1 = new GameEngine('seed-game-1');
      const engine2 = new GameEngine('seed-game-2');

      const game1 = engine1.initializeGame(2);
      const game2 = engine2.initializeGame(2);

      // Games should have different seeds
      expect(game1.seed).not.toBe(game2.seed);

      // Both should be valid
      expect(game1.players).toHaveLength(2);
      expect(game2.players).toHaveLength(2);
      expect(game1.currentPlayer).toBe(0);
      expect(game2.currentPlayer).toBe(0);
    });
  });

  describe('IT 1.4: Player Deck Reshuffling', () => {
    test('should reshuffle deck when empty during draw', () => {
      // @req: FR 1.2 - Deck reshuffles when empty during draw
      // @input: 2-player game, force deck empty scenario
      // @output: Discard pile shuffled into deck
      // @level: Integration

      const state = engine.initializeGame(2);

      // Create state where P0 has empty deck but cards in discard
      const testState: GameState = {
        ...state,
        phase: 'cleanup',
        players: [
          {
            ...state.players[0],
            drawPile: [],
            hand: ['Copper', 'Silver', 'Estate', 'Duchy', 'Village'],
            inPlay: ['Gold'],
            discardPile: ['Copper', 'Copper', 'Copper', 'Smithy', 'Estate']
          },
          state.players[1]
        ]
      };

      // Execute cleanup - should reshuffle
      const result = engine.executeMove(testState, { type: 'end_phase' });

      if (result.newState) {
        // After cleanup for P0, move to P1 and verify P0's new state
        // P0 should have cards drawn from reshuffled deck
        const p0 = result.newState.players[0];
        expect(p0.hand.length + p0.drawPile.length + p0.inPlay.length).toBeGreaterThan(0);
      }
    });
  });

  describe('IT 1.5: State Immutability Across 2 Players', () => {
    test('should not mutate original state when creating new state', () => {
      // @req: FR 1.3 - GameState remains immutable with 2 players
      // @input: initializeGame(2), executeMove, compare states
      // @output: Original state unchanged, new state returned
      // @level: Integration

      const state1 = engine.initializeGame(2);
      const state1Copy = JSON.stringify(state1);

      engine.executeMove(state1, { type: 'end_phase' });

      const state1After = JSON.stringify(state1);

      // Original state should be unchanged
      expect(state1After).toBe(state1Copy);
    });

    test('should create truly independent copies for both players', () => {
      // @req: FR 1.3 - New state is independent of old state

      const state1 = engine.initializeGame(2);
      const result = engine.executeMove(state1, { type: 'end_phase' });

      if (result.newState) {
        const state2 = result.newState;

        // States should be different
        expect(state1).not.toBe(state2);

        // But both should have valid structure
        expect(state1.players).toHaveLength(2);
        expect(state2.players).toHaveLength(2);
      }
    });
  });
});
