/**
 * @file CLI Integration Tests - Shared Presentation Layer
 * @phase 4.2
 * @status RED (implementation doesn't exist yet - TDD approach)
 *
 * These tests verify that the CLI correctly uses the shared presentation layer
 * to display interactive card prompts. This ensures consistency between CLI and MCP
 * and prevents code duplication.
 */

import { GameEngine } from '../../../core/src/game';
import { CardName, GameState } from '../../../core/src/types';
import { Display } from '../../src/display';

// NOTE: These imports will fail until implementation is created
import { generateMoveOptions, MoveOption } from '../../../core/src/presentation/move-options';

describe('CLI Integration with Shared Presentation Layer', () => {
  let engine: GameEngine;
  let display: Display;

  beforeEach(() => {
    engine = new GameEngine('test-cli-integration');
    display = new Display();
  });

  // Helper to create game state with pending effect
  const createStateWithPendingEffect = (card: CardName, effect: string, hand: CardName[]): GameState => {
    const state = engine.initializeGame(1, { allCards: true });
    return {
      ...state,
      players: [{
        ...state.players[0],
        hand
      }],
      pendingEffect: {
        card,
        effect
      }
    };
  };

  describe('displayPendingEffectPrompt - Shared Layer Usage', () => {
    // @req: FR-CLI-1 - CLI uses shared layer
    // @assert: CLI calls generateMoveOptions from shared layer
    it('should call generateMoveOptions from shared layer', () => {
      const spy = jest.spyOn(require('../../../core/src/presentation/move-options'), 'generateMoveOptions');

      const state = createStateWithPendingEffect('Cellar', 'discard_for_cellar', ['Copper', 'Copper', 'Estate']);
      const validMoves = engine.getValidMoves(state);

      display.displayPendingEffectPrompt(state, validMoves);

      expect(spy).toHaveBeenCalledWith(state, validMoves);
      spy.mockRestore();
    });

    // @req: FR-CLI-3 - Consistent option numbering
    // @assert: CLI displays same option numbers as shared layer
    it('should display same option numbers as shared layer', () => {
      const state = createStateWithPendingEffect('Cellar', 'discard_for_cellar', ['Copper', 'Copper', 'Estate']);
      const validMoves = engine.getValidMoves(state);

      const sharedOptions = generateMoveOptions(state, validMoves);

      // Capture CLI output
      const consoleSpy = jest.spyOn(console, 'log');
      display.displayPendingEffectPrompt(state, validMoves);

      // Verify CLI displays same indices
      sharedOptions.forEach(opt => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(`[${opt.index}]`)
        );
      });

      consoleSpy.mockRestore();
    });

    // @req: FR-CLI-2 - No behavioral changes
    // @assert: CLI output format remains human-readable
    it('should display human-readable format', () => {
      const state = createStateWithPendingEffect('Cellar', 'discard_for_cellar', ['Copper', 'Copper', 'Estate']);
      const validMoves = engine.getValidMoves(state);

      const consoleSpy = jest.spyOn(console, 'log');
      display.displayPendingEffectPrompt(state, validMoves);

      // Verify human-readable elements
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Cellar'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Choose'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('discard'));

      consoleSpy.mockRestore();
    });
  });

  describe('All Interactive Cards - CLI Display', () => {
    // @req: FR-CLI-1, FR-CLI-2 - All cards work with shared layer
    // @assert: Each card displays correctly via shared layer

    it('should display Cellar prompt using shared layer', () => {
      const state = createStateWithPendingEffect('Cellar', 'discard_for_cellar', ['Copper', 'Copper', 'Estate']);
      const validMoves = engine.getValidMoves(state);

      const consoleSpy = jest.spyOn(console, 'log');
      display.displayPendingEffectPrompt(state, validMoves);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Cellar'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[1]'));
      consoleSpy.mockRestore();
    });

    it('should display Chapel prompt using shared layer', () => {
      const state = createStateWithPendingEffect('Chapel', 'trash_cards', ['Copper', 'Copper', 'Estate', 'Curse']);
      state.pendingEffect!.maxTrash = 4;
      const validMoves = engine.getValidMoves(state);

      const consoleSpy = jest.spyOn(console, 'log');
      display.displayPendingEffectPrompt(state, validMoves);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Chapel'));
      consoleSpy.mockRestore();
    });

    it('should display Remodel Step 1 prompt using shared layer', () => {
      const state = createStateWithPendingEffect('Remodel', 'trash_for_remodel', ['Estate', 'Copper']);
      const validMoves = engine.getValidMoves(state);

      const consoleSpy = jest.spyOn(console, 'log');
      display.displayPendingEffectPrompt(state, validMoves);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Remodel'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Step 1'));
      consoleSpy.mockRestore();
    });

    it('should display Remodel Step 2 prompt using shared layer', () => {
      const state = createStateWithPendingEffect('Remodel', 'gain_card', ['Copper', 'Silver']);
      state.pendingEffect!.maxGainCost = 4;
      const validMoves = engine.getValidMoves(state);

      const consoleSpy = jest.spyOn(console, 'log');
      display.displayPendingEffectPrompt(state, validMoves);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Remodel'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Step 2'));
      consoleSpy.mockRestore();
    });

    it('should display Mine Step 1 prompt using shared layer', () => {
      const state = createStateWithPendingEffect('Mine', 'select_treasure_to_trash', ['Copper', 'Silver', 'Estate']);
      const validMoves = engine.getValidMoves(state);

      const consoleSpy = jest.spyOn(console, 'log');
      display.displayPendingEffectPrompt(state, validMoves);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Mine'));
      consoleSpy.mockRestore();
    });

    it('should display Workshop prompt using shared layer', () => {
      const state = createStateWithPendingEffect('Workshop', 'gain_card', ['Copper', 'Silver']);
      const validMoves = engine.getValidMoves(state);

      const consoleSpy = jest.spyOn(console, 'log');
      display.displayPendingEffectPrompt(state, validMoves);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Workshop'));
      consoleSpy.mockRestore();
    });

    it('should display Throne Room prompt using shared layer', () => {
      const state = createStateWithPendingEffect('Throne Room', 'select_action_for_throne', ['Village', 'Smithy', 'Copper']);
      const validMoves = engine.getValidMoves(state);

      const consoleSpy = jest.spyOn(console, 'log');
      display.displayPendingEffectPrompt(state, validMoves);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Throne Room'));
      consoleSpy.mockRestore();
    });

    it('should display Library prompt using shared layer', () => {
      const state = createStateWithPendingEffect('Library', 'library_set_aside', ['Copper', 'Silver']);
      const validMoves = engine.getValidMoves(state);

      const consoleSpy = jest.spyOn(console, 'log');
      display.displayPendingEffectPrompt(state, validMoves);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Library'));
      consoleSpy.mockRestore();
    });

    it('should display Chancellor prompt using shared layer', () => {
      const state = createStateWithPendingEffect('Chancellor', 'chancellor_decision', ['Copper', 'Silver']);
      const validMoves = engine.getValidMoves(state);

      const consoleSpy = jest.spyOn(console, 'log');
      display.displayPendingEffectPrompt(state, validMoves);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Chancellor'));
      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases - CLI Display', () => {
    // @edge: Empty hand scenarios
    it('should display Cellar prompt for empty hand', () => {
      const state = createStateWithPendingEffect('Cellar', 'discard_for_cellar', []);
      const validMoves = engine.getValidMoves(state);

      const consoleSpy = jest.spyOn(console, 'log');
      display.displayPendingEffectPrompt(state, validMoves);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should display Chapel prompt for empty hand', () => {
      const state = createStateWithPendingEffect('Chapel', 'trash_cards', []);
      state.pendingEffect!.maxTrash = 4;
      const validMoves = engine.getValidMoves(state);

      const consoleSpy = jest.spyOn(console, 'log');
      display.displayPendingEffectPrompt(state, validMoves);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should display Throne Room prompt when no actions in hand', () => {
      const state = createStateWithPendingEffect('Throne Room', 'select_action_for_throne', ['Copper', 'Estate']);
      const validMoves = engine.getValidMoves(state);

      const consoleSpy = jest.spyOn(console, 'log');
      display.displayPendingEffectPrompt(state, validMoves);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('no action'));
      consoleSpy.mockRestore();
    });

    it('should display Bureaucrat prompt when no victory cards', () => {
      const state = createStateWithPendingEffect('Bureaucrat', 'reveal_and_topdeck', ['Copper', 'Village']);
      const validMoves = engine.getValidMoves(state);

      const consoleSpy = jest.spyOn(console, 'log');
      display.displayPendingEffectPrompt(state, validMoves);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Reveal hand'));
      consoleSpy.mockRestore();
    });
  });

  describe('Phase 4.1 Regression Tests', () => {
    // @req: FR-CLI-2 - No behavioral changes from Phase 4.1
    // @assert: All Phase 4.1 Feature 2 tests still pass

    it('should maintain Phase 4.1 Cellar prompt behavior', () => {
      // Import and run existing Phase 4.1 Cellar tests
      // This verifies no regression from Phase 4.1
      const state = createStateWithPendingEffect('Cellar', 'discard_for_cellar', ['Copper', 'Copper', 'Estate']);
      const validMoves = engine.getValidMoves(state);

      const consoleSpy = jest.spyOn(console, 'log');
      display.displayPendingEffectPrompt(state, validMoves);

      // Verify same output format as Phase 4.1
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Cellar'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[1]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('discard'));

      consoleSpy.mockRestore();
    });

    // Add similar regression tests for all 11 cards
    // These should be copies of Phase 4.1 tests to ensure no breaking changes
  });

  describe('Option Descriptions - Consistency Check', () => {
    // @req: FR-CLI-3 - Consistent option numbering
    // @assert: CLI and shared layer agree on option content

    it('should display same descriptions as shared layer options', () => {
      const state = createStateWithPendingEffect('Cellar', 'discard_for_cellar', ['Copper', 'Estate']);
      const validMoves = engine.getValidMoves(state);

      const sharedOptions = generateMoveOptions(state, validMoves);
      const consoleSpy = jest.spyOn(console, 'log');
      display.displayPendingEffectPrompt(state, validMoves);

      // Verify each option description appears in console output
      sharedOptions.forEach(opt => {
        // Description might be formatted differently but key elements should be present
        const descriptionParts = opt.description.split(' ');
        descriptionParts.forEach(part => {
          if (part.length > 3) { // Skip small words
            expect(consoleSpy.mock.calls.some(call =>
              call.some(arg => String(arg).includes(part))
            )).toBe(true);
          }
        });
      });

      consoleSpy.mockRestore();
    });
  });
});
