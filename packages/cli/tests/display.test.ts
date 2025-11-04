/**
 * Comprehensive test suite for Display class
 * Validates game state formatting, output display, and console operations
 */

// @req: UTIL-DISPLAY - CLI display formatting and game state rendering
// @edge: Complete game state display; console operations; state validation
// @why: Core utility for rendering game information to players during gameplay

import { Display } from '../src/display';
import { GameState, Move, Victory } from '@principality/core';
import {
  ConsoleCapture,
  GameStateBuilder,
  MockMoveGenerator,
  CLIAssertions,
  PerformanceHelper,
  TestScenarios
} from './utils/test-utils';
import { VictoryPointsTestUtils, QuickGameTestUtils } from './utils/phase1-5-utils';

describe('Display', () => {
  let display: Display;
  let consoleCapture: ConsoleCapture;

  beforeEach(() => {
    display = new Display();
    consoleCapture = new ConsoleCapture();
    consoleCapture.start();
  });

  afterEach(() => {
    consoleCapture.stop();
  });

  describe('displayGameState', () => {
    test('should display complete game state information', () => {
      const state = GameStateBuilder.create()
        .withTurnNumber(5)
        .withCurrentPlayer(0)
        .withPhase('action')
        .withPlayerHand(0, ['Village', 'Copper', 'Silver', 'Estate', 'Duchy'])
        .withPlayerStats(0, { actions: 2, buys: 1, coins: 3 })
        .build();

      display.displayGameState(state);

      CLIAssertions.assertGameStateDisplayed(consoleCapture, state);

      // Verify specific formatting
      expect(consoleCapture.contains('Turn 5')).toBe(true);
      expect(consoleCapture.contains('Player 1')).toBe(true);
      expect(consoleCapture.contains('Action Phase')).toBe(true);
      expect(consoleCapture.contains('Hand: Village, Copper, Silver, Estate, Duchy')).toBe(true);
      expect(consoleCapture.contains('Actions: 2')).toBe(true);
      expect(consoleCapture.contains('Buys: 1')).toBe(true);
      expect(consoleCapture.contains('Coins: $3')).toBe(true);
    });

    test('should display different phases correctly', () => {
      const phases: Array<'action' | 'buy' | 'cleanup'> = ['action', 'buy', 'cleanup'];

      phases.forEach(phase => {
        consoleCapture.clear();
        const state = GameStateBuilder.create().withPhase(phase).build();

        display.displayGameState(state);

        const expectedPhase = phase.charAt(0).toUpperCase() + phase.slice(1);
        expect(consoleCapture.contains(`${expectedPhase} Phase`)).toBe(true);
      });
    });

    test('should display empty hand appropriately', () => {
      const state = GameStateBuilder.create()
        .withPlayerHand(0, [])
        .build();

      display.displayGameState(state);

      expect(consoleCapture.contains('Hand: (empty)')).toBe(true);
    });

    test('should display different players correctly', () => {
      const state = GameStateBuilder.create()
        .withPlayers(3)
        .withCurrentPlayer(1)
        .build();

      display.displayGameState(state);

      expect(consoleCapture.contains('Player 2')).toBe(true); // 0-indexed to 1-indexed
    });

    test('should handle large hands gracefully', () => {
      const largeHand = Array(20).fill(0).map((_, i) => `Card${i}`);
      const state = GameStateBuilder.create()
        .withPlayerHand(0, largeHand)
        .build();

      display.displayGameState(state);

      // Should display all cards
      largeHand.forEach(card => {
        expect(consoleCapture.contains(card)).toBe(true);
      });
    });

    test('should include proper formatting elements', () => {
      const state = GameStateBuilder.create().build();

      display.displayGameState(state);

      const output = consoleCapture.getAllOutput();

      // Should have separator lines
      expect(output).toMatch(/=+/);
      // Should have proper structure
      expect(output).toMatch(/Turn \d+/);
      expect(output).toMatch(/Player \d+/);
      expect(output).toMatch(/Phase/);
      expect(output).toMatch(/Hand:/);
      expect(output).toMatch(/Actions:/);
      expect(output).toMatch(/Buys:/);
      expect(output).toMatch(/Coins:/);
    });
  });

  describe('displayAvailableMoves', () => {
    test('should display numbered move list', () => {
      const moves = MockMoveGenerator.actionMoves();

      display.displayAvailableMoves(moves);

      CLIAssertions.assertMovesDisplayed(consoleCapture, moves);

      // Check specific numbering
      expect(consoleCapture.contains('[1] Play Village')).toBe(true);
      expect(consoleCapture.contains('[2] Play Smithy')).toBe(true);
      expect(consoleCapture.contains('[3] End Phase')).toBe(true);
    });

    test('should handle different move types', () => {
      const moves: Move[] = [
        { type: 'play_action', card: 'Village' },
        { type: 'play_treasure', card: 'Silver' },
        { type: 'buy', card: 'Gold' },
        { type: 'end_phase' },
        { type: 'discard_for_cellar' }
      ];

      display.displayAvailableMoves(moves);

      expect(consoleCapture.contains('Play Village')).toBe(true);
      expect(consoleCapture.contains('Play Silver')).toBe(true);
      expect(consoleCapture.contains('Buy Gold ($6)')).toBe(true);
      expect(consoleCapture.contains('End Phase')).toBe(true);
      expect(consoleCapture.contains('Discard cards for Cellar')).toBe(true);
    });

    test('should handle empty move list', () => {
      display.displayAvailableMoves([]);

      expect(consoleCapture.contains('Available Moves:')).toBe(true);
      // Should not show any numbered moves
      expect(consoleCapture.contains('[1]')).toBe(false);
    });

    test('should handle large move lists', () => {
      const largeMoveList: Move[] = Array(50).fill(0).map((_, i) => ({
        type: 'play_action' as const,
        card: `Card${i}`
      }));

      display.displayAvailableMoves(largeMoveList);

      // Check first and last moves
      expect(consoleCapture.contains('[1] Play Card0')).toBe(true);
      expect(consoleCapture.contains('[50] Play Card49')).toBe(true);
    });

    test('should handle unknown move types gracefully', () => {
      const unknownMove = { type: 'unknown_type' as any, card: 'TestCard' };

      display.displayAvailableMoves([unknownMove]);

      expect(consoleCapture.contains('[1] Unknown move')).toBe(true);
    });
  });

  describe('displaySupply', () => {
    test('should display supply organized by type', () => {
      const state = GameStateBuilder.create()
        .withSupply({
          'Copper': 46, 'Silver': 40, 'Gold': 30,
          'Estate': 8, 'Duchy': 8, 'Province': 8,
          'Village': 10, 'Smithy': 10, 'Market': 10
        })
        .build();

      display.displaySupply(state);

      const output = consoleCapture.getAllOutput();

      // Should group by type
      expect(output).toMatch(/Treasures:.*Copper.*Silver.*Gold/);
      expect(output).toMatch(/Victory:.*Estate.*Duchy.*Province/);
      expect(output).toMatch(/Kingdom:.*Village.*Smithy.*Market/);

      // Should show counts with prices
      expect(output).toMatch(/Copper \(\$0, 46\)/);
      expect(output).toMatch(/Province \(\$8, 8\)/);
      expect(output).toMatch(/Village \(\$3, 10\)/);
    });

    test('should handle empty supply piles', () => {
      const state = GameStateBuilder.create()
        .withSupply({
          'Copper': 46,
          'Province': 0 // Empty pile
        })
        .build();

      display.displaySupply(state);

      expect(consoleCapture.contains('Copper ($0, 46)')).toBe(true);
      expect(consoleCapture.contains('Province ($8, 0)')).toBe(true);
    });

    test('should display all supply categories even with zero counts', () => {
      const state = GameStateBuilder.create()
        .withSupply({
          'Copper': 46, // Only treasures with count
          'Estate': 0, 'Duchy': 0, 'Province': 0, // Victory cards at zero
          'Village': 0, 'Smithy': 0 // Kingdom cards at zero
        })
        .build();

      display.displaySupply(state);

      // All categories should be shown, even if counts are 0 (useful game information)
      expect(consoleCapture.contains('Treasures:')).toBe(true);
      expect(consoleCapture.contains('Victory:')).toBe(true); // Shows empty piles
      expect(consoleCapture.contains('Kingdom:')).toBe(true); // Shows empty piles
    });

    test('should format supply groups correctly', () => {
      const state = GameStateBuilder.create()
        .withSupply({
          'Copper': 46, 'Silver': 40,
          'Estate': 8, 'Duchy': 8
        })
        .build();

      display.displaySupply(state);

      // Check comma separation with prices
      expect(consoleCapture.contains('Copper ($0, 46), Silver ($3, 40)')).toBe(true);
      expect(consoleCapture.contains('Estate ($2, 8), Duchy ($5, 8)')).toBe(true);
    });
  });

  describe('displayMoveResult', () => {
    test('should display success messages with checkmark', () => {
      display.displayMoveResult(true, 'Played Village');

      CLIAssertions.assertSuccessDisplayed(consoleCapture, 'Played Village');
      expect(consoleCapture.contains('✓ Played Village')).toBe(true);
    });

    test('should display error messages with X mark', () => {
      display.displayMoveResult(false, 'Invalid move');

      CLIAssertions.assertErrorDisplayed(consoleCapture, 'Invalid move');
      expect(consoleCapture.contains('✗ Error: Invalid move')).toBe(true);
    });

    test('should handle success without message', () => {
      display.displayMoveResult(true);

      // Should not display anything for success without message
      expect(consoleCapture.getLogs()).toHaveLength(0);
    });

    test('should handle error without message', () => {
      display.displayMoveResult(false);

      // Should not display anything for error without message
      expect(consoleCapture.getLogs()).toHaveLength(0);
    });
  });

  describe('displayGameOver', () => {
    test('should display complete game over information', () => {
      const { state, victory } = TestScenarios.gameOver();

      display.displayGameOver(victory, state);

      const output = consoleCapture.getAllOutput();

      expect(output).toMatch(/GAME OVER/);
      expect(output).toMatch(/Final Scores:/);
      expect(output).toMatch(/Player 1: 15 VP .* ★ WINNER/); // Allow VP breakdown
      expect(output).toMatch(/Player 2: 8 VP/);
      expect(output).toMatch(/Total Turns: 20/);
    });

    test('should handle victory without scores', () => {
      const victory: Victory = {
        isGameOver: true,
        winner: 0
      };
      const state = GameStateBuilder.create().build();

      display.displayGameOver(victory, state);

      expect(consoleCapture.contains('GAME OVER')).toBe(true);
      expect(consoleCapture.contains('Final Scores:')).toBe(false);
    });

    test('should mark winner correctly', () => {
      const victory: Victory = {
        isGameOver: true,
        winner: 1,
        scores: [10, 15, 8]
      };
      const state = GameStateBuilder.create().withTurnNumber(25).build();

      display.displayGameOver(victory, state);

      expect(consoleCapture.contains('Player 2:')).toBe(true);
      expect(consoleCapture.contains('15 VP')).toBe(true);
      expect(consoleCapture.contains('★ WINNER')).toBe(true);
      expect(consoleCapture.contains('Player 1: 10 VP')).toBe(true);
      expect(consoleCapture.contains('Player 3: 8 VP')).toBe(true);
    });
  });

  describe('displayWelcome', () => {
    test('should display welcome screen with seed', () => {
      display.displayWelcome('test-seed-123');

      const output = consoleCapture.getAllOutput();

      expect(output).toMatch(/PRINCIPALITY AI/);
      expect(output).toMatch(/Deck Building Game/);
      expect(output).toMatch(/Game Seed: test-seed-123/);
      expect(output).toMatch(/Commands:/);
      expect(output).toMatch(/Enter number to select a move/);
      expect(output).toMatch(/help.*Show this help message/);
    });

    test('should include all command information', () => {
      display.displayWelcome('seed');

      const output = consoleCapture.getAllOutput();

      expect(output).toMatch(/hand.*Show your hand/);
      expect(output).toMatch(/supply.*Show available cards/);
      expect(output).toMatch(/quit.*End game/);
    });
  });

  describe('displayHelp', () => {
    test('should display comprehensive help information', () => {
      display.displayHelp();

      const output = consoleCapture.getAllOutput();

      expect(output).toMatch(/Available Commands:/);
      expect(output).toMatch(/\[number\].*Select move by number/);
      expect(output).toMatch(/hand.*Display your current hand/);
      expect(output).toMatch(/supply.*Display all available supply piles/);
      expect(output).toMatch(/help.*Show this help message/);
      expect(output).toMatch(/quit.*Exit the game/);
      expect(output).toMatch(/exit.*Exit the game/);
    });
  });

  describe('displayError', () => {
    test('should display formatted error messages', () => {
      display.displayError('Test error message');

      expect(consoleCapture.contains('✗ Error: Test error message')).toBe(true);
    });

    test('should handle empty error messages', () => {
      display.displayError('');

      expect(consoleCapture.contains('✗ Error:')).toBe(true);
    });
  });

  describe('displayInfo', () => {
    test('should display info messages', () => {
      display.displayInfo('Test information');

      expect(consoleCapture.contains('Test information')).toBe(true);
    });
  });

  describe('clearScreen', () => {
    test('should call console.clear', () => {
      display.clearScreen();

      expect(consoleCapture.wasClearCalled()).toBe(true);
    });
  });

  describe('performance', () => {
    test('should display game state quickly', async () => {
      const state = GameStateBuilder.create().build();

      await PerformanceHelper.assertWithinTime(
        () => display.displayGameState(state),
        50, // < 50ms
        'game state display'
      );
    });

    test('should display large move lists quickly', async () => {
      const largeMoveList: Move[] = Array(100).fill(0).map((_, i) => ({
        type: 'play_action' as const,
        card: `Card${i}`
      }));

      await PerformanceHelper.assertWithinTime(
        () => display.displayAvailableMoves(largeMoveList),
        100, // < 100ms
        'large move list display'
      );
    });

    test('should display supply quickly', async () => {
      const state = GameStateBuilder.create()
        .withSupply(Object.fromEntries(
          Array(30).fill(0).map((_, i) => [`Card${i}`, 10])
        ))
        .build();

      await PerformanceHelper.assertWithinTime(
        () => display.displaySupply(state),
        75, // < 75ms
        'supply display'
      );
    });
  });

  describe('Phase 1.5 features (implemented)', () => {
    describe('Victory points display', () => {
      test('should display VP in game state', () => {
        const state = VictoryPointsTestUtils.createVPTestState();

        display.displayGameState(state);

        // Phase 1.5: VP display is implemented
        expect(consoleCapture.contains('VP:')).toBe(true);
      });

      test('should support VP calculation for various deck compositions', () => {
        const testDecks = VictoryPointsTestUtils.getTestDeckCompositions();

        testDecks.forEach(({ cards, expectedVP, description }) => {
          consoleCapture.clear();

          const state = GameStateBuilder.create()
            .withPlayerHand(0, cards)
            .build();

          display.displayGameState(state);

          // Framework ready for VP display
          // TODO: Verify VP calculation when implemented
          // expect(consoleCapture.contains(`VP: ${expectedVP}`)).toBe(true);
        });
      });
    });

    describe('Quick game mode display (pending implementation)', () => {
      test('should handle reduced pile sizes display', () => {
        const state = QuickGameTestUtils.createQuickGameState();

        display.displaySupply(state);

        // Should display reduced pile sizes correctly with prices
        expect(consoleCapture.contains('Estate ($2, 8)')).toBe(true);
        expect(consoleCapture.contains('Duchy ($5, 8)')).toBe(true);
        expect(consoleCapture.contains('Province ($8, 8)')).toBe(true);
      });
    });
  });

  describe('edge cases and robustness', () => {
    test('should handle null/undefined states gracefully', () => {
      // @ts-expect-error Testing robustness
      expect(() => display.displayGameState(null)).not.toThrow();
    });

    test('should handle states with missing properties', () => {
      const partialState = {
        players: [],
        currentPlayer: 0,
        phase: 'action' as const,
        turnNumber: 1
      };

      // @ts-expect-error Testing robustness with partial state
      expect(() => display.displayGameState(partialState)).not.toThrow();
    });

    test('should handle very long card names', () => {
      const longCardName = 'A'.repeat(100);
      const state = GameStateBuilder.create()
        .withPlayerHand(0, [longCardName])
        .build();

      display.displayGameState(state);

      expect(consoleCapture.contains(longCardName)).toBe(true);
    });

    test('should handle special characters in card names', () => {
      const specialCards = ['Card!@#', 'Card(1)', 'Card_Test', 'Card-Name'];
      const state = GameStateBuilder.create()
        .withPlayerHand(0, specialCards)
        .build();

      display.displayGameState(state);

      specialCards.forEach(card => {
        expect(consoleCapture.contains(card)).toBe(true);
      });
    });
  });

  describe('output formatting consistency', () => {
    test('should maintain consistent formatting across displays', () => {
      const state = GameStateBuilder.create().build();
      const moves = MockMoveGenerator.actionMoves();

      display.displayGameState(state);
      display.displayAvailableMoves(moves);
      display.displaySupply(state);

      const output = consoleCapture.getAllOutput();

      // Should have consistent line endings
      expect(output.split('\n').every(line =>
        line === '' || !line.endsWith(' ')
      )).toBe(true);

      // Should have proper structure
      expect(output).toMatch(/=+/); // Separators
      expect(output).toMatch(/Available Moves:/);
      expect(output).toMatch(/Supply:/);
    });

    test('should handle console width considerations', () => {
      // Test with very wide content
      const wideState = GameStateBuilder.create()
        .withPlayerHand(0, Array(50).fill('VeryLongCardName'))
        .build();

      display.displayGameState(wideState);

      // Should not throw errors with wide content
      expect(consoleCapture.getLogs().length).toBeGreaterThan(0);
    });
  });
});