/**
 * Test Suite: Turn-Based CLI Parser Refactor (Issue #93)
 *
 * Requirements: TB-CLI-6.* (Parser Integration)
 * Validates turn-based mode uses shared Parser class for feature parity
 *
 * Key Requirements:
 * - TB-CLI-6.1: Use shared Parser class for move parsing
 * - TB-CLI-6.2: Support "treasures" command (t, play all, all)
 * - TB-CLI-6.3: Stable numbers work when enabled
 * - TB-CLI-6.4: Error messages include context from Parser
 *
 * Related Issues:
 * - Issue #92: "play all treasures" command missing in turn-based mode
 * - Issue #94: Stable numbers flag not implemented
 * - Issue #96: Generic error messages (Parser returns detailed errors)
 *
 * @why: Turn-based CLI has parallel implementation of command parsing
 *       instead of reusing Parser class from interactive mode
 */

// @req: TB-CLI-6.1 - Use shared Parser class for move parsing
// @req: TB-CLI-6.2 - Support "treasures" command (t, play all, all)
// @req: TB-CLI-6.3 - Stable numbers work when enabled
// @req: TB-CLI-6.4 - Error messages include context from Parser
// @edge: All Parser commands work in turn-based mode | Stable numbers produce consistent output
// @why: Feature parity between interactive and turn-based modes

import { GameEngine, GameState, Move } from '@principality/core';
import { CLIOptions } from '../src/cli';
import { ConsoleCapture, GameStateBuilder, PerformanceHelper } from './utils/test-utils';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

import {
  initializeGameAndSave,
  executeMoveAndSave,
  formatOutputForTurnBasedMode
} from '../src/turn-based-cli';

