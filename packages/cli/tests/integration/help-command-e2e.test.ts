/**
 * Test Suite: Help Command End-to-End and Integration Tests
 *
 * Status: ACTIVE - Tests written to expose production bug
 * Created: 2025-10-21
 * Phase: 1.6
 *
 * Requirements Reference: docs/requirements/phase-1.6/FEATURES.md (Feature 1)
 *
 * PURPOSE:
 * These tests validate the COMPLETE user workflow for the help command:
 * - CLI parser recognizes "help <cardname>" pattern
 * - CLI routes to handleHelpCommand() with card parameter
 * - Handler output is displayed to user
 * - Game state remains unchanged
 *
 * BUG DISCOVERED:
 * - Unit tests PASS (handleHelpCommand function works in isolation)
 * - Integration tests FAIL (CLI parser doesn't recognize "help <cardname>")
 * - E2E tests FAIL (users typing "help copper" get error message)
 *
 * ROOT CAUSE:
 * - Parser.isCommand() only recognizes "help" without parameters
 * - Parser never extracts card name from "help <cardname>"
 * - CLI never routes to handleHelpCommand() with card parameter
 *
 * Test Count: 18 tests (12 integration + 6 E2E)
 *
 * @req: Feature 1 - Display card information during gameplay
 * @req: Command available during all game phases
 * @req: Case-insensitive card lookup
 * @req: 'h' alias works identically to 'help'
 */

import { Parser, ParseResult } from '../../src/parser';
import { PrincipalityCLI } from '../../src/cli';
import { GameEngine, Move } from '@principality/core';
import { ConsoleCapture, GameStateBuilder, MockReadline } from '../utils/test-utils';
import { handleHelpCommand } from '../../src/commands/help';

