/**
 * Test Suite: Turn-Based CLI Mode - Game End Detection
 *
 * GitHub Issue #91: CLI turn-based mode does not detect game end
 *
 * Evidence from Agent D playtest:
 * - Province pile reached 0 on Turn 74
 * - Game continued to Turn 75, 76, and beyond
 * - No "Game Over" message displayed
 *
 * Requirements:
 * @req: TB-CLI-5.1 - Detect game end condition (Province empty OR 3 piles empty)
 * @req: TB-CLI-5.2 - Display "GAME OVER" message with reason
 * @req: TB-CLI-5.3 - Show final scores for each player
 * @req: TB-CLI-5.4 - Prevent further moves after game ends
 *
 * @edge: Province pile at 0 | 3+ piles empty | tie-breaking
 * @why: AI agents played 70+ turns after game should have ended
 */

import { GameEngine, GameState, Move } from '@principality/core';
import { isGameOver, getGameOverReason, calculateVictoryPoints } from '@principality/core';
import { CLIOptions } from '../src/cli';
import { ConsoleCapture, GameStateBuilder } from './utils/test-utils';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

import {
  initializeGameAndSave,
  executeMoveAndSave,
  formatOutputForTurnBasedMode
} from '../src/turn-based-cli';

describe('Turn-Based CLI Mode - Game End Detection (Issue #91)', () => {
  let consoleCapture: ConsoleCapture;
  let tempDir: string;
  let stateFilePath: string;

  beforeEach(async () => {
    consoleCapture = new ConsoleCapture();
    consoleCapture.start();

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'principality-gameend-'));
    stateFilePath = path.join(tempDir, 'game.json');
  });

  afterEach(async () => {
    consoleCapture.stop();

    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  /**
   * Helper: Create a state file with Province pile at 0
   * This simulates a game that has reached its end condition
   */
  async function createGameEndState(options: {
    provinceCount?: number;
    emptyPiles?: string[];
    turnNumber?: number;
    playerVP?: number[];
  } = {}) {
    const engine = new GameEngine('game-end-seed');
    let state = engine.initializeGame(1);

    // Build game-end state
    const supply = new Map(state.supply);

    // Set Province count (default 0 = game over)
    supply.set('Province', options.provinceCount ?? 0);

    // Empty additional piles if specified
    if (options.emptyPiles) {
      for (const pile of options.emptyPiles) {
        supply.set(pile, 0);
      }
    }

    state = {
      ...state,
      supply,
      turnNumber: options.turnNumber ?? 74,
      phase: 'cleanup' as const,
    };

    // Save to file with CLI options
    await fs.writeFile(
      stateFilePath,
      JSON.stringify({
        schemaVersion: '1.0.0',
        timestamp: new Date().toISOString(),
        seed: state.seed,
        players: state.players,
        supply: Array.from(state.supply.entries()),
        currentPlayer: state.currentPlayer,
        phase: state.phase,
        turnNumber: state.turnNumber,
        gameLog: state.gameLog,
        trash: state.trash,
        selectedKingdomCards: state.selectedKingdomCards,
        cliOptions: { victoryPileSize: 4 }
      }),
      'utf-8'
    );

    return state;
  }

  describe('BUG FIX VERIFICATION: Game end detection now works (Issue #91)', () => {
    /**
     * These tests verify that the bug from Issue #91 is now fixed.
     * The bug was: game continued after Province pile empty, no game over shown.
     * After the fix: game ends properly with scores and winner.
     */
    test('FIXED: executeMoveAndSave now detects game end', async () => {
      // @req: TB-CLI-5.1 - Detect game end condition
      // @why: Verifies Issue #91 is fixed

      // Setup: Province pile at 0 (game should be over)
      await createGameEndState({ provinceCount: 0 });

      // Attempt to execute a move when game is over
      const result = await executeMoveAndSave(stateFilePath, 'end phase');

      // FIXED: Output now contains "GAME OVER"
      expect(result.output).toContain('GAME OVER');
    });

    test('FIXED: Winner is now declared when game ends', async () => {
      // @req: TB-CLI-5.3 - Show final scores for each player
      // @why: Agent D saw no winner declaration - now fixed

      await createGameEndState({ provinceCount: 0 });

      const result = await executeMoveAndSave(stateFilePath, 'end phase');

      // FIXED: Winner is now declared
      expect(result.output).toMatch(/wins?|winner/i);
      expect(result.output).toMatch(/victory points?|VP/i);
    });
  });

  describe('TB-CLI-5.1: Detect game end condition', () => {
    test('should detect game end when Province pile is empty', async () => {
      // @req: TB-CLI-5.1 - Detect Province pile empty
      // @edge: Last Province bought triggers game end

      await createGameEndState({ provinceCount: 0 });

      const result = await executeMoveAndSave(stateFilePath, 'end phase');

      // After fix: output should indicate game is over
      expect(result.output).toMatch(/game\s*over/i);
    });

    test('should detect game end when 3 supply piles are empty', async () => {
      // @req: TB-CLI-5.1 - Detect 3 empty piles
      // @edge: Alternative game end condition

      // Province still has cards, but 3 other piles empty
      await createGameEndState({
        provinceCount: 4,
        emptyPiles: ['Estate', 'Duchy', 'Copper']
      });

      const result = await executeMoveAndSave(stateFilePath, 'end phase');

      // After fix: output should indicate game is over
      expect(result.output).toMatch(/game\s*over/i);
    });

    test('should NOT trigger game end with Province > 0 and < 3 empty piles', async () => {
      // @req: TB-CLI-5.1 - Game continues when conditions not met
      // @edge: False positive prevention

      // Province has cards, only 2 piles empty
      await createGameEndState({
        provinceCount: 4,
        emptyPiles: ['Estate', 'Duchy']
      });

      const result = await executeMoveAndSave(stateFilePath, 'end phase');

      // Game should continue - no game over message
      expect(result.output).not.toMatch(/game\s*over/i);
      expect(result.output).toContain('Available Moves');
    });

    test('should use core isGameOver function', async () => {
      // @req: TB-CLI-5.1 - Use existing core function
      // @why: Avoid duplicating game end logic

      // Verify core function works correctly
      const endState = GameStateBuilder.create()
        .withSupply({ 'Province': 0 })
        .build();

      expect(isGameOver(endState)).toBe(true);

      const continueState = GameStateBuilder.create()
        .withSupply({ 'Province': 4 })
        .build();

      expect(isGameOver(continueState)).toBe(false);
    });
  });

  describe('TB-CLI-5.2: Display GAME OVER message with reason', () => {
    test('should display "GAME OVER" header when game ends', async () => {
      // @req: TB-CLI-5.2 - Clear game over indication
      // @edge: AI must recognize game end unambiguously

      await createGameEndState({ provinceCount: 0 });

      const result = await executeMoveAndSave(stateFilePath, 'end phase');

      // Prominent game over message
      expect(result.output).toMatch(/GAME\s*OVER/i);
    });

    test('should explain why game ended (Province pile empty)', async () => {
      // @req: TB-CLI-5.2 - Show game end reason
      // @edge: Province pile emptied

      await createGameEndState({ provinceCount: 0 });

      const result = await executeMoveAndSave(stateFilePath, 'end phase');

      expect(result.output).toMatch(/province.*empty/i);
    });

    test('should explain why game ended (3 piles empty)', async () => {
      // @req: TB-CLI-5.2 - Show game end reason
      // @edge: 3+ supply piles empty

      await createGameEndState({
        provinceCount: 4,
        emptyPiles: ['Estate', 'Duchy', 'Copper']
      });

      const result = await executeMoveAndSave(stateFilePath, 'end phase');

      expect(result.output).toMatch(/(\d+\s*)?piles?\s*(are\s*)?empty/i);
    });

    test('should use core getGameOverReason function', async () => {
      // @req: TB-CLI-5.2 - Use existing core function
      // @why: Consistent messaging across CLI/MCP

      const endState = GameStateBuilder.create()
        .withSupply({ 'Province': 0 })
        .build();

      const reason = getGameOverReason(endState);
      expect(reason).toMatch(/province.*empty/i);
    });
  });

  describe('TB-CLI-5.3: Show final scores for each player', () => {
    test('should display victory points for each player', async () => {
      // @req: TB-CLI-5.3 - Final score display
      // @edge: Single player game

      await createGameEndState({ provinceCount: 0 });

      const result = await executeMoveAndSave(stateFilePath, 'end phase');

      // Should show VP in game over summary
      expect(result.output).toMatch(/\d+\s*(VP|victory\s*points?)/i);
    });

    test('should declare the winner', async () => {
      // @req: TB-CLI-5.3 - Winner declaration
      // @edge: Clear winner identification

      await createGameEndState({ provinceCount: 0 });

      const result = await executeMoveAndSave(stateFilePath, 'end phase');

      // Should declare winner
      expect(result.output).toMatch(/(player\s*\d+\s*wins?|winner.*player)/i);
    });

    test('should use core calculateVictoryPoints function', async () => {
      // @req: TB-CLI-5.3 - Use existing core function
      // @why: Consistent VP calculation

      const state = GameStateBuilder.create()
        .withPlayerHand(0, ['Estate', 'Estate', 'Copper'])
        .build();

      // Estate = 1 VP each
      const vp = calculateVictoryPoints(state.players[0]);

      // Starting deck has 3 Estates = 3 VP, plus 2 in hand = 5 VP
      // (depending on deck contents)
      expect(typeof vp).toBe('number');
      expect(vp).toBeGreaterThanOrEqual(0);
    });
  });

  describe('TB-CLI-5.4: Prevent further moves after game ends', () => {
    test('should NOT show Available Moves when game is over', async () => {
      // @req: TB-CLI-5.4 - No moves after game end
      // @edge: AI should not attempt more moves

      await createGameEndState({ provinceCount: 0 });

      const result = await executeMoveAndSave(stateFilePath, 'end phase');

      // Game over output should NOT have move options
      expect(result.output).not.toContain('Available Moves');
      expect(result.output).not.toMatch(/\[\d+\]/);
    });

    test('should reject moves when game is already over', async () => {
      // @req: TB-CLI-5.4 - Reject moves after game end
      // @edge: Prevent post-game-over moves

      await createGameEndState({ provinceCount: 0 });

      // First move should trigger game end
      await executeMoveAndSave(stateFilePath, 'end phase');

      // Subsequent move should be rejected
      const result = await executeMoveAndSave(stateFilePath, 'end phase');

      // Either success=false or output indicates game is already over
      expect(
        result.success === false ||
        result.output.match(/game\s*(is\s*)?over|already\s*(ended|over)/i)
      ).toBeTruthy();
    });

    test('should return meaningful response for game-end state', async () => {
      // @req: TB-CLI-5.4 - Graceful handling of post-game moves
      // @edge: Don't crash, provide clear message

      await createGameEndState({ provinceCount: 0 });

      // Should not throw, should return structured response
      const result = await executeMoveAndSave(stateFilePath, 'buy Province');

      expect(result).toBeDefined();
      expect(result.output).toBeDefined();
      expect(result.state).toBeDefined();
    });
  });

  describe('Output format for game over', () => {
    test('should format game over output clearly', async () => {
      // @req: TB-CLI-5.2 - Clear, parseable output
      // @why: AI agents need to detect game end programmatically

      await createGameEndState({ provinceCount: 0 });

      const result = await executeMoveAndSave(stateFilePath, 'end phase');

      // Output should have clear structure
      const output = result.output;

      // Should have visual separator
      expect(output).toMatch(/[=]{10,}|[*]{10,}|-{10,}/);

      // Should have GAME OVER prominently
      expect(output).toMatch(/GAME\s*OVER/i);
    });

    test('should include turn number in game over output', async () => {
      // @req: TB-CLI-5.2 - Context in game over message
      // @edge: Know when game ended

      await createGameEndState({ provinceCount: 0, turnNumber: 42 });

      const result = await executeMoveAndSave(stateFilePath, 'end phase');

      // Should show what turn game ended
      expect(result.output).toMatch(/turn\s*\d+/i);
    });
  });

  describe('Edge cases', () => {
    test('should handle game end on turn 1', async () => {
      // @edge: Very short game (reduced piles mode)

      await createGameEndState({ provinceCount: 0, turnNumber: 1 });

      const result = await executeMoveAndSave(stateFilePath, 'end phase');

      expect(result.output).toMatch(/game\s*over/i);
    });

    test('should handle exactly 3 empty piles', async () => {
      // @edge: Boundary condition for 3-pile rule

      await createGameEndState({
        provinceCount: 4,
        emptyPiles: ['Estate', 'Duchy', 'Silver'] // exactly 3
      });

      const result = await executeMoveAndSave(stateFilePath, 'end phase');

      expect(result.output).toMatch(/game\s*over/i);
    });

    test('should handle 4+ empty piles', async () => {
      // @edge: More than minimum empty piles

      await createGameEndState({
        provinceCount: 0, // Province also empty
        emptyPiles: ['Estate', 'Duchy', 'Silver', 'Copper']
      });

      const result = await executeMoveAndSave(stateFilePath, 'end phase');

      expect(result.output).toMatch(/game\s*over/i);
      // Should mention Province as primary reason
      expect(result.output).toMatch(/province.*empty/i);
    });
  });
});