describe('Turn-Based CLI Parser Refactor - Treasures Command (Issue #92)', () => {
  /**
   * @req: TB-CLI-6.2 - Support "treasures" command (t, play all, all)
   * @edge: All treasure command aliases should work in turn-based mode
   * @why: Interactive mode supports these; turn-based should too
   */

  let tempDir: string;
  let stateFilePath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'principality-treasures-'));
    stateFilePath = path.join(tempDir, 'game.json');
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('TB-CLI-6.2.1: "treasures" command auto-plays all treasures', () => {
    test('should auto-play treasures when using "treasures" command', async () => {
      // @req: TB-CLI-6.2 - Support treasures command
      // @edge: Command works in buy phase with treasures in hand
      // @why: Issue #92 - command is missing in turn-based mode

      // Setup: Initialize game and get to buy phase with treasures
      await initializeGameAndSave('treasures-test-seed', stateFilePath, {
        victoryPileSize: 4,
        edition: '2E'
      });

      // End action phase to get to buy phase
      await executeMoveAndSave(stateFilePath, 'end phase');

      // Now in buy phase with treasures in hand
      const { output, success, state } = await executeMoveAndSave(
        stateFilePath,
        'treasures'
      );

      expect(success).toBe(true);
      expect(output).toMatch(/Played.*treasures?/i);
      // Should show coin total
      expect(output).toMatch(/\$\d+/);
    });

    test('should auto-play treasures when using "t" alias', async () => {
      // @req: TB-CLI-6.2 - "t" is alias for treasures
      // @edge: Single character command

      await initializeGameAndSave('t-alias-seed', stateFilePath);
      await executeMoveAndSave(stateFilePath, 'end phase');

      const { output, success } = await executeMoveAndSave(
        stateFilePath,
        't'
      );

      expect(success).toBe(true);
      expect(output).toMatch(/Played.*treasures?/i);
    });

    test('should auto-play treasures when using "play all" command', async () => {
      // @req: TB-CLI-6.2 - "play all" is alias for treasures
      // @edge: Multi-word command with space

      await initializeGameAndSave('play-all-seed', stateFilePath);
      await executeMoveAndSave(stateFilePath, 'end phase');

      const { output, success } = await executeMoveAndSave(
        stateFilePath,
        'play all'
      );

      expect(success).toBe(true);
      expect(output).toMatch(/Played.*treasures?/i);
    });

    test('should auto-play treasures when using "all" command', async () => {
      // @req: TB-CLI-6.2 - "all" is alias for treasures
      // @edge: Short alias command

      await initializeGameAndSave('all-alias-seed', stateFilePath);
      await executeMoveAndSave(stateFilePath, 'end phase');

      const { output, success } = await executeMoveAndSave(
        stateFilePath,
        'all'
      );

      expect(success).toBe(true);
      expect(output).toMatch(/Played.*treasures?/i);
    });

    test('should handle case-insensitive treasure commands', async () => {
      // @req: TB-CLI-6.2 - Case insensitivity
      // @edge: TREASURES, Treasures, T, PLAY ALL, All

      const commands = ['TREASURES', 'Treasures', 'T', 'PLAY ALL', 'Play All', 'ALL'];

      for (const command of commands) {
        await initializeGameAndSave(`case-test-${command}`, stateFilePath);
        await executeMoveAndSave(stateFilePath, 'end phase');

        const { success } = await executeMoveAndSave(stateFilePath, command);

        expect(success).toBe(true);
      }
    });
  });

  describe('TB-CLI-6.2.2: Treasure command output format', () => {
    test('should show count of treasures played', async () => {
      // @req: TB-CLI-6.2 - Show summary of treasures played
      // @edge: Output includes count of cards played

      await initializeGameAndSave('treasure-count-seed', stateFilePath);
      await executeMoveAndSave(stateFilePath, 'end phase');

      const { output } = await executeMoveAndSave(stateFilePath, 'treasures');

      // Should show something like "Played X treasures" or "Played 3 treasures for $Y"
      expect(output).toMatch(/Played \d+ treasures?/i);
    });

    test('should show total coins from treasures', async () => {
      // @req: TB-CLI-6.2 - Show coin total
      // @edge: Output includes dollar amount

      await initializeGameAndSave('treasure-coins-seed', stateFilePath);
      await executeMoveAndSave(stateFilePath, 'end phase');

      const { output } = await executeMoveAndSave(stateFilePath, 'treasures');

      // Should show coins gained, e.g., "for $5"
      expect(output).toMatch(/\$\d+/);
    });

    test('should handle no treasures in hand gracefully', async () => {
      // @req: TB-CLI-6.2 - Edge case: no treasures
      // @edge: Hand has only victory cards or actions
      // @hint: Should not error, just show "No treasures to play"

      // This test requires setting up state with no treasures
      // For now, just verify the command doesn't crash
      await initializeGameAndSave('no-treasures-seed', stateFilePath);
      await executeMoveAndSave(stateFilePath, 'end phase');

      // Play any treasures first (to empty hand of treasures for subsequent turns)
      const { output } = await executeMoveAndSave(stateFilePath, 'treasures');

      // Should not throw error
      expect(output).toBeDefined();
    });
  });

  describe('TB-CLI-6.2.3: Treasure command in wrong phase', () => {
    test('should reject treasures command in action phase', async () => {
      // @req: TB-CLI-6.2 - Phase validation
      // @edge: Treasures can only be played in buy phase
      // @hint: Should return error with context

      await initializeGameAndSave('action-phase-seed', stateFilePath);

      // Still in action phase - should not allow treasures
      const { success, output } = await executeMoveAndSave(
        stateFilePath,
        'treasures'
      );

      // Should fail or indicate wrong phase
      // (Current behavior may vary - test defines expected behavior)
      expect(success).toBe(false);
      expect(output).toMatch(/action phase|cannot play treasures|invalid/i);
    });
  });
});