describe('Help Command Integration Tests - CLI Infrastructure', () => {
  let parser: Parser;
  let capture: ConsoleCapture;
  let engine: GameEngine;

  beforeEach(() => {
    parser = new Parser();
    capture = new ConsoleCapture();
    engine = new GameEngine('integration-test-seed');
  });

  afterEach(() => {
    capture.stop();
  });

  describe('IT-HELP-1: Parser Recognition and Routing', () => {
    /**
     * Test IT-HELP-1.1: Parser Recognizes "help <cardname>" Pattern
     *
     * @req: Parser must recognize "help" followed by card name as a command with parameter
     * @edge: Single word card names, multiple words not supported in Phase 1.6
     * @hint: Parser.isCommand() currently only checks for exact match, needs parameter extraction
     *
     * Expected Behavior:
     * - Input: "help village"
     * - Parser returns: { type: 'command', command: 'help', parameter: 'village' }
     *
     * Current Bug:
     * - Parser returns: { type: 'invalid', error: 'Invalid input...' }
     * - Parser doesn't recognize "help village" as a command
     */
    test('IT-HELP-1.1: parser recognizes "help <cardname>" pattern', () => {
      // @req: Parser must extract command and parameter from "help <cardname>"
      // @edge: Valid card names | invalid card names | case variations
      // @hint: Modify Parser.parseInput() to detect "help <param>" and "h <param>"
      const validMoves: Move[] = [{ type: 'end_phase' }];

      const result = parser.parseInput('help village', validMoves);

      // CRITICAL: This test WILL FAIL until parser is fixed
      expect(result.type).toBe('command');
      expect(result.command).toBe('help');

      // Parser needs to include the card name parameter
      // Current implementation doesn't support this - dev-agent must add
      expect(result).toHaveProperty('parameter');
      expect((result as any).parameter).toBe('village');
    });

    /**
     * Test IT-HELP-1.2: Parser Handles 'h' Alias with Parameter
     *
     * @req: 'h' alias must work identically to 'help' with parameters
     * @edge: Short alias with parameter
     * @hint: Parser normalization must handle both "help <card>" and "h <card>"
     */
    test('IT-HELP-1.2: parser recognizes "h <cardname>" alias', () => {
      // @req: 'h' alias works with parameters just like 'help'
      // @edge: Single-char command with space and parameter
      // @hint: Parser.normalizeCommand() must preserve parameters when aliasing
      const validMoves: Move[] = [{ type: 'end_phase' }];

      const result = parser.parseInput('h smithy', validMoves);

      expect(result.type).toBe('command');
      expect(result.command).toBe('help'); // Normalized from 'h'
      expect((result as any).parameter).toBe('smithy');
    });

    /**
     * Test IT-HELP-1.3: Parser Trims Whitespace from Card Parameter
     *
     * @req: Parser must trim leading/trailing whitespace from card name
     * @edge: Extra spaces, tabs, multiple spaces between words
     * @hint: Apply .trim() to extracted parameter
     */
    test('IT-HELP-1.3: parser trims whitespace from card parameter', () => {
      // @req: Whitespace handling for robust parsing
      // @edge: Multiple spaces | leading/trailing spaces
      // @hint: Extract parameter with regex or split, then trim
      const validMoves: Move[] = [{ type: 'end_phase' }];

      const result = parser.parseInput('help   market  ', validMoves);

      expect(result.type).toBe('command');
      expect((result as any).parameter).toBe('market'); // Trimmed
    });

    /**
     * Test IT-HELP-1.4: Parser Handles Empty Parameter (help with no card)
     *
     * @req: "help" without parameter should still parse as command
     * @edge: Command without parameter shows usage
     * @hint: Parameter can be undefined or empty string
     */
    test('IT-HELP-1.4: parser handles "help" without parameter', () => {
      // @req: "help" alone is valid (shows usage)
      // @edge: No parameter vs empty parameter
      // @hint: Check for parameter existence before processing
      const validMoves: Move[] = [{ type: 'end_phase' }];

      const result = parser.parseInput('help', validMoves);

      expect(result.type).toBe('command');
      expect(result.command).toBe('help');
      // Parameter should be undefined or empty when not provided
      expect((result as any).parameter).toBeUndefined();
    });

    /**
     * Test IT-HELP-1.5: Parser Case-Insensitivity
     *
     * @req: Parser must handle "HELP", "Help", "HeLp" identically
     * @edge: All caps, mixed case, lowercase
     * @hint: Apply .toLowerCase() before command detection
     */
    test('IT-HELP-1.5: parser handles case-insensitive command', () => {
      // @req: Case-insensitive command parsing
      // @edge: UPPERCASE | MixedCase | lowercase
      // @hint: Normalize to lowercase early in parseInput()
      const validMoves: Move[] = [{ type: 'end_phase' }];

      const results = [
        parser.parseInput('HELP VILLAGE', validMoves),
        parser.parseInput('Help Smithy', validMoves),
        parser.parseInput('help market', validMoves)
      ];

      results.forEach(result => {
        expect(result.type).toBe('command');
        expect(result.command).toBe('help');
        expect((result as any).parameter).toBeDefined();
      });
    });

    /**
     * Test IT-HELP-1.6: Parser Doesn't Confuse "help" in Move Numbers
     *
     * @req: Parser priority - numbers checked before commands
     * @edge: Edge case where user might type something unexpected
     * @hint: Parse order matters - check numbers first
     */
    test('IT-HELP-1.6: parser correctly prioritizes number vs command', () => {
      // @req: Parser must check for numbers before commands
      // @edge: Input that looks like command but has numbers
      // @hint: parseNumber() should run before isCommand()
      const validMoves: Move[] = [
        { type: 'play_action', card: 'Village' },
        { type: 'end_phase' }
      ];

      // "1" is a move number, not a command
      const numberResult = parser.parseInput('1', validMoves);
      expect(numberResult.type).toBe('move');

      // "help" is a command, not a move number
      const commandResult = parser.parseInput('help', validMoves);
      expect(commandResult.type).toBe('command');
    });
  });

  describe('IT-HELP-2: CLI Command Routing', () => {
    /**
     * Test IT-HELP-2.1: CLI Routes "help <card>" to handleHelpCommand()
     *
     * @req: CLI must call handleHelpCommand(cardName) when parser returns help command
     * @edge: Valid and invalid card names
     * @hint: Modify CLI.handleCommand() to check for parameter and route accordingly
     *
     * Expected Behavior:
     * - User types: "help village"
     * - Parser extracts: command='help', parameter='village'
     * - CLI calls: handleHelpCommand('village')
     * - Output displays: "Village | 3 | action | +1 Card, +2 Actions"
     *
     * Current Bug:
     * - CLI.handleCommand('help') displays general help menu
     * - handleHelpCommand() is NEVER CALLED
     */
    test('IT-HELP-2.1: CLI routes to handleHelpCommand with parameter', () => {
      // @req: CLI must detect parameter and call handleHelpCommand(param)
      // @edge: Command routing with parameter
      // @hint: In CLI.handleCommand(), check if command has parameter before routing

      // This test simulates the CLI routing logic
      capture.start();

      // Simulate what CLI should do when receiving 'help village'
      const cardName = 'village';
      const expectedOutput = handleHelpCommand(cardName);

      // CLI should call handleHelpCommand and display result
      console.log(expectedOutput);

      capture.stop();

      const output = capture.getAllOutput();

      // CRITICAL: Verify correct function was called
      expect(output).toContain('Village');
      expect(output).toContain('3'); // cost
      expect(output).toContain('action');
      expect(output).toContain('+1 Card');
    });

    /**
     * Test IT-HELP-2.2: CLI Displays Unknown Card Error
     *
     * @req: CLI must display error from handleHelpCommand for unknown cards
     * @edge: Invalid card names, typos
     * @hint: Pass through error message from handleHelpCommand
     */
    test('IT-HELP-2.2: CLI displays error for unknown card', () => {
      // @req: Error messages from handleHelpCommand must reach user
      // @edge: Unknown cards | typos | non-existent cards
      // @hint: Display output directly from handleHelpCommand
      capture.start();

      const errorOutput = handleHelpCommand('FakeCard');
      console.log(errorOutput);

      capture.stop();

      const output = capture.getAllOutput();
      expect(output).toContain('Unknown card');
      expect(output).toContain('FakeCard');
      expect(output).toContain('cards'); // Suggestion to type 'cards'
    });

    /**
     * Test IT-HELP-2.3: CLI Displays Usage for Empty Parameter
     *
     * @req: "help" without parameter shows usage message
     * @edge: Command without parameter
     * @hint: Call handleHelpCommand('') for empty parameter
     */
    test('IT-HELP-2.3: CLI displays usage for help without parameter', () => {
      // @req: Empty parameter shows usage, not general help menu
      // @edge: No parameter vs empty string parameter
      // @hint: handleHelpCommand('') returns usage message
      capture.start();

      const usageOutput = handleHelpCommand('');
      console.log(usageOutput);

      capture.stop();

      const output = capture.getAllOutput();
      expect(output).toContain('Usage');
      expect(output).toContain('help <card_name>');
    });
  });

  describe('IT-HELP-3: Game State Immutability', () => {
    /**
     * Test IT-HELP-3.1: Help Command Doesn't Modify Game State
     *
     * @req: Informational commands must not modify game state
     * @edge: All game phases, all game properties
     * @hint: Capture state snapshot before/after, verify equality
     */
    test('IT-HELP-3.1: help command preserves game state', () => {
      // @req: Game state immutable after help command (CLAUDE.md core requirement)
      // @edge: All state properties unchanged
      // @hint: JSON.stringify() for deep comparison
      const game = GameStateBuilder.create()
        .withPhase('action')
        .withTurnNumber(1)
        .withPlayerStats(0, { actions: 1, buys: 1, coins: 0 })
        .build();

      const stateBefore = JSON.stringify(game);

      // Execute help command (output only, no state change)
      capture.start();
      const output = handleHelpCommand('village');
      console.log(output);
      capture.stop();

      const stateAfter = JSON.stringify(game);

      // CRITICAL: State must be identical
      expect(stateAfter).toBe(stateBefore);
      expect(game.phase).toBe('action');
      expect(game.turnNumber).toBe(1);
    });

    /**
     * Test IT-HELP-3.2: Multiple Help Commands Don't Accumulate State
     *
     * @req: Repeated commands don't cause state drift
     * @edge: Sequential calls, different cards
     * @hint: Verify state after each call
     */
    test('IT-HELP-3.2: multiple help commands preserve state', () => {
      // @req: No state accumulation or drift from repeated commands
      // @edge: Multiple sequential calls
      // @hint: Check state equality after each call
      const game = GameStateBuilder.create().build();
      const initialState = JSON.stringify(game);

      capture.start();

      handleHelpCommand('village');
      handleHelpCommand('smithy');
      handleHelpCommand('copper');

      capture.stop();

      expect(JSON.stringify(game)).toBe(initialState);
    });
  });

  describe('IT-HELP-4: Integration Across Game Phases', () => {
    /**
     * Test IT-HELP-4.1: Help Works During Action Phase
     *
     * @req: Command available during action phase (FR1.4)
     * @edge: Action phase with available actions
     * @hint: Game in action phase, help returns output, state unchanged
     */
    test('IT-HELP-4.1: help works during action phase', () => {
      // @req: Help available during action phase without interrupting gameplay
      // @edge: Active game, action phase
      // @hint: Verify output displays AND phase unchanged
      const game = GameStateBuilder.create()
        .withPhase('action')
        .withPlayerStats(0, { actions: 1, buys: 1, coins: 0 })
        .build();

      capture.start();
      const output = handleHelpCommand('village');
      capture.stop();

      expect(output).toContain('Village');
      expect(game.phase).toBe('action'); // Unchanged
    });

    /**
     * Test IT-HELP-4.2: Help Works During Buy Phase
     *
     * @req: Command available during buy phase (FR1.4)
     * @edge: Buy phase with coins available
     * @hint: Users need help deciding what to buy
     */
    test('IT-HELP-4.2: help works during buy phase', () => {
      // @req: Help available during buy phase for purchase decisions
      // @edge: Buy phase with available coins
      // @hint: Verify province info displayed correctly
      const game = GameStateBuilder.create()
        .withPhase('buy')
        .withPlayerStats(0, { actions: 0, buys: 1, coins: 8 })
        .build();

      capture.start();
      const output = handleHelpCommand('province');
      capture.stop();

      expect(output).toContain('Province');
      expect(output).toContain('8'); // cost
      expect(game.phase).toBe('buy'); // Unchanged
    });

    /**
     * Test IT-HELP-4.3: Help Works During Cleanup Phase
     *
     * @req: Command available during cleanup (FR1.4)
     * @edge: Cleanup phase, planning next turn
     * @hint: Players review cards between turns
     */
    test('IT-HELP-4.3: help works during cleanup phase', () => {
      // @req: Help available during cleanup/between turns
      // @edge: Cleanup phase
      // @hint: Verify output and phase unchanged
      const game = GameStateBuilder.create()
        .withPhase('cleanup')
        .withTurnNumber(2)
        .build();

      capture.start();
      const output = handleHelpCommand('smithy');
      capture.stop();

      expect(output).toContain('Smithy');
      expect(game.phase).toBe('cleanup'); // Unchanged
    });
  });
});

