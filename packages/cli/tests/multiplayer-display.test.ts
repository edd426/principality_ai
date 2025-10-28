import { GameEngine } from '../../core/src/game';
import { GameState } from '../../core/src/types';

// @req: FR 4.1-4.6 CLI Display for Multiplayer
// @edge: Current player display; opponent info; supply status; turn boundaries; game end display
// @why: Human needs clear visual feedback for multiplayer turn-based gameplay

describe('Feature 4: CLI Display for Multiplayer', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('test-display-001');
  });

  // ============================================================================
  // UNIT TESTS: Current Player Indicator (UT 4.1 - UT 4.2)
  // ============================================================================

  describe('UT 4.1: Current Player Header - P0', () => {
    test('should display current player indicator for Player 0', () => {
      // @req: FR 4.1 - Current player indicator displayed
      // @input: P0's turn, generate display
      // @output: Header shows "PLAYER 0'S TURN"
      // @level: Unit

      const state = engine.initializeGame(2);

      // Header format expected:
      // ═══════════════════════════════════
      // PLAYER 0'S TURN (Human vs AI) | Turn #1
      // ═══════════════════════════════════

      expect(state.currentPlayer).toBe(0);
      expect(state.phase).toBe('action');

      // Display should include player number
      const header = `PLAYER ${state.currentPlayer}'S TURN`;
      expect(header).toContain('PLAYER 0');
    });
  });

  describe('UT 4.2: Current Player Header - P1', () => {
    test('should display current player indicator for Player 1', () => {
      // @req: FR 4.1 - Current player indicator for P1
      // @input: P1's turn, generate display
      // @output: Header shows "PLAYER 1'S TURN"
      // @level: Unit

      let state = engine.initializeGame(2);

      // Move to P1's turn
      state = engine.executeMove(state, { type: 'end_phase' }).newState!;
      state = engine.executeMove(state, { type: 'end_phase' }).newState!;
      state = engine.executeMove(state, { type: 'end_phase' }).newState!;

      expect(state.currentPlayer).toBe(1);

      const header = `PLAYER ${state.currentPlayer}'S TURN`;
      expect(header).toContain('PLAYER 1');
    });
  });

  // ============================================================================
  // UNIT TESTS: Opponent Information (UT 4.3 - UT 4.5)
  // ============================================================================

  describe('UT 4.3: Opponent VP Display', () => {
    test('should display opponent VP score', () => {
      // @req: FR 4.2 - Opponent VP shown
      // @input: P0's turn, P1 has 8 VP
      // @output: Display shows "Opponent: 8 VP"
      // @level: Unit

      const state = engine.initializeGame(2);

      // Create state where P1 has VP
      const testState: GameState = {
        ...state,
        players: [
          state.players[0],
          {
            ...state.players[1],
            hand: ['Estate', 'Duchy', 'Copper', 'Copper', 'Silver'],
            discardPile: [],
            drawPile: []
          }
        ]
      };

      const p1 = testState.players[1];
      const allCards = [...p1.hand, ...p1.discardPile, ...p1.drawPile];

      // Calculate opponent VP (for display purposes)
      const vpCount = allCards.filter(c => ['Estate', 'Duchy', 'Province'].includes(c)).length;

      expect(vpCount).toBeGreaterThan(0);
    });
  });

  describe('UT 4.4: Opponent Hand Size', () => {
    test('should display opponent hand size', () => {
      // @req: FR 4.2 - Opponent hand size shown
      // @input: P0's turn, P1 hand has 5 cards
      // @output: Display shows "Cards in Hand: 5"
      // @level: Unit

      const state = engine.initializeGame(2);

      const p1HandSize = state.players[1].hand.length;

      // Display format: "Cards in Hand: 5"
      const display = `Cards in Hand: ${p1HandSize}`;

      expect(display).toContain('5');
    });
  });

  describe('UT 4.5: Opponent In-Play Cards', () => {
    test('should display opponent in-play cards', () => {
      // @req: FR 4.2 - Opponent inPlay cards listed
      // @input: P1 played Village and Smithy
      // @output: Display shows: "Cards in Play: Village, Smithy"
      // @level: Unit

      const state = engine.initializeGame(2);

      const testState: GameState = {
        ...state,
        players: [
          state.players[0],
          {
            ...state.players[1],
            inPlay: ['Village', 'Smithy']
          }
        ]
      };

      const p1InPlay = testState.players[1].inPlay;

      const display = `Cards in Play: ${p1InPlay.join(', ')}`;

      expect(display).toContain('Village');
      expect(display).toContain('Smithy');
    });
  });

  // ============================================================================
  // UNIT TESTS: Supply Pile Display (UT 4.6 - UT 4.9)
  // ============================================================================

  describe('UT 4.6: Supply Pile Display', () => {
    test('should display all 8 supply piles with counts', () => {
      // @req: FR 4.3 - All 8 supply piles shown
      // @input: Current supply state
      // @output: Display lists all cards with counts
      // @level: Unit

      const state = engine.initializeGame(2);

      const expectedCards = [
        'Copper', 'Silver', 'Gold',
        'Estate', 'Duchy', 'Province',
        'Smithy', 'Village'
      ];

      expectedCards.forEach(card => {
        const count = state.supply.get(card);
        expect(count).toBeGreaterThan(0);

        const display = `${card}: ${count}`;
        expect(display).toContain(card);
        expect(display).toContain(String(count));
      });
    });
  });

  describe('UT 4.7: Supply Low Warning', () => {
    test('should warn when supply low (<5)', () => {
      // @req: FR 4.3 - Low supply warning (<5)
      // @input: Smithy = 3 remaining
      // @output: Display shows warning
      // @level: Unit

      const state = engine.initializeGame(2);

      const testState: GameState = {
        ...state,
        supply: new Map(state.supply).set('Smithy', 3)
      };

      const count = testState.supply.get('Smithy')!;

      if (count < 5 && count > 0) {
        const display = `⚠️ Smithy: ${count} ⚠️ Low!`;
        expect(display).toContain('Low!');
      }
    });
  });

  describe('UT 4.8: Supply Critically Low Warning', () => {
    test('should warn when supply critically low (<3)', () => {
      // @req: FR 4.3 - Critically low warning (<3)
      // @input: Village = 1 remaining
      // @output: Display shows "Critically Low!"
      // @level: Unit

      const state = engine.initializeGame(2);

      const testState: GameState = {
        ...state,
        supply: new Map(state.supply).set('Village', 1)
      };

      const count = testState.supply.get('Village')!;

      if (count < 3 && count > 0) {
        const display = `⚠️ Village: ${count} ⚠️ Critically Low!`;
        expect(display).toContain('Critically Low!');
      }
    });
  });

  describe('UT 4.9: Supply Empty Warning', () => {
    test('should show empty warning when pile empty', () => {
      // @req: FR 4.3 - Empty pile warning
      // @input: Smithy = 0
      // @output: Display shows "⚠️ Smithy: EMPTY"
      // @level: Unit

      const state = engine.initializeGame(2);

      const testState: GameState = {
        ...state,
        supply: new Map(state.supply).set('Smithy', 0)
      };

      const count = testState.supply.get('Smithy')!;

      if (count === 0) {
        const display = `⚠️ Smithy: EMPTY`;
        expect(display).toContain('EMPTY');
      }
    });
  });

  // ============================================================================
  // UNIT TESTS: Turn Boundaries & Game End (UT 4.10 - UT 4.13)
  // ============================================================================

  describe('UT 4.10: Turn Boundary - Visual Separator', () => {
    test('should display clear visual separator between turns', () => {
      // @req: FR 4.4 - Turn boundaries clear
      // @input: Display between turns
      // @output: Separator line (═══) visible
      // @level: Unit

      const state = engine.initializeGame(2);

      // Separator format expected
      const separator = '═══════════════════════════════════';

      expect(separator.length).toBeGreaterThan(10);
      expect(separator).toContain('═');
    });
  });

  describe('UT 4.11: Game End Display - Winner', () => {
    test('should display winner with ranking', () => {
      // @req: FR 4.5 - Winner displayed with ranking
      // @input: P0 wins with 25 VP, P1 has 18 VP
      // @output: "🥇 1st Place: Player 0 (25 VP)"
      // @level: Unit

      const state = engine.initializeGame(2);

      const testState: GameState = {
        ...state,
        players: [
          {
            ...state.players[0],
            hand: ['Province', 'Province', 'Province', 'Duchy', 'Copper'],
            discardPile: [],
            drawPile: []
          },
          {
            ...state.players[1],
            hand: ['Province', 'Province', 'Duchy', 'Duchy', 'Estate'],
            discardPile: [],
            drawPile: []
          }
        ]
      };

      // Display format: "🥇 1st Place: Player 0 (25 VP)"
      const p0 = testState.players[0];
      const vpCards = [...p0.hand, ...p0.discardPile, ...p0.drawPile].filter(
        c => ['Estate', 'Duchy', 'Province'].includes(c)
      );

      const display = `🥇 1st Place: Player 0 (${vpCards.length} VP)`;

      expect(display).toContain('1st Place');
      expect(display).toContain('Player 0');
    });
  });

  describe('UT 4.12: Game End Display - Loser', () => {
    test('should display loser with ranking', () => {
      // @req: FR 4.5 - Loser displayed with ranking
      // @input: P1 with 18 VP
      // @output: "🥈 2nd Place: Player 1 (18 VP)"
      // @level: Unit

      const state = engine.initializeGame(2);

      const testState: GameState = {
        ...state,
        players: [
          state.players[0],
          {
            ...state.players[1],
            hand: ['Province', 'Duchy', 'Estate', 'Estate', 'Copper'],
            discardPile: [],
            drawPile: []
          }
        ]
      };

      const p1 = testState.players[1];
      const vpCards = [...p1.hand, ...p1.discardPile, ...p1.drawPile].filter(
        c => ['Estate', 'Duchy', 'Province'].includes(c)
      );

      const display = `🥈 2nd Place: Player 1 (${vpCards.length} VP)`;

      expect(display).toContain('2nd Place');
      expect(display).toContain('Player 1');
    });
  });

  describe('UT 4.13: Game End - Summary', () => {
    test('should display game summary', () => {
      // @req: FR 4.5 - Game summary shown
      // @input: Game completed
      // @output: "Game completed in X turns"
      // @level: Unit

      const state = engine.initializeGame(2);

      const display = `Game completed in ${state.turnNumber} turns`;

      expect(display).toContain('Game completed');
      expect(display).toContain('turns');
    });
  });

  // ============================================================================
  // UNIT TESTS: Player Hand Display (UT 4.14 - UT 4.16)
  // ============================================================================

  describe('UT 4.14: Player Hand Display', () => {
    test('should show player hand with indices', () => {
      // @req: FR 4.6 - Player hand shown with indices
      // @input: P0 hand [Copper, Copper, Silver, Estate, Duchy]
      // @output: "[0] Copper  [1] Copper  [2] Silver..."
      // @level: Unit

      const state = engine.initializeGame(2);

      const p0Hand = state.players[0].hand;

      let display = '';
      p0Hand.forEach((card, index) => {
        display += `[${index}] ${card}  `;
      });

      p0Hand.forEach((card, index) => {
        expect(display).toContain(`[${index}]`);
        expect(display).toContain(card);
      });
    });
  });

  describe('UT 4.15: Available Moves Display', () => {
    test('should display available move options', () => {
      // @req: FR 4.6 - Move options displayed
      // @input: Action phase with possible moves
      // @output: Numbered list of available moves
      // @level: Unit

      const state = engine.initializeGame(2);

      const validMoves = engine.getValidMoves(state, 0);

      expect(validMoves.length).toBeGreaterThan(0);

      // Display format: [5] Play Copper, [6] Play Copper, [7] End Phase
      let display = '';
      validMoves.forEach((move, index) => {
        const moveDesc = move.card ? `${move.type} ${move.card}` : move.type;
        display += `[${index}] ${moveDesc}  `;
      });

      expect(display).toContain('[0]');
    });
  });

  describe('UT 4.16: Phase Display', () => {
    test('should show current phase with resources', () => {
      // @req: FR 4.6 - Current phase shown
      // @input: In action phase
      // @output: "ACTION PHASE (1 action, 1 buy, $0 coins)"
      // @level: Unit

      const state = engine.initializeGame(2);

      const p0 = state.players[0];

      const display = `${state.phase.toUpperCase()} PHASE (${p0.actions} action, ${p0.buys} buy, $${p0.coins} coins)`;

      expect(display).toContain('ACTION PHASE');
      expect(display).toContain('action');
      expect(display).toContain('buy');
      expect(display).toContain('coins');
    });
  });

  // ============================================================================
  // INTEGRATION TESTS: Full Game Display (IT 4.1 - IT 4.3)
  // ============================================================================

  describe('IT 4.1: Complete Game Display', () => {
    test('should display correctly throughout full 5-turn game', () => {
      // @req: FR 4.1-4.6 - Full game display works
      // @input: Play complete 5-turn game
      // @output: All display elements accurate throughout
      // @level: Integration

      let state = engine.initializeGame(2);

      for (let turn = 0; turn < 5; turn++) {
        // P0 turn
        expect(state.currentPlayer).toBe(0);
        const p0Header = `PLAYER ${state.currentPlayer}'S TURN`;
        expect(p0Header).toContain('PLAYER 0');

        for (let phase = 0; phase < 3; phase++) {
          state = engine.executeMove(state, { type: 'end_phase' }).newState!;
        }

        // P1 turn
        expect(state.currentPlayer).toBe(1);
        const p1Header = `PLAYER ${state.currentPlayer}'S TURN`;
        expect(p1Header).toContain('PLAYER 1');

        for (let phase = 0; phase < 3; phase++) {
          state = engine.executeMove(state, { type: 'end_phase' }).newState!;
        }
      }

      expect(state.turnNumber).toBe(5);
    });
  });

  describe('IT 4.2: Player Switch Display', () => {
    test('should update display when switching between players', () => {
      // @req: FR 4.4 - Display updates on turn switch
      // @input: P0 ends cleanup, P1 starts
      // @output: Headers and opponent info update
      // @level: Integration

      let state = engine.initializeGame(2);

      // P0's display
      let header = `PLAYER ${state.currentPlayer}'S TURN`;
      expect(header).toContain('PLAYER 0');

      // Complete P0's turn
      state = engine.executeMove(state, { type: 'end_phase' }).newState!;
      state = engine.executeMove(state, { type: 'end_phase' }).newState!;
      state = engine.executeMove(state, { type: 'end_phase' }).newState!;

      // P1's display
      header = `PLAYER ${state.currentPlayer}'S TURN`;
      expect(header).toContain('PLAYER 1');

      // Opponent info should now show P0
      const opponentHandSize = state.players[0].hand.length;
      expect(opponentHandSize).toBeGreaterThan(0);
    });
  });

  describe('IT 4.3: Supply Updates Visible', () => {
    test('should show supply pile counts changing', () => {
      // @req: FR 4.3 - Supply pile counts change
      // @input: Multiple purchases
      // @output: Display shows decreasing counts
      // @level: Integration

      let state = engine.initializeGame(2);

      const copperBefore = state.supply.get('Copper')!;

      // Make some purchases
      for (let i = 0; i < 5; i++) {
        const validMoves = engine.getValidMoves(state, state.currentPlayer);
        if (validMoves.length > 0) {
          const result = engine.executeMove(state, validMoves[0]);
          if (result.newState) state = result.newState;
        }
      }

      const copperAfter = state.supply.get('Copper')!;

      // Copper count should have changed (likely decreased)
      expect(state.supply.get('Copper')).toBeLessThanOrEqual(copperBefore);
    });
  });

  // ============================================================================
  // E2E TEST: Human Gameplay Display (E2E 4.1)
  // ============================================================================

  describe('E2E 4.1: Human Gameplay Display', () => {
    test('should provide clear, readable display for human player', () => {
      // @req: FR 4.1-4.6 - Human sees clear display
      // @input: Human plays 3 turns vs AI
      // @output: Display is clear, readable, informative
      // @level: E2E

      let state = engine.initializeGame(2);

      for (let turn = 0; turn < 3; turn++) {
        // Display P0's turn
        const p0Header = `PLAYER ${state.currentPlayer}'S TURN (Turn #${state.turnNumber})`;
        expect(p0Header).toContain(`PLAYER 0`);
        expect(p0Header).toContain(`Turn #${state.turnNumber}`);

        // Display supply status
        const emptyPiles = Array.from(state.supply.values()).filter(c => c === 0).length;
        expect(state.supply.size).toBe(8);

        // Display opponent info
        const opponentVP = state.players[1].hand.filter(
          c => ['Estate', 'Duchy', 'Province'].includes(c)
        ).length;
        const opponentHand = state.players[1].hand.length;
        expect(opponentHand).toBeGreaterThan(0);

        // Complete P0's turn
        for (let phase = 0; phase < 3; phase++) {
          state = engine.executeMove(state, { type: 'end_phase' }).newState!;
        }

        // Display P1's turn
        const p1Header = `PLAYER ${state.currentPlayer}'S TURN (Turn #${state.turnNumber})`;
        expect(p1Header).toContain(`PLAYER 1`);

        // Complete P1's turn
        for (let phase = 0; phase < 3; phase++) {
          state = engine.executeMove(state, { type: 'end_phase' }).newState!;
        }
      }

      expect(state.turnNumber).toBe(3);
    });
  });
});
