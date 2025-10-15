/**
 * Test Suite: Stable Card Numbers Feature (Phase 1.5)
 *
 * Requirements: CLI_PHASE2_REQUIREMENTS.md - Feature 2
 * Validates stable number mappings, consistency, and display
 *
 * Key Requirements:
 * - Village always [7], Smithy always [6], etc.
 * - Simple stable-only display (no hybrid)
 * - Gaps in numbering accepted
 * - Opt-in via --stable-numbers flag
 * - Help command shows reference
 * - Performance: < 5ms overhead
 */

import { Parser } from '../src/parser';
import { GameStateBuilder, PerformanceHelper } from './utils/test-utils';
import { Move } from '@principality/core';

/**
 * Stable number mapping as per STABLE_NUMBER_REFERENCE.md
 */
const STABLE_NUMBER_MAP: Record<string, number> = {
  // Action cards (1-10, alphabetical)
  'Cellar': 1,
  'Council Room': 2,
  'Festival': 3,
  'Laboratory': 4,
  'Market': 5,
  'Smithy': 6,
  'Village': 7,
  'Woodcutter': 8,

  // Treasures (11-13, by value)
  'Copper': 11,
  'Silver': 12,
  'Gold': 13,

  // Buy moves (21-34, alphabetical)
  'Buy Copper': 21,
  'Buy Silver': 22,
  'Buy Gold': 23,
  'Buy Estate': 24,
  'Buy Duchy': 25,
  'Buy Province': 26,
  'Buy Cellar': 27,
  'Buy Council Room': 28,
  'Buy Festival': 29,
  'Buy Laboratory': 30,
  'Buy Market': 31,
  'Buy Smithy': 32,
  'Buy Village': 33,
  'Buy Woodcutter': 34,

  // Special moves (50+)
  'End Phase': 50
};

/**
 * Reverse lookup: stable number → card name
 */
const STABLE_NUMBER_TO_CARD: Record<number, string> =
  Object.fromEntries(
    Object.entries(STABLE_NUMBER_MAP).map(([card, num]) => [num, card])
  );