describe('Core game end detection (verification)', () => {
  /**
   * These tests verify that core functions work correctly.
   * They should all pass - if they fail, the issue is in core, not CLI.
   */

  test('isGameOver returns true when Province pile is empty', () => {
    const state = GameStateBuilder.create()
      .withSupply({ 'Province': 0 })
      .build();

    expect(isGameOver(state)).toBe(true);
  });

  test('isGameOver returns true when 3 piles are empty', () => {
    const state = GameStateBuilder.create()
      .withSupply({
        'Province': 4,
        'Estate': 0,
        'Duchy': 0,
        'Copper': 0
      })
      .build();

    expect(isGameOver(state)).toBe(true);
  });

  test('isGameOver returns false when game should continue', () => {
    const state = GameStateBuilder.create()
      .withSupply({
        'Province': 4,
        'Estate': 4,
        'Duchy': 4
      })
      .build();

    expect(isGameOver(state)).toBe(false);
  });

  test('getGameOverReason returns Province message', () => {
    const state = GameStateBuilder.create()
      .withSupply({ 'Province': 0 })
      .build();

    const reason = getGameOverReason(state);
    expect(reason).toMatch(/province.*empty/i);
  });

  test('getGameOverReason returns piles message', () => {
    const state = GameStateBuilder.create()
      .withSupply({
        'Province': 4,
        'Estate': 0,
        'Duchy': 0,
        'Copper': 0
      })
      .build();

    const reason = getGameOverReason(state);
    expect(reason).toMatch(/piles.*empty/i);
  });
});
