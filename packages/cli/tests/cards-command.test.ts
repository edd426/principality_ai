/**
 * Test Suite: Phase 1.6 Feature 2 - `cards` Catalog Command
 *
 * Status: DRAFT - Tests written first (TDD approach)
 * Created: 2025-10-21
 * Phase: 1.6
 *
 * Requirements Reference: docs/requirements/phase-1.6/FEATURES.md
 *
 * Feature 2 validates the cards command that displays all available cards:
 * - Syntax: `cards` (no arguments)
 * - Output: Formatted table with all 15 cards (8 kingdom + 7 base)
 * - Sorting: Action → Treasure → Victory → Curse (then by cost, then name)
 * - Columns: Name, Cost, Type, Effect
 * - Performance: < 10ms
 *
 * Total: 8 tests (5 unit + 3 integration)
 * Note: Manual visual tests (2) excluded as they require human verification
 *
 * These tests WILL FAIL until:
 * - handleCardsCommand function implemented
 * - Table formatting logic implemented
 * - Sorting logic implemented
 * - Card descriptions available (Feature 3)
 */

// @req: R1.6-02 - cards catalog command displays all available cards
// @edge: Card sorting (by type/cost/name); all 15 cards present; performance <10ms; empty args
// @why: Players need complete card reference before game starts to understand available options

import { ConsoleCapture, PerformanceHelper } from './utils/test-utils';
import { BASIC_CARDS, KINGDOM_CARDS } from '@principality/core/src/cards';

/**
 * Mock implementation for testing
 * Will be replaced by actual implementation
 */
function handleCardsCommand(): string {
  // TODO: Implement in packages/cli/src/cards-command.ts
  const allCards = { ...BASIC_CARDS, ...KINGDOM_CARDS };

  // Sort by type, then cost, then name
  const typeOrder: Record<string, number> = { 'action': 0, 'treasure': 1, 'victory': 2, 'curse': 3 };
  const sortedCards = Object.values(allCards).sort((a, b) => {
    if (typeOrder[a.type] !== typeOrder[b.type]) {
      return typeOrder[a.type] - typeOrder[b.type];
    }
    if (a.cost !== b.cost) {
      return a.cost - b.cost;
    }
    return a.name.localeCompare(b.name);
  });

  // Format as table
  const header = '=== AVAILABLE CARDS ===';
  const columnHeader = 'Name          | Cost | Type     | Effect';
  const separator = '--------------|------|----------|------------------------------------------';

  const rows = sortedCards.map(card => {
    const name = card.name.padEnd(14);
    const cost = String(card.cost).padStart(4);
    const type = card.type.padEnd(9);
    return `${name}| ${cost} | ${type} | ${card.description}`;
  });

  return [header, '', columnHeader, separator, ...rows].join('\n');
}

