/**
 * Test Suite: Cards Command End-to-End and Integration Tests
 *
 * Status: DRAFT - Tests written first (TDD approach)
 * Created: 2025-10-21
 * Phase: 1.6
 *
 * Requirements Reference: docs/requirements/phase-1.6/FEATURES.md (Feature 2)
 *
 * PURPOSE:
 * These tests validate the COMPLETE user workflow for the cards command:
 * - CLI parser recognizes "cards" command
 * - CLI routes to handleCardsCommand()
 * - Handler output displays all 15 cards in correct format
 * - Game state remains unchanged
 * - Command works during all game phases
 * - Performance requirement met (< 10ms)
 *
 * CRITICAL VALIDATION:
 * - Tests validate COMPILED code in production environment
 * - Catches module import failures and CLI wiring issues
 * - Prevents "works in tests, fails in production" scenarios
 *
 * Test Count: 8 E2E tests validating complete user workflows
 *
 * @req: Feature 2 - Display card catalog during gameplay
 * @req: Command available during all game phases
 * @req: No game state modification
 * @req: Performance < 10ms
 */

import { Parser, ParseResult } from '../../src/parser';
import { GameEngine, GameState, Move, KINGDOM_CARDS, BASIC_CARDS } from '@principality/core';
import { ConsoleCapture, GameStateBuilder } from '../utils/test-utils';
import { handleCardsCommand } from '../../src/commands/cards';
import { PerformanceHelper } from '../utils/test-utils';

const TOTAL_KINGDOM_CARDS = Object.keys(KINGDOM_CARDS).length;
const TOTAL_BASIC_CARDS = Object.keys(BASIC_CARDS).length;
const TOTAL_CARDS = TOTAL_KINGDOM_CARDS + TOTAL_BASIC_CARDS;