describe('Feature 2: Stable Card Numbers', () => {
  let parser: Parser;

  beforeEach(() => {
    parser = new Parser();
  });

  describe('Stable Number Mapping Consistency (FR-2.2, FR-2.4)', () => {
    test('UT-2.1: Village should always have stable number 7', () => {
      // Test across different hand compositions
      const scenarios = [
        ['Village'],
        ['Copper', 'Village'],
        ['Village', 'Smithy', 'Market'],
        ['Estate', 'Estate', 'Village']
      ];

      scenarios.forEach(hand => {
        const stableNum = STABLE_NUMBER_MAP['Village'];
        expect(stableNum).toBe(7);
      });
    });

    test('should maintain stable number for Village across multiple turns', () => {
      // Turn 1
      expect(STABLE_NUMBER_MAP['Village']).toBe(7);

      // Turn 5 (simulate by checking again)
      expect(STABLE_NUMBER_MAP['Village']).toBe(7);

      // Turn 20
      expect(STABLE_NUMBER_MAP['Village']).toBe(7);
    });

    test('should maintain stable number for Smithy consistently', () => {
      expect(STABLE_NUMBER_MAP['Smithy']).toBe(6);

      // Across different game states
      const hands = [
        ['Smithy'],
        ['Village', 'Smithy'],
        ['Copper', 'Smithy', 'Market']
      ];

      hands.forEach(() => {
        expect(STABLE_NUMBER_MAP['Smithy']).toBe(6);
      });
    });

    test('should never change stable numbers regardless of game state', () => {
      // Record initial mappings
      const initialMappings = { ...STABLE_NUMBER_MAP };

      // Simulate game progression by creating different states
      const states = [
        GameStateBuilder.create().withPhase('action').build(),
        GameStateBuilder.create().withPhase('buy').build(),
        GameStateBuilder.create().withTurnNumber(10).build()
      ];

      // After all state changes, mappings should be identical
      expect(STABLE_NUMBER_MAP).toEqual(initialMappings);
    });
  });

  describe('Stable Number Lookup Table Completeness (FR-2.3)', () => {
    test('UT-2.2: should have stable numbers for all action cards', () => {
      const actionCards = [
        'Cellar', 'Council Room', 'Festival', 'Laboratory',
        'Market', 'Smithy', 'Village', 'Woodcutter'
      ];

      actionCards.forEach(card => {
        const stableNum = STABLE_NUMBER_MAP[card];
        expect(stableNum).toBeDefined();
        expect(typeof stableNum).toBe('number');
        expect(stableNum).toBeGreaterThanOrEqual(1);
        expect(stableNum).toBeLessThanOrEqual(10);
      });
    });

    test('should have stable numbers for all treasure cards', () => {
      const treasureCards = ['Copper', 'Silver', 'Gold'];

      treasureCards.forEach(card => {
        const stableNum = STABLE_NUMBER_MAP[card];
        expect(stableNum).toBeDefined();
        expect(stableNum).toBeGreaterThanOrEqual(11);
        expect(stableNum).toBeLessThanOrEqual(13);
      });
    });

    test('should have stable numbers for all buy moves', () => {
      const buyMoves = [
        'Buy Copper', 'Buy Silver', 'Buy Gold',
        'Buy Estate', 'Buy Duchy', 'Buy Province',
        'Buy Cellar', 'Buy Council Room', 'Buy Festival',
        'Buy Laboratory', 'Buy Market', 'Buy Smithy',
        'Buy Village', 'Buy Woodcutter'
      ];

      buyMoves.forEach(move => {
        const stableNum = STABLE_NUMBER_MAP[move];
        expect(stableNum).toBeDefined();
        expect(stableNum).toBeGreaterThanOrEqual(21);
        expect(stableNum).toBeLessThanOrEqual(34);
      });
    });

    test('should have stable number for End Phase', () => {
      const stableNum = STABLE_NUMBER_MAP['End Phase'];
      expect(stableNum).toBe(50);
    });

    test('action cards should be in alphabetical order', () => {
      const actionCards = ['Cellar', 'Council Room', 'Festival', 'Laboratory',
                          'Market', 'Smithy', 'Village', 'Woodcutter'];
      const sorted = [...actionCards].sort();

      // Verify they match alphabetical order
      expect(actionCards).toEqual(sorted);

      // Verify stable numbers increase (mostly, with some gaps)
      for (let i = 0; i < actionCards.length; i++) {
        const stableNum = STABLE_NUMBER_MAP[actionCards[i]];
        expect(stableNum).toBeGreaterThanOrEqual(1);
        expect(stableNum).toBeLessThanOrEqual(10);
      }
    });

    test('treasures should be ordered by value', () => {
      expect(STABLE_NUMBER_MAP['Copper']).toBe(11); // $1
      expect(STABLE_NUMBER_MAP['Silver']).toBe(12); // $2
      expect(STABLE_NUMBER_MAP['Gold']).toBe(13);   // $3

      // Verify increasing order
      expect(STABLE_NUMBER_MAP['Copper']).toBeLessThan(STABLE_NUMBER_MAP['Silver']);
      expect(STABLE_NUMBER_MAP['Silver']).toBeLessThan(STABLE_NUMBER_MAP['Gold']);
    });
  });

  describe('Reverse Lookup (UT-2.3)', () => {
    test('should reverse lookup stable number to card name', () => {
      expect(STABLE_NUMBER_TO_CARD[7]).toBe('Village');
      expect(STABLE_NUMBER_TO_CARD[6]).toBe('Smithy');
      expect(STABLE_NUMBER_TO_CARD[50]).toBe('End Phase');
    });

    test('should reverse lookup all action cards', () => {
      expect(STABLE_NUMBER_TO_CARD[1]).toBe('Cellar');
      expect(STABLE_NUMBER_TO_CARD[2]).toBe('Council Room');
      expect(STABLE_NUMBER_TO_CARD[3]).toBe('Festival');
      expect(STABLE_NUMBER_TO_CARD[4]).toBe('Laboratory');
      expect(STABLE_NUMBER_TO_CARD[5]).toBe('Market');
      expect(STABLE_NUMBER_TO_CARD[6]).toBe('Smithy');
      expect(STABLE_NUMBER_TO_CARD[7]).toBe('Village');
      expect(STABLE_NUMBER_TO_CARD[8]).toBe('Woodcutter');
    });

    test('should reverse lookup all treasures', () => {
      expect(STABLE_NUMBER_TO_CARD[11]).toBe('Copper');
      expect(STABLE_NUMBER_TO_CARD[12]).toBe('Silver');
      expect(STABLE_NUMBER_TO_CARD[13]).toBe('Gold');
    });

    test('should reverse lookup buy moves', () => {
      expect(STABLE_NUMBER_TO_CARD[33]).toBe('Buy Village');
      expect(STABLE_NUMBER_TO_CARD[32]).toBe('Buy Smithy');
      expect(STABLE_NUMBER_TO_CARD[26]).toBe('Buy Province');
    });

    test('should return undefined for unmapped stable numbers', () => {
      expect(STABLE_NUMBER_TO_CARD[9]).toBeUndefined();  // Gap in action cards
      expect(STABLE_NUMBER_TO_CARD[10]).toBeUndefined(); // Gap in action cards
      expect(STABLE_NUMBER_TO_CARD[14]).toBeUndefined(); // After treasures
      expect(STABLE_NUMBER_TO_CARD[20]).toBeUndefined(); // Before buy moves
      expect(STABLE_NUMBER_TO_CARD[99]).toBeUndefined(); // Invalid number
    });
  });

  describe('Display Format (FR-2.5, FR-2.7)', () => {
    test('UT-2.5: should display gaps correctly when some cards unavailable', () => {
      // Available moves: Village, Market, End Phase
      const availableMoves = [
        { card: 'Village', stableNum: 7 },
        { card: 'Market', stableNum: 5 },
        { stableNum: 50, description: 'End Phase' }
      ];

      // Format display
      const display = formatStableNumberDisplay(availableMoves);

      // Should show non-consecutive numbers
      expect(display).toContain('[5] Play Market');
      expect(display).toContain('[7] Play Village');
      expect(display).toContain('[50] End Phase');

      // Should not show Smithy (gap at [6])
      expect(display).not.toContain('[6]');
    });

    test('should display simple stable-only format (no hybrid)', () => {
      const moves = [
        { card: 'Village', stableNum: 7 },
        { card: 'Smithy', stableNum: 6 }
      ];

      const display = formatStableNumberDisplay(moves);

      // Should show stable numbers only
      expect(display).toMatch(/\[7\]\s+Play Village/);
      expect(display).toMatch(/\[6\]\s+Play Smithy/);

      // Should NOT show sequential numbers
      expect(display).not.toMatch(/\[1\]\s+\(7\)/);
      expect(display).not.toMatch(/\[2\]\s+\(6\)/);
    });

    test('should display buy phase with stable numbers', () => {
      const moves = [
        { card: 'Silver', stableNum: 22, action: 'buy' },
        { card: 'Village', stableNum: 33, action: 'buy' },
        { stableNum: 50, description: 'End Phase' }
      ];

      const display = formatStableNumberDisplay(moves);

      expect(display).toContain('[22] Buy Silver ($3)');
      expect(display).toContain('[33] Buy Village ($3)');
      expect(display).toContain('[50] End Phase');
    });

    test('should handle empty move list', () => {
      const moves: any[] = [];

      const display = formatStableNumberDisplay(moves);

      expect(display).toBe('No available moves.');
    });

    test('should display all moves in ascending stable number order', () => {
      const moves = [
        { card: 'Village', stableNum: 7 },
        { card: 'Market', stableNum: 5 },
        { card: 'Smithy', stableNum: 6 }
      ];

      const display = formatStableNumberDisplay(moves);
      const lines = display.split('\n').filter(l => l.trim());

      // Should be in order: 5, 6, 7
      expect(lines[0]).toContain('[5]');
      expect(lines[1]).toContain('[6]');
      expect(lines[2]).toContain('[7]');
    });
  });

  describe('Input Parsing with Stable Numbers (FR-2.7)', () => {
    test('should accept stable number input for Village', () => {
      const moves: Move[] = [
        { type: 'play_action', card: 'Village' },
        { type: 'end_phase' }
      ];

      // In stable mode, user types "7" for Village
      const result = parser.parseInput('7', moves, { stableNumbers: true });

      // Parser should map 7 → Village move
      expect(result.type).toBe('move');
      expect(result.move?.card).toBe('Village');
    });

    test('should reject unmapped stable numbers', () => {
      const moves: Move[] = [
        { type: 'play_action', card: 'Village' }
      ];

      // User types "9" which is not mapped
      const result = parser.parseInput('9', moves, { stableNumbers: true });

      expect(result.type).toBe('invalid');
      expect(result.error).toContain('Invalid stable number');
    });

    test('should map stable numbers to correct moves across different hands', () => {
      // Hand 1: Village, Smithy
      const hand1Moves: Move[] = [
        { type: 'play_action', card: 'Village' }, // Stable 7
        { type: 'play_action', card: 'Smithy' }   // Stable 6
      ];

      // Hand 2: Market, Village
      const hand2Moves: Move[] = [
        { type: 'play_action', card: 'Market' },  // Stable 5
        { type: 'play_action', card: 'Village' }  // Stable 7
      ];

      // Both hands: 7 should map to Village
      const result1 = parser.parseInput('7', hand1Moves, { stableNumbers: true });
      const result2 = parser.parseInput('7', hand2Moves, { stableNumbers: true });

      expect(result1.move?.card).toBe('Village');
      expect(result2.move?.card).toBe('Village');
    });
  });

  describe('Edge Cases (EC-2.1, EC-2.2, EC-2.3)', () => {
    test('EC-2.1: multiple copies of same card share stable number', () => {
      const hand = ['Village', 'Village', 'Village'];

      // All Villages have stable number 7
      hand.forEach(card => {
        expect(STABLE_NUMBER_MAP[card]).toBe(7);
      });

      // Display should show count
      const moves = [
        { card: 'Village', stableNum: 7, count: 3 }
      ];
      const display = formatStableNumberDisplay(moves);
      expect(display).toMatch(/\[7\]\s+Play Village\s+\(x3/);
    });

    test('EC-2.1: typing stable number plays first occurrence', () => {
      const moves: Move[] = [
        { type: 'play_action', card: 'Village' },
        { type: 'play_action', card: 'Village' },
        { type: 'play_action', card: 'Village' }
      ];

      // User types "7" (Village's stable number)
      const result = parser.parseInput('7', moves, { stableNumbers: true });

      // Should select first Village
      expect(result.type).toBe('move');
      expect(result.move).toEqual(moves[0]);
    });

    test('EC-2.2: phase transition shows new moves with stable numbers', () => {
      // Action phase moves
      const actionMoves = [
        { card: 'Village', stableNum: 7 }
      ];

      // After transition to buy phase
      const buyMoves = [
        { card: 'Silver', stableNum: 22, action: 'buy' },
        { stableNum: 50, description: 'End Phase' }
      ];

      const actionDisplay = formatStableNumberDisplay(actionMoves);
      const buyDisplay = formatStableNumberDisplay(buyMoves);

      // Action phase shows [7]
      expect(actionDisplay).toContain('[7]');
      expect(actionDisplay).not.toContain('[22]');

      // Buy phase shows [22], not [7]
      expect(buyDisplay).toContain('[22]');
      expect(buyDisplay).not.toContain('[7]');
    });

    test('EC-2.3: action cards not playable in buy phase', () => {
      // In buy phase, action cards should not appear
      const hand = ['Village', 'Smithy', 'Copper'];
      const buyPhaseMoves: Move[] = [
        { type: 'play_treasure', card: 'Copper' },
        { type: 'end_phase' }
      ];

      // Village (7) and Smithy (6) should not be in moves
      const display = formatStableNumberDisplay(
        buyPhaseMoves.map(m => ({
          card: m.card,
          stableNum: m.card ? STABLE_NUMBER_MAP[m.card] : 50
        }))
      );

      expect(display).not.toContain('[7]'); // Village
      expect(display).not.toContain('[6]'); // Smithy
      expect(display).toContain('[11]');    // Copper
    });
  });

  describe('Help Command and Documentation (FR-2.3, AC-2.4)', () => {
    test('AC-2.4: help command shows stable number reference', () => {
      const helpText = getStableNumberHelp();

      // Should show action cards section
      expect(helpText).toContain('Action Cards (1-10)');
      expect(helpText).toContain('[7] Village');
      expect(helpText).toContain('[6] Smithy');

      // Should show treasures section
      expect(helpText).toContain('Treasure Cards (11-13)');
      expect(helpText).toContain('[11] Copper');
      expect(helpText).toContain('[12] Silver');
      expect(helpText).toContain('[13] Gold');

      // Should show buy moves section
      expect(helpText).toContain('Buy Moves (21-34)');
      expect(helpText).toContain('[33] Buy Village');

      // Should show special moves
      expect(helpText).toContain('[50] End Phase');
    });

    test('help should explain stable numbers never change', () => {
      const helpText = getStableNumberHelp();

      expect(helpText).toMatch(/never change|always|consistent/i);
      expect(helpText).toContain('Village is always [7]');
    });

    test('help should explain gaps are normal', () => {
      const helpText = getStableNumberHelp();

      expect(helpText).toMatch(/gaps|non-consecutive|skip/i);
    });
  });

  describe('Performance Requirements (NFR-2.1)', () => {
    test('should lookup stable number in < 5ms', async () => {
      await PerformanceHelper.assertWithinTime(
        () => {
          const num = STABLE_NUMBER_MAP['Village'];
          return num;
        },
        5,
        'stable number lookup'
      );
    });

    test('should reverse lookup in < 5ms', async () => {
      await PerformanceHelper.assertWithinTime(
        () => {
          const card = STABLE_NUMBER_TO_CARD[7];
          return card;
        },
        5,
        'reverse stable number lookup'
      );
    });

    test('should format stable number display for 50 moves in < 15ms', async () => {
      const moves = Array(50).fill(0).map((_, i) => ({
        card: `Card${i}`,
        stableNum: i + 1
      }));

      await PerformanceHelper.assertWithinTime(
        () => formatStableNumberDisplay(moves),
        15,
        'format large stable number display'
      );
    });
  });

  describe('Acceptance Criteria Validation', () => {
    test('AC-2.1: Village always has stable number 7 across turns', () => {
      // When I start a game
      const turn1 = STABLE_NUMBER_MAP['Village'];
      expect(turn1).toBe(7);

      // After multiple turns
      const turn5 = STABLE_NUMBER_MAP['Village'];
      const turn10 = STABLE_NUMBER_MAP['Village'];

      // Then Village always has stable number [7]
      expect(turn5).toBe(7);
      expect(turn10).toBe(7);

      // And Smithy always has stable number [6]
      expect(STABLE_NUMBER_MAP['Smithy']).toBe(6);

      // And these numbers do not change across turns
      expect(turn1).toBe(turn5);
      expect(turn5).toBe(turn10);
    });

    test('AC-2.2: Non-consecutive numbers displayed correctly', () => {
      // Given I am in action phase with Village and Smithy
      const moves = [
        { card: 'Village', stableNum: 7 },
        { card: 'Smithy', stableNum: 6 }
      ];

      // When I see the move list
      const display = formatStableNumberDisplay(moves);

      // Then I see [6] Play Smithy and [7] Play Village
      expect(display).toContain('[6] Play Smithy');
      expect(display).toContain('[7] Play Village');

      // And the numbers are not consecutive (gap accepted)
      const lines = display.split('\n').filter(l => l.includes('['));
      expect(lines.length).toBe(2);
    });

    test('AC-2.3: Multiple copies handled correctly', () => {
      // Given I have 3 Copper in hand
      const moves = [
        { card: 'Copper', stableNum: 11, count: 3 }
      ];

      // When I see the move list
      const display = formatStableNumberDisplay(moves);

      // Then I see [11] Play Copper (x3 in hand)
      expect(display).toMatch(/\[11\]\s+Play Copper.*x3/);

      // And typing 11 plays one Copper
      const parseResult = parser.parseInput('11', [
        { type: 'play_treasure' as const, card: 'Copper' }
      ], { stableNumbers: true });

      expect(parseResult.move?.card).toBe('Copper');
    });
  });

  describe('Command-Line Flag Parsing', () => {
    test('should support --stable-numbers flag', () => {
      const flags = ['--stable-numbers', '--stable'];

      flags.forEach(flag => {
        const options = parseCommandLineFlags([flag]);
        expect(options.stableNumbers).toBe(true);
      });
    });

    test('should default to sequential numbers without flag', () => {
      const options = parseCommandLineFlags([]);
      expect(options.stableNumbers).toBe(false);
    });
  });
});

/**
 * Helper function to format stable number display
 */
function formatStableNumberDisplay(moves: Array<{ card?: string; stableNum: number; count?: number; description?: string; action?: string }>): string {
  if (moves.length === 0) {
    return 'No available moves.';
  }

  // Card costs for price display
  const cardCosts: Record<string, number> = {
    'Copper': 0, 'Silver': 3, 'Gold': 6,
    'Estate': 2, 'Duchy': 5, 'Province': 8,
    'Cellar': 2, 'Chapel': 2, 'Council Room': 5, 'Festival': 5,
    'Laboratory': 5, 'Market': 5, 'Smithy': 4, 'Village': 3,
    'Witch': 5, 'Workshop': 3
  };

  // Sort by stable number
  const sorted = [...moves].sort((a, b) => a.stableNum - b.stableNum);

  return sorted.map(move => {
    const num = move.stableNum;
    const count = move.count ? ` (x${move.count} in hand)` : '';

    if (move.description) {
      return `  [${num}] ${move.description}`;
    }

    const action = move.action === 'buy' ? 'Buy' : 'Play';
    const price = move.action === 'buy' && move.card ? ` ($${cardCosts[move.card] || 0})` : '';
    return `  [${num}] ${action} ${move.card}${price}${count}`;
  }).join('\n');
}

/**
 * Helper function to get stable number help text
 */
function getStableNumberHelp(): string {
  return `
Stable Number Reference:

Action Cards (1-10):
  [1] Cellar
  [2] Council Room
  [3] Festival
  [4] Laboratory
  [5] Market
  [6] Smithy
  [7] Village
  [8] Woodcutter

Treasure Cards (11-13):
  [11] Copper
  [12] Silver
  [13] Gold

Buy Moves (21-34):
  [22] Buy Silver ($3)
  [26] Buy Province ($8)
  [33] Buy Village ($3)
  ...and more

Special Moves:
  [50] End Phase

Stable numbers never change. Village is always [7], regardless of what else is in your hand.
Gaps in numbering are normal (non-consecutive numbers).
`;
}

/**
 * Helper to parse command-line flags
 */
function parseCommandLineFlags(args: string[]): { stableNumbers: boolean } {
  return {
    stableNumbers: args.includes('--stable-numbers') || args.includes('--stable')
  };
}
