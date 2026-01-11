import { GameEngine, GameState, generateMoveOptions } from '@principality/core';

// @bug: #12 - Remodel: Input validation rejects valid option 4 when 4 cards available
// @bug: #13 - Buy Phase: 'End Phase' option executes 'Play Copper' instead
// @bug: #37 - CRITICAL: Pending effects use dual sources of truth (display ≠ execution)
// @req: Single Source of Truth - Display and execution must use same array
// @why: Prevent wrong moves from being executed when user selects from menu
// @level: integration

// Bug #37 - Testing SSOT fix
describe('Pending Effect SSOT Violation (Bug #37, #12)', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('test-seed-ssot');
  });

  describe('Bug #12: Remodel with duplicate cards in hand', () => {
    it('should have matching array lengths between display and execution', () => {
      // Setup: Player has 4 cards with 3 unique types [Silver, Estate, Silver, Cellar]
      const state: GameState = {
        players: [{
          drawPile: [],
          hand: ['Silver', 'Estate', 'Silver', 'Cellar'],
          discardPile: [],
          inPlay: ['Remodel'],
          actions: 0,
          buys: 1,
          coins: 0
        }],
        supply: new Map([
          ['Copper', 30],
          ['Silver', 30],
          ['Gold', 30],
          ['Estate', 8],
          ['Duchy', 8],
          ['Province', 8],
          ['Cellar', 10],
          ['Remodel', 10]
        ]),
        currentPlayer: 0,
        phase: 'action',
        turnNumber: 1,
        seed: 'test',
        gameLog: [],
        trash: [],
        pendingEffect: {
          card: 'Remodel',
          effect: 'trash_for_remodel'
        }
      } as GameState;

      // Get valid moves from engine (SOURCE A)
      const validMoves = engine.getValidMoves(state);

      // Get display options (SOURCE B)
      const displayOptions = generateMoveOptions(state, validMoves);

      // BUG: These should be the same length!
      console.log('validMoves.length:', validMoves.length);
      console.log('displayOptions.length:', displayOptions.length);
      console.log('validMoves:', validMoves);
      console.log('displayOptions:', displayOptions.map(o => ({ index: o.index, desc: o.description })));

      // ASSERTION: Display and execution arrays must have same length
      expect(displayOptions.length).toBe(validMoves.length);
    });

    it('should allow selecting option 4 when 4 cards are displayed', () => {
      // This test will fail until the bug is fixed
      const state: GameState = {
        players: [{
          drawPile: [],
          hand: ['Silver', 'Estate', 'Silver', 'Cellar'],
          discardPile: [],
          inPlay: ['Remodel'],
          actions: 0,
          buys: 1,
          coins: 0
        }],
        supply: new Map([
          ['Copper', 30],
          ['Silver', 30],
          ['Gold', 30],
          ['Estate', 8],
          ['Duchy', 8],
          ['Province', 8],
          ['Cellar', 10],
          ['Remodel', 10]
        ]),
        currentPlayer: 0,
        phase: 'action',
        turnNumber: 1,
        seed: 'test',
        gameLog: [],
        trash: [],
        pendingEffect: {
          card: 'Remodel',
          effect: 'trash_for_remodel'
        }
      } as GameState;

      const validMoves = engine.getValidMoves(state);
      const displayOptions = generateMoveOptions(state, validMoves);

      // User should be able to select any displayed option
      for (let i = 0; i < displayOptions.length; i++) {
        const selection = i + 1;

        // This simulates validation in cli.ts:204
        const isValid = selection >= 1 && selection <= validMoves.length;

        // BUG: If displayOptions shows 4 items but validMoves has 3,
        // selecting option 4 will fail validation
        expect(isValid).toBe(true);
      }
    });

    it('should execute the correct move when user selects from display', () => {
      // Setup: Player selects option 4 (Cellar) from display
      const state: GameState = {
        players: [{
          drawPile: ['Gold'],
          hand: ['Silver', 'Estate', 'Silver', 'Cellar'],
          discardPile: [],
          inPlay: ['Remodel'],
          actions: 0,
          buys: 1,
          coins: 0
        }],
        supply: new Map([
          ['Copper', 30],
          ['Silver', 30],
          ['Gold', 30],
          ['Estate', 8],
          ['Duchy', 8],
          ['Province', 8],
          ['Cellar', 10],
          ['Remodel', 10]
        ]),
        currentPlayer: 0,
        phase: 'action',
        turnNumber: 1,
        seed: 'test',
        gameLog: [],
        trash: [],
        pendingEffect: {
          card: 'Remodel',
          effect: 'trash_for_remodel'
        }
      } as GameState;

      const validMoves = engine.getValidMoves(state);
      const displayOptions = generateMoveOptions(state, validMoves);

      // Find "Cellar" option in display (should be option 4)
      const cellarOption = displayOptions.find(o => o.description.includes('Cellar'));
      expect(cellarOption).toBeDefined();

      if (cellarOption) {
        const userSelection = cellarOption.index; // User selects this option

        // Current buggy implementation: uses validMoves array
        const executedMove = validMoves[userSelection - 1];

        // Expected: Should execute the move from the option user saw
        // BUG: If display shows Cellar at index 4 but validMoves[3] is something else,
        // wrong move gets executed
        expect(executedMove.card).toBe('Cellar');
      }
    });
  });

  describe('Bug #12: Chapel with duplicate cards', () => {
    it('should show all cards in hand including duplicates', () => {
      // Chapel allows trashing any cards, including duplicates
      // User should be able to select specific duplicate to trash
      const state: GameState = {
        players: [{
          drawPile: [],
          hand: ['Copper', 'Copper', 'Copper', 'Estate'],
          discardPile: [],
          inPlay: ['Chapel'],
          actions: 0,
          buys: 1,
          coins: 0
        }],
        supply: new Map([['Copper', 30], ['Estate', 8], ['Chapel', 10]]),
        currentPlayer: 0,
        phase: 'action',
        turnNumber: 1,
        seed: 'test',
        gameLog: [],
        trash: [],
        pendingEffect: {
          card: 'Chapel',
          effect: 'trash_cards',
          maxTrash: 4
        }
      } as GameState;

      const validMoves = engine.getValidMoves(state);
      const displayOptions = generateMoveOptions(state, validMoves);

      // Display and execution should have matching lengths
      expect(displayOptions.length).toBe(validMoves.length);
    });
  });

  describe('Runtime validation', () => {
    it('should detect SSOT violations before they cause bugs', () => {
      // This test validates that we can detect mismatches
      const state: GameState = {
        players: [{
          drawPile: [],
          hand: ['Silver', 'Estate', 'Silver', 'Cellar'],
          discardPile: [],
          inPlay: ['Remodel'],
          actions: 0,
          buys: 1,
          coins: 0
        }],
        supply: new Map([
          ['Copper', 30],
          ['Silver', 30],
          ['Estate', 8],
          ['Cellar', 10],
          ['Remodel', 10]
        ]),
        currentPlayer: 0,
        phase: 'action',
        turnNumber: 1,
        seed: 'test',
        gameLog: [],
        trash: [],
        pendingEffect: {
          card: 'Remodel',
          effect: 'trash_for_remodel'
        }
      } as GameState;

      const validMoves = engine.getValidMoves(state);
      const displayOptions = generateMoveOptions(state, validMoves);

      // Runtime validation: arrays must match
      if (displayOptions.length !== validMoves.length) {
        console.error('CRITICAL: Display/execution array mismatch!');
        console.error(`  Options: ${displayOptions.length}, ValidMoves: ${validMoves.length}`);

        // This should fail if SSOT violation exists
        fail('SSOT violation detected: display and execution arrays have different lengths');
      }
    });
  });
});