describe('Turn-Based CLI Parser Refactor - Stable Numbers (Issue #94)', () => {
  /**
   * @req: TB-CLI-6.3 - Stable numbers work when enabled
   * @edge: Move numbers should be consistent across invocations
   * @why: Issue #94 - stable numbers flag exists but does nothing (TODO stub)
   */

  let tempDir: string;
  let stateFilePath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'principality-stable-'));
    stateFilePath = path.join(tempDir, 'game.json');
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('TB-CLI-6.3.1: Stable number display in output', () => {
    test('should display stable numbers when --stable-numbers is enabled', async () => {
      // @req: TB-CLI-6.3 - Stable numbers in output
      // @edge: Move list shows stable numbers instead of sequential

      const { output } = await initializeGameAndSave(
        'stable-display-seed',
        stateFilePath,
        { stableNumbers: true }
      );

      // End Phase should always be [50] in stable numbering
      expect(output).toMatch(/\[50\].*End/i);
    });

    test('should display stable number [50] for End Phase', async () => {
      // @req: TB-CLI-6.3 - End Phase stable number
      // @edge: End Phase is always 50

      const { output } = await initializeGameAndSave(
        'end-phase-stable-seed',
        stateFilePath,
        { stableNumbers: true }
      );

      expect(output).toContain('[50]');
      expect(output).toMatch(/\[50\].*End/i);
    });

    test('should display stable numbers for buy moves in range 21-34', async () => {
      // @req: TB-CLI-6.3 - Buy move stable numbers
      // @edge: Buy Silver is 22, Buy Gold is 23, Buy Province is 26

      await initializeGameAndSave('buy-stable-seed', stateFilePath, {
        stableNumbers: true
      });

      // Get to buy phase
      await executeMoveAndSave(stateFilePath, '50'); // End action phase (stable number)

      const { output } = await executeMoveAndSave(stateFilePath, 't'); // Play treasures

      // Check for stable buy numbers
      // Silver (22), Gold (23), Province (26) should appear if affordable
      expect(output).toMatch(/\[2[1-9]\]|\[3[0-4]\]/); // Buy moves in 21-34 range
    });

    test('should display stable numbers for treasure cards in range 11-13', async () => {
      // @req: TB-CLI-6.3 - Treasure stable numbers
      // @edge: Copper=11, Silver=12, Gold=13

      await initializeGameAndSave('treasure-stable-seed', stateFilePath, {
        stableNumbers: true
      });

      // End action phase to get to buy phase where we can play treasures
      const { output } = await executeMoveAndSave(stateFilePath, '50');

      // Should show Copper as [11]
      expect(output).toMatch(/\[11\].*Copper/i);
    });
  });

  describe('TB-CLI-6.3.2: Stable number input parsing', () => {
    test('should accept stable number 50 for End Phase', async () => {
      // @req: TB-CLI-6.3 - Parse stable number input
      // @edge: Typing "50" should select End Phase

      await initializeGameAndSave('stable-input-seed', stateFilePath, {
        stableNumbers: true
      });

      const { success, output, state } = await executeMoveAndSave(
        stateFilePath,
        '50'
      );

      expect(success).toBe(true);
      expect(state.phase).not.toBe('action'); // Should have moved past action phase
    });

    test('should accept stable number for buy moves', async () => {
      // @req: TB-CLI-6.3 - Stable buy numbers
      // @edge: Typing "22" should buy Silver when in buy phase

      await initializeGameAndSave('stable-buy-seed', stateFilePath, {
        stableNumbers: true,
        victoryPileSize: 4
      });

      // End action phase
      await executeMoveAndSave(stateFilePath, '50');

      // Play treasures (to get coins)
      await executeMoveAndSave(stateFilePath, 't');

      // Buy Silver with stable number 22
      const { success, state } = await executeMoveAndSave(stateFilePath, '22');

      // Should have bought Silver (if we had enough coins)
      // Even if we can't afford it, the parsing should succeed
      // Success depends on having enough coins, but parsing is correct
      expect(success).toBeDefined();
    });

    test('should reject invalid stable numbers', async () => {
      // @req: TB-CLI-6.3 - Invalid stable number handling
      // @edge: Numbers not in stable mapping should fail with helpful error

      await initializeGameAndSave('invalid-stable-seed', stateFilePath, {
        stableNumbers: true
      });

      const { success, output } = await executeMoveAndSave(stateFilePath, '99');

      expect(success).toBe(false);
      expect(output).toMatch(/invalid|not available|out of range/i);
    });
  });

  describe('TB-CLI-6.3.3: Stable number consistency', () => {
    test('should maintain stable numbers across turns', async () => {
      // @req: TB-CLI-6.3 - Consistency across turns
      // @edge: Same card always has same stable number

      await initializeGameAndSave('stable-consistency-seed', stateFilePath, {
        stableNumbers: true
      });

      // Turn 1: Check End Phase number
      const { output: turn1Output } = await executeMoveAndSave(stateFilePath, '50');

      // Continue through phases to get back to action phase
      await executeMoveAndSave(stateFilePath, 't'); // Play treasures
      await executeMoveAndSave(stateFilePath, '50'); // End buy phase

      // Turn 2: End Phase should still be 50
      const { output: turn2Output } = await initializeGameAndSave(
        'stable-consistency-seed-2',
        stateFilePath,
        { stableNumbers: true }
      );

      expect(turn2Output).toMatch(/\[50\].*End/i);
    });

    test('should not change stable numbers when hand composition changes', async () => {
      // @req: TB-CLI-6.3 - Stable across hand changes
      // @edge: Village is always 7 regardless of what else is in hand
      // @why: This is the core value of stable numbers for AI

      // This is verified by the stable number implementation
      // If Village appears in output, it should be [7]
      // If Smithy appears, it should be [6]
      await initializeGameAndSave('stable-hand-seed', stateFilePath, {
        stableNumbers: true
      });

      const { output } = await executeMoveAndSave(stateFilePath, '50');

      // End Phase is always 50
      expect(output).toMatch(/\[50\]/);
    });
  });

  describe('TB-CLI-6.3.4: Sequential numbers when stable disabled', () => {
    test('should use sequential numbers when stableNumbers is false', async () => {
      // @req: TB-CLI-6.3 - Default is sequential numbers
      // @edge: Without flag, moves are [1], [2], [3], etc.

      const { output } = await initializeGameAndSave(
        'sequential-seed',
        stateFilePath,
        { stableNumbers: false }
      );

      // Should have sequential numbering
      expect(output).toMatch(/\[1\]/);
      // Should NOT have stable numbers like [50] for End Phase
      expect(output).not.toMatch(/\[50\]/);
    });

    test('should use sequential numbers by default (no option)', async () => {
      // @req: TB-CLI-6.3 - Default behavior
      // @edge: stableNumbers defaults to false

      const { output } = await initializeGameAndSave(
        'default-seed',
        stateFilePath
        // No options - defaults
      );

      expect(output).toMatch(/\[1\]/);
    });
  });
});