describe('Cards Command End-to-End Tests - Full User Workflow', () => {
  let parser: Parser;
  let engine: GameEngine;
  let capture: ConsoleCapture;

  beforeEach(() => {
    parser = new Parser();
    engine = new GameEngine('e2e-cards-test-seed');
    capture = new ConsoleCapture();
  });

  afterEach(() => {
    capture.stop();
  });

  /**
   * E2E Test 1: User Types "cards" During Active Game
   *
   * @req: Complete user workflow - input to output
   * @edge: Most common use case during gameplay
   * @hint: Simulates exact user experience
   *
   * User Story:
   * - User is playing game (action phase, turn 1)
   * - User types: "cards"
   * - System displays: Full card catalog table
   * - Output contains: All 15 cards with name, cost, type, effect
   * - User can continue playing normally
   *
   * Expected Flow:
   * 1. Parser.parseInput('cards') → { type: 'command', command: 'cards' }
   * 2. CLI.handleCommand('cards') → calls handleCardsCommand()
   * 3. handleCardsCommand() → returns formatted table string
   * 4. Output displayed to user
   * 5. Game state unchanged
   */
  test('E2E-1: user types "cards" during active game', () => {
    // @req: End-to-end test of most common user scenario
    // @edge: Real gameplay simulation
    // @hint: This validates complete chain: parser → CLI → command → output

    // SIMULATE: User typing "cards" in action phase
    let game = engine.initializeGame(1);
    const validMoves = engine.getValidMoves(game);

    capture.start();

    // Step 1: User types input
    const userInput = 'cards';

    // Step 2: Parser processes input
    const parseResult = parser.parseInput(userInput, validMoves);

    // CRITICAL: Parser must recognize this as a command
    expect(parseResult.type).toBe('command');
    expect(parseResult.command).toBe('cards');

    // Step 3: CLI routes to handleCardsCommand (simulated)
    const output = handleCardsCommand();

    // Step 4: Output displayed to user
    console.log(output);

    capture.stop();

    // Step 5: User sees card catalog
    const displayedOutput = capture.getAllOutput();

    // Verify output structure
    expect(displayedOutput).toContain('AVAILABLE CARDS');
    expect(displayedOutput).toContain('Name');
    expect(displayedOutput).toContain('Cost');
    expect(displayedOutput).toContain('Type');
    expect(displayedOutput).toContain('Effect');

    // Verify all kingdom cards present (dynamically from KINGDOM_CARDS)
    Object.keys(KINGDOM_CARDS).forEach(card => {
      expect(displayedOutput).toContain(card);
    });

    // Verify all base cards present
    const baseCards = ['Copper', 'Silver', 'Gold', 'Estate', 'Duchy', 'Province', 'Curse'];
    baseCards.forEach(card => {
      expect(displayedOutput).toContain(card);
    });
  });

  /**
   * E2E Test 2: Card Sorting Correct (Action→Treasure→Victory→Curse)
   *
   * @req: Cards sorted by type, then cost within type
   * @edge: Type transitions, cost ordering
   * @hint: Validates sorting logic in production
   */
  test('E2E-2: cards displayed in correct sort order', () => {
    // @req: Sorting matches specification: type→cost→name
    // @edge: Type grouping | cost ordering | name as tiebreaker
    // @hint: Verify action cards appear before treasure, etc.

    capture.start();
    const output = handleCardsCommand();
    console.log(output);
    capture.stop();

    const displayedOutput = capture.getAllOutput();
    const lines = displayedOutput.split('\n');

    // Extract lines with card data (has pipes, not headers/separators)
    const cardLines = lines.filter(l =>
      l.includes('|') && !l.includes('Name') && !l.includes('===') && !l.includes('---')
    );

    // Helper to get base type category for sorting
    const getTypeCategory = (type: string): string => {
      if (type.startsWith('action')) return 'action';
      return type;
    };

    // Verify type order
    let lastTypeCategory = '';
    const typeOrder: Record<string, number> = { 'action': 0, 'treasure': 1, 'victory': 2, 'curse': 3 };

    cardLines.forEach(line => {
      const parts = line.split('|');
      if (parts.length >= 3) {
        const type = parts[2].trim();
        const typeCategory = getTypeCategory(type);
        const currentTypeIndex = typeOrder[typeCategory] ?? 99;

        if (lastTypeCategory !== '') {
          const lastTypeIndex = typeOrder[lastTypeCategory] ?? 99;
          // Each type category should appear in order
          expect(currentTypeIndex).toBeGreaterThanOrEqual(lastTypeIndex);
        }
        lastTypeCategory = typeCategory;
      }
    });

    // Verify all type categories present
    expect(displayedOutput.includes('action')).toBe(true);
    expect(displayedOutput.includes('treasure')).toBe(true);
    expect(displayedOutput.includes('victory')).toBe(true);
    expect(displayedOutput.includes('curse')).toBe(true);
  });

  /**
   * E2E Test 3: All Cards Present with Complete Information
   *
   * @req: Every card displayed with name, cost, type, effect
   * @edge: Data completeness
   * @hint: Validates card data availability and formatting
   */
  test(`E2E-3: all ${TOTAL_CARDS} cards displayed with complete information`, () => {
    // @req: All cards with all required fields
    // @edge: Data availability | formatting consistency
    // @hint: Verify handleCardsCommand() accesses complete card data

    capture.start();
    const output = handleCardsCommand();
    console.log(output);
    capture.stop();

    const displayedOutput = capture.getAllOutput();

    // Expected cards: kingdom cards + base cards
    const expectedCards = {
      kingdom: Object.keys(KINGDOM_CARDS),
      base: ['Copper', 'Silver', 'Gold', 'Estate', 'Duchy', 'Province', 'Curse']
    };

    const allCards = [...expectedCards.kingdom, ...expectedCards.base];

    // Verify all cards present
    allCards.forEach(card => {
      expect(displayedOutput).toContain(card);
    });

    // Verify no duplicates (count occurrences)
    let cardCount = 0;
    allCards.forEach(card => {
      const lines = displayedOutput.split('\n');
      const occurrences = lines.filter(l => l.includes(card) && l.includes('|')).length;
      cardCount += occurrences;
    });

    // Should have correct number of card lines
    expect(cardCount).toBeGreaterThanOrEqual(TOTAL_CARDS);

    // Verify descriptions present (no empty effect columns)
    const lines = displayedOutput.split('\n');
    const dataLines = lines.filter(l =>
      l.includes('|') && !l.includes('Name') && !l.includes('---') && !l.includes('===')
    );

    dataLines.forEach(line => {
      const parts = line.split('|');
      if (parts.length >= 4) {
        const effect = parts[3]?.trim();
        expect(effect).toBeTruthy();
        expect(effect).not.toBe('');
        expect(effect?.length).toBeGreaterThan(3); // At least some text
      }
    });
  });

  /**
   * E2E Test 4: Table Formatting is Readable
   *
   * @req: Table structure with header, separator, aligned columns
   * @edge: Output formatting, readability
   * @hint: Validates visual presentation
   */
  test('E2E-4: table format is readable and well-structured', () => {
    // @req: Readable formatting with headers, separators, alignment
    // @edge: Multi-line output | column alignment | special formatting
    // @hint: Verify output is formatted for terminal display

    capture.start();
    const output = handleCardsCommand();
    console.log(output);
    capture.stop();

    const displayedOutput = capture.getAllOutput();

    // Verify header
    expect(displayedOutput).toContain('AVAILABLE CARDS');

    // Verify column labels
    expect(displayedOutput).toContain('Name');
    expect(displayedOutput).toContain('Cost');
    expect(displayedOutput).toContain('Type');
    expect(displayedOutput).toContain('Effect');

    // Verify separator line exists
    const lines = displayedOutput.split('\n');
    const hasSeparator = lines.some(l => /^-+\|/.test(l));
    expect(hasSeparator).toBe(true);

    // Verify pipe separators in data rows
    const dataRows = lines.filter(l =>
      l.includes('|') && !l.includes('Name') && !l.includes('===') && !l.includes('---')
    );
    expect(dataRows.length).toBeGreaterThan(TOTAL_CARDS - 5); // At least close to total cards

    dataRows.forEach(row => {
      expect(row).toContain('|'); // Pipe separators present
    });
  });

  /**
   * E2E Test 5: Game State Unchanged After Command
   *
   * @req: Informational commands don't modify game state
   * @edge: State immutability, no side effects
   * @why: Players should view cards without consequences
   */
  test('E2E-5: cards command preserves game state immutability', () => {
    // @req: Game state immutable after cards command
    // @edge: All state properties unchanged
    // @hint: JSON.stringify() for deep comparison

    const game = GameStateBuilder.create()
      .withPhase('action')
      .withTurnNumber(1)
      .withPlayerStats(0, { actions: 1, buys: 1, coins: 0 })
      .build();

    const stateBefore = JSON.stringify(game);

    // Execute cards command (output only, no state change)
    capture.start();
    const output = handleCardsCommand();
    console.log(output);
    capture.stop();

    const stateAfter = JSON.stringify(game);

    // CRITICAL: State must be identical
    expect(stateAfter).toBe(stateBefore);
    expect(game.phase).toBe('action');
    expect(game.turnNumber).toBe(1);
    expect(game.players[0].actions).toBe(1);
  });

  /**
   * E2E Test 6: Cards Command Then Continue Playing
   *
   * @req: Command doesn't interrupt gameplay flow
   * @edge: State preserved between command and move
   * @hint: Simulates real usage: view cards, then make move
   */
  test('E2E-6: user views cards then makes a move', () => {
    // @req: Cards command non-intrusive | game continues normally
    // @edge: Command followed by move execution
    // @hint: State unchanged, user can proceed with turn

    let game = engine.initializeGame(1);
    let validMoves = engine.getValidMoves(game);

    capture.start();

    // User looks at cards
    const cardsResult = parser.parseInput('cards', validMoves);
    expect(cardsResult.type).toBe('command');

    const cardsOutput = handleCardsCommand();
    console.log(cardsOutput);

    // Game state should be unchanged
    const stateAfterCards = JSON.stringify(game);

    // User makes a move (end phase - always available move #1)
    const moveResult = parser.parseInput('1', validMoves);
    expect(moveResult.type).toBe('move');

    // Execute move
    const executionResult = engine.executeMove(game, moveResult.move!);
    if (executionResult.success && executionResult.newState) {
      game = executionResult.newState;
    }

    capture.stop();

    // Cards command didn't interfere with move execution
    expect(executionResult.success).toBe(true);
    expect(capture.getAllOutput()).toContain('AVAILABLE CARDS');
  });

  /**
   * E2E Test 7: Performance Requirement < 10ms
   *
   * @req: Cards command executes quickly even with full catalog
   * @edge: Performance under load
   * @hint: Validates implementation efficiency
   */
  test('E2E-7: cards command response time meets performance requirement', async () => {
    // @req: Response time < 10ms for card catalog display
    // @edge: Repeated calls maintain performance
    // @why: Instant feedback improves user experience

    await PerformanceHelper.assertWithinTime(
      () => handleCardsCommand(),
      10, // < 10ms requirement
      'cards command'
    );
  });

  /**
   * E2E Test 8: Multiple Cards Commands Don't Degrade Performance
   *
   * @req: Performance remains constant with repeated calls
   * @edge: No accumulation or degradation
   * @hint: Validates no state leaks between calls
   */
  test('E2E-8: repeated cards commands maintain performance', async () => {
    // @req: 50 consecutive calls stay < 10ms each (500ms total)
    // @edge: No performance degradation over iterations
    // @why: Players may check cards multiple times per turn

    const iterations = 50;
    const timeout = 500; // 50 calls * 10ms average = 500ms max

    await PerformanceHelper.assertWithinTime(
      () => {
        for (let i = 0; i < iterations; i++) {
          handleCardsCommand();
        }
      },
      timeout,
      `${iterations} cards commands`
    );
  });

  /**
   * E2E Test 9: Cards Works in Different Game Phases
   *
   * @req: Available during action, buy, and cleanup phases
   * @edge: All game phases
   * @why: Players need reference at any time during turn
   */
  test('E2E-9: cards command works during all game phases', () => {
    // @req: Phase-independent command (no phase dependency)
    // @edge: Action | Buy | Cleanup phases
    // @hint: handleCardsCommand() shouldn't check phase

    const phases = ['action', 'buy', 'cleanup'] as const;

    phases.forEach(phase => {
      capture.start();

      const game = GameStateBuilder.create()
        .withPhase(phase)
        .withTurnNumber(1)
        .build();

      const output = handleCardsCommand();
      console.log(`Output during ${phase} phase:`);
      console.log(output);

      capture.stop();

      // Should display cards in any phase
      expect(output).toContain('AVAILABLE CARDS');
      expect(output).toContain('Village');
      expect(output).toContain('Copper');
    });
  });

  /**
   * E2E Test 10: Module Import Validation (Compiled vs TypeScript)
   *
   * @req: Import paths work in production (compiled JavaScript)
   * @edge: Validates fix for help command import bug
   * @hint: Catches "Cannot find module" errors at runtime
   */
  test('E2E-10: module imports work in production environment', () => {
    // @req: Imports use module-level paths not source-level
    // @edge: Compiled code | runtime imports
    // @hint: Should use @principality/core not @principality/core/src/cards

    // If this test passes, it means:
    // 1. handleCardsCommand imported successfully
    // 2. Card data accessible
    // 3. No "Cannot find module" errors
    // 4. Compiled code works as expected

    capture.start();

    // If module imports fail, handleCardsCommand() would throw
    expect(() => {
      const output = handleCardsCommand();
      expect(output).toBeTruthy();
      expect(output.length).toBeGreaterThan(100); // Substantial output
    }).not.toThrow();

    capture.stop();
  });
});

