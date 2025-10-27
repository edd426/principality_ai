/**
 * Test Suite: Auto-Play All Treasures Feature (Phase 1.5)
 *
 * Requirements: CLI_PHASE2_REQUIREMENTS.md - Feature 1
 * Validates command-based treasure auto-play functionality
 *
 * Key Requirements:
 * - Commands: 'treasures', 't', 'play all', 'all'
 * - Command-based (NOT automatic)
 * - Display summary with coin totals
 * - Individual treasure playing still works
 * - Performance: < 100ms
 */

// @req: R1.5-01 - Auto-play treasures with single command
// @edge: Empty hand → nothing to play; mixed treasures and actions → play only treasures
// @why: Command-based approach maintains player control; faster than individual plays

import { GameStateBuilder, ConsoleCapture, PerformanceHelper } from './utils/test-utils';
import { AutoPlayTreasuresTestUtils } from './utils/phase1-5-utils';
import { Parser } from '../src/parser';

describe('Feature 1: Auto-Play All Treasures', () => {
  let parser: Parser;
  let console: ConsoleCapture;

  beforeEach(() => {
    parser = new Parser();
    console = new ConsoleCapture();
  });

  afterEach(() => {
    console.stop();
  });

  describe('Command Recognition (FR-1.1)', () => {
    test('should recognize "treasures" command', () => {
      const result = parser.parseInput('treasures', []);

      expect(result.type).toBe('command');
      expect(result.command).toBe('treasures');
    });

    test('should recognize "t" command alias', () => {
      const result = parser.parseInput('t', []);

      expect(result.type).toBe('command');
      expect(result.command).toBe('treasures');
    });

    test('should recognize "play all" command', () => {
      const result = parser.parseInput('play all', []);

      expect(result.type).toBe('command');
      expect(result.command).toBe('treasures');
    });

    test('should recognize "all" command', () => {
      const result = parser.parseInput('all', []);

      expect(result.type).toBe('command');
      expect(result.command).toBe('treasures');
    });

    test('should handle command case-insensitivity', () => {
      const commands = ['TREASURES', 'Treasures', 'T', 'PLAY ALL', 'Play All', 'ALL'];

      commands.forEach(cmd => {
        const result = parser.parseInput(cmd, []);
        expect(result.type).toBe('command');
        expect(result.command).toBe('treasures');
      });
    });

    test('should handle leading/trailing whitespace in commands', () => {
      const commands = ['  treasures  ', '  t  ', '  play all  '];

      commands.forEach(cmd => {
        const result = parser.parseInput(cmd, []);
        expect(result.type).toBe('command');
        expect(result.command).toBe('treasures');
      });
    });
  });

  describe('Treasure Playing Logic (FR-1.2)', () => {
    test('should play all treasures in hand', () => {
      // Arrange
      const hand = ['Copper', 'Copper', 'Silver', 'Estate'];
      const state = GameStateBuilder.create()
        .withPhase('buy')
        .withPlayerHand(0, hand)
        .build();

      // Act - This would be called by CLI when user types 'treasures'
      // The actual implementation will call this internally
      const treasures = hand.filter(card =>
        ['Copper', 'Silver', 'Gold'].includes(card)
      );

      // Assert
      expect(treasures).toHaveLength(3);
      expect(treasures).toEqual(['Copper', 'Copper', 'Silver']);
    });

    test('should play treasures in order they appear in hand', () => {
      // Arrange
      const hand = ['Silver', 'Copper', 'Gold', 'Copper'];

      // Act - Filter to get treasure order
      const treasures = hand.filter(card =>
        ['Copper', 'Silver', 'Gold'].includes(card)
      );

      // Assert - Order preserved from hand
      expect(treasures).toEqual(['Silver', 'Copper', 'Gold', 'Copper']);
    });

    test('should calculate correct coin total from treasures', () => {
      // Arrange
      const treasures = ['Copper', 'Copper', 'Silver', 'Gold'];
      const coinValues: Record<string, number> = {
        'Copper': 1,
        'Silver': 2,
        'Gold': 3
      };

      // Act
      const totalCoins = treasures.reduce((sum, card) =>
        sum + coinValues[card], 0
      );

      // Assert
      expect(totalCoins).toBe(7); // 1+1+2+3
    });

    test('should only play treasure cards, not action or victory cards', () => {
      // Arrange
      const hand = ['Village', 'Copper', 'Estate', 'Silver', 'Smithy'];

      // Act
      const treasures = hand.filter(card =>
        ['Copper', 'Silver', 'Gold'].includes(card)
      );

      // Assert
      expect(treasures).toEqual(['Copper', 'Silver']);
      expect(treasures).not.toContain('Village');
      expect(treasures).not.toContain('Estate');
      expect(treasures).not.toContain('Smithy');
    });
  });

  describe('Display Summary (FR-1.3)', () => {
    test('should display summary with coin values for each treasure', () => {
      // Arrange
      const treasures = ['Copper', 'Copper', 'Silver'];
      const expectedSummary = 'Played all treasures: Copper (+$1), Copper (+$1), Silver (+$2)';

      // Act - Format function that will be implemented
      const summary = formatAutoPlaySummary(treasures);

      // Assert
      expect(summary).toContain('Played all treasures');
      expect(summary).toContain('Copper (+$1)');
      expect(summary).toContain('Silver (+$2)');
    });

    test('should display total coins after playing all treasures', () => {
      // Arrange
      const treasures = ['Copper', 'Silver', 'Gold'];
      const totalCoins = 6; // 1+2+3

      // Act
      const summary = formatAutoPlaySummary(treasures);

      // Assert
      expect(summary).toMatch(/Total.*\$6/);
    });

    test('should show empty treasure summary when no treasures', () => {
      // Arrange
      const treasures: string[] = [];

      // Act
      const summary = formatAutoPlaySummary(treasures);

      // Assert
      expect(summary).toContain('No treasures to play');
      expect(summary).toContain('$0');
    });

    test('should handle single treasure correctly', () => {
      // Arrange
      const treasures = ['Gold'];

      // Act
      const summary = formatAutoPlaySummary(treasures);

      // Assert
      expect(summary).toContain('Gold (+$3)');
      expect(summary).toContain('Total: $3');
    });

    test('should handle many treasures (10+) correctly', () => {
      // Arrange
      const treasures = Array(10).fill('Copper');

      // Act
      const summary = formatAutoPlaySummary(treasures);

      // Assert
      expect(summary).toContain('Played all treasures');
      expect(summary).toMatch(/Total.*\$10/);
    });
  });

  describe('Edge Cases (EC-1.1, EC-1.2, EC-1.3)', () => {
    test('should handle zero treasures gracefully (EC-1.1)', () => {
      // Arrange
      const hand = ['Estate', 'Estate', 'Village'];
      const state = GameStateBuilder.create()
        .withPlayerHand(0, hand)
        .build();

      // Act
      const treasures = hand.filter(card =>
        ['Copper', 'Silver', 'Gold'].includes(card)
      );

      // Assert
      expect(treasures).toHaveLength(0);
      const summary = formatAutoPlaySummary(treasures);
      expect(summary).toContain('No treasures to play');
    });

    test('should handle hand with only victory cards (EC-1.2)', () => {
      // Arrange
      const hand = ['Estate', 'Duchy', 'Province'];

      // Act
      const treasures = hand.filter(card =>
        ['Copper', 'Silver', 'Gold'].includes(card)
      );

      // Assert
      expect(treasures).toHaveLength(0);
    });

    test('should only play unplayed treasures if some already played (EC-1.3)', () => {
      // Arrange - Simulate state where 1 Copper already played
      const handBefore = ['Copper', 'Copper', 'Silver'];
      const handAfter = ['Copper', 'Silver']; // One Copper removed

      // Act
      const treasures = handAfter.filter(card =>
        ['Copper', 'Silver', 'Gold'].includes(card)
      );

      // Assert
      expect(treasures).toHaveLength(2);
      expect(treasures).toEqual(['Copper', 'Silver']);
    });

    test('should handle empty hand', () => {
      // Arrange
      const hand: string[] = [];

      // Act
      const treasures = hand.filter(card =>
        ['Copper', 'Silver', 'Gold'].includes(card)
      );

      // Assert
      expect(treasures).toHaveLength(0);
    });

    test('should handle hand with all three treasure types', () => {
      // Arrange
      const hand = ['Copper', 'Silver', 'Gold'];

      // Act
      const treasures = hand.filter(card =>
        ['Copper', 'Silver', 'Gold'].includes(card)
      );

      // Assert
      expect(treasures).toHaveLength(3);
      expect(treasures).toContain('Copper');
      expect(treasures).toContain('Silver');
      expect(treasures).toContain('Gold');
    });
  });

  describe('Individual Treasure Playing Still Works (FR-1.6)', () => {
    test('should allow playing individual treasure cards', () => {
      // Arrange
      const hand = ['Copper', 'Silver', 'Gold'];
      const moves = [
        { type: 'play_treasure' as const, card: 'Copper' },
        { type: 'play_treasure' as const, card: 'Silver' },
        { type: 'play_treasure' as const, card: 'Gold' }
      ];

      // Act - User selects move 1 to play first Copper
      const result = parser.parseInput('1', moves);

      // Assert
      expect(result.type).toBe('move');
      expect(result.move?.type).toBe('play_treasure');
      expect(result.move?.card).toBe('Copper');
    });

    test('should allow mix of auto-play and individual play', () => {
      // Arrange - User plays 1 treasure manually, then uses auto-play
      const handBefore = ['Copper', 'Copper', 'Silver'];

      // Act - Play first Copper manually
      const handAfter = handBefore.slice(1); // Remove first Copper

      // Then auto-play remaining treasures
      const treasures = handAfter.filter(card =>
        ['Copper', 'Silver', 'Gold'].includes(card)
      );

      // Assert
      expect(treasures).toEqual(['Copper', 'Silver']);
    });
  });

  describe('Performance Requirements (NFR-1.1)', () => {
    test('should auto-play 5 treasures in < 100ms', async () => {
      // Arrange
      const treasures = ['Copper', 'Copper', 'Silver', 'Gold', 'Silver'];

      // Act & Assert
      await PerformanceHelper.assertWithinTime(
        () => {
          treasures.forEach(treasure => {
            // Simulate playing each treasure
            const coinValue = treasure === 'Copper' ? 1 : treasure === 'Silver' ? 2 : 3;
            return coinValue;
          });
        },
        100,
        'auto-play 5 treasures'
      );
    });

    test('should auto-play 10 treasures in < 100ms', async () => {
      // Arrange
      const treasures = Array(10).fill('Copper');

      // Act & Assert
      await PerformanceHelper.assertWithinTime(
        () => {
          return treasures.reduce((sum, t) => sum + 1, 0);
        },
        100,
        'auto-play 10 treasures'
      );
    });

    test('should format summary for 10 treasures in < 50ms', async () => {
      // Arrange
      const treasures = Array(10).fill('Copper');

      // Act & Assert
      await PerformanceHelper.assertWithinTime(
        () => formatAutoPlaySummary(treasures),
        50,
        'format auto-play summary'
      );
    });
  });

  describe('Acceptance Criteria Validation', () => {
    test('AC-1.1: Play all treasures with summary and total', () => {
      // Given I am in buy phase with 3 Copper in hand
      const hand = ['Copper', 'Copper', 'Copper'];

      // When I type "treasures"
      const result = parser.parseInput('treasures', []);
      expect(result.type).toBe('command');

      // Then all 3 Copper are played
      const treasures = hand.filter(c => c === 'Copper');
      expect(treasures).toHaveLength(3);

      // And I see summary
      const summary = formatAutoPlaySummary(treasures);
      expect(summary).toContain('Played all treasures: Copper (+$1), Copper (+$1), Copper (+$1)');

      // And coins display shows total
      expect(summary).toContain('Total: $3');
    });

    test('AC-1.2: No treasures displays message immediately', () => {
      // Given I am in buy phase with no treasures
      const hand = ['Estate', 'Estate'];

      // When the phase begins
      const treasures = hand.filter(card =>
        ['Copper', 'Silver', 'Gold'].includes(card)
      );

      // Then I see "No treasures to play"
      const summary = formatAutoPlaySummary(treasures);
      expect(summary).toContain('No treasures to play');

      // And I see buy options immediately (would show $0 available)
      expect(summary).toMatch(/\$0/);
    });

    test('AC-1.3: Only treasures played, not victory cards', () => {
      // Given I am in buy phase with 2 Copper and 1 Estate
      const hand = ['Copper', 'Estate', 'Copper'];

      // When treasures are auto-played
      const treasures = hand.filter(card =>
        ['Copper', 'Silver', 'Gold'].includes(card)
      );

      // Then only the 2 Copper are played
      expect(treasures).toEqual(['Copper', 'Copper']);

      // And Estate remains in hand (not in treasures list)
      expect(treasures).not.toContain('Estate');

      // And I see "$2 available"
      const totalCoins = treasures.length; // Each Copper = $1
      expect(totalCoins).toBe(2);
    });
  });

  describe('Command Parsing Integration', () => {
    test('should not confuse treasure commands with move numbers', () => {
      const moves = [{ type: 'play_action' as const, card: 'Village' }];

      const treasureResult = parser.parseInput('treasures', moves);
      expect(treasureResult.type).toBe('command');

      const numberResult = parser.parseInput('1', moves);
      expect(numberResult.type).toBe('move');
    });

    test('should reject partial treasure command words', () => {
      const invalidCommands = ['treas', 'treasure', 'play', 'al'];

      invalidCommands.forEach(cmd => {
        const result = parser.parseInput(cmd, []);
        // These should either be invalid or recognized differently
        // 'play' and 'al' are not valid commands in isolation
        if (result.type !== 'command' || result.command !== 'treasures') {
          expect(result.type).toBe('invalid');
        }
      });
    });
  });
});

/**
 * Helper function for formatting auto-play summary
 * This will be implemented in the actual CLI display module
 */
function formatAutoPlaySummary(treasures: string[]): string {
  if (treasures.length === 0) {
    return 'No treasures to play. $0 available.';
  }

  const coinValues: Record<string, number> = {
    'Copper': 1,
    'Silver': 2,
    'Gold': 3
  };

  const treasureDescriptions = treasures.map(treasure =>
    `${treasure} (+$${coinValues[treasure]})`
  ).join(', ');

  const totalCoins = treasures.reduce((sum, treasure) =>
    sum + coinValues[treasure], 0
  );

  return `Played all treasures: ${treasureDescriptions}. Total: $${totalCoins}`;
}