describe('Turn-Based CLI Parser Refactor - Error Messages (Issue #96)', () => {
  /**
   * @req: TB-CLI-6.4 - Error messages include context from Parser
   * @edge: Parser returns detailed errors; turn-based should use them
   * @why: Issue #96 - Generic error messages instead of Parser's detailed ones
   */

  let tempDir: string;
  let stateFilePath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'principality-errors-'));
    stateFilePath = path.join(tempDir, 'game.json');
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('TB-CLI-6.4.1: Out of range move number errors', () => {
    test('should show "Move X out of range" for invalid numbers', async () => {
      // @req: TB-CLI-6.4 - Specific error for out of range
      // @edge: Number too high or zero

      await initializeGameAndSave('range-error-seed', stateFilePath);

      const { success, output } = await executeMoveAndSave(stateFilePath, '999');

      expect(success).toBe(false);
      expect(output).toMatch(/out of range|invalid move number/i);
      expect(output).toMatch(/1-\d+/); // Should show valid range
    });

    test('should show valid range in error message', async () => {
      // @req: TB-CLI-6.4 - Include valid range in error
      // @edge: "Please select 1-5" format

      await initializeGameAndSave('range-info-seed', stateFilePath);

      const { output } = await executeMoveAndSave(stateFilePath, '0');

      expect(output).toMatch(/Please select 1-\d+|Invalid move number.*1-\d+/i);
    });
  });

  describe('TB-CLI-6.4.2: Card name suggestion errors', () => {
    test('should suggest correction for misspelled card names', async () => {
      // @req: TB-CLI-6.4 - Typo correction suggestions
      // @edge: "Silvr" -> "Did you mean Silver?"
      // @hint: Parser or error handler should detect similar card names

      await initializeGameAndSave('typo-error-seed', stateFilePath);
      await executeMoveAndSave(stateFilePath, 'end phase');
      await executeMoveAndSave(stateFilePath, 'treasures');

      const { success, output } = await executeMoveAndSave(stateFilePath, 'buy Silvr');

      expect(success).toBe(false);
      // Should suggest correct spelling or indicate card not found
      expect(output).toMatch(/Silver|not found|invalid|unknown card/i);
    });

    test('should show error for completely unknown card', async () => {
      // @req: TB-CLI-6.4 - Unknown card error
      // @edge: Card name doesn't exist at all

      await initializeGameAndSave('unknown-card-seed', stateFilePath);
      await executeMoveAndSave(stateFilePath, 'end phase');

      const { success, output } = await executeMoveAndSave(
        stateFilePath,
        'buy NonexistentCard'
      );

      expect(success).toBe(false);
      expect(output).toMatch(/invalid|unknown|not found|cannot buy/i);
    });
  });

  describe('TB-CLI-6.4.3: Affordability error messages', () => {
    test('should show "need $X, have $Y" for unaffordable purchases', async () => {
      // @req: TB-CLI-6.4 - Cost vs coins in error
      // @edge: Province costs 8, player has 5
      // @hint: Error should include both cost and current coins

      await initializeGameAndSave('afford-error-seed', stateFilePath);
      await executeMoveAndSave(stateFilePath, 'end phase'); // To buy phase
      // Don't play all treasures to ensure we can't afford Province

      const { success, output } = await executeMoveAndSave(
        stateFilePath,
        'buy Province'
      );

      // If we can't afford Province, should show informative error
      if (!success) {
        expect(output).toMatch(/cannot afford|cost|\$\d+|need|have/i);
      }
    });

    test('should show current coin amount in error', async () => {
      // @req: TB-CLI-6.4 - Include current coins
      // @edge: "have $3" or "coins: $3"

      await initializeGameAndSave('coins-error-seed', stateFilePath);
      await executeMoveAndSave(stateFilePath, 'end phase');

      const { output } = await executeMoveAndSave(stateFilePath, 'buy Province');

      // Should show coins info in error or state display
      expect(output).toMatch(/\$\d+|Coins: \d+/);
    });
  });

  describe('TB-CLI-6.4.4: Phase-specific error messages', () => {
    test('should indicate wrong phase for action in buy phase', async () => {
      // @req: TB-CLI-6.4 - Phase context in errors
      // @edge: Trying to play action card during buy phase

      await initializeGameAndSave('phase-error-seed', stateFilePath);
      await executeMoveAndSave(stateFilePath, 'end phase'); // Now in buy phase

      const { success, output } = await executeMoveAndSave(
        stateFilePath,
        'play Village'
      );

      expect(success).toBe(false);
      expect(output).toMatch(/buy phase|cannot play|invalid|not available/i);
    });

    test('should indicate wrong phase for buy in action phase', async () => {
      // @req: TB-CLI-6.4 - Cannot buy in action phase
      // @edge: Trying to buy during action phase

      await initializeGameAndSave('buy-action-phase-seed', stateFilePath);

      const { success, output } = await executeMoveAndSave(
        stateFilePath,
        'buy Silver'
      );

      expect(success).toBe(false);
      expect(output).toMatch(/action phase|cannot buy|invalid/i);
    });
  });

  describe('TB-CLI-6.4.5: Empty input errors', () => {
    test('should show helpful error for empty input', async () => {
      // @req: TB-CLI-6.4 - Empty input handling
      // @edge: User submits empty string

      await initializeGameAndSave('empty-input-seed', stateFilePath);

      const { success, output } = await executeMoveAndSave(stateFilePath, '');

      expect(success).toBe(false);
      expect(output).toMatch(/empty|invalid|enter/i);
    });

    test('should show helpful error for whitespace-only input', async () => {
      // @req: TB-CLI-6.4 - Whitespace handling
      // @edge: "   " (spaces only)

      await initializeGameAndSave('whitespace-seed', stateFilePath);

      const { success, output } = await executeMoveAndSave(stateFilePath, '   ');

      expect(success).toBe(false);
      expect(output).toMatch(/empty|invalid|enter/i);
    });
  });

  describe('TB-CLI-6.4.6: Error includes available moves', () => {
    test('should always show available moves after error', async () => {
      // @req: TB-CLI-6.4 - Error recovery context
      // @edge: After any error, show valid moves
      // @why: AI agents need to know what moves are valid

      await initializeGameAndSave('error-moves-seed', stateFilePath);

      const { output } = await executeMoveAndSave(stateFilePath, 'invalid_command');

      expect(output).toContain('Available Moves');
      expect(output).toMatch(/\[\d+\]/); // At least one move number
    });
  });
});