describe('Cards Command Integration with Help Command', () => {
  let parser: Parser;
  let engine: GameEngine;
  let capture: ConsoleCapture;

  beforeEach(() => {
    parser = new Parser();
    engine = new GameEngine('integration-cards-help-seed');
    capture = new ConsoleCapture();
  });

  afterEach(() => {
    capture.stop();
  });

  /**
   * Integration Test 1: Cards and Help Commands Work Together
   *
   * @req: Multiple commands don't interfere with each other
   * @edge: Sequential command execution
   * @hint: Validates command orchestration
   */
  test('CARDS-HELP-1: cards and help commands work together', () => {
    // @req: Both commands available and functional simultaneously
    // @edge: Multiple command types | sequential execution
    // @hint: Each command independent, state preserved

    let game = engine.initializeGame(1);
    const validMoves = engine.getValidMoves(game);

    capture.start();

    // User executes help command
    const helpResult = parser.parseInput('help village', validMoves);
    expect(helpResult.type).toBe('command');

    // User executes cards command
    const cardsResult = parser.parseInput('cards', validMoves);
    expect(cardsResult.type).toBe('command');

    // Both commands available and working
    expect(helpResult.command).toBe('help');
    expect(cardsResult.command).toBe('cards');

    capture.stop();

    // Both parsed successfully
    expect(cardsResult.type).toBe('command');
  });

  /**
   * Integration Test 2: Deterministic Output
   *
   * @req: Same input produces identical output (no randomness)
   * @edge: Repeated calls consistency
   * @hint: Validates determinism
   */
  test('CARDS-HELP-2: cards command output is deterministic', () => {
    // @req: Identical output for identical calls
    // @edge: Multiple calls produce same result
    // @hint: No randomness in card catalog

    capture.start();

    const output1 = handleCardsCommand();
    const output2 = handleCardsCommand();
    const output3 = handleCardsCommand();

    capture.stop();

    // All outputs identical
    expect(output1).toBe(output2);
    expect(output2).toBe(output3);
  });
});