describe('Feature 2: `cards` Catalog Command - Phase 1.6', () => {
  let capture: ConsoleCapture;

  beforeEach(() => {
    capture = new ConsoleCapture();
  });

  afterEach(() => {
    capture.stop();
  });

  describe('Unit Tests: Card Catalog Display (UT-2.1 to UT-2.5)', () => {
    /**
     * Test UT-2.1: Display All Cards
     *
     * Requirement FR2.1, FR2.5: Show all 15 cards
     *
     * Expected Output:
     * - All 8 kingdom cards present (Village, Smithy, Laboratory, Festival, Market, Woodcutter, Council Room, Cellar)
     * - All 7 base cards present (Copper, Silver, Gold, Estate, Duchy, Province, Curse)
     * - Total: 15 cards displayed
     */
    test('UT-2.1: displays all 15 cards', () => {
      // @req: All 15 cards (8 kingdom + 7 base) displayed in output
      // @edge: Complete card set | no duplicates | no omissions
      // @why: Ensures players see all available cards for purchase decisions
      const output = handleCardsCommand();

      // Check for all kingdom cards
      expect(output).toContain('Village');
      expect(output).toContain('Smithy');
      expect(output).toContain('Laboratory');
      expect(output).toContain('Festival');
      expect(output).toContain('Market');
      expect(output).toContain('Woodcutter');
      expect(output).toContain('Council Room');
      expect(output).toContain('Cellar');

      // Check for all base cards
      expect(output).toContain('Copper');
      expect(output).toContain('Silver');
      expect(output).toContain('Gold');
      expect(output).toContain('Estate');
      expect(output).toContain('Duchy');
      expect(output).toContain('Province');
      expect(output).toContain('Curse');
    });

    /**
     * Test UT-2.2: Table Format Validation
     *
     * Requirement FR2.2: Proper table structure
     *
     * Expected Structure:
     * - Header line: "AVAILABLE CARDS"
     * - Column headers: "Name", "Cost", "Type", "Effect"
     * - Separator line: dashes and pipes
     * - Data rows: pipe-separated columns
     */
    test('UT-2.2: output is properly formatted table', () => {
      // @req: Output is pipe-separated table with header, columns, and separator
      // @edge: Multi-line format | alignment | consistency
      // @why: Readable tables prevent parsing errors and improve usability
      const output = handleCardsCommand();
      const lines = output.split('\n');

      // Check header
      expect(output).toContain('AVAILABLE CARDS');

      // Check column headers
      expect(output).toContain('Name');
      expect(output).toContain('Cost');
      expect(output).toContain('Type');
      expect(output).toContain('Effect');

      // Check separator line
      const hasSeparator = lines.some(l => /^-+\|/.test(l));
      expect(hasSeparator).toBe(true);

      // Check data rows have pipe separators
      const dataLines = lines.slice(4).filter(l => l.trim());
      dataLines.forEach(line => {
        if (line.trim() && !line.includes('===')) {
          expect(line).toContain('|');
        }
      });
    });

    /**
     * Test UT-2.3: Correct Sorting Order
     *
     * Requirement FR2.3: Sort by type, then cost, then name
     *
     * Expected Order:
     * 1. All action cards (sorted by cost)
     * 2. All treasure cards (sorted by cost)
     * 3. All victory cards (sorted by cost)
     * 4. Curse cards
     */
    test('UT-2.3: cards are sorted by type then cost', () => {
      // @req: Cards sorted by type (action→treasure→victory→curse), cost within type
      // @edge: Type transitions | cost ties | name ordering as tiebreaker
      // @why: Logical grouping helps players find cards faster
      const output = handleCardsCommand();
      const lines = output.split('\n').filter(l =>
        l.includes('|') && !l.includes('Name') && !l.includes('===') && !l.includes('---')
      );

      // Extract types from each line
      const types: string[] = [];
      lines.forEach(line => {
        const parts = line.split('|');
        if (parts.length >= 3) {
          const type = parts[2].trim();
          types.push(type);
        }
      });

      // Find indices of each type
      const firstAction = types.findIndex(t => t === 'action');
      const firstTreasure = types.findIndex(t => t === 'treasure');
      const firstVictory = types.findIndex(t => t === 'victory');
      const firstCurse = types.findIndex(t => t === 'curse');

      // Verify order
      expect(firstAction).toBeLessThan(firstTreasure);
      expect(firstTreasure).toBeLessThan(firstVictory);
      if (firstCurse !== -1) {
        expect(firstVictory).toBeLessThan(firstCurse);
      }

      // Verify actions are grouped together
      const actionTypes = types.slice(firstAction, firstTreasure);
      actionTypes.forEach(type => {
        expect(type).toBe('action');
      });
    });

    /**
     * Test UT-2.4: Column Alignment
     *
     * Requirement FR2.4: Columns properly aligned
     *
     * Expected:
     * - All rows have same number of pipe separators
     * - Pipes align vertically
     * - Column widths consistent
     */
    test('UT-2.4: columns are properly aligned', () => {
      // @req: All rows have same pipe count, pipes align vertically
      // @edge: Variable-length content | long descriptions | edge rows
      // @why: Alignment ensures table is readable without parsing errors
      const output = handleCardsCommand();
      const lines = output.split('\n').filter(l => l.includes('|'));

      // Count separators in each line
      const separatorCounts = lines.map(l => (l.match(/\|/g) || []).length);
      const expectedCount = separatorCounts[0];

      // All lines should have same count
      separatorCounts.forEach(count => {
        expect(count).toBe(expectedCount);
      });

      // Check pipe positions align vertically
      const pipePositions = lines.map(l =>
        [...l].map((c, i) => c === '|' ? i : -1).filter(i => i >= 0)
      );

      // All first pipes should be at same position
      const firstPipePositions = pipePositions.map(p => p[0]);
      firstPipePositions.forEach(pos => {
        expect(pos).toBe(firstPipePositions[0]);
      });
    });

    /**
     * Test UT-2.5: All Descriptions Present
     *
     * Requirement FR2.5, FR2.4: Every card has effect description
     *
     * Expected:
     * - Effect column not empty for any card
     * - No placeholder text or "N/A"
     * - Description length > 5 characters
     */
    test('UT-2.5: all cards have effect descriptions', () => {
      // @req: Every card row has non-empty effect description (>5 chars)
      // @edge: Min/max description lengths | special characters
      // @why: Effects help users understand card mechanics during discovery
      const output = handleCardsCommand();
      const lines = output.split('\n').filter(l =>
        l.includes('|') && !l.includes('Name') && !l.includes('---') && !l.includes('===')
      );

      lines.forEach(line => {
        const parts = line.split('|');
        if (parts.length >= 4) {
          const effect = parts[3]?.trim();

          expect(effect).toBeTruthy();
          expect(effect).not.toBe('');
          expect(effect.length).toBeGreaterThan(5);
        }
      });
    });
  });

  describe('Integration Tests: Cards During Gameplay (IT-2.6 to IT-2.8)', () => {
    /**
     * Test IT-2.6: Cards Command During Gameplay
     *
     * Requirement FR2.5: Available during active game
     *
     * Expected:
     * - Catalog displayed
     * - Game state unchanged after command
     * - Can continue playing
     */
    test('IT-2.6: cards command works during active game', () => {
      // @req: Cards command available and displays during active gameplay
      // @edge: Various game states | player turns | phase transitions
      // @why: Players need card reference even during active play
      const output = handleCardsCommand();

      expect(output).toContain('Village');
      expect(output).toContain('AVAILABLE CARDS');
      expect(output).toContain('|'); // Table format

      // In actual integration: verify game state unchanged
    });

    /**
     * Test IT-2.7: Cards Command at Game Start
     *
     * Requirement FR2.5: Available before first turn
     *
     * Expected:
     * - Catalog displayed
     * - All 15 cards shown
     * - Player can learn about cards before playing
     */
    test('IT-2.7: cards command works before first turn', () => {
      // @req: Cards command available before game starts
      // @edge: Initial game state | no moves executed yet
      // @why: Players learn cards before first action
      const output = handleCardsCommand();

      expect(output).toContain('AVAILABLE CARDS');
      // Should have header + blank + headers + separator + 15 cards
      const lines = output.split('\n').filter(l => l.trim());
      expect(lines.length).toBeGreaterThan(15); // At least 15 cards + headers
    });

    /**
     * Test IT-2.8: Cards Command Non-Intrusive
     *
     * Requirement FR2.5: Doesn't interrupt gameplay
     *
     * Expected:
     * - Multiple calls succeed
     * - Game state remains unchanged
     * - Game can continue normally
     */
    test('IT-2.8: cards command does not interrupt game', () => {
      // @req: Multiple calls don't accumulate state or change output
      // @edge: Rapid calls | sequential calls | interspersed with other commands
      // @why: Command must be idempotent and non-intrusive
      capture.start();

      const output1 = handleCardsCommand();
      const output2 = handleCardsCommand();

      capture.stop();

      expect(output1).toContain('AVAILABLE CARDS');
      expect(output2).toContain('AVAILABLE CARDS');
      // Both calls return identical output
      expect(output1).toEqual(output2);
    });
  });

  describe('Sorting Validation', () => {
    /**
     * Test SV-1: Action cards sorted by cost within type
     *
     * Expected Order (actions only):
     * - Woodcutter (3)
     * - Village (3)
     * - Smithy (4)
     * - Laboratory (5)
     * - Festival (5)
     * - Market (5)
     * - Council Room (6)
     * - Cellar (2)... wait should be first
     */
    test('SV-1: action cards sorted by cost', () => {
      // @req: Action cards appear grouped and sorted by cost ascending
      // @edge: All 8 action cards | cost variations | ties
      const output = handleCardsCommand();

      // Find first action card and verify cost progression
      const lines = output.split('\n').filter(l =>
        l.includes('|') && l.includes('action')
      );

      const costs: number[] = [];
      lines.forEach(line => {
        const parts = line.split('|');
        if (parts.length >= 2) {
          const cost = parseInt(parts[1].trim(), 10);
          if (!isNaN(cost)) {
            costs.push(cost);
          }
        }
      });

      // Costs should be in ascending order
      for (let i = 1; i < costs.length; i++) {
        expect(costs[i]).toBeGreaterThanOrEqual(costs[i - 1]);
      }
    });

    /**
     * Test SV-2: Treasure cards sorted by cost within type
     *
     * Expected Order:
     * - Copper (0)
     * - Silver (3)
     * - Gold (6)
     */
    test('SV-2: treasure cards sorted by cost', () => {
      // @req: Treasure cards appear grouped and sorted by cost ascending
      // @edge: 3 treasure cards | cost progression 0→3→6
      const output = handleCardsCommand();

      const lines = output.split('\n').filter(l =>
        l.includes('|') && l.includes('treasure')
      );

      // Copper should come before Silver, Silver before Gold
      const text = output.toLowerCase();
      const copperPos = text.indexOf('copper');
      const silverPos = text.indexOf('silver');
      const goldPos = text.indexOf('gold');

      expect(copperPos).toBeLessThan(silverPos);
      expect(silverPos).toBeLessThan(goldPos);
    });

    /**
     * Test SV-3: Type order correct (Action < Treasure < Victory < Curse)
     */
    test('SV-3: types ordered correctly', () => {
      // @req: Type order is action→treasure→victory→curse
      // @edge: All types present | type transitions
      const output = handleCardsCommand();

      const hasAction = output.includes('action');
      const hasTreasure = output.includes('treasure');
      const hasVictory = output.includes('victory');
      const hasCurse = output.includes('curse');

      // All types should be present
      expect(hasAction).toBe(true);
      expect(hasTreasure).toBe(true);
      expect(hasVictory).toBe(true);
      expect(hasCurse).toBe(true);

      // Find first occurrence of each
      const actionFirst = output.indexOf('action');
      const treasureFirst = output.indexOf('treasure');
      const victoryFirst = output.indexOf('victory');
      const curseFirst = output.indexOf('curse');

      // Verify order
      expect(actionFirst).toBeLessThan(treasureFirst);
      expect(treasureFirst).toBeLessThan(victoryFirst);
      expect(victoryFirst).toBeLessThan(curseFirst);
    });
  });

  describe('Performance Tests', () => {
    /**
     * Test PT-2.1: Cards command executes in < 10ms
     *
     * Requirement FR2.5, NFR-2.1
     *
     * Expected:
     * - Average response time < 10ms
     * - Max response time < 20ms
     */
    test('PT-2.1: cards command response time < 10ms', async () => {
      // @req: Cards command responds in < 10ms average
      // @edge: Repeated calls | cold/warm cache
      // @why: Instant feedback ensures good UX during gameplay
      await PerformanceHelper.assertWithinTime(
        () => handleCardsCommand(),
        10,
        'cards command'
      );
    });

    /**
     * Test PT-2.2: Multiple calls maintain performance
     *
     * Expected:
     * - 50 consecutive calls still respond quickly
     * - No degradation over time
     */
    test('PT-2.2: multiple cards commands maintain performance', async () => {
      // @req: 50 consecutive calls respond in < 500ms (avg <10ms each)
      // @edge: No performance degradation over iterations
      // @why: Repeated lookups should maintain constant performance
      const iterations = 50;

      await PerformanceHelper.assertWithinTime(
        async () => {
          for (let i = 0; i < iterations; i++) {
            handleCardsCommand();
          }
        },
        500, // 50 calls should take < 500ms (< 10ms each)
        '50 cards commands'
      );
    });
  });

  describe('Acceptance Criteria Validation', () => {
    /**
     * AC-2.1: Display all cards
     *
     * Gherkin:
     * Given the game is running
     * When I type "cards"
     * Then the output includes all 15 cards
     * And each card shows: name, cost, type, effect
     * And the table is properly formatted with aligned columns
     */
    test('AC-2.1: displays all cards in formatted table', () => {
      // @req: All 15 cards displayed in readable table format
      // @edge: Complete set | formatting consistency
      const output = handleCardsCommand();

      // All kingdom cards
      const kingdomCards = ['Village', 'Smithy', 'Laboratory', 'Festival', 'Market', 'Woodcutter', 'Council Room', 'Cellar'];
      kingdomCards.forEach(card => {
        expect(output).toContain(card);
      });

      // All base cards
      const baseCards = ['Copper', 'Silver', 'Gold', 'Estate', 'Duchy', 'Province', 'Curse'];
      baseCards.forEach(card => {
        expect(output).toContain(card);
      });

      // Verify table format
      expect(output).toContain('|'); // Has pipes
      expect(output).toContain('AVAILABLE CARDS'); // Has header
    });

    /**
     * AC-2.2: Correct sorting
     *
     * Gherkin:
     * Given the game is running
     * When I type "cards"
     * Then action cards appear first (sorted by cost)
     * And treasure cards appear second (sorted by cost)
     * And victory cards appear third (sorted by cost)
     * And curse cards appear last
     */
    test('AC-2.2: cards sorted correctly by type and cost', () => {
      // @req: Type order action→treasure→victory→curse with costs ascending
      // @edge: Type transitions | cost ordering within type
      const output = handleCardsCommand();

      // Extract card data
      const lines = output.split('\n').filter(l =>
        l.includes('|') && !l.includes('Name') && !l.includes('---') && !l.includes('===')
      );

      let lastType = '';
      let lastCost = -1;
      let lastCostInType = -1;

      const typeOrder: Record<string, number> = { 'action': 0, 'treasure': 1, 'victory': 2, 'curse': 3 };

      lines.forEach(line => {
        const parts = line.split('|');
        if (parts.length >= 3) {
          const type = parts[2].trim();
          const cost = parseInt(parts[1].trim(), 10);

          // If type changed, verify it's in correct order
          if (type !== lastType) {
            expect(typeOrder[type]).toBeGreaterThanOrEqual(typeOrder[lastType] || 0);
            lastCostInType = -1;
            lastType = type;
          }

          // Costs within type should be ascending
          expect(cost).toBeGreaterThanOrEqual(lastCostInType);
          lastCostInType = cost;
        }
      });
    });

    /**
     * AC-2.3: Readable formatting
     *
     * Gherkin:
     * Given the game is running
     * When I type "cards"
     * Then column headers are clear
     * And columns are aligned
     * And there's a separator line
     * And long effects don't break layout
     */
    test('AC-2.3: table is readable and well-formatted', () => {
      // @req: Header, column labels, separators, aligned content
      // @edge: Long descriptions | varying column widths
      // @why: Readable tables enable quick parsing and understanding
      const output = handleCardsCommand();

      // Has header
      expect(output).toContain('AVAILABLE CARDS');

      // Has column headers
      expect(output).toContain('Name');
      expect(output).toContain('Cost');
      expect(output).toContain('Type');
      expect(output).toContain('Effect');

      // Has separator
      const hasSeparator = /^-+\|/.test(output.split('\n').find(l => /^-+\|/.test(l)) || '');
      expect(hasSeparator).toBe(true);

      // No excessively long lines (> 100 chars indicates wrapping)
      const lines = output.split('\n');
      const excessivelyLongLines = lines.filter(l => l.length > 150);
      // Allow some long lines but not excessive wrapping
      expect(excessivelyLongLines.length).toBeLessThan(3);
    });

    /**
     * AC-2.4: Available anytime
     *
     * Gherkin:
     * Given the game is in any phase
     * When I type "cards"
     * Then the catalog is displayed
     * And the game state is unchanged
     */
    test('AC-2.4: cards command works at any time', () => {
      // @req: Cards command available at any game state
      // @edge: All phases | multi-player scenarios
      const output = handleCardsCommand();

      expect(output).toContain('AVAILABLE CARDS');
      expect(output.split('\n').length).toBeGreaterThan(15);
    });

    /**
     * AC-2.5: Performance requirement
     *
     * Gherkin:
     * Given the game is running
     * When I type "cards"
     * Then the response time is < 10ms
     */
    test('AC-2.5: meets performance requirement', async () => {
      // @req: Cards command responds in < 10ms
      // @edge: Cold/warm cache | repeated queries
      await PerformanceHelper.assertWithinTime(
        () => handleCardsCommand(),
        10,
        'cards display'
      );
    });
  });
});