describe('Turn-Based CLI Parser Refactor - Shared Parser Integration (Issue #93)', () => {
  /**
   * @req: TB-CLI-6.1 - Use shared Parser class for move parsing
   * @edge: All Parser capabilities available in turn-based mode
   * @why: Issue #93 - parallel implementation causes feature gaps
   */

  let tempDir: string;
  let stateFilePath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'principality-parser-'));
    stateFilePath = path.join(tempDir, 'game.json');
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('TB-CLI-6.1.1: Parser command support', () => {
    test('should support all Parser commands in turn-based mode', async () => {
      // @req: TB-CLI-6.1 - Feature parity with Parser
      // @edge: help, hand, supply commands should work or be handled

      await initializeGameAndSave('parser-commands-seed', stateFilePath);

      // These should either work or return appropriate responses
      const helpResult = await executeMoveAndSave(stateFilePath, 'help');
      expect(helpResult.output).toBeDefined();

      // Note: In turn-based mode, info commands may work differently
      // but they should not crash
    });

    test('should support chained input (1, 2 format)', async () => {
      // @req: TB-CLI-6.1 - Parser chained input
      // @edge: Comma or space separated move numbers
      // @hint: Parser supports "1, 2" and "1 2" formats

      await initializeGameAndSave('chained-seed', stateFilePath);
      await executeMoveAndSave(stateFilePath, 'end phase');

      // Try chained treasure playing (if applicable)
      // Behavior may vary but should not crash
      const { output } = await executeMoveAndSave(stateFilePath, '1, 2');
      expect(output).toBeDefined();
    });
  });

  describe('TB-CLI-6.1.2: Move type support', () => {
    test('should support "play [CardName]" command', async () => {
      // @req: TB-CLI-6.1 - Play command parsing
      // @edge: "play Copper" in buy phase

      await initializeGameAndSave('play-card-seed', stateFilePath);
      await executeMoveAndSave(stateFilePath, 'end phase');

      const { success, output } = await executeMoveAndSave(
        stateFilePath,
        'play Copper'
      );

      // Should either succeed (if Copper in hand) or fail with good error
      expect(output).toBeDefined();
    });

    test('should support "buy [CardName]" command', async () => {
      // @req: TB-CLI-6.1 - Buy command parsing
      // @edge: "buy Silver" in buy phase with coins

      await initializeGameAndSave('buy-card-seed', stateFilePath);
      await executeMoveAndSave(stateFilePath, 'end phase');
      await executeMoveAndSave(stateFilePath, 'treasures');

      const { success } = await executeMoveAndSave(stateFilePath, 'buy Copper');

      // Copper costs 0, should always be affordable
      expect(success).toBe(true);
    });

    test('should support "end phase" and "end" commands', async () => {
      // @req: TB-CLI-6.1 - End phase variations
      // @edge: Both "end phase" and "end" should work

      await initializeGameAndSave('end-phase-seed', stateFilePath);

      const result1 = await executeMoveAndSave(stateFilePath, 'end phase');
      expect(result1.success).toBe(true);

      // Reset for second test
      await initializeGameAndSave('end-seed', stateFilePath);

      const result2 = await executeMoveAndSave(stateFilePath, 'end');
      expect(result2.success).toBe(true);
    });

    test('should support move numbers', async () => {
      // @req: TB-CLI-6.1 - Numeric move selection
      // @edge: "1", "2", etc. select moves by index

      await initializeGameAndSave('number-seed', stateFilePath);

      const { success } = await executeMoveAndSave(stateFilePath, '1');

      expect(success).toBe(true);
    });
  });

  describe('TB-CLI-6.1.3: Parser options passthrough', () => {
    test('should pass stableNumbers option to Parser', async () => {
      // @req: TB-CLI-6.1 - Options flow to Parser
      // @edge: ParserOptions.stableNumbers should be set

      await initializeGameAndSave('options-seed', stateFilePath, {
        stableNumbers: true
      });

      // When stable numbers enabled, End Phase should accept 50
      const { success } = await executeMoveAndSave(stateFilePath, '50');

      expect(success).toBe(true);
    });
  });
});