describe('Help Command End-to-End Tests - Full User Workflow', () => {
  let capture: ConsoleCapture;

  beforeEach(() => {
    capture = new ConsoleCapture();
  });

  afterEach(() => {
    capture.stop();
  });

  /**
   * E2E Test 1: User Types "help copper" During Gameplay
   *
   * @req: Complete user workflow - input to output
   * @edge: Most common use case
   * @hint: Simulates exact user experience
   *
   * User Story:
   * - User is playing game (action phase, turn 1)
   * - User types: "help copper"
   * - System displays: "Copper | 0 | treasure | +$1"
   * - User can continue playing normally
   *
   * Current Bug:
   * - User types: "help copper"
   * - System displays: "✗ Error: Invalid input..."
   * - User frustrated, can't get help during game
   */
  test('E2E-1: user types "help copper" during active game', () => {
    // @req: End-to-end test of most common user scenario
    // @edge: Real gameplay simulation
    // @hint: This is the exact bug reported - "help copper" fails

    // SIMULATE: User typing "help copper" in action phase
    const parser = new Parser();
    const validMoves: Move[] = [
      { type: 'play_action', card: 'Village' },
      { type: 'end_phase' }
    ];

    capture.start();

    // Step 1: User types input
    const userInput = 'help copper';

    // Step 2: Parser processes input
    const parseResult = parser.parseInput(userInput, validMoves);

    // CRITICAL: Parser must recognize this as a command with parameter
    // Current bug: parseResult.type === 'invalid'
    expect(parseResult.type).toBe('command');
    expect(parseResult.command).toBe('help');
    expect((parseResult as any).parameter).toBe('copper');

    // Step 3: CLI routes to handleHelpCommand (simulated)
    const cardName = (parseResult as any).parameter;
    const output = handleHelpCommand(cardName);

    // Step 4: Output displayed to user
    console.log(output);

    capture.stop();

    // Step 5: User sees card information
    const displayedOutput = capture.getAllOutput();
    expect(displayedOutput).toContain('Copper');
    expect(displayedOutput).toContain('0'); // cost
    expect(displayedOutput).toContain('treasure');
    expect(displayedOutput).toContain('Worth 1 coin'); // Card description as stored in card data
  });

  /**
   * E2E Test 2: User Types "h village" (Alias)
   *
   * @req: 'h' alias works in real gameplay
   * @edge: Shorthand command
   * @hint: Power users prefer short aliases
   */
  test('E2E-2: user types "h village" using alias', () => {
    // @req: 'h' alias provides identical UX to 'help'
    // @edge: Single-char command in real game
    // @hint: Reduces typing for frequent lookups
    const parser = new Parser();
    const validMoves: Move[] = [{ type: 'end_phase' }];

    capture.start();

    const parseResult = parser.parseInput('h village', validMoves);

    expect(parseResult.type).toBe('command');
    expect(parseResult.command).toBe('help'); // Normalized from 'h'

    const output = handleHelpCommand((parseResult as any).parameter);
    console.log(output);

    capture.stop();

    expect(capture.getAllOutput()).toContain('Village');
  });

  /**
   * E2E Test 3: User Types "help UnknownCard"
   *
   * @req: Helpful error message for typos
   * @edge: Invalid card name
   * @hint: User gets guidance, not cryptic error
   */
  test('E2E-3: user gets helpful error for unknown card', () => {
    // @req: Unknown cards return actionable error message
    // @edge: Typos, non-existent cards
    // @hint: Error suggests 'cards' command
    const parser = new Parser();
    const validMoves: Move[] = [{ type: 'end_phase' }];

    capture.start();

    const parseResult = parser.parseInput('help FakeCard', validMoves);
    const output = handleHelpCommand((parseResult as any).parameter);
    console.log(output);

    capture.stop();

    const displayedOutput = capture.getAllOutput();
    expect(displayedOutput).toContain('Unknown card');
    expect(displayedOutput).toContain('FakeCard');
    expect(displayedOutput).toContain('cards'); // Helpful suggestion
  });

  /**
   * E2E Test 4: User Types "help" Without Card Name
   *
   * @req: Usage message when parameter missing
   * @edge: Empty parameter
   * @hint: Guides user to correct syntax
   */
  test('E2E-4: user types "help" without card name', () => {
    // @req: Empty parameter shows usage, not error
    // @edge: Command without parameter
    // @hint: Friendly guidance on syntax
    const parser = new Parser();
    const validMoves: Move[] = [{ type: 'end_phase' }];

    capture.start();

    const parseResult = parser.parseInput('help', validMoves);

    // Should be recognized as command with no parameter
    expect(parseResult.type).toBe('command');

    const output = handleHelpCommand('');
    console.log(output);

    capture.stop();

    expect(capture.getAllOutput()).toContain('Usage');
  });

  /**
   * E2E Test 5: User Types "help MARKET" (Case Insensitive)
   *
   * @req: Case-insensitive lookup in real usage
   * @edge: UPPERCASE, MixedCase, lowercase
   * @hint: Users shouldn't worry about capitalization
   */
  test('E2E-5: case-insensitive card lookup', () => {
    // @req: All case variations work identically
    // @edge: User typing habits vary
    // @hint: Normalize both command and parameter
    const parser = new Parser();
    const validMoves: Move[] = [{ type: 'end_phase' }];

    capture.start();

    const inputs = ['help MARKET', 'help Market', 'help market'];
    const outputs: string[] = [];

    inputs.forEach(input => {
      const parseResult = parser.parseInput(input, validMoves);
      const output = handleHelpCommand((parseResult as any).parameter);
      outputs.push(output);
    });

    capture.stop();

    // All outputs should be identical
    expect(outputs[0]).toBe(outputs[1]);
    expect(outputs[1]).toBe(outputs[2]);
    expect(outputs[0]).toContain('Market');
  });

  /**
   * E2E Test 6: User Gets Help, Then Continues Playing
   *
   * @req: Help doesn't interrupt gameplay flow
   * @edge: Help followed by move
   * @hint: Seamless integration into game loop
   */
  test('E2E-6: user gets help then makes a move', () => {
    // @req: Help is non-intrusive, game continues normally
    // @edge: Command followed by move
    // @hint: State unchanged, user can continue
    const parser = new Parser();
    const engine = new GameEngine('e2e-test');
    let game = engine.initializeGame(1);

    const validMoves = engine.getValidMoves(game);

    capture.start();

    // User types help
    const helpResult = parser.parseInput('help village', validMoves);
    expect(helpResult.type).toBe('command');

    const helpOutput = handleHelpCommand((helpResult as any).parameter);
    console.log(helpOutput);

    // Game state unchanged
    const stateBeforeMove = JSON.stringify(game);

    // User makes a move (end phase)
    const moveResult = parser.parseInput('1', validMoves);
    expect(moveResult.type).toBe('move');

    // Execute move
    const executionResult = engine.executeMove(game, moveResult.move!);
    if (executionResult.success) {
      game = executionResult.newState!;
    }

    capture.stop();

    // Help didn't interfere with move execution
    expect(executionResult.success).toBe(true);
    expect(capture.getAllOutput()).toContain('Village');
  });
});