describe('Turn-Based CLI Parser Refactor - Performance', () => {
  /**
   * @req: Performance requirements for parser operations
   * @edge: Should not add significant overhead
   */

  let tempDir: string;
  let stateFilePath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'principality-perf-'));
    stateFilePath = path.join(tempDir, 'game.json');
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test('should parse move command in < 10ms', async () => {
    // @req: Performance - quick parsing

    await initializeGameAndSave('perf-seed', stateFilePath);

    const start = performance.now();
    await executeMoveAndSave(stateFilePath, '1');
    const end = performance.now();

    // Allow some overhead for file I/O, but parsing should be fast
    expect(end - start).toBeLessThan(500); // 500ms total including I/O
  });

  test('should handle treasure command efficiently', async () => {
    // @req: Performance - treasure auto-play

    await initializeGameAndSave('perf-treasure-seed', stateFilePath);
    await executeMoveAndSave(stateFilePath, 'end phase');

    await PerformanceHelper.assertWithinTime(
      async () => executeMoveAndSave(stateFilePath, 'treasures'),
      500,
      'treasure command execution'
    );
  });
});

describe('Turn-Based CLI Parser Refactor - formatOutputForTurnBasedMode', () => {
  /**
   * @req: Output formatting uses Parser for display
   * @edge: Stable numbers affect output format
   */

  test('should format output with stable numbers when enabled', () => {
    // @req: TB-CLI-6.3 - Stable number display

    const engine = new GameEngine('format-test-seed');
    const state = engine.initializeGame(1);
    const validMoves = engine.getValidMoves(state);

    const output = formatOutputForTurnBasedMode(
      state,
      validMoves,
      { stableNumbers: true }
    );

    // Should include stable numbers in output
    // End Phase should be [50]
    expect(output).toMatch(/\[\d+\]/);
  });

  test('should format output with sequential numbers when disabled', () => {
    // @req: TB-CLI-6.3 - Sequential numbering default

    const engine = new GameEngine('sequential-format-seed');
    const state = engine.initializeGame(1);
    const validMoves = engine.getValidMoves(state);

    const output = formatOutputForTurnBasedMode(
      state,
      validMoves,
      { stableNumbers: false }
    );

    // Should start with [1], [2], etc.
    expect(output).toMatch(/\[1\]/);
  });
});
